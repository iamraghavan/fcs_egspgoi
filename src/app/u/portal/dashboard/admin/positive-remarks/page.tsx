
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
import { PlusCircle, Eye, Search, Edit, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colleges } from "@/lib/colleges";
import { useAlert } from "@/context/alert-context";
import { Label } from "@/components/ui/label";
import { shortenUrl } from "@/lib/url-shortener";
import { Badge } from "@/components/ui/badge";


const API_BASE_URL = 'https://faculty-credit-system.vercel.app';

type User = {
  _id: string;
  name: string;
  college: string;
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

type PositiveCredit = {
    _id: string;
    academicYear: string;
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
    type: 'positive';
    updatedAt: string;
};

type Departments = {
    [key: string]: string[];
};

const getCurrentAcademicYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (currentMonth >= 5) {
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

export default function ManagePositiveCreditsPage() {
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
  const [credits, setCredits] = useState<PositiveCredit[]>([]);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
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
  const [selectedCreditDetails, setSelectedCreditDetails] = useState<PositiveCredit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [shortProofUrl, setShortProofUrl] = useState<string | null>(null);

  // Edit State
  const [editingCredit, setEditingCredit] = useState<PositiveCredit | null>(null);
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
    setSelectedFaculty(null);
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
      .sort((a, b) => a.name.localeCompare(b.name))
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
        setCreditTitles(creditTitlesData.items.filter((ct: CreditTitle) => ct.type === 'positive'));
      } else {
        throw new Error(creditTitlesData.message || "Failed to fetch credit titles");
      }
    } catch (error: any) {
      showAlert("Error fetching initial data", error.message);
    }
  };

  const fetchCredits = async (currentPage: number) => {
      setIsLoadingCredits(true);
      if (!adminToken) {
          setIsLoadingCredits(false);
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

          const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/positive?${params.toString()}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          const resData = await response.json();
          if (resData.success) {
              setCredits(resData.data || resData.items || []);
              setTotal(resData.total || resData.meta?.total || 0);
          } else {
              throw new Error(resData.message || "Failed to fetch credits");
          }
      } catch (error: any) {
          showAlert("Error fetching credits", error.message);
          setCredits([]);
          setTotal(0);
      } finally {
          setIsLoadingCredits(false);
      }
  };


  useEffect(() => {
    if (adminToken) {
      fetchDropdownData();
    }
  }, [adminToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (adminToken) {
            fetchCredits(page);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [page, adminToken, searchTerm, academicYearFilter, creditTitleFilter, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    setPage(1);
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
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (editingCredit) {
        setEditNotes(editingCredit.notes || "");
        setEditCreditTitleId(editingCredit.creditTitle || "");
        setEditProof(null);
    }
  }, [editingCredit]);

  useEffect(() => {
    if (selectedCreditDetails?.proofUrl) {
      setShortProofUrl(null);
      shortenUrl(getProofUrl(selectedCreditDetails.proofUrl))
        .then(setShortProofUrl)
        .catch(() => setShortProofUrl(getProofUrl(selectedCreditDetails!.proofUrl)));
    }
  }, [selectedCreditDetails]);


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
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/positive`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to issue credit.");
      }

      toast({
        title: "Credit Issued",
        description: "The positive credit has been successfully recorded.",
      });

      setSelectedFaculty(null);
      setFacultySearch("");
      setCreditTitleId("");
      setTitle("");
      setPoints("");
      setNotes("");
      setProof(null);
      fetchCredits(1);
      setPage(1);
      setIsFormOpen(false);

    } catch (error: any) {
      showAlert("Submission Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredit) return;
    setIsSubmittingEdit(true);

    const formData = new FormData();
    if (editNotes !== (editingCredit.notes || "")) formData.append("notes", editNotes);
    if (editCreditTitleId !== (editingCredit.creditTitle || "")) formData.append("creditTitleId", editCreditTitleId);
    if (editProof) formData.append("proof", editProof);

    if (Array.from(formData.keys()).length === 0) {
        setIsSubmittingEdit(false);
        setIsEditDialogOpen(false);
        toast({ title: "No Changes", description: "No changes were made to the credit." });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/positive/${editingCredit._id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "Failed to update credit.");
        }

        toast({ title: "Credit Updated", description: "The credit has been successfully updated." });
        setIsEditDialogOpen(false);
        fetchCredits(page);
    } catch (error: any) {
        showAlert("Update Failed", error.message);
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
      if (!adminToken) {
          showAlert("Authentication Error", "Admin token not found.");
          return;
      }
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/positive/${creditId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${adminToken}` },
          });

          const responseData = await response.json();
          if (!response.ok || !responseData.success) {
              throw new Error(responseData.message || "Failed to delete credit.");
          }

          toast({ title: "Credit Deleted", description: "The credit has been permanently deleted." });
          if (page > 1 && credits.length === 1) {
            setPage(page - 1);
          } else {
            fetchCredits(page);
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

const getStatusBadge = (status: PositiveCredit['status']) => {
    switch (status) {
        case 'approved':
            return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
        case 'rejected':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
        case 'pending':
        default:
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
};


  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Manage Positive Credits
          </h1>
          <p className="mt-1 text-muted-foreground">
            Issue and monitor positive credit adjustments for faculty members.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Issue New Credit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>Issue New Positive Credit</DialogTitle>
                    <DialogDescription>Fill out the details below to award a positive credit to a faculty member.</DialogDescription>
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
                                    className="cursor-pointer p-3 hover:bg-accent"
                                    onClick={() => handleFacultySelect(faculty)}
                                  >
                                    <p className="font-semibold">{faculty.name}</p>
                                    <p className="text-sm text-muted-foreground">{faculty.department || 'N/A'} - {faculty.college || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">{faculty.email || ''}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="creditTitle">Credit Template (Optional)</label>
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
                            <Input id="title" placeholder="e.g., 'Best Paper Award at Conference'" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground" htmlFor="points">Points</label>
                                <Input id="points" type="number" placeholder="e.g., 10" value={points} onChange={(e) => setPoints(Number(e.target.value))} required />
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
                        <Textarea id="notes" placeholder="Enter detailed notes about the activity" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                            {isLoading ? "Submitting..." : "Issue Credit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </header>
        
      <Card>
        <CardHeader>
            <CardTitle>Issued Credits History</CardTitle>
            <CardDescription>A log of all positive credits that have been issued by administrators.</CardDescription>
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
                  <TableHead>Department</TableHead>
                  <TableHead>Credit Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCredits ? (
                   <TableRow><TableCell colSpan={7} className="text-center h-24">Loading credits...</TableCell></TableRow>
                ) : credits.length > 0 ? (
                  credits.map((credit) => (
                  <TableRow key={credit._id}>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{credit.facultySnapshot?.name || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">{credit.facultySnapshot?.facultyID || 'N/A'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-xs">{credit.facultySnapshot?.department || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={credit.title}>{credit.title}</TableCell>
                    <TableCell>{getStatusBadge(credit.status)}</TableCell>
                    <TableCell className="text-xs">{new Date(credit.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">+{credit.points}</TableCell>
                    <TableCell className="text-center">
                        <div className="flex justify-center items-center">
                            <Dialog open={isDetailsOpen && selectedCreditDetails?._id === credit._id} onOpenChange={setIsDetailsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedCreditDetails(credit)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                 <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                    <DialogTitle>Credit Details</DialogTitle>
                                    <DialogDescription>A complete overview of the recorded credit.</DialogDescription>
                                    </DialogHeader>
                                    {selectedCreditDetails && (
                                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4 text-sm">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{selectedCreditDetails.facultySnapshot?.name}</CardTitle>
                                                <CardDescription>{selectedCreditDetails.facultySnapshot?.facultyID}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p><strong className="font-medium text-muted-foreground w-24 inline-block">Department:</strong> {selectedCreditDetails.facultySnapshot?.department}</p>
                                                <p><strong className="font-medium text-muted-foreground w-24 inline-block">College:</strong> {selectedCreditDetails.facultySnapshot?.college}</p>
                                            </CardContent>
                                        </Card>
                                
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Credit Details</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                 <p><strong className="font-medium text-muted-foreground block">Credit Title:</strong> {selectedCreditDetails.title}</p>
                                                <p><strong className="font-medium text-muted-foreground block">Points:</strong> <span className="font-bold text-green-600">+{selectedCreditDetails.points}</span></p>
                                                <p><strong className="font-medium text-muted-foreground block">Status:</strong> {selectedCreditDetails.status}</p>
                                                <p><strong className="font-medium text-muted-foreground block">Date Issued:</strong> {new Date(selectedCreditDetails.createdAt).toLocaleString()}</p>
                                                <div>
                                                    <strong className="font-medium text-muted-foreground block">Notes / Rationale:</strong>
                                                    <p className="mt-1 pl-2 border-l-4 border-muted italic bg-muted/50 p-2 rounded-r-md">{selectedCreditDetails.notes || 'N/A'}</p>
                                                </div>
                                                 <div>
                                                    <strong className="font-medium text-muted-foreground block">Proof Document:</strong>
                                                    {selectedCreditDetails.proofUrl ? (
                                                        shortProofUrl ? (
                                                            <Button asChild variant="link" className="p-0 h-auto">
                                                                <a href={shortProofUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                                                            </Button>
                                                        ) : <span className="text-xs text-muted-foreground">Generating secure link...</span>
                                                    ) : "Not Provided"}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <p className="border-t pt-4 mt-4"><strong className="font-medium text-muted-foreground block">Credit ID:</strong> <span className="font-mono text-xs">{selectedCreditDetails._id}</span></p>
                                    </div>
                                    )}
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isEditDialogOpen && editingCredit?._id === credit._id} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingCredit(credit)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Positive Credit</DialogTitle>
                                        <DialogDescription>Update the details for this credit.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                                        <div>
                                            <Label htmlFor="edit-creditTitle">Credit Template (Optional)</Label>
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
                                            {editingCredit?.proofUrl && !editProof && (
                                                <p className="text-xs text-muted-foreground">Current file: <a href={getProofUrl(editingCredit.proofUrl)} target="_blank" rel="noopener noreferrer" className="text-primary underline">View</a>. Upload to replace.</p>
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
                                        <AlertDialogDescription>This will permanently delete the credit. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteCredit(credit._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">No credits found for the selected filters.</TableCell></TableRow>
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
