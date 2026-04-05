
"use client"

import { useState, useEffect, useMemo } from "react";
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
import { Eye, Badge as BadgeIcon, AlertTriangle, Info, MoreHorizontal, Edit, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAlert } from "@/context/alert-context";
import { shortenUrl } from "@/lib/url-shortener";
import { useRemoteConfig } from "@/hooks/use-remote-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in';

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
  appealEligibility?: {
    canAppeal: boolean;
    reason: string;
    expiryDate?: string;
  };
};

export default function NegativeRemarksPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch configurations dynamically from Firebase Remote Config
  const amnestyActive = useRemoteConfig('amnesty_active')?.asBoolean() || false;
  
  const [remarks, setRemarks] = useState<NegativeCredit[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [selectedRemark, setSelectedRemark] = useState<NegativeCredit | null>(null);

  // Modal/Dialog states
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
          const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/faculty/${facultyId}/negative`, {
              headers: { Authorization: `Bearer ${token}` },
          });
  
          if (!response.ok) {
            const errorText = await response.text();
             if (errorText.includes('<!DOCTYPE')) {
                showAlert("error fetching remarks", "the api returned an invalid response. the endpoint might be incorrect.");
            } else {
                const errorJson = JSON.parse(errorText);
                showAlert("error fetching remarks", errorJson.message || 'an unknown error occurred.');
            }
            throw new Error(`failed to fetch remarks`);
          }
          
          const data = await response.json();
          if (data.success) {
              setRemarks(data.items);
          } else {
              throw new Error(data.message || "failed to fetch remarks");
          }
      } catch (error: any) {
        if (!error.message.includes('failed to fetch remarks')) {
            showAlert("error fetching remarks", error.message);
        }
        setRemarks([]);
      } finally {
          setIsLoadingRemarks(false);
      }
  };

  useEffect(() => {
    if (token && facultyId) {
        fetchRemarks();
    }
  }, [token, facultyId]);
  
  const getProofUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (selectedRemark?.proofUrl) {
        setShortProofUrl(null);
        shortenUrl(getProofUrl(selectedRemark.proofUrl))
            .then(url => setShortProofUrl(url))
            .catch(() => {
                if(selectedRemark.proofUrl) setShortProofUrl(getProofUrl(selectedRemark.proofUrl))
            });
    }
  }, [selectedRemark]);

  const handleAppealSubmit = async (isEdit: boolean) => {
    if (!selectedRemark || !appealReason.trim()) {
        showAlert("incomplete form", "please provide a reason for your appeal.");
        return;
    }
    setIsSubmittingAppeal(true);
    
    const formData = new FormData();
    formData.append("reason", appealReason);
    if (appealProof) {
      formData.append("proof", appealProof);
    }
    
    const url = isEdit
        ? `${API_BASE_URL}/api/v1/credits/credits/appeals/${selectedRemark._id}`
        : `${API_BASE_URL}/api/v1/credits/credits/${selectedRemark._id}/appeal`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || `failed to ${isEdit ? 'update' : 'submit'} appeal.`);
        }
        
        toast({
            title: `appeal ${isEdit ? 'updated' : 'submitted'}`,
            description: `your appeal has been successfully ${isEdit ? 'updated' : 'submitted'}.`,
        });

        setIsAppealDialogOpen(false);
        setIsEditAppealDialogOpen(false);
        fetchRemarks();
        router.push(`/u/portal/dashboard/appeals?uid=${facultyId}`);

    } catch (error: any) {
        showAlert("appeal failed", error.message);
    } finally {
        setIsSubmittingAppeal(false);
    }
  };

  const handleWithdrawAppeal = async (creditId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/appeals/${creditId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "failed to withdraw appeal.");
        }
        toast({ title: "appeal withdrawn", description: "your appeal has been withdrawn."});
        fetchRemarks();
    } catch(error: any) {
        showAlert("withdrawal failed", error.message);
    }
  }

  const getStatusBadge = (remark: NegativeCredit) => {
    if (remark.status === 'appealed' && remark.appeal) {
      switch (remark.appeal.status) {
        case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 rounded-none">Appeal Pending</Badge>;
        case 'accepted': return <Badge variant="default" className="bg-green-100 text-green-800 rounded-none">Appeal Accepted</Badge>;
        case 'rejected': return <Badge variant="destructive" className="rounded-none">Appeal Rejected</Badge>;
      }
    }
    
    let variant: "default" | "secondary" | "destructive" = "secondary";
    switch (remark.status) {
        case 'approved': variant = 'default'; break;
        case 'rejected': variant = 'destructive'; break;
        case 'appealed': variant = 'secondary'; break;
    }
    return <Badge variant={variant} className={cn("rounded-none", remark.status === 'approved' && 'bg-green-100 text-green-800')}>{remark.status}</Badge>;
  };

  const renderAppealDialog = (isEdit = false) => (
     <Dialog open={isEdit ? isEditAppealDialogOpen : isAppealDialogOpen} onOpenChange={isEdit ? setIsEditAppealDialogOpen : setIsAppealDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Create'} an Appeal for "{selectedRemark?.title}"</DialogTitle>
            <DialogDescription>
              Provide a clear reason for your appeal. Attaching a new proof document is optional but recommended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">Reason for Appeal <span className="text-red-500">*</span></label>
                <Textarea 
                    id="reason" 
                    placeholder="explain why you are appealing this remark..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)} 
                    rows={4}
                    aria-required="true"
                    className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="proof" className="text-sm font-medium">Proof Document (Optional)</label>
                <FileUpload onFileSelect={setAppealProof} />
                 <div className="flex items-start gap-2 text-sm text-blue-700 p-3 bg-blue-50 rounded-none mt-2" role="note">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                        <strong>Tip:</strong> if you have multiple files, please combine them into a single .zip file (under 10mb) before uploading.
                    </p>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => isEdit ? setIsEditAppealDialogOpen(false) : setIsAppealDialogOpen(false)} className="rounded-none">Cancel</Button>
            <Button onClick={() => handleAppealSubmit(isEdit)} disabled={isSubmittingAppeal || !appealReason.trim()} className="rounded-none">
                {isSubmittingAppeal ? 'submitting...' : 'submit appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">My Negative Remarks</h1>
        <p className="mt-1 text-muted-foreground">Review and manage negative credits.</p>
      </header>
        
      {amnestyActive && (
        <div className="bg-primary/10 border border-primary/20 rounded-none p-4 flex gap-3 items-center">
            <Info className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-primary">Special Window Active: you can currently appeal any remark regardless of its date.</p>
        </div>
      )}

      <Card className="rounded-none shadow-none border-cds-ui-03">
        <CardHeader className="bg-cds-ui-01/50 border-b">
            <CardTitle className="text-base font-semibold">Remarks History</CardTitle>
            <CardDescription className="text-xs">
                A log of all negative remarks issued to you. 
                {amnestyActive 
                    ? " Amnesty mode is active: all remarks are currently appealable." 
                    : " Institutional policy: appeals must be filed within the allowed window unless re-opened by Admin."
                }
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Remark Title</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Date</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Status</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Points</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (
                   <TableRow><TableCell colSpan={5} className="text-center h-24">Loading remarks...</TableCell></TableRow>
                ) : remarks.length > 0 ? (
                  remarks.map((remark) => {
                    const eligibility = remark.appealEligibility;
                    const canAppeal = eligibility?.canAppeal ?? false;
                    const isBlocked = eligibility && !eligibility.canAppeal && remark.status !== 'appealed';

                    return (
                      <TableRow key={remark._id} className="hover:bg-cds-ui-01/50 transition-colors border-b last:border-0">
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-cds-text-01 text-[13px]">{remark.title}</span>
                            {isBlocked && (
                                <div className="flex items-center gap-1 text-[10px] text-destructive font-bold uppercase tracking-wider">
                                    <Clock className="h-3 w-3" /> {eligibility.reason}
                                </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px] text-cds-text-05 tabular-nums">{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-[12px]">{getStatusBadge(remark)}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-cds-support-01">{remark.points}</TableCell>
                        <TableCell className="text-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none">
                                    <DropdownMenuItem onSelect={() => { setSelectedRemark(remark); setIsDetailsDialogOpen(true); }}>View Details</DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                    {canAppeal && (
                                        <DropdownMenuItem onSelect={() => { setSelectedRemark(remark); setIsAppealDialogOpen(true); setAppealReason(""); setAppealProof(null); }}>
                                            Appeal
                                        </DropdownMenuItem>
                                    )}
                                    {remark.appeal?.status === 'pending' && (
                                        <>
                                        <DropdownMenuItem onSelect={() => { setSelectedRemark(remark); setIsEditAppealDialogOpen(true); setAppealReason(remark.appeal?.reason || ""); setAppealProof(null); }}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Appeal
                                        </DropdownMenuItem>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                  <Trash2 className="mr-2 h-4 w-4"/> Withdraw Appeal
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Withdraw Appeal?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will cancel your pending appeal. You may not be able to appeal this remark again. Are you sure?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleWithdrawAppeal(remark._id)} className="bg-destructive hover:bg-destructive/90 rounded-none">Withdraw</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </>
                                    )}
                                     {remark.appeal && (
                                        <DropdownMenuItem onSelect={() => router.push(`/u/portal/dashboard/appeals?uid=${facultyId}`)}>
                                            View Appeal Status
                                        </DropdownMenuItem>
                                     )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 italic text-muted-foreground">No negative remarks found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {renderAppealDialog(false)}
      {renderAppealDialog(true)}
      
       <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Remark Details</DialogTitle>
                <DialogDescription>A detailed overview of the remark issued to you.</DialogDescription>
            </DialogHeader>
            {selectedRemark && (
                <div className="space-y-6 py-4 text-sm">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Title</p>
                            <p className="font-semibold leading-tight">{selectedRemark.title}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Deduction</p>
                            <p className="text-xl font-bold text-cds-support-01 tabular-nums">{selectedRemark.points}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <p><span className="text-muted-foreground">Academic Year:</span> {selectedRemark.academicYear}</p>
                        <p><span className="text-muted-foreground">Date Issued:</span> {new Date(selectedRemark.createdAt).toLocaleString()}</p>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Administrator's Notes</p>
                        <blockquote className="mt-1 border-l-2 border-primary/20 pl-4 italic bg-cds-ui-01 p-3 rounded-r-none leading-relaxed text-cds-text-02">
                            {selectedRemark.notes || "no notes were provided."}
                        </blockquote>
                    </div>

                    {selectedRemark.proofUrl && (
                        <div className="p-4 border border-dashed border-cds-ui-03 bg-cds-ui-01/30 text-center">
                             {shortProofUrl ? (
                                <Button asChild variant="link" className="text-primary font-bold">
                                    <a href={shortProofUrl} target="_blank" rel="noopener noreferrer">View Original Proof Attachment</a>
                                </Button>
                            ) : <span className="text-xs text-muted-foreground italic animate-pulse">generating secure link...</span>}
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="border-t pt-4">
                <DialogClose asChild><Button variant="secondary" className="rounded-none px-8">Close Details</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  )
}
