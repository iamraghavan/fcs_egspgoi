
"use client"

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Eye, Search, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colleges } from "@/lib/colleges";
import { useAlert } from "@/context/alert-context";
import { Label } from "@/components/ui/label";
import { shortenUrl } from "@/lib/url-shortener";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in';

type User = {
  _id: string;
  name: string;
  department?: string;
  facultyID?: string;
  role?: string;
  email?: string;
  profileImage?: string;
};

type CreditTitle = {
  _id: string;
  title: string;
  points: number;
  type: 'positive' | 'negative';
};

type NegativeRemark = {
    _id: string;
    academicYear: string;
    appealCount?: number;
    createdAt: string;
    creditTitle?: string;
    faculty: string;
    facultySnapshot: {
        name: string;
        college: string;
        facultyID: string;
        department: string;
        profileImage?: string;
    };
    issuedBy: string;
    notes?: string;
    points: number;
    proofMeta?: {
        fileName: string;
        size: string;
    };
    proofUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed';
    title: string;
    type: 'negative';
    updatedAt: string;
    appeal?: {
      by: string;
      reason: string;
      status: 'pending' | 'accepted' | 'rejected';
      createdAt: string;
    };
};

type Departments = {
    [key: string]: string[];
};

const getCurrentAcademicYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (currentMonth >= 5) { // June or later
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    }
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
};

const generateYearOptions = () => {
    const currentYearString = getCurrentAcademicYear();
    const [startCurrentYear] = currentYearString.split('-').map(Number);
    
    const years = [];
    for (let i = 0; i < 5; i++) {
        const startYear = startCurrentYear - i;
        const endYear = (startYear + 1).toString().slice(-2);
        years.push(`${startYear}-${endYear}`);
    }
    return years;
};

export default function ManageRemarksPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Form state
  const [selectedFaculty, setSelectedFaculty] = useState<User | null>(null);
  const [facultySearch, setFacultySearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [creditTitleId, setCreditTitleId] = useState("");
  const [points, setPoints] = useState<number | string>("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Data for dropdowns
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [creditTitles, setCreditTitles] = useState<CreditTitle[]>([]);

  // Data for table and filters
  const [remarks, setRemarks] = useState<NegativeRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [creditTitleFilter, setCreditTitleFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});
  
  // Details view state
  const [selectedRemarkDetails, setSelectedRemarkDetails] = useState<NegativeRemark | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [shortProofUrl, setShortProofUrl] = useState<string | null>(null);

  // Edit State
  const [editingRemark, setEditingRemark] = useState<NegativeRemark | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editCreditTitleId, setEditCreditTitleId] = useState("");
  const [editProof, setEditProof] = useState<File | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);


  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const uid = searchParams.get('uid');
  const totalPages = Math.ceil(total / limit);
  const suggestionRef = useRef<HTMLDivElement>(null);


  const handleFacultySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFacultySearch(e.target.value);
    setSelectedFaculty(null); // Clear selection when user types
    if (!showSuggestions) {
      setShowSuggestions(true);
    }
  };
  
  const handleFacultySelect = (faculty: User) => {
    setSelectedFaculty(faculty);
    setFacultySearch(`${faculty.name} (${faculty.department || 'N/A'})`);
    setShowSuggestions(false);
  };
  
  const suggestedFaculty = useMemo(() => {
    if (!facultySearch) return [];
    return facultyList
      .filter(f => 
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        (f.department && f.department.toLowerCase().includes(facultySearch.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
      .slice(0, 10);
  }, [facultySearch, facultyList]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchDropdownData = async () => {
    if (!adminToken) {
      showAlert("Authentication Error", "Admin token not found.");
      return;
    }
    try {
      const [facultyResponse, creditTitlesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/users?limit=1000`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/admin/credit-title`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      ]);

      const facultyData = await facultyResponse.json();
      if (facultyData.success) {
        setFacultyList(facultyData.items);
      } else {
        throw new Error(facultyData.message || "Failed to fetch faculty");
      }

      const creditTitlesData = await creditTitlesResponse.json();
      if (creditTitlesData.success) {
        setCreditTitles(creditTitlesData.items.filter((ct: CreditTitle) => ct.type === 'negative'));
      } else {
        throw new Error(creditTitlesData.message || "Failed to fetch credit titles");
      }
    } catch (error: any) {
      showAlert("Error fetching initial data", error.message);
    }
  };

  const fetchRemarks = async (currentPage: number) => {
      setIsLoadingRemarks(true);
      if (!adminToken) {
          setIsLoadingRemarks(false);
          return;
      }
  
      try {
          const params = new URLSearchParams({
              page: currentPage.toString(),
              limit: limit.toString(),
              sort: '-createdAt',
          });

          if (searchTerm) params.append('search', searchTerm);
          if (academicYearFilter !== 'all') params.append('academicYear', academicYearFilter);
          if (creditTitleFilter !== 'all') params.append('templateId', creditTitleFilter);
          if (collegeFilter !== 'all') params.append('college', collegeFilter);
          if (departmentFilter !== 'all') params.append('department', departmentFilter);

          const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative?${params.toString()}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          const data = await response.json();
          if (data.success) {
              setRemarks(data.items);
              setTotal(data.total);
          } else {
              throw new Error(data.message || "Failed to fetch remarks");
          }
      } catch (error: any) {
          showAlert("Error fetching remarks", error.message);
          setRemarks([]);
          setTotal(0);
      } finally {
          setIsLoadingRemarks(false);
      }
  };


  useEffect(() => {
    if (adminToken) {
      fetchDropdownData();
    }
  }, [uid, adminToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (adminToken) {
            fetchRemarks(page);
        }
    }, 500); // Debounce API call
    return () => clearTimeout(timer);
  }, [page, adminToken, searchTerm, academicYearFilter, creditTitleFilter, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    setPage(1); // Reset to first page whenever filters change
  }, [searchTerm, academicYearFilter, creditTitleFilter, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    const selectedTitle = creditTitles.find(ct => ct._id === creditTitleId);
    if (selectedTitle) {
      setTitle(selectedTitle.title);
      setPoints(selectedTitle.points);
    } else {
      setTitle("");
      setPoints("");
    }
  }, [creditTitleId, creditTitles]);

  useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
      setDepartmentFilter("all"); 
    } else {
      setFilteredDepartments({});
      setDepartmentFilter("all");
    }
  }, [collegeFilter]);

  const getProofUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
        return url;
    }
    // Handle cases where the base URL might be duplicated
    if (url.includes(API_BASE_URL)) {
        const urlParts = url.split(API_BASE_URL);
        return `${API_BASE_URL}${urlParts[urlParts.length - 1]}`;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (editingRemark) {
        setEditNotes(editingRemark.notes || "");
        setEditCreditTitleId(editingRemark.creditTitle || "");
        setEditProof(null);
    }
  }, [editingRemark]);

  useEffect(() => {
    if (selectedRemarkDetails?.proofUrl) {
      setShortProofUrl(null);
      shortenUrl(getProofUrl(selectedRemarkDetails.proofUrl))
        .then(setShortProofUrl)
        .catch(() => setShortProofUrl(getProofUrl(selectedRemarkDetails.proofUrl))); // Fallback to full URL on error
    }
  }, [selectedRemarkDetails]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !points || !title) {
      showAlert("Incomplete Form", "Please select a faculty member and fill out all required fields.");
      return;
    }
    setIsLoading(true);

    if (!adminToken) {
      showAlert("Authentication Error", "Admin token not found.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("facultyId", selectedFaculty._id);
    formData.append("points", points.toString());
    formData.append("academicYear", getCurrentAcademicYear());
    formData.append("title", title);
    if (creditTitleId) formData.append("creditTitleId", creditTitleId);
    if (notes) formData.append("notes", notes);
    if (proof) formData.append("proof", proof);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to issue remark.");
      }

      toast({
        title: "Remark Issued",
        description: "The negative remark has been successfully recorded.",
      });

      // Reset form and close dialog *before* attempting to send email
      setSelectedFaculty(null);
      setFacultySearch("");
      setCreditTitleId("");
      setTitle("");
      setPoints("");
      setNotes("");
      setProof(null);
      fetchRemarks(1);
      setPage(1);
      setIsFormOpen(false);

      // Fire-and-forget the email notification
      fetch(`${API_BASE_URL}/api/v1/notifications/remark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facultyId: selectedFaculty._id,
          title: title,
          points: Number(points),
          notes: notes,
          academicYear: getCurrentAcademicYear(),
        }),
      }).then(async (emailResponse) => {
          if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            showAlert(
              "Email Notification Failed",
              errorData.message || "The remark was saved, but the email notification could not be sent."
            );
          }
      }).catch((emailError: any) => {
          showAlert(
            "Email Sending Error",
            emailError.message || "An error occurred while trying to send the email."
          );
      });

    } catch (error: any) {
      showAlert("Submission Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemark) return;
    setIsSubmittingEdit(true);

    const formData = new FormData();
    // Only append changed values
    if (editNotes !== (editingRemark.notes || "")) formData.append("notes", editNotes);
    if (editCreditTitleId !== (editingRemark.creditTitle || "")) formData.append("creditTitleId", editCreditTitleId);
    if (editProof) formData.append("proof", editProof);

    if (Array.from(formData.keys()).length === 0) {
        setIsSubmittingEdit(false);
        setIsEditDialogOpen(false);
        toast({ title: "No Changes", description: "No changes were made to the remark." });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/negative/${editingRemark._id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "Failed to update remark.");
        }

        toast({ title: "Remark Updated", description: "The remark has been successfully updated." });
        setIsEditDialogOpen(false);
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("Update Failed", error.message);
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleDeleteRemark = async (creditId: string) => {
      if (!adminToken) {
          showAlert("Authentication Error", "Admin token not found.");
          return;
      }
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/negative/${creditId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${adminToken}` },
          });

          const responseData = await response.json();
          if (!response.ok || !responseData.success) {
              throw new Error(responseData.message || "Failed to delete remark.");
          }

          toast({ title: "Remark Deleted", description: "The remark has been permanently deleted." });
          if (page > 1 && remarks.length === 1) {
            setPage(page - 1);
          } else {
            fetchRemarks(page);
          }
      } catch (error: any) {
          showAlert("Delete Failed", error.message);
      }
  };
  
 const creditTitleOptions = useMemo(() => {
    const sortedTitles = creditTitles
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(ct => ({ value: ct._id, label: `${ct.title} (${ct.points} pts)` }));
    
    return [{ value: 'all', label: 'All Templates' }, ...sortedTitles];
}, [creditTitles]);


  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Manage Negative Remarks
          </h1>
          <p className="mt-1 text-muted-foreground">
            Issue and monitor negative credit adjustments for faculty members.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Issue New Remark
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>Issue New Remark</DialogTitle>
                    <DialogDescription>Fill out the details below to issue a negative credit to a faculty member.</DialogDescription>
                </DialogHeader>
                <form className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4" onSubmit={handleSubmit}>
                    <div className="md:col-span-2 space-y-4">
                        <div ref={suggestionRef} className="relative">
                            <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="faculty">Faculty Member</label>
                            <Input 
                              id="faculty"
                              placeholder="Type to search for faculty..."
                              value={facultySearch}
                              onChange={handleFacultySearch}
                              onFocus={() => setShowSuggestions(true)}
                              autoComplete="off"
                            />
                             {showSuggestions && suggestedFaculty.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suggestedFaculty.map(faculty => (
                                  <div
                                    key={faculty._id}
                                    className="cursor-pointer p-2 hover:bg-accent"
                                    onClick={() => handleFacultySelect(faculty)}
                                  >
                                    <p className="font-medium">{faculty.name}</p>
                                    <p className="text-sm text-muted-foreground">{faculty.department}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="creditTitle">Remark Template (Optional)</label>
                             <Select value={creditTitleId} onValueChange={setCreditTitleId}>
                                <SelectTrigger id="creditTitle">
                                    <SelectValue placeholder="Select a template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {creditTitles.map(ct => ({ value: ct._id, label: `${ct.title} (${ct.points} pts)` })).map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground" htmlFor="title">Title</label>
                            <Input id="title" placeholder="e.g., 'Missed department meeting'" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground" htmlFor="points">Points</label>
                                <Input id="points" type="number" placeholder="e.g., -5" value={points} onChange={(e) => setPoints(Number(e.target.value))} required />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-muted-foreground" htmlFor="academicYear">Academic Year</label>
                            <Select value={getCurrentAcademicYear()} disabled>
                                <SelectTrigger id="academicYear"><SelectValue placeholder="Select Year" /></SelectTrigger>
                                <SelectContent>{generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-muted-foreground" htmlFor="notes">Notes / Rationale</label>
                        <Textarea id="notes" placeholder="Enter detailed notes about the incident" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Upload Proof (Optional)</label>
                        <FileUpload onFileSelect={setProof} />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        {selectedFaculty ? (
                             <Card>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={selectedFaculty.profileImage} />
                                        <AvatarFallback>{selectedFaculty.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{selectedFaculty.name}</CardTitle>
                                        <CardDescription>{selectedFaculty.facultyID}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong className="font-medium text-muted-foreground">Department:</strong> {selectedFaculty.department || 'N/A'}</p>
                                    <p><strong className="font-medium text-muted-foreground">Role:</strong> <span className="capitalize">{selectedFaculty.role || 'N/A'}</span></p>
                                    <p><strong className="font-medium text-muted-foreground">Email:</strong> {selectedFaculty.email || 'N/A'}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg bg-muted/50">
                                <p className="text-muted-foreground text-center p-4">Select a faculty member to see their details.</p>
                            </div>
                        )}
                    </div>
                     <DialogFooter className="pt-4 md:col-span-3">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? "Submitting..." : "Issue Remark"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </header>
        
      <Card>
        <CardHeader>
            <CardTitle>Issued Remarks History</CardTitle>
            <CardDescription>A log of all negative remarks that have been issued.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search by title, faculty..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
               <Select value={creditTitleFilter} onValueChange={(value) => setCreditTitleFilter(value === "all" ? "all" : value)}>
                   <SelectTrigger>
                        <SelectValue placeholder="Filter by template..." />
                   </SelectTrigger>
                   <SelectContent>
                        {creditTitleOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                   </SelectContent>
               </Select>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                  </SelectContent>
              </Select>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger>
                      <SelectValue placeholder="Select College" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Colleges</SelectItem>
                      {Object.keys(colleges).map(college => (<SelectItem key={college} value={college}>{college}</SelectItem>))}
                  </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={!filteredDepartments || Object.keys(filteredDepartments).length === 0}>
                  <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                       {Object.entries(filteredDepartments).map(([group, courses]) => (
                          <SelectGroup key={group}>
                              <SelectLabel>{group}</SelectLabel>
                              {courses.map(course => (
                                  <SelectItem key={course} value={course}>{course}</SelectItem>
                              ))}
                          </SelectGroup>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Faculty ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (
                   <TableRow><TableCell colSpan={7} className="text-center h-24">Loading remarks...</TableCell></TableRow>
                ) : remarks.length > 0 ? (
                  remarks.map((remark) => (
                  <TableRow key={remark._id}>
                    <TableCell className="font-medium text-foreground">{remark.facultySnapshot.name}</TableCell>
                    <TableCell>{remark.facultySnapshot.facultyID}</TableCell>
                    <TableCell>{remark.facultySnapshot.department}</TableCell>
                    <TableCell>{remark.title}</TableCell>
                    <TableCell>{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{remark.points}</TableCell>
                    <TableCell className="text-center">
                        <div className="flex justify-center items-center">
                            <Dialog open={isDetailsOpen && selectedRemarkDetails?._id === remark._id} onOpenChange={setIsDetailsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRemarkDetails(remark)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                 <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                    <DialogTitle>Remark Details</DialogTitle>
                                    <DialogDescription>A complete overview of the recorded remark.</DialogDescription>
                                    </DialogHeader>
                                    {selectedRemarkDetails && (
                                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4 text-sm">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={getProofUrl(selectedRemarkDetails.facultySnapshot.profileImage || '')} />
                                                    <AvatarFallback>{selectedRemarkDetails.facultySnapshot.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg">{selectedRemarkDetails.facultySnapshot.name}</CardTitle>
                                                    <CardDescription>{selectedRemarkDetails.facultySnapshot.facultyID}</CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p><strong className="font-medium text-muted-foreground w-24 inline-block">Department:</strong> {selectedRemarkDetails.facultySnapshot.department}</p>
                                                <p><strong className="font-medium text-muted-foreground w-24 inline-block">College:</strong> {selectedRemarkDetails.facultySnapshot.college}</p>
                                            </CardContent>
                                        </Card>
                                
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Remark Details</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                 <p><strong className="font-medium text-muted-foreground block">Remark Title:</strong> {selectedRemarkDetails.title}</p>
                                                <p><strong className="font-medium text-muted-foreground block">Points:</strong> <span className="font-bold text-destructive">{selectedRemarkDetails.points}</span></p>
                                                <p><strong className="font-medium text-muted-foreground block">Date Issued:</strong> {new Date(selectedRemarkDetails.createdAt).toLocaleString()}</p>
                                                <div>
                                                    <strong className="font-medium text-muted-foreground block">Notes / Rationale:</strong>
                                                    <p className="mt-1 pl-2 border-l-4 border-muted italic bg-muted/50 p-2 rounded-r-md">{selectedRemarkDetails.notes || 'N/A'}</p>
                                                </div>
                                                 <div>
                                                    <strong className="font-medium text-muted-foreground block">Proof Document:</strong>
                                                    {selectedRemarkDetails.proofUrl ? (
                                                        shortProofUrl ? (
                                                            <Button asChild variant="link" className="p-0 h-auto">
                                                                <a href={shortProofUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                                                            </Button>
                                                        ) : <span className="text-xs text-muted-foreground">Generating secure link...</span>
                                                    ) : "Not Provided"}
                                                </div>
                                            </CardContent>
                                        </Card>
                                
                                        {selectedRemarkDetails.appeal && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Appeal Information</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <p><strong className="font-medium text-muted-foreground block">Appeal Status:</strong> {selectedRemarkDetails.appeal.status}</p>
                                                    <p><strong className="font-medium text-muted-foreground block">Date Appealed:</strong> {new Date(selectedRemarkDetails.appeal.createdAt).toLocaleString()}</p>
                                                    <div>
                                                        <strong className="font-medium text-muted-foreground block">Appeal Reason:</strong>
                                                        <p className="mt-1 pl-2 border-l-4 border-muted italic bg-muted/50 p-2 rounded-r-md">{selectedRemarkDetails.appeal.reason}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                
                                        <p className="border-t pt-4 mt-4"><strong className="font-medium text-muted-foreground block">Remark ID:</strong> <span className="font-mono text-xs">{selectedRemarkDetails._id}</span></p>
                                    </div>
                                    )}
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isEditDialogOpen && editingRemark?._id === remark._id} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingRemark(remark)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Negative Remark</DialogTitle>
                                        <DialogDescription>Update the details for this remark.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                                        <div>
                                            <Label htmlFor="edit-creditTitle">Remark Template (Optional)</Label>
                                            <Select value={editCreditTitleId} onValueChange={setEditCreditTitleId}>
                                                <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                                                <SelectContent>
                                                    {creditTitleOptions.filter(o => o.value !== 'all').map(option => (
                                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-notes">Notes / Rationale</Label>
                                            <Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Proof Document (Optional)</Label>
                                            {editingRemark?.proofUrl && !editProof && (
                                                <p className="text-xs text-muted-foreground">Current file: <a href={getProofUrl(editingRemark.proofUrl)} target="_blank" rel="noopener noreferrer" className="text-primary underline">View</a>. Upload to replace.</p>
                                            )}
                                            <FileUpload onFileSelect={setEditProof} />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                            <Button type="submit" disabled={isSubmittingEdit}>
                                                {isSubmittingEdit ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the remark. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteRemark(remark._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">No remarks found for the selected filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}
