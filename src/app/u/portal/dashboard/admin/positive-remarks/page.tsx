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
import { PlusCircle, Eye, Search, Edit, Trash2, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
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
            return <Badge className="bg-green-100 text-green-800 border-green-200" aria-label="Status: Approved"><CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" /> Approved</Badge>;
        case 'rejected':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200" aria-label="Status: Rejected"><XCircle className="w-3 h-3 mr-1" aria-hidden="true" /> Rejected</Badge>;
        case 'pending':
        default:
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200" aria-label="Status: Pending"><Clock className="w-3 h-3 mr-1" aria-hidden="true" /> Pending</Badge>;
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
            <DialogContent className="sm:max-w-4xl border-cds-ui-03 rounded-none">
                 <DialogHeader>
                    <DialogTitle>Issue New Positive Credit</DialogTitle>
                    <DialogDescription>Fill out the details below to award a positive credit to a faculty member.</DialogDescription>
                </DialogHeader>
                <form className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4" onSubmit={handleSubmit}>
                    <div className="md:col-span-2 space-y-4">
                        <div ref={suggestionRef} className="relative">
                            <Label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="faculty">Faculty Member</Label>
                            <Input 
                              id="faculty"
                              placeholder="Type to search for faculty..."
                              value={facultySearch}
                              onChange={handleFacultySearch}
                              onFocus={() => setShowSuggestions(true)}
                              autoComplete="off"
                              className="rounded-none"
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
                            <Label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="creditTitle">Credit Template (Optional)</Label>
                             <Select value={creditTitleId} onValueChange={setCreditTitleId}>
                                <SelectTrigger id="creditTitle" className="rounded-none">
                                    <SelectValue placeholder="Select a template..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    {creditTitles.map(ct => ({ value: ct._id, label: `${ct.title} (${ct.points} pts)` })).map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-muted-foreground" htmlFor="title">Title</Label>
                            <Input id="title" placeholder="e.g., 'Best Paper Award at Conference'" value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="block text-sm font-medium text-muted-foreground" htmlFor="points">Points</Label>
                                <Input id="points" type="number" placeholder="e.g., 10" value={points} onChange={(e) => setPoints(Number(e.target.value))} required className="rounded-none" />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-muted-foreground" htmlFor="academicYear">Academic Year</label>
                            <Select value={getCurrentAcademicYear()} disabled>
                                <SelectTrigger id="academicYear" className="rounded-none"><SelectValue placeholder="Select Year" /></SelectTrigger>
                                <SelectContent className="rounded-none">{generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-muted-foreground" htmlFor="notes">Notes / Rationale</label>
                        <Textarea id="notes" placeholder="Enter detailed notes about the activity" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-none" />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Upload Proof (Optional)</label>
                        <FileUpload onFileSelect={setProof} />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        {selectedFaculty ? (
                             <Card className="rounded-none shadow-none">
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
                            <div className="flex items-center justify-center h-full border-2 border-dashed rounded-none bg-muted/50">
                                <p className="text-muted-foreground text-center p-4">Select a faculty member to see their details.</p>
                            </div>
                        )}
                    </div>
                     <DialogFooter className="pt-4 md:col-span-3">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" className="rounded-none">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-none">
                            {isLoading ? "Submitting..." : "Issue Credit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </header>
        
      <Card className="rounded-none shadow-none border-cds-ui-03">
        <CardHeader className="bg-cds-ui-01/50 border-b">
            <CardTitle>Issued Credits History</CardTitle>
            <CardDescription>A log of all positive credits that have been issued by administrators.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input 
                      placeholder="Search title, faculty..." 
                      className="pl-10 rounded-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
               <Select value={creditTitleFilter} onValueChange={(value) => setCreditTitleFilter(value === "all" ? "all" : value)}>
                   <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Filter template..." />
                   </SelectTrigger>
                   <SelectContent className="rounded-none">
                        {creditTitleOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                   </SelectContent>
               </Select>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                      <SelectItem value="all">All Years</SelectItem>
                      {generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                  </SelectContent>
              </Select>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select College" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                      <SelectItem value="all">All Colleges</SelectItem>
                      {Object.keys(colleges).map(college => (<SelectItem key={college} value={college}>{college}</SelectItem>))}
                  </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={!filteredDepartments || Object.keys(filteredDepartments).length === 0}>
                  <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
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
          <div className="overflow-x-auto border rounded-none">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credit Title</TableHead>
                  <TableHead className="text-center">Status</TableHead>
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
                  <TableRow key={credit._id} className="hover:bg-cds-ui-01/50 transition-colors">
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{credit.facultySnapshot?.name || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">{credit.facultySnapshot?.facultyID || 'N/A'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-xs">{credit.facultySnapshot?.department || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={credit.title}>{credit.title}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(credit.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{new Date(credit.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-bold text-cds-support-02 tabular-nums">+{credit.points}</TableCell>
                    <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1">
                            <Dialog open={isDetailsOpen && selectedCreditDetails?._id === credit._id} onOpenChange={setIsDetailsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCreditDetails(credit)} aria-label="View Details">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                 <DialogContent className="max-w-3xl rounded-none border-cds-ui-03">
                                    <DialogHeader>
                                    <DialogTitle>Credit Transaction Audit</DialogTitle>
                                    <DialogDescription>A complete overview of the recorded credit adjustment.</DialogDescription>
                                    </DialogHeader>
                                    {selectedCreditDetails && (
                                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4 text-sm">
                                        <div className="bg-cds-ui-01 p-4 border border-cds-ui-03">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Faculty Associate</p>
                                            <p className="font-bold text-base">{selectedCreditDetails.facultySnapshot?.name}</p>
                                            <p className="text-xs font-mono text-muted-foreground uppercase">{selectedCreditDetails.facultySnapshot?.facultyID}</p>
                                        </div>
                                
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Impact</p>
                                                <p className="text-2xl font-bold text-cds-support-02 tabular-nums">+{selectedCreditDetails.points}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Status</p>
                                                <div>{getStatusBadge(selectedCreditDetails.status)}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Staff Rationale</p>
                                            <blockquote className="mt-1 border-l-4 border-cds-support-02 pl-4 italic bg-cds-ui-01 p-3 text-cds-text-02 leading-relaxed">
                                                {selectedCreditDetails.notes || 'No notes provided.'}
                                            </blockquote>
                                        </div>

                                        {selectedCreditDetails.proofUrl && (
                                            <div className="p-4 border border-dashed border-cds-ui-03 bg-cds-ui-01/30 text-center">
                                                {shortProofUrl ? (
                                                    <Button asChild variant="link" className="text-primary font-bold">
                                                        <a href={shortProofUrl} target="_blank" rel="noopener noreferrer">Download Supporting Evidence</a>
                                                    </Button>
                                                ) : <span className="text-xs text-muted-foreground italic animate-pulse">authorizing access...</span>}
                                            </div>
                                        )}
                                    </div>
                                    )}
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="secondary" className="rounded-none px-8">Close Audit</Button></DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isEditDialogOpen && editingCredit?._id === credit._id} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCredit(credit)} aria-label="Edit Record">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-none border-cds-ui-03">
                                    <DialogHeader>
                                        <DialogTitle>Update Credit Record</DialogTitle>
                                        <DialogDescription>Modify the administrative details for this credit adjustment.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                                        <div>
                                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block" htmlFor="edit-creditTitle">Activity Category</Label>
                                            <Select value={editCreditTitleId} onValueChange={setEditCreditTitleId}>
                                                <SelectTrigger className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01"><SelectValue placeholder="Select template..." /></SelectTrigger>
                                                <SelectContent className="rounded-none">
                                                    {creditTitleOptions.filter(o => o.value !== 'all').map(option => (
                                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block" htmlFor="edit-notes">Administrative Rationale</Label>
                                            <Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 min-h-[100px] resize-none focus:ring-0 focus:border-b-2" />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Evidence Replacement</Label>
                                            {editingCredit?.proofUrl && !editProof && (
                                                <p className="text-xs text-muted-foreground mb-2">Current file exists. Upload to replace.</p>
                                            )}
                                            <FileUpload onFileSelect={setEditProof} />
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

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" aria-label="Delete Record">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none border-cds-ui-03">
                                    <AlertDialogHeader>
                                        <div className="flex items-center gap-3 text-destructive mb-2">
                                            <AlertCircle className="h-6 w-6" aria-hidden="true" />
                                            <AlertDialogTitle>Delete Credit Adjustment?</AlertDialogTitle>
                                        </div>
                                        <AlertDialogDescription>This transaction will be voided and the faculty associate's balance will be adjusted accordingly. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteCredit(credit._id)} className="bg-destructive hover:bg-destructive/90 rounded-none">Confirm Deletion</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24 italic text-muted-foreground">No records matched your criteria.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t py-3 bg-cds-ui-01/30">
            <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                Page {page} of {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                </Button>
                <Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}
