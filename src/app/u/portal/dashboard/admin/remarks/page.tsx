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
import { PlusCircle, Eye, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colleges } from "@/lib/colleges";
import { useAlert } from "@/context/alert-context";
import { Combobox } from "@/components/ui/combobox";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type User = {
  _id: string;
  name: string;
};

type CreditTitle = {
  _id: string;
  title: string;
  points: number;
  type: 'positive' | 'negative';
};

type NegativeRemark = {
  _id: string;
  faculty: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  title: string;
  points: number;
  status: string;
  notes?: string;
  proofUrl?: string;
  createdAt: string;
  academicYear: string;
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
  const [facultyId, setFacultyId] = useState("");
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});
  
  // Details view state
  const [selectedRemark, setSelectedRemark] = useState<NegativeRemark | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const uid = searchParams.get('uid');
  const totalPages = Math.ceil(total / limit);

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
          if (statusFilter !== 'all') params.append('status', statusFilter);
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
  }, [page, adminToken, searchTerm, academicYearFilter, statusFilter, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    setPage(1); // Reset to first page whenever filters change
  }, [searchTerm, academicYearFilter, statusFilter, collegeFilter, departmentFilter]);
  
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId || !points || !title) {
      showAlert("Incomplete Form", "Please fill out all required fields.");
      return;
    }
    setIsLoading(true);

    if (!adminToken) {
      showAlert("Authentication Error", "Admin token not found.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("facultyId", facultyId);
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
      setFacultyId("");
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
          facultyId: facultyId,
          remark: {
            title: title,
            message: notes,
          },
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

  const facultyOptions = useMemo(() => 
    facultyList.map(f => ({ value: f._id, label: f.name })),
    [facultyList]
  );

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
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader>
                    <DialogTitle>Issue New Remark</DialogTitle>
                    <DialogDescription>Fill out the details below to issue a negative credit to a faculty member.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="faculty">Faculty Member</label>
                        <Combobox
                            options={facultyOptions}
                            value={facultyId}
                            onValueChange={setFacultyId}
                            placeholder="Select faculty member..."
                            searchPlaceholder="Search faculty..."
                            emptyPlaceholder="No faculty found."
                        />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-muted-foreground" htmlFor="creditTitle">Remark Template (Optional)</label>
                    <Select value={creditTitleId} onValueChange={setCreditTitleId}>
                        <SelectTrigger id="creditTitle"><SelectValue placeholder="Select a template" /></SelectTrigger>
                        <SelectContent>
                        {creditTitles.map(ct => (<SelectItem key={ct._id} value={ct._id}>{ct.title}</SelectItem>))}
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
                    <DialogFooter className="pt-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search by title, faculty..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
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
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (
                   <TableRow><TableCell colSpan={5} className="text-center h-24">Loading remarks...</TableCell></TableRow>
                ) : remarks.length > 0 ? (
                  remarks.map((remark) => (
                  <TableRow key={remark._id}>
                    <TableCell className="font-medium text-foreground">{remark.faculty.name}</TableCell>
                    <TableCell>{remark.title}</TableCell>
                    <TableCell>{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{remark.points}</TableCell>
                    <TableCell className="text-center">
                        <Dialog open={isDetailsOpen && selectedRemark?._id === remark._id} onOpenChange={(isOpen) => {
                            if (isOpen) {
                                setSelectedRemark(remark);
                                setIsDetailsOpen(true);
                            } else {
                                setIsDetailsOpen(false);
                                setSelectedRemark(null);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setSelectedRemark(remark);
                                    setIsDetailsOpen(true);
                                }}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Remark Details</DialogTitle>
                                </DialogHeader>
                                {selectedRemark && selectedRemark.faculty && (
                                <div className="space-y-4 py-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={selectedRemark.faculty.profileImage} />
                                            <AvatarFallback>{selectedRemark.faculty.name?.charAt(0) ?? '?'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{selectedRemark.faculty.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedRemark.academicYear}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p><strong className="font-medium text-muted-foreground">Title:</strong> {selectedRemark.title}</p>
                                        <p><strong className="font-medium text-muted-foreground">Points:</strong> <span className="font-semibold text-destructive">{selectedRemark.points}</span></p>
                                        <p><strong className="font-medium text-muted-foreground">Date Issued:</strong> {new Date(selectedRemark.createdAt).toLocaleString()}</p>
                                        <p><strong className="font-medium text-muted-foreground">Notes:</strong> {selectedRemark.notes || 'N/A'}</p>
                                    </div>
                                    {selectedRemark.proofUrl && (
                                        <Button asChild variant="link" className="p-0 h-auto">
                                            <a href={getProofUrl(selectedRemark.proofUrl)} target="_blank" rel="noopener noreferrer">View Proof Document</a>
                                        </Button>
                                    )}
                                </div>
                                )}
                                <DialogFooter>
                                    <DialogClose asChild><Button>Close</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No remarks found for the selected filters.</TableCell></TableRow>
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
