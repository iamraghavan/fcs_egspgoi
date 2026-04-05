
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
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
} from "@/components/ui/alert-dialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Eye, Calendar as CalendarIcon, Trash2, Edit, AlertCircle, RefreshCw } from "lucide-react";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { colleges } from "@/lib/colleges";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { shortenUrl } from "@/lib/url-shortener";
import _ from "lodash";

const API_BASE_URL = '/api/v1';

type IssuedRemark = {
    _id: string;
    academicYear: string;
    createdAt: string;
    faculty: string;
    facultySnapshot: {
        name: string;
        college: string;
        facultyID: string;
        department: string;
        profileImage?: string;
    };
    issuedBy: string;
    issuedBySnapshot: {
        _id: string;
        name: string;
        email: string;
    };
    notes?: string;
    points: number;
    proofUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed' | 'deleted';
    type: 'negative';
    updatedAt: string;
    creditTitle?: string;
    title: string;
    appealEligibility?: {
        canAppeal: boolean;
        reason: string;
        expiryDate?: string;
    };
};

type CreditTitle = {
  _id: string;
  title: string;
  points: number;
  type: 'positive' | 'negative';
};

type DynamicFilters = {
    templates: string[];
    years: string[];
    colleges: string[];
    departments: string[];
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

export default function IssuedHistoryPage() {
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [remarks, setRemarks] = useState<IssuedRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [creditTitleFilter, setCreditTitleFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilters>({
      templates: [],
      years: [],
      colleges: [],
      departments: []
  });
  
  const [selectedRemark, setSelectedRemark] = useState<IssuedRemark | null>(null);
  const [shortProofUrl, setShortProofUrl] = useState<string | null>(null);
  
  const [creditTitles, setCreditTitles] = useState<CreditTitle[]>([]);
  const [editingRemark, setEditingRemark] = useState<IssuedRemark | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editCreditTitleId, setEditCreditTitleId] = useState("");
  const [editProof, setEditProof] = useState<File | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const uid = searchParams.get('uid');
  const totalPages = Math.ceil(total / limit);

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
          if (statusFilter !== 'all') params.append('status', statusFilter);
          if (academicYearFilter !== 'all') params.append('academicYear', academicYearFilter);
          if (creditTitleFilter !== 'all') params.append('templateId', creditTitleFilter);
          if (collegeFilter !== 'all') params.append('college', collegeFilter);
          if (departmentFilter !== 'all') params.append('department', departmentFilter);
          if (dateRange?.from) params.append('fromDate', format(dateRange.from, 'yyyy-MM-dd'));
          if (dateRange?.to) params.append('toDate', format(dateRange.to, 'yyyy-MM-dd'));

          const response = await fetch(`${API_BASE_URL}/admin/credits/negative?${params.toString()}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          const resData = await response.json();
          if (resData.success) {
              const items = resData.items || resData.data?.items || [];
              setRemarks(items);
              setTotal(resData.total || items.length);
              if (resData.filters) {
                  setDynamicFilters(resData.filters);
              }
          } else {
              throw new Error(resData.message || "failed to fetch remarks");
          }
      } catch (error: any) {
          showAlert("error fetching remarks", error.message);
          setRemarks([]);
          setTotal(0);
      } finally {
          setIsLoadingRemarks(false);
      }
  };

  const debouncedFetch = useMemo(
    () => _.debounce((p) => fetchRemarks(p), 300),
    [searchTerm, statusFilter, academicYearFilter, creditTitleFilter, collegeFilter, departmentFilter, dateRange, adminToken]
  );

  useEffect(() => {
    const fetchCreditTitles = async () => {
        if (!adminToken) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/credit-title`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            const data = await response.json();
            if(data.success) {
                setCreditTitles(data.items.filter((ct: any) => ct.type === 'negative'));
            }
        } catch (error) {
            console.error("failed to fetch credit titles", error);
        }
    };
    fetchCreditTitles();
  }, [adminToken]);

  useEffect(() => {
    debouncedFetch(page);
    return () => debouncedFetch.cancel();
  }, [page, debouncedFetch]);
  
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, academicYearFilter, creditTitleFilter, collegeFilter, departmentFilter, dateRange]);

   useEffect(() => {
    if (editingRemark) {
        setEditNotes(editingRemark.notes || "");
        setEditCreditTitleId(editingRemark.creditTitle || "");
        setEditProof(null);
    }
  }, [editingRemark]);

  const getProofUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `/api/v1/credits/credits${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (selectedRemark?.proofUrl) {
        setShortProofUrl(null);
        shortenUrl(getProofUrl(selectedRemark.proofUrl))
            .then(setShortProofUrl)
            .catch(() => setShortProofUrl(getProofUrl(selectedRemark!.proofUrl)));
    }
  }, [selectedRemark]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemark) return;
    setIsSubmittingEdit(true);

    const formData = new FormData();
    formData.append("notes", editNotes);
    if (editCreditTitleId) formData.append("creditTitleId", editCreditTitleId);
    if (editProof) formData.append("proof", editProof);

    try {
        const response = await fetch(`${API_BASE_URL}/credits/credits/negative/${editingRemark._id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "failed to update remark.");
        }

        toast({ title: "remark updated", description: "the remark has been successfully updated." });
        setIsEditDialogOpen(false);
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("update failed", error.message);
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) {
        showAlert("authentication error", "admin token not found.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/credits/credits/negative/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${adminToken}` },
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "failed to delete remark.");
        }

        toast({ title: "remark deleted", description: "the remark has been permanently removed." });
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("delete failed", error.message);
    }
  };

  const handleReopenWindow = async (creditId: string) => {
    const confirm = window.confirm("Allow this faculty member to submit a new appeal for this remark?");
    if (!confirm) return;

    if (!adminToken) {
        showAlert("authentication error", "admin token not found.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/credits/credits/negative/${creditId}/reopen`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${adminToken}` },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "failed to re-open appeal window.");
        }

        toast({ title: "window re-opened", description: "the faculty member can now submit a new appeal." });
        fetchRemarks(page);
        if (selectedRemark?._id === creditId) {
            setSelectedRemark({ ...selectedRemark, status: 'pending' });
        }
    } catch (error: any) {
        showAlert("operation failed", error.message);
    }
  };

  const getStatusBadge = (status: IssuedRemark['status']) => {
    let variant: "default" | "secondary" | "destructive" = "secondary";
    let className = "";
    switch (status) {
        case 'approved': 
            variant = 'default';
            className = 'bg-green-100 text-green-800';
            break;
        case 'rejected':
        case 'deleted':
            variant = 'destructive';
            className = 'bg-red-100 text-red-800';
            break;
        case 'appealed':
            variant = 'default';
            className = 'bg-blue-100 text-blue-800';
            break;
        case 'pending':
        default:
            variant = 'secondary';
            className = 'bg-yellow-100 text-yellow-800';
            break;
    }
    return <Badge variant={variant} className={cn("rounded-none", className)}>{status}</Badge>;
  };

  const displayRemarks = useMemo(() => {
    if (!searchTerm) return remarks;
    const term = searchTerm.toLowerCase();
    return remarks.filter(r => 
      r.facultySnapshot.name.toLowerCase().includes(term) ||
      r.facultySnapshot.facultyID.toLowerCase().includes(term) ||
      r.title.toLowerCase().includes(term)
    );
  }, [remarks, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">
            Transaction History
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage negative remarks issued to faculty members.
          </p>
        </div>
         <Button asChild className="rounded-none font-semibold">
            <Link href={`/u/portal/dashboard/oa?uid=${uid}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Issue New Remark
            </Link>
        </Button>
      </header>
        
      <Card className="rounded-none shadow-none border-cds-ui-03">
        <CardHeader className="bg-cds-ui-01/50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                <div className="relative col-span-1 lg:col-span-3 border-b mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, ID, title, notes..." 
                        className="pl-10 h-12 border-0 rounded-none bg-transparent focus:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 border-0 rounded-none border-r focus:ring-0 bg-transparent text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className="z-[150] rounded-none">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="appealed">Appealed</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
                 <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                    <SelectTrigger className="h-10 border-0 rounded-none border-r focus:ring-0 bg-transparent text-xs"><SelectValue placeholder="Academic Year" /></SelectTrigger>
                    <SelectContent className="z-[150] rounded-none">
                        <SelectItem value="all">All Years</SelectItem>
                        {dynamicFilters.years.map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="h-10 border-0 rounded-none focus:ring-0 bg-transparent text-xs justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {dateRange?.from ? (
                          dateRange.to ? ( <> {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")} </> ) : ( format(dateRange.from, "LLL dd") )
                        ) : ( <span>Date Range</span> )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-[150] w-auto p-0 rounded-none" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Faculty</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Remark Title</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-cds-text-05 text-center">Status</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Date</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Points</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">Loading history...</TableCell></TableRow>
                ) : displayRemarks.length > 0 ? (
                  displayRemarks.map((remark) => {
                    const isModifiable = remark.status !== 'deleted';
                    return (
                      <TableRow key={remark._id} className={cn("hover:bg-cds-ui-01/50 transition-colors border-b last:border-0", remark.status === 'deleted' && 'opacity-50 grayscale bg-cds-ui-01')}>
                        <TableCell>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-cds-text-01 text-[13px] leading-tight">{remark.facultySnapshot.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{remark.facultySnapshot.facultyID}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-[12px] max-w-[200px] truncate">{remark.title}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(remark.status)}</TableCell>
                        <TableCell className="text-[12px] text-cds-text-05 tabular-nums whitespace-nowrap">{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-cds-support-01">{remark.points}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-cds-text-05" onClick={() => setSelectedRemark(remark)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-cds-text-05" onClick={() => { setEditingRemark(remark); setIsEditDialogOpen(true); }} disabled={!isModifiable}>
                                <Edit className="h-4 w-4" />
                            </Button>

                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={!isModifiable}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none">
                                    <AlertDialogHeader>
                                        <div className="flex items-center gap-3 text-destructive mb-2">
                                            <AlertCircle className="h-6 w-6" />
                                            <AlertDialogTitle>Delete Negative Remark?</AlertDialogTitle>
                                        </div>
                                        <AlertDialogDescription>
                                            This action cannot be undone. the faculty's credit balance will be restored automatically upon removal of this remark.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(remark._id)} className="bg-destructive hover:bg-destructive/90 rounded-none">
                                            Confirm & Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                    <TableRow><TableCell colSpan={6} className="text-center h-24 italic text-muted-foreground">No matching issued remarks found.</TableCell></TableRow>
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
        <DialogContent className="sm:max-w-md rounded-none">
            <DialogHeader>
                <DialogTitle>Update Remark Details</DialogTitle>
                <DialogDescription>Correct notes or modify the violation category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-creditTitle" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Violation Category</Label>
                    <Select value={editCreditTitleId} onValueChange={setEditCreditTitleId}>
                        <SelectTrigger className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 h-11">
                            <SelectValue placeholder="Select updated template..." />
                        </SelectTrigger>
                        <SelectContent className="z-[150] rounded-none">
                            {creditTitles.map(ct => (
                                <SelectItem key={ct._id} value={ct._id}>{ct.title} ({ct.points} pts)</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-notes" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Administrative Rationale</Label>
                    <Textarea 
                        id="edit-notes" 
                        value={editNotes} 
                        onChange={(e) => setEditNotes(e.target.value)} 
                        placeholder="Provide detailed notes for the correction..."
                        className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 min-h-[120px] resize-none focus:ring-0 focus:border-b-2 focus:border-primary"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Proof Replacement (Optional)</Label>
                    <FileUpload onFileSelect={setEditProof} description="Upload a new supporting document" />
                </div>
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild><Button type="button" variant="secondary" className="rounded-none px-6">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmittingEdit} className="rounded-none px-10">
                        {isSubmittingEdit ? "Updating..." : "Save Transaction"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
       <Dialog open={!!selectedRemark} onOpenChange={(open) => !open && setSelectedRemark(null)}>
        <DialogContent className="sm:max-w-2xl rounded-none">
            <DialogHeader>
                <DialogTitle>Remark Audit Details</DialogTitle>
                <DialogDescription>Full record of the negative credit transaction.</DialogDescription>
            </DialogHeader>
            {selectedRemark && (
            <div className="space-y-6 py-4 text-sm max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-cds-ui-01 p-4 border border-cds-ui-03">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Faculty Associate</p>
                        <p className="font-bold text-base leading-tight">{selectedRemark.facultySnapshot.name}</p>
                        <p className="text-xs font-mono text-muted-foreground uppercase">{selectedRemark.facultySnapshot.facultyID}</p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Department</p>
                        <p className="font-medium text-cds-text-02">{selectedRemark.facultySnapshot.department}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Violation Title</p>
                            <p className="font-semibold leading-tight text-cds-text-01">{selectedRemark.title}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Deduction Points</p>
                            <p className="text-2xl font-bold text-cds-support-01 tabular-nums">{selectedRemark.points}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Status</p>
                            <div>{getStatusBadge(selectedRemark.status)}</div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Timeline</p>
                            <p className="text-xs text-cds-text-02">Issued: {new Date(selectedRemark.createdAt).toLocaleString()}</p>
                            <p className="text-xs text-cds-text-02">Academic Year: {selectedRemark.academicYear}</p>
                        </div>
                    </div>
                </div>

                <Separator className="bg-cds-ui-03" />

                <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Administrative Rationale</p>
                    <div className="p-4 bg-cds-ui-01 border-l-4 border-cds-support-01 italic text-cds-text-02 leading-relaxed">
                        {selectedRemark.notes || "No additional rationale provided during issuance."}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Issued By</p>
                        <div className="flex items-center gap-2 text-xs">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{selectedRemark.issuedBySnapshot?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{selectedRemark.issuedBySnapshot?.name || 'n/a'}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Proof Document</p>
                        {selectedRemark.proofUrl ? (
                            <div className="flex flex-col gap-1 items-start">
                                {shortProofUrl ? (
                                    <Button asChild variant="link" className="p-0 h-auto text-primary font-bold">
                                        <a href={shortProofUrl} target="_blank" rel="noopener noreferrer">Download Proof Document</a>
                                    </Button>
                                ) : <span className="text-xs text-muted-foreground italic animate-pulse">generating secure access link...</span>}
                            </div>
                        ) : <span className="text-xs text-muted-foreground italic">No proof attached to this transaction.</span>}
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-[10px] text-muted-foreground font-mono">INTERNAL_ID: {selectedRemark._id}</p>
                </div>
            </div>
            )}
            <DialogFooter className="border-t pt-4 flex items-center justify-between">
                <div className="flex gap-2">
                    {selectedRemark && selectedRemark.status !== 'deleted' && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none gap-2 text-xs" 
                            onClick={() => handleReopenWindow(selectedRemark._id)}
                        >
                            <RefreshCw className="h-3 w-3" />
                            Re-open Appeal Window
                        </Button>
                    )}
                </div>
                <DialogClose asChild><Button variant="secondary" className="rounded-none px-8">Close Audit</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  )
}
