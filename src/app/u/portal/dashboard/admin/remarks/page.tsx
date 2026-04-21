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
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
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
import { PlusCircle, Eye, Search, Edit, Trash2, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAlert } from "@/context/alert-context";
import { Label } from "@/components/ui/label";
import { shortenUrl } from "@/lib/url-shortener";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_BASE_URL = '/api/v1';

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
    proofUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed' | 'deleted';
    type: 'negative' | 'positive';
    title: string;
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
    if (currentMonth >= 5) return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
};

export default function ManageRemarksPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [creditTitles, setCreditTitles] = useState<CreditTitle[]>([]);

  const [remarks, setRemarks] = useState<NegativeRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilters>({
      templates: [],
      years: [],
      colleges: [],
      departments: []
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  
  const [selectedRemarkDetails, setSelectedRemarkDetails] = useState<NegativeRemark | null>(null);
  const [shortProofUrl, setShortProofUrl] = useState<string | null>(null);

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
    if (!showSuggestions) setShowSuggestions(true);
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
      .slice(0, 10);
  }, [facultySearch, facultyList]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDropdownData = async () => {
    if (!adminToken) return;
    try {
      const [fRes, ctRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users?limit=1000`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${API_BASE_URL}/admin/credit-title`, { headers: { Authorization: `Bearer ${adminToken}` } })
      ]);
      const fData = await fRes.json();
      if (fData.success) setFacultyList(fData.items);
      const ctData = await ctRes.json();
      if (ctData.success) setCreditTitles(ctData.items);
    } catch (error: any) {}
  };

  const fetchRemarks = async (currentPage: number) => {
      setIsLoadingRemarks(true);
      if (!adminToken) return;
  
      try {
          const params = new URLSearchParams({
              page: currentPage.toString(),
              limit: limit.toString(),
              sort: '-createdAt',
          });
          if (searchTerm) params.append('search', searchTerm);
          if (statusFilter !== 'all') params.append('status', statusFilter);
          if (academicYearFilter !== 'all') params.append('academicYear', academicYearFilter);
          if (templateFilter !== 'all') params.append('templateId', templateFilter);

          const response = await fetch(`${API_BASE_URL}/admin/credits/negative?${params.toString()}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          const resData = await response.json();
          if (resData.success) {
              setRemarks(resData.items || resData.data?.items || []);
              setTotal(resData.total || resData.data?.total || 0);
              if (resData.filters) setDynamicFilters(resData.filters);
          }
      } catch (error: any) {
          setRemarks([]);
      } finally {
          setIsLoadingRemarks(false);
      }
  };

  useEffect(() => {
    if (adminToken) fetchDropdownData();
  }, [adminToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (adminToken) fetchRemarks(page);
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter, academicYearFilter, templateFilter, adminToken]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, academicYearFilter, templateFilter]);
  
  useEffect(() => {
    const selected = creditTitles.find(ct => ct._id === creditTitleId);
    if (selected) { setTitle(selected.title); setPoints(selected.points); }
  }, [creditTitleId, creditTitles]);

  const getProofUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `/api/v1/credits/credits${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (selectedRemarkDetails?.proofUrl) {
      setShortProofUrl(null);
      shortenUrl(getProofUrl(selectedRemarkDetails.proofUrl)).then(setShortProofUrl).catch(() => setShortProofUrl(getProofUrl(selectedRemarkDetails!.proofUrl)));
    }
  }, [selectedRemarkDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !points || !title || !creditTitleId) return showAlert("Incomplete Form", "Please fill all required fields.");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("facultyId", selectedFaculty._id);
    formData.append("points", points.toString());
    formData.append("academicYear", getCurrentAcademicYear());
    formData.append("title", title);
    formData.append("creditTitleId", creditTitleId);
    if (notes) formData.append("notes", notes);
    if (proof) formData.append("proof", proof);

    try {
      const res = await fetch(`${API_BASE_URL}/credits/credits/negative`, { method: "POST", headers: { "Authorization": `Bearer ${adminToken}` }, body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to issue");
      toast({ title: "Remark Issued", description: "Record has been successfully saved." });
      setIsFormOpen(false);
      fetchRemarks(1);
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
    formData.append("notes", editNotes);
    if (editCreditTitleId) formData.append("creditTitleId", editCreditTitleId);
    if (editProof) formData.append("proof", editProof);

    try {
        const res = await fetch(`${API_BASE_URL}/credits/credits/negative/${editingRemark._id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${adminToken}` }, body: formData });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to update");
        toast({ title: "Remark Updated", description: "Changes saved successfully." });
        setIsEditDialogOpen(false);
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("Update Failed", error.message);
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleDeleteRemark = async (id: string) => {
      try {
          const res = await fetch(`${API_BASE_URL}/credits/credits/negative/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${adminToken}` } });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete");
          toast({ title: "Remark Deleted", description: "Record has been permanently removed." });
          fetchRemarks(page);
      } catch (error: any) {
          showAlert("Delete Failed", error.message);
      }
  };

  const handleReopenWindow = async (id: string) => {
    const confirm = window.confirm("Allow this faculty member to submit a new appeal for this remark?");
    if (!confirm) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/credits/credits/negative/${id}/reopen`, { method: "PATCH", headers: { "Authorization": `Bearer ${adminToken}` } });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to reopen");
        toast({ title: "Window Re-opened", description: "Faculty can now submit a new appeal." });
        fetchRemarks(page);
        if (selectedRemarkDetails?._id === id) setSelectedRemarkDetails({ ...selectedRemarkDetails, status: 'pending' });
    } catch (error: any) {
        showAlert("Operation Failed", error.message);
    }
  };
  
  const getStatusBadge = (status: NegativeRemark['status']) => {
    let cl = "bg-yellow-100 text-yellow-800";
    if (status === 'approved') cl = "bg-green-100 text-green-800";
    else if (status === 'rejected' || status === 'deleted') cl = "bg-red-100 text-red-800";
    else if (status === 'appealed') cl = "bg-blue-100 text-blue-800";
    return <Badge variant="secondary" className={cn("rounded-none", cl)} aria-label={`Status: ${status}`}>{status}</Badge>;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Negative Remarks</h1>
          <p className="mt-1 text-muted-foreground">Administer institutional deductions and dispute resolutions.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild><Button className="rounded-none"><PlusCircle className="mr-2 h-4 w-4" /> Issue New Remark</Button></DialogTrigger>
            <DialogContent className="sm:max-w-4xl rounded-none">
                 <DialogHeader><DialogTitle>Issue New Remark</DialogTitle></DialogHeader>
                <form className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4" onSubmit={handleSubmit}>
                    <div className="md:col-span-2 space-y-4">
                        <div ref={suggestionRef} className="relative">
                            <Label className="mb-1" htmlFor="faculty">Faculty Member <span className="text-destructive">*</span></Label>
                            <Input id="faculty" placeholder="Search name or ID..." value={facultySearch} onChange={handleFacultySearch} onFocus={() => setShowSuggestions(true)} autoComplete="off" className="rounded-none" />
                             {showSuggestions && suggestedFaculty.length > 0 && (
                              <div className="absolute z-[150] w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suggestedFaculty.map(f => (
                                  <div key={f._id} className="cursor-pointer p-3 hover:bg-accent" onClick={() => handleFacultySelect(f)}>
                                    <p className="font-semibold text-sm">{f.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{f.department || 'n/a'} - {f.college || 'n/a'}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div>
                            <Label className="mb-1" htmlFor="creditTitle">Remark Template <span className="text-destructive">*</span></Label>
                             <Select value={creditTitleId} onValueChange={setCreditTitleId}>
                                <SelectTrigger id="creditTitle" className="rounded-none"><SelectValue placeholder="Select a template..." /></SelectTrigger>
                                <SelectContent className="z-[150] rounded-none">{creditTitles.filter(c => c.type === 'negative').map(ct => (<SelectItem key={ct._id} value={ct._id}>{ct.title} ({ct.points} pts)</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1" htmlFor="title">Title <span className="text-destructive">*</span></Label>
                            <Input id="title" placeholder="e.g., 'Missed department meeting'" value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1" htmlFor="points">Points <span className="text-destructive">*</span></Label>
                                <Input id="points" type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} required className="rounded-none" />
                            </div>
                            <div>
                                <Label className="mb-1">Academic Year</Label>
                                <Input value={getCurrentAcademicYear()} readOnly className="bg-muted cursor-not-allowed rounded-none" />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1" htmlFor="notes">Rationale</Label>
                            <Textarea id="notes" placeholder="Enter detailed notes..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-none" />
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
                                    <Avatar className="h-10 w-10"><AvatarImage src={selectedFaculty.profileImage} /><AvatarFallback>{selectedFaculty.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div><CardTitle className="text-sm font-semibold">{selectedFaculty.name}</CardTitle><CardDescription className="text-[10px] font-mono uppercase">{selectedFaculty.facultyID}</CardDescription></div>
                                </CardHeader>
                                <CardContent className="text-xs space-y-2 p-4 pt-0">
                                    <p><strong className="text-muted-foreground">Department:</strong> {selectedFaculty.department || 'n/a'}</p>
                                    <p><strong className="text-muted-foreground">College:</strong> {selectedFaculty.college || 'n/a'}</p>
                                </CardContent>
                             </Card>
                        ) : (<div className="flex items-center justify-center h-full border border-dashed border-cds-ui-03 bg-cds-ui-01/50 p-6"><p className="text-muted-foreground text-center text-xs">Select a faculty member.</p></div>)}
                    </div>
                     <DialogFooter className="pt-4 md:col-span-3 border-t">
                        <DialogClose asChild><Button type="button" variant="secondary" className="rounded-none">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isLoading} className="rounded-none px-8">{isLoading ? "Submitting..." : "Issue Remark"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </header>
        
      <Card className="rounded-none shadow-none border-cds-ui-03">
        <CardHeader className="bg-cds-ui-01/50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b">
                <div className="relative border-r"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-10 h-12 border-0 rounded-none bg-transparent focus:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-12 border-0 rounded-none bg-transparent border-r focus:ring-0"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent className="z-[150] rounded-none"><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="appealed">Appealed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
                <Select value={templateFilter} onValueChange={setTemplateFilter}><SelectTrigger className="h-12 border-0 rounded-none bg-transparent border-r focus:ring-0"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent className="z-[150] rounded-none"><SelectItem value="all">All Categories</SelectItem>{dynamicFilters.templates.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent></Select>
                <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}><SelectTrigger className="h-12 border-0 rounded-none bg-transparent focus:ring-0"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent className="z-[150] rounded-none"><SelectItem value="all">All Years</SelectItem>{dynamicFilters.years.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}</SelectContent></Select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Faculty</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Title</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05 text-center">Status</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Date</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Points</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (<TableRow><TableCell colSpan={6} className="text-center h-24">Loading history...</TableCell></TableRow>) : remarks.length > 0 ? (
                  remarks.map((r) => (
                    <TableRow key={r._id} className={cn("hover:bg-cds-ui-01/50 transition-colors border-b last:border-0", r.status === 'deleted' && 'opacity-50 grayscale bg-cds-ui-01')}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={r.facultySnapshot.profileImage} /><AvatarFallback>{r.facultySnapshot.name.charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex flex-col"><span className="font-medium text-cds-text-01 text-[13px]">{r.facultySnapshot.name}</span><span className="text-[10px] text-muted-foreground uppercase font-mono">{r.facultySnapshot.facultyID}</span></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px] max-w-[200px] truncate">{r.title}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-[12px] text-cds-text-05 tabular-nums">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-cds-support-01">{r.points}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedRemarkDetails(r)} aria-label="View Audit"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRemark(r); setEditNotes(r.notes || ""); setEditCreditTitleId(r.creditTitle || ""); setIsEditDialogOpen(true); }} disabled={r.status === 'deleted'} aria-label="Edit Remark"><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={r.status === 'deleted'} aria-label="Delete Remark"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none border-cds-ui-03">
                                    <AlertDialogHeader>
                                        <div className="flex items-center gap-3 text-destructive mb-2"><AlertCircle className="h-6 w-6" /><AlertDialogTitle>Delete Remark?</AlertDialogTitle></div>
                                        <AlertDialogDescription>Institutional records will be restored.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteRemark(r._id)} className="bg-destructive hover:bg-destructive/90 rounded-none">Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={6} className="text-center h-24">No records found.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t py-3 bg-cds-ui-01/30">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Page {page} of {totalPages || 1}</div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button><Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button></div>
        </CardFooter>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-none border-cds-ui-03">
            <DialogHeader><DialogTitle>Update Remark Details</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Violation Category</Label>
                  <Select value={editCreditTitleId} onValueChange={setEditCreditTitleId}>
                      <SelectTrigger className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01"><SelectValue placeholder="Select template..." /></SelectTrigger>
                      <SelectContent className="z-[150] rounded-none">
                        {creditTitles.filter(c => c.type === (editingRemark?.type || 'negative')).map(ct => (<SelectItem key={ct._id} value={ct._id}>{ct.title} ({ct.points} pts)</SelectItem>))}
                      </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Administrative Notes</Label><Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 min-h-[100px] resize-none focus:ring-0 focus:border-b-2" /></div>
                <div><Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Proof Replacement</Label><FileUpload onFileSelect={setEditProof} /></div>
                <DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="secondary" className="rounded-none">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmittingEdit} className="rounded-none px-8">{isSubmittingEdit ? "Updating..." : "Save Changes"}</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
       <Dialog open={!!selectedRemarkDetails} onOpenChange={(o) => !o && setSelectedRemarkDetails(null)}>
        <DialogContent className="sm:max-w-lg rounded-none border-cds-ui-03">
            <DialogHeader><DialogTitle>Remark Resolution Audit</DialogTitle></DialogHeader>
            {selectedRemarkDetails && (
                <div className="space-y-6 py-4 text-sm">
                    <div className="flex items-center gap-4 p-4 bg-cds-ui-01 border border-cds-ui-03"><Avatar className="h-12 w-12 border"><AvatarImage src={selectedRemarkDetails.facultySnapshot.profileImage} /><AvatarFallback>{selectedRemarkDetails.facultySnapshot.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-bold text-base">{selectedRemarkDetails.facultySnapshot.name}</p><p className="text-xs text-muted-foreground font-mono uppercase">{selectedRemarkDetails.facultySnapshot.facultyID}</p></div></div>
                    <div className="grid grid-cols-2 gap-6"><div><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Deduction</p><p className="text-xl font-bold text-cds-support-01 tabular-nums">{selectedRemarkDetails.points}</p></div><div className="text-right"><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Status</p><div>{getStatusBadge(selectedRemarkDetails.status)}</div></div></div>
                    <div><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Staff Rationale</p><blockquote className="mt-1 border-l-2 border-primary/20 pl-4 italic bg-cds-ui-01 p-3 text-cds-text-02 leading-relaxed">{selectedRemarkDetails.notes || "No notes provided."}</blockquote></div>
                    {selectedRemarkDetails.proofUrl && (<div className="p-4 border border-dashed border-cds-ui-03 bg-cds-ui-01/30 text-center"><Button asChild variant="link" className="text-primary font-bold"><a href={getProofUrl(selectedRemarkDetails.proofUrl)} target="_blank" rel="noopener noreferrer">View Original Proof</a></Button></div>)}
                </div>
            )}
            <DialogFooter className="border-t pt-4 flex items-center justify-between"><div className="flex gap-2">{selectedRemarkDetails && selectedRemarkDetails.status !== 'deleted' && (<Button variant="outline" size="sm" className="rounded-none gap-2 text-xs" onClick={() => handleReopenWindow(selectedRemarkDetails._id)}><RefreshCw className="h-3 w-3" /> Re-open Appeal Window</Button>)}</div><DialogClose asChild><Button variant="secondary" className="rounded-none px-8">Close Details</Button></DialogClose></DialogFooter>
        </DialogContent>
    </Dialog>
    </div>
  )
}
