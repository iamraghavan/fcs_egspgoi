
"use client"

import { useState, useEffect, useMemo } from"react";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from"@/components/ui/table"
import { Button } from"@/components/ui/button"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select"
import { Textarea } from"@/components/ui/textarea"
import { useToast } from"@/hooks/use-toast";
import { useSearchParams, useRouter } from"next/navigation";
import { FileUpload } from"@/components/file-upload";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from"@/components/ui/card";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
 DialogClose,
} from"@/components/ui/dialog"
import { Eye, Badge as BadgeIcon, MoreHorizontal, Edit, Trash2, Clock } from"lucide-react";
import { Badge } from"@/components/ui/badge";
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
} from"@/components/ui/alert-dialog"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from"@/components/ui/dropdown-menu"
import { useAlert } from"@/context/alert-context";
import { shortenUrl } from"@/lib/url-shortener";
import { cn } from"@/lib/utils";

const API_BASE_URL = '/api/v1';

type AppealData = {
 _id: string;
 reason: string;
 createdAt: string;
 status: 'pending' | 'accepted' | 'rejected';
}

type NegativeCredit = {
 _id: string;
 title: string;
 points: number;
 status: 'pending' | 'approved' | 'rejected' | 'appealed';
 notes?: string;
 proofUrl?: string;
 createdAt: string;
 academicYear: string;
 appealCount?: number;
 appeal?: AppealData;
 overrideAppealWindow?: boolean;
 appealEligibility?: {
 canAppeal: boolean;
 reason: string;
 };
};

export default function NegativeRemarksPage() {
 const { toast } = useToast();
 const { showAlert } = useAlert();
 const searchParams = useSearchParams();
 const router = useRouter();

 const [remarks, setRemarks] = useState<NegativeCredit[]>([]);
 const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
 const [selectedRemark, setSelectedRemark] = useState<NegativeCredit | null>(null);

 const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
 const [isEditAppealDialogOpen, setIsEditAppealDialogOpen] = useState(false);
 const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
 
 const [appealReason, setAppealReason] = useState("");
 const [appealProof, setAppealProof] = useState<File | null>(null);
 const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
 const [shortProofUrl, setShortProofUrl] = useState<string | null>(null);

 const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
 const facultyId = searchParams.get('uid');

 const fetchRemarks = async () => {
 setIsLoadingRemarks(true);
 if (!token || !facultyId) {
 setIsLoadingRemarks(false);
 return;
 }
 
 try {
 const response = await fetch(`${API_BASE_URL}/credits/credits/faculty/${facultyId}/negative`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 
 const data = await response.json();
 if (data.success) {
 setRemarks(data.items || data.data?.items || []);
 } else {
 throw new Error(data.message ||"Failed to fetch remarks");
 }
 } catch (error: any) {
 setRemarks([]);
 } finally {
 setIsLoadingRemarks(false);
 }
 };

 useEffect(() => {
 if (token && facultyId) fetchRemarks();
 }, [token, facultyId]);
 
 const getProofUrl = (url: string) => {
 if (!url) return '';
 return url.startsWith('http') ? url : `/api/v1/credits/credits${url.startsWith('/') ? '' : '/'}${url}`;
 };

 useEffect(() => {
 if (selectedRemark?.proofUrl) {
 setShortProofUrl(null);
 shortenUrl(getProofUrl(selectedRemark.proofUrl)).then(setShortProofUrl).catch(() => {
 if(selectedRemark.proofUrl) setShortProofUrl(getProofUrl(selectedRemark.proofUrl))
 });
 }
 }, [selectedRemark]);

 const handleAppealSubmit = async (isEdit: boolean) => {
 if (!selectedRemark || !appealReason.trim()) {
 showAlert("Incomplete Form","Please provide a reason for your appeal.");
 return;
 }
 setIsSubmittingAppeal(true);
 
 const formData = new FormData();
 formData.append("reason", appealReason);
 if (appealProof) formData.append("proof", appealProof);
 
 const url = isEdit
 ? `${API_BASE_URL}/credits/credits/appeals/${selectedRemark._id}`
 : `${API_BASE_URL}/credits/credits/${selectedRemark._id}/appeal`;
 const method = isEdit ? 'PUT' : 'POST';

 try {
 const res = await fetch(url, { method, headers: {"Authorization": `Bearer ${token}` }, body: formData });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message || `Failed to submit appeal.`);
 
 toast({ title: `Appeal ${isEdit ? 'Updated' : 'Submitted'}`, description: `Action recorded successfully.` });
 setIsAppealDialogOpen(false);
 setIsEditAppealDialogOpen(false);
 fetchRemarks();
 router.push(`/u/portal/dashboard/appeals?uid=${facultyId}`);
 } catch (error: any) {
 showAlert("Appeal Failed", error.message);
 } finally {
 setIsSubmittingAppeal(false);
 }
 };

 const handleWithdrawAppeal = async (creditId: string) => {
 try {
 const res = await fetch(`${API_BASE_URL}/credits/credits/appeals/${creditId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||"Failed to withdraw");
 toast({ title:"Appeal Withdrawn", description:"Record has been removed."});
 fetchRemarks();
 } catch(error: any) {
 showAlert("Withdrawal Failed", error.message);
 }
 }

 const getStatusBadge = (remark: NegativeCredit) => {
 if (remark.status === 'appealed' && remark.appeal) {
 switch (remark.appeal.status) {
 case 'pending': return <Badge variant="secondary"className="bg-yellow-100 text-yellow-800 rounded-none"aria-label="Status: Appeal Pending">Appeal Pending</Badge>;
 case 'accepted': return <Badge variant="default"className="bg-green-100 text-green-800 rounded-none"aria-label="Status: Appeal Accepted">Appeal Accepted</Badge>;
 case 'rejected': return <Badge variant="destructive"className="rounded-none"aria-label="Status: Appeal Rejected">Appeal Rejected</Badge>;
 }
 }
 return <Badge variant={remark.status === 'approved' ? 'default' : remark.status === 'rejected' ? 'destructive' : 'secondary'} className={cn("rounded-none", remark.status === 'approved' && 'bg-green-100 text-green-800')} aria-label={`Status: ${remark.status}`}>{remark.status}</Badge>;
 };

 return (
 <div className="mx-auto max-w-7xl space-y-8">
 <header>
 <h1 className="text-3xl font-bold text-foreground">My Negative Remarks</h1>
 <p className="mt-1 text-muted-foreground">Institutional record of performance-related deductions.</p>
 </header>
 
 <Card className="rounded-none shadow-none border-cds-ui-03">
 <CardHeader className="bg-cds-ui-01/50 border-b">
 <CardTitle className="text-base font-semibold">Remarks History</CardTitle>
 <CardDescription className="text-xs">Comprehensive log of all deductions issued to your profile.</CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-cds-ui-01">
 <TableRow>
 <TableHead className="text-[11px] font-bold tracking-widest text-cds-text-05">Remark Title</TableHead>
 <TableHead className="text-[11px] font-bold tracking-widest text-cds-text-05">Date</TableHead>
 <TableHead className="text-[11px] font-bold tracking-widest text-cds-text-05 text-center">Status</TableHead>
 <TableHead className="text-right text-[11px] font-bold tracking-widest text-cds-text-05">Points</TableHead>
 <TableHead className="text-center text-[11px] font-bold tracking-widest text-cds-text-05">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoadingRemarks ? (
 <TableRow><TableCell colSpan={5} className="text-center h-24">Loading records...</TableCell></TableRow>
 ) : remarks.length > 0 ? (
 remarks.map((remark) => {
 const isWithin7Days = (new Date().getTime() - new Date(remark.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000);
 const canAppealFallback = remark.status !== 'appealed' && (remark.overrideAppealWindow || isWithin7Days);
 
 const canAppeal = remark.appealEligibility 
   ? (remark.appealEligibility.canAppeal || (remark.overrideAppealWindow && remark.status !== 'appealed')) 
   : canAppealFallback;
   
 const isBlocked = remark.appealEligibility 
   ? (!remark.appealEligibility.canAppeal && !remark.overrideAppealWindow && remark.status !== 'appealed')
   : (!canAppealFallback && remark.status !== 'appealed');

 return (
 <TableRow key={remark._id} className="hover:bg-cds-ui-01/50 transition-colors border-b last:border-0">
 <TableCell>
 <div className="flex flex-col gap-1">
 <span className="font-medium text-cds-text-01 text-[13px]">{remark.title}</span>
 {isBlocked && (
 <div className="flex items-center gap-1 text-[10px] text-destructive font-bold tracking-wider"aria-live="polite">
 <Clock className="h-3 w-3"aria-hidden="true"/> {remark.appealEligibility?.reason}
 </div>
 )}
 </div>
 </TableCell>
 <TableCell className="text-[12px] text-cds-text-05 tabular-nums">{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
 <TableCell className="text-center">{getStatusBadge(remark)}</TableCell>
 <TableCell className="text-right font-bold tabular-nums text-cds-support-01">{remark.points}</TableCell>
 <TableCell className="text-center">
 <div className="flex justify-center items-center gap-2">
 {canAppeal && (
 <Button 
 size="sm"
 className="h-7 rounded-none px-3 text-[10px] font-bold tracking-widest bg-cds-interactive-01 text-white hover:bg-cds-interactive-01/90"
 onClick={() => { setSelectedRemark(remark); setIsAppealDialogOpen(true); setAppealReason(""); setAppealProof(null); }}
 aria-label={`Appeal remark: ${remark.title}`}
 >
 Appeal
 </Button>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild><Button variant="ghost"size="icon"className="h-8 w-8 rounded-none"aria-label="Action Menu"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
 <DropdownMenuContent align="end"className="rounded-none">
 <DropdownMenuItem onSelect={() => { setSelectedRemark(remark); setIsDetailsDialogOpen(true); }}>View Details</DropdownMenuItem>
 {remark.appeal?.status === 'pending' && (
 <>
 <DropdownMenuSeparator />
 <DropdownMenuItem onSelect={() => { setSelectedRemark(remark); setIsEditAppealDialogOpen(true); setAppealReason(remark.appeal?.reason ||""); setAppealProof(null); }}>
 <Edit className="mr-2 h-4 w-4"/> Edit Appeal
 </DropdownMenuItem>
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
 <Trash2 className="mr-2 h-4 w-4"/> Withdraw Appeal
 </DropdownMenuItem>
 </AlertDialogTrigger>
 <AlertDialogContent className="rounded-none">
 <AlertDialogHeader>
 <AlertDialogTitle>Withdraw Pending Appeal?</AlertDialogTitle>
 <AlertDialogDescription>Institutional windows may prevent re-submission.</AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
 <AlertDialogAction onClick={() => handleWithdrawAppeal(remark._id)} className="bg-destructive hover:bg-destructive/90 rounded-none">Confirm Withdraw</AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </TableCell>
 </TableRow>
 );
 })
 ) : (
 <TableRow><TableCell colSpan={5} className="text-center h-24 italic text-muted-foreground">No negative records identified.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 
 <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
 <DialogContent className="sm:max-w-lg rounded-none">
 <DialogHeader>
 <DialogTitle>Submit Appeal: {selectedRemark?.title}</DialogTitle>
 <DialogDescription>Provide a clear reason for disputing this record.</DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-1.5">
 <label htmlFor="reason"className="text-xs font-bold tracking-wider text-muted-foreground">Reason <span className="text-destructive"aria-hidden="true">*</span></label>
 <Textarea id="reason"placeholder="Enter justification..."value={appealReason} onChange={(e) => setAppealReason(e.target.value)} rows={4} className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01"required />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold tracking-wider text-muted-foreground">Evidence (Optional)</label>
 <FileUpload onFileSelect={setAppealProof} />
 </div>
 </div>
 <DialogFooter>
 <Button type="button"variant="secondary"onClick={() => setIsAppealDialogOpen(false)} className="rounded-none">Cancel</Button>
 <Button onClick={() => handleAppealSubmit(false)} disabled={isSubmittingAppeal || !appealReason.trim()} className="rounded-none px-8">
 {isSubmittingAppeal ? 'Processing...' : 'Submit Action'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <Dialog open={isEditAppealDialogOpen} onOpenChange={setIsEditAppealDialogOpen}>
 <DialogContent className="sm:max-w-lg rounded-none">
 <DialogHeader>
 <DialogTitle>Edit Appeal: {selectedRemark?.title}</DialogTitle>
 <DialogDescription>Update your justification reason.</DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-1.5">
 <label htmlFor="edit-reason"className="text-xs font-bold tracking-wider text-muted-foreground">Reason <span className="text-destructive"aria-hidden="true">*</span></label>
 <Textarea id="edit-reason"placeholder="Update justification..."value={appealReason} onChange={(e) => setAppealReason(e.target.value)} rows={4} className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01"required />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold tracking-wider text-muted-foreground">Evidence (Optional)</label>
 <FileUpload onFileSelect={setAppealProof} />
 </div>
 </div>
 <DialogFooter>
 <Button type="button"variant="secondary"onClick={() => setIsEditAppealDialogOpen(false)} className="rounded-none">Cancel</Button>
 <Button onClick={() => handleAppealSubmit(true)} disabled={isSubmittingAppeal || !appealReason.trim()} className="rounded-none px-8">
 {isSubmittingAppeal ? 'Updating...' : 'Save Changes'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 
 <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
 <DialogContent className="sm:max-w-lg rounded-none">
 <DialogHeader><DialogTitle>Remark Audit Audit</DialogTitle></DialogHeader>
 {selectedRemark && (
 <div className="space-y-6 py-4 text-sm">
 <div className="grid grid-cols-2 gap-6">
 <div>
 <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1">Violation</p>
 <p className="font-semibold leading-tight">{selectedRemark.title}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1">Impact</p>
 <p className="text-xl font-bold text-cds-support-01 tabular-nums">{selectedRemark.points}</p>
 </div>
 </div>
 <div>
 <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1">Staff Reason</p>
 <blockquote className="mt-1 border-l-2 border-cds-interactive-01 pl-4 italic bg-cds-ui-01 p-3 text-cds-text-02 leading-relaxed">
 {selectedRemark.notes ||"No additional notes provided."}
 </blockquote>
 </div>
 {selectedRemark.proofUrl && (
 <div className="p-4 border border-dashed border-cds-ui-03 bg-cds-ui-01/30 text-center">
 {shortProofUrl ? (
 <Button asChild variant="link"className="text-cds-interactive-01 font-bold">
 <a href={shortProofUrl} target="_blank"rel="noopener noreferrer">Download Supporting Evidence</a>
 </Button>
 ) : <span className="text-xs text-muted-foreground italic animate-pulse">authorizing access...</span>}
 </div>
 )}
 </div>
 )}
 <DialogFooter className="border-t pt-4">
 <DialogClose asChild><Button variant="secondary"className="rounded-none px-8">Close Audit</Button></DialogClose>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
