"use client"

import { useState, useEffect, useMemo, useRef, memo } from "react";
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
import { Search, Eye, Calendar as CalendarIcon, Trash2, Edit, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { shortenUrl } from "@/lib/url-shortener";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    issuedBySnapshot?: {
        name: string;
    };
    notes?: string;
    points: number;
    proofUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed' | 'deleted';
    type: 'positive' | 'negative';
    title: string;
    appealEligibility?: {
        canAppeal: boolean;
        reason: string;
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

const RemarkRow = memo(({ 
    remark, 
    onView, 
    onEdit, 
    onDelete 
}: { 
    remark: IssuedRemark, 
    onView: (r: IssuedRemark) => void, 
    onEdit: (r: IssuedRemark) => void, 
    onDelete: (id: string) => void 
}) => {
    const getStatusBadge = (status: IssuedRemark['status']) => {
        let cl = "bg-yellow-100 text-yellow-800";
        if (status === 'approved') cl = "bg-green-100 text-green-800";
        else if (status === 'rejected' || status === 'deleted') cl = "bg-red-100 text-red-800";
        else if (status === 'appealed') cl = "bg-blue-100 text-blue-800";
        return <Badge variant="secondary" className={cn("rounded-none", cl)} aria-label={`Status: ${status}`}>{status}</Badge>;
    };

    return (
        <TableRow className={cn("hover:bg-cds-ui-01/50 transition-colors border-b last:border-0", remark.status === 'deleted' && 'opacity-50 grayscale bg-cds-ui-01')}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-cds-text-01 text-[13px]">{remark.facultySnapshot.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{remark.facultySnapshot.facultyID}</span>
              </div>
            </TableCell>
            <TableCell className="text-[12px] max-w-[200px] truncate">{remark.title}</TableCell>
            <TableCell className="text-center">{getStatusBadge(remark.status)}</TableCell>
            <TableCell className="text-[12px] text-cds-text-05 tabular-nums">{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right font-bold tabular-nums text-cds-support-01">{remark.points}</TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(remark)} aria-label="View Audit"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(remark)} disabled={remark.status === 'deleted'} aria-label="Edit Record"><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={remark.status === 'deleted'} aria-label="Delete Record">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none border-cds-ui-03">
                            <AlertDialogHeader>
                                <div className="flex items-center gap-3 text-destructive mb-2"><AlertCircle className="h-6 w-6" /><AlertDialogTitle>Delete Remark?</AlertDialogTitle></div>
                                <AlertDialogDescription>Institutional record will be voided. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(remark._id)} className="bg-destructive hover:bg-destructive/90 rounded-none">Confirm Deletion</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
        </TableRow>
    );
});

RemarkRow.displayName = "RemarkRow";

export default function IssuedHistoryPage() {
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [remarks, setRemarks] = useState<IssuedRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
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
          if (dateRange?.from) params.append('fromDate', format(dateRange.from, 'yyyy-MM-dd'));
          if (dateRange?.to) params.append('toDate', format(dateRange.to, 'yyyy-MM-dd'));

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
    const fetchTitles = async () => {
        if (!adminToken) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/credit-title`, { headers: { Authorization: `Bearer ${adminToken}` } });
            const data = await res.json();
            if(data.success) setCreditTitles(data.items);
        } catch (error) { console.error(error); }
    };
    fetchTitles();
  }, [adminToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (adminToken) fetchRemarks(page);
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter, academicYearFilter, dateRange, adminToken]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, academicYearFilter, dateRange]);

  const getProofUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `/api/v1/credits/credits${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (selectedRemark?.proofUrl) {
        setShortProofUrl(null);
        shortenUrl(getProofUrl(selectedRemark.proofUrl)).then(setShortProofUrl).catch(() => setShortProofUrl(getProofUrl(selectedRemark!.proofUrl)));
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
        const res = await fetch(`${API_BASE_URL}/credits/credits/negative/${editingRemark._id}`, { 
            method: 'PUT', 
            headers: { 'Authorization': `Bearer ${adminToken}` }, 
            body: formData 
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to update");
        toast({ title: "Remark Updated", description: "Changes have been successfully synchronized." });
        setIsEditDialogOpen(false);
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("Update Failed", error.message);
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/credits/credits/negative/${id}`, { 
            method: "DELETE", 
            headers: { "Authorization": `Bearer ${adminToken}` } 
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete");
        toast({ title: "Remark Deleted", description: "Record has been permanently removed from logs." });
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("Delete Failed", error.message);
    }
  };

  const handleReopenWindow = async (id: string) => {
    const confirm = window.confirm("Allow this faculty member to submit a new appeal for this remark?");
    if (!confirm) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/credits/credits/negative/${id}/reopen`, { 
            method: "PATCH", 
            headers: { "Authorization": `Bearer ${adminToken}` } 
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to reopen");
        toast({ title: "Window Re-opened", description: "The faculty member has been granted appeal access." });
        fetchRemarks(page);
        if (selectedRemark?._id === id) setSelectedRemark({ ...selectedRemark, status: 'pending' });
    } catch (error: any) {
        showAlert("Operation Failed", error.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="mt-1 text-muted-foreground text-sm">OA record of institutional remark issuances.</p>
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
                <div className="relative col-span-1 lg:col-span-3 border-b mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search name, ID, title..." className="pl-10 h-12 border-0 rounded-none bg-transparent focus:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-10 border-0 rounded-none border-r focus:ring-0 bg-transparent text-xs"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent className="z-[150] rounded-none"><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="appealed">Appealed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
                 <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}><SelectTrigger className="h-10 border-0 rounded-none border-r focus:ring-0 bg-transparent text-xs"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent className="z-[150] rounded-none"><SelectItem value="all">All Years</SelectItem>{dynamicFilters.years.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}</SelectContent></Select>
                 <Popover><PopoverTrigger asChild><Button variant={"outline"} className="h-10 border-0 rounded-none focus:ring-0 bg-transparent text-xs justify-start"><CalendarIcon className="mr-2 h-3 w-3" />{dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</>) : (format(dateRange.from, "LLL dd"))) : (<span>Date Range</span>)}</Button></PopoverTrigger><PopoverContent className="z-[150] w-auto p-0 rounded-none" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent></Popover>
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
                    <RemarkRow 
                        key={r._id} 
                        remark={r} 
                        onView={setSelectedRemark} 
                        onEdit={(remark) => { setEditingRemark(remark); setEditNotes(remark.notes || ""); setEditCreditTitleId(remark.creditTitle || ""); setIsEditDialogOpen(true); }}
                        onDelete={handleDelete}
                    />
                  ))
                ) : (<TableRow><TableCell colSpan={6} className="text-center h-24 italic text-muted-foreground">No records matched.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t py-3 bg-cds-ui-01/30"><div className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Page {page} of {totalPages || 1}</div><div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button><Button variant="outline" size="sm" className="h-8 rounded-none px-4 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button></div></CardFooter>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-none border-cds-ui-03">
            <DialogHeader>
                <DialogTitle>Update Remark Details</DialogTitle>
                <DialogDescription>Correct notes or modify the violation category. This is now enabled for all non-deleted records.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <div>
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                        {editingRemark?.type === 'positive' ? 'Achievement Category' : 'Violation Category'}
                    </Label>
                    <Select value={editCreditTitleId} onValueChange={setEditCreditTitleId}>
                        <SelectTrigger className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01"><SelectValue placeholder="Select category..." /></SelectTrigger>
                        <SelectContent className="z-[150] rounded-none">
                            {creditTitles
                                .filter(ct => ct.type === editingRemark?.type)
                                .map(ct => (
                                    <SelectItem key={ct._id} value={ct._id}>{ct.title} ({ct.points} pts)</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Administrative Rationale</Label><Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 min-h-[120px] resize-none focus:ring-0 focus:border-b-2" /></div>
                <div><Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Proof Replacement (Optional)</Label><FileUpload onFileSelect={setEditProof} description="Upload a new supporting document" /></div>
                <DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="secondary" className="rounded-none">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmittingEdit} className="rounded-none px-8">{isSubmittingEdit ? "Updating..." : "Save Transaction"}</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

       <Dialog open={!!selectedRemark} onOpenChange={(o) => !o && setSelectedRemark(null)}>
        <DialogContent className="sm:max-w-2xl rounded-none border-cds-ui-03">
            <DialogHeader><DialogTitle>Remark Audit Details</DialogTitle></DialogHeader>
            {selectedRemark && (
            <div className="space-y-6 py-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-cds-ui-01 p-4 border border-cds-ui-03">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedRemark.facultySnapshot.profileImage} />
                            <AvatarFallback>{selectedRemark.facultySnapshot.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Faculty Associate</p>
                            <p className="font-bold text-base leading-tight">{selectedRemark.facultySnapshot.name}</p>
                            <p className="text-xs font-mono text-muted-foreground uppercase">{selectedRemark.facultySnapshot.facultyID}</p>
                        </div>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Department</p>
                        <p className="font-medium text-cds-text-02">{selectedRemark.facultySnapshot.department}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Violation Title</p><p className="font-semibold leading-tight">{selectedRemark.title}</p></div><div><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Impact</p><p className={cn("text-2xl font-bold tabular-nums", selectedRemark.type === 'positive' ? "text-cds-support-02" : "text-cds-support-01")}>{selectedRemark.type === 'positive' ? '+' : ''}{selectedRemark.points}</p></div></div>
                <div><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Administrative Rationale</p><div className="p-4 bg-cds-ui-01 border-l-4 border-cds-support-01 italic text-cds-text-02 leading-relaxed">{selectedRemark.notes || "No rationale provided."}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Issued By</p>
                        <div className="flex items-center gap-2 text-xs">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">{selectedRemark.issuedBySnapshot?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{selectedRemark.issuedBySnapshot?.name || 'n/a'}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Evidence</p>
                        {selectedRemark.proofUrl ? (<Button asChild variant="link" className="p-0 h-auto font-bold"><a href={getProofUrl(selectedRemark.proofUrl)} target="_blank" rel="noopener noreferrer">View Original Proof</a></Button>) : <span className="text-xs italic">No proof attached.</span>}
                    </div>
                </div>
            </div>
            )}
            <DialogFooter className="border-t pt-4 flex items-center justify-between"><div className="flex gap-2">{selectedRemark && selectedRemark.status !== 'deleted' && (<Button variant="outline" size="sm" className="rounded-none gap-2 text-xs" onClick={() => handleReopenWindow(selectedRemark._id)}><RefreshCw className="h-3 w-3" /> Re-open Appeal Window</Button>)}</div><DialogClose asChild><Button variant="secondary" className="rounded-none px-8">Close Audit</Button></DialogClose></DialogFooter>
        </DialogContent>
    </Dialog>
    </div>
  )
}
