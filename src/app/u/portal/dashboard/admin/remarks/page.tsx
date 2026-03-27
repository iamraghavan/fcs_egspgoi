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
import { PlusCircle, Eye, Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colleges } from "@/lib/colleges";
import { useAlert } from "@/context/alert-context";
import { Label } from "@/components/ui/label";
import { shortenUrl } from "@/lib/url-shortener";

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
    setSelectedFaculty(null);
    if (!showSuggestions) {
      setShowSuggestions(true);
    }
  };
  
  const handleFacultySelect = (faculty: User) => {
    setSelectedFaculty(faculty);
    setFacultySearch(`${faculty.name} (${faculty.department || 'n/a'})`);
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
      showAlert("Authentication error", "Admin token not found.");
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
      }

      const creditTitlesData = await creditTitlesResponse.json();
      if (creditTitlesData.success) {
        setCreditTitles(creditTitlesData.items.filter((ct: CreditTitle) => ct.type === 'negative'));
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

          // Standardized path per Guide V2
          const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/negative?${params.toString()}`, {
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
  }, [adminToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (adminToken) {
            fetchRemarks(page);
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
    return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
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
        .catch(() => setShortProofUrl(getProofUrl(selectedRemarkDetails.proofUrl)));
    }
  }, [selectedRemarkDetails]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !points || !title || !creditTitleId) {
      showAlert("Incomplete form", "Please ensure a faculty member and a valid remark template are selected.");
      return;
    }
    setIsLoading(true);

    if (!adminToken) {
      showAlert("Authentication error", "Admin token not found.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("facultyId", selectedFaculty._id);
    formData.append("points", points.toString());
    formData.append("academicYear", getCurrentAcademicYear());
    formData.append("title", title);
    formData.append("creditTitleId", creditTitleId);
    if (notes) formData.append("notes", notes);
    if (proof) formData.append("proof", proof);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/negative`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to issue remark.");
      }

      toast({
        title: "Remark issued",
        description: "The negative remark has been successfully recorded.",
      });

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

    } catch (error: any) {
      showAlert("Submission failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemark) return;
    setIsSubmittingEdit(true);

    const formData = new FormData();
    if (editNotes !== (editingRemark.notes || "")) formData.append("notes", editNotes);
    if (editCreditTitleId !== (editingRemark.creditTitle || "")) formData.append("creditTitleId", editCreditTitleId);
    if (editProof) formData.append("proof", editProof);

    if (Array.from(formData.keys()).length === 0) {
        setIsSubmittingEdit(false);
        setIsEditDialogOpen(false);
        toast({ title: "No changes", description: "No changes were made to the remark." });
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

        toast({ title: "Remark updated", description: "The remark has been successfully updated." });
        setIsEditDialogOpen(false);
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("Update failed", error.message);
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleDeleteRemark = async (creditId: string) => {
      if (!adminToken) {
          showAlert("Authentication error", "Admin token not found.");
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

          toast({ title: "Remark deleted", description: "The remark has been permanently deleted and credit balance restored." });
          fetchRemarks(page);
      } catch (error: any) {
          showAlert("Delete failed", error.message);
      }
  };
  
 const creditTitleOptions = useMemo(() => {
    return creditTitles
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(ct => ({ value: ct._id, label: `${ct.title} (${ct.points} pts)` }));
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
                            <Label className="mb-1" htmlFor="faculty">Faculty Member <span className="text-destructive">*</span></Label>
                            <Input 
                              id="faculty"
                              placeholder="Type to search for faculty..."
                              value={facultySearch}
                              onChange={handleFacultySearch}
                              onFocus={() => setShowSuggestions(true)}
                              autoComplete="off"
                            />
                             {showSuggestions && suggestedFaculty.length > 0 && (
                              <div className="absolute z-[150] w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suggestedFaculty.map(faculty => (
                                  <div
                                    key={faculty._id}
                                    className="cursor-pointer p-3 hover:bg-accent"
                                    onClick={() => handleFacultySelect(faculty)}
                                  >
                                    <p className="font-semibold text-sm">{faculty.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{faculty.department || 'n/a'} - {faculty.college || 'n/a'}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div>
                            <Label className="mb-1" htmlFor="creditTitle">Remark Template <span className="text-destructive">*</span></Label>
                             <Select value={creditTitleId} onValueChange={setCreditTitleId}>
                                <SelectTrigger id="creditTitle">
                                    <SelectValue placeholder="Select a template..." />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                    {creditTitleOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1" htmlFor="title">Title <span className="text-destructive">*</span></Label>
                            <Input id="title" placeholder="e.g., 'Missed department meeting'" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1" htmlFor="points">Points <span className="text-destructive">*</span></Label>
                                <Input id="points" type="number" placeholder="e.g., -5" value={points} onChange={(e) => setPoints(Number(e.target.value))} required />
                            </div>
                            <div>
                            <Label className="mb-1" htmlFor="academicYear">Academic Year</Label>
                            <Select value={getCurrentAcademicYear()} disabled>
                                <SelectTrigger id="academicYear"><SelectValue placeholder="Select Year" /></SelectTrigger>
                                <SelectContent className="z-[150]">{generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div>
                        <Label className="mb-1" htmlFor="notes">Notes / Rationale</Label>
                        <Textarea id="notes" placeholder="Enter detailed notes about the incident" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        <div>
                        <Label className="mb-1">Upload Proof (Optional)</Label>
                        <FileUpload onFileSelect={setProof} />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        {selectedFaculty ? (
                             <Card className="rounded-none border-cds-ui-03">
                                <CardHeader className="flex flex-row items-center gap-4 p-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedFaculty.profileImage} />
                                        <AvatarFallback>{selectedFaculty.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-sm font-semibold">{selectedFaculty.name}</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-mono">{selectedFaculty.facultyID}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-xs space-y-2 p-4 pt-0">
                                    <p><strong className="font-medium text-muted-foreground">Department:</strong> {selectedFaculty.department || 'n/a'}</p>
                                    <p><strong className="font-medium text-muted-foreground">Role:</strong> <span className="capitalize">{selectedFaculty.role || 'n/a'}</span></p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex items-center justify-center h-full border border-dashed border-cds-ui-03 bg-cds-ui-01/50 p-6">
                                <p className="text-muted-foreground text-center text-xs">Search and select a faculty member to see their profile details.</p>
                            </div>
                        )}
                    </div>
                     <DialogFooter className="pt-4 md:col-span-3 border-t">
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
        
      <Card className="rounded-none shadow-none">
        <CardHeader className="bg-cds-ui-01/50 border-b">
            <CardTitle className="text-base font-semibold">Issued Remarks History</CardTitle>
            <CardDescription className="text-xs">A log of all negative remarks that have been issued across the institution.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border-b">
              <div className="relative border-r">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search title, faculty..." 
                      className="pl-10 h-12 border-0 rounded-none bg-transparent focus:ring-0"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
               <Select value={creditTitleFilter} onValueChange={setCreditTitleFilter}>
                   <SelectTrigger className="h-12 border-0 rounded-none bg-transparent border-r focus:ring-0">
                        <SelectValue placeholder="Filter by template..." />
                   </SelectTrigger>
                   <SelectContent className="z-[150]">
                        <SelectItem value="all">All Templates</SelectItem>
                        {creditTitleOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                   </SelectContent>
               </Select>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger className="h-12 border-0 rounded-none bg-transparent border-r focus:ring-0">
                      <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                      <SelectItem value="all">All Years</SelectItem>
                      {generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                  </SelectContent>
              </Select>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger className="h-12 border-0 rounded-none bg-transparent border-r focus:ring-0">
                      <SelectValue placeholder="Select College" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                      <SelectItem value="all">All Colleges</SelectItem>
                      {Object.keys(colleges).map(college => (<SelectItem key={college} value={college}>{college}</SelectItem>))}
                  </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={!filteredDepartments || Object.keys(filteredDepartments).length === 0}>
                  <SelectTrigger className="h-12 border-0 rounded-none bg-transparent focus:ring-0">
                      <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead className="text-xs font-bold text-cds-text-05">Faculty</TableHead>
                  <TableHead className="text-xs font-bold text-cds-text-05">Department</TableHead>
                  <TableHead className="text-xs font-bold text-cds-text-05">Remark Title</TableHead>
                  <TableHead className="text-xs font-bold text-cds-text-05">Date</TableHead>
                  <TableHead className="text-right text-xs font-bold text-cds-text-05">Points</TableHead>
                  <TableHead className="text-center text-xs font-bold text-cds-text-05">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">Loading remarks...</TableCell></TableRow>
                ) : remarks.length > 0 ? (
                  remarks.map((remark) => (
                      <TableRow key={remark._id} className="hover:bg-cds-ui-01/50 transition-colors border-b last:border-0">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={remark.facultySnapshot.profileImage} />
                                    <AvatarFallback>{remark.facultySnapshot.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-cds-text-01 text-[13px]">{remark.facultySnapshot.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{remark.facultySnapshot.facultyID}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-[12px] text-cds-text-02">{remark.facultySnapshot.department}</TableCell>
                        <TableCell className="text-[12px] text-cds-text-01 max-w-[250px] truncate">{remark.title}</TableCell>
                        <TableCell className="text-[12px] text-cds-text-05 tabular-nums">{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-cds-support-01">{remark.points}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex justify-center items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedRemarkDetails(remark)}>
                                    <Eye className="h-4 w-4 text-cds-text-05" />
                                </Button>

                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRemark(remark); setIsEditDialogOpen(true); }}>
                                    <Edit className="h-4 w-4 text-cds-text-05" />
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <div className="flex items-center gap-3 text-destructive mb-2">
                                                <AlertCircle className="h-6 w-6" />
                                                <AlertDialogTitle>Delete Negative Credit?</AlertDialogTitle>
                                            </div>
                                            <AlertDialogDescription>
                                                This action cannot be undone. The faculty's credit balance will be restored automatically upon removal of this remark.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteRemark(remark._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none">
                                                Delete Remark
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">No remarks found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t py-3 bg-cds-ui-01/30">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                Page {page} of {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs font-semibold" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                </Button>
                <Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs font-semibold" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next
                </Button>
            </div>
        </CardFooter>
      </Card>

      {/* Edit Remark Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Negative Remark</DialogTitle>
                <DialogDescription>Correct the notes or change the violation type if issued incorrectly.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <div>
                    <Label htmlFor="edit-creditTitle" className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1 block">Violation Type</Label>
                    <Select value={editCreditTitleId} onValueChange={setEditCreditTitleId}>
                        <SelectTrigger className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01">
                            <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent className="z-[150]">
                            {creditTitleOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="edit-notes" className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1 block">Notes / Reason</Label>
                    <Textarea 
                        id="edit-notes" 
                        value={editNotes} 
                        onChange={(e) => setEditNotes(e.target.value)} 
                        placeholder="Update the reason for this remark..."
                        className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 min-h-[100px] resize-none focus:ring-0 focus:border-b-2 focus:border-primary"
                    />
                </div>
                <div>
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1 block">Proof Replacement (Optional)</Label>
                    <FileUpload onFileSelect={setEditProof} description="Upload a new document to replace existing proof" />
                </div>
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild><Button type="button" variant="secondary" className="rounded-none">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmittingEdit} className="rounded-none px-8">
                        {isSubmittingEdit ? "Updating..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
       <Dialog open={!!selectedRemarkDetails} onOpenChange={(open) => !open && setSelectedRemarkDetails(null)}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Remark Details</DialogTitle>
                <DialogDescription>A comprehensive overview of the recorded negative remark.</DialogDescription>
            </DialogHeader>
            {selectedRemarkDetails && (
                <div className="space-y-6 py-4 text-sm">
                    <div className="flex items-center gap-4 p-4 bg-cds-ui-01 border border-cds-ui-03">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={selectedRemarkDetails.facultySnapshot.profileImage} />
                            <AvatarFallback>{selectedRemarkDetails.facultySnapshot.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-base">{selectedRemarkDetails.facultySnapshot.name}</p>
                            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{selectedRemarkDetails.facultySnapshot.facultyID}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Title</p>
                            <p className="font-semibold leading-tight">{selectedRemarkDetails.title}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Deduction</p>
                            <p className="text-xl font-bold text-cds-support-01 tabular-nums">{selectedRemarkDetails.points}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Institutional Context</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <p><span className="text-muted-foreground">Department:</span> {selectedRemarkDetails.facultySnapshot.department}</p>
                            <p><span className="text-muted-foreground">Academic Year:</span> {selectedRemarkDetails.academicYear}</p>
                            <p><span className="text-muted-foreground">Date Issued:</span> {new Date(selectedRemarkDetails.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Notes / Rationale</p>
                        <blockquote className="mt-1 border-l-2 border-primary/20 pl-4 italic bg-cds-ui-01 p-3 rounded-r-sm leading-relaxed text-cds-text-02">
                            {selectedRemarkDetails.notes || "No additional notes were provided at issuance."}
                        </blockquote>
                    </div>

                    {selectedRemarkDetails.proofUrl && (
                        <div className="p-4 border border-dashed border-cds-ui-03 bg-cds-ui-01/30 text-center">
                             <Button asChild variant="link" className="text-primary font-bold">
                                <a href={getProofUrl(selectedRemarkDetails.proofUrl)} target="_blank" rel="noopener noreferrer">View Original Proof Attachment</a>
                            </Button>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="border-t pt-4">
                <DialogClose asChild><Button variant="secondary" className="rounded-none">Close Details</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  )
}
