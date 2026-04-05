
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
  const remoteAppealWindow = useRemoteConfig('appeal_window_days')?.asNumber();
  const amnestyActive = useRemoteConfig('amnesty_active')?.asBoolean() || false;
  
  const APPEAL_WINDOW_DAYS = remoteAppealWindow || 7;

  const [remarks, setRemarks] = useState<NegativeCredit[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [selectedRemark, setSelectedRemark] = useState<NegativeCredit | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
                showAlert("Error fetching remarks", "The API returned an invalid response. The endpoint might be incorrect.");
            } else {
                const errorJson = JSON.parse(errorText);
                showAlert("Error fetching remarks", errorJson.message || 'An unknown error occurred.');
            }
            throw new Error(`Failed to fetch remarks`);
          }
          
          const data = await response.json();
          if (data.success) {
              setRemarks(data.items);
          } else {
              throw new Error(data.message || "Failed to fetch remarks");
          }
      } catch (error: any) {
        if (!error.message.includes('Failed to fetch remarks')) {
            showAlert("Error fetching remarks", error.message);
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
        showAlert("Incomplete Form", "Please provide a reason for your appeal.");
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
            throw new Error(responseData.message || `Failed to ${isEdit ? 'update' : 'submit'} appeal.`);
        }
        
        toast({
            title: `Appeal ${isEdit ? 'Updated' : 'Submitted'}`,
            description: `Your appeal has been successfully ${isEdit ? 'updated' : 'submitted'}.`,
        });

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
        const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/appeals/${creditId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "Failed to withdraw appeal.");
        }
        toast({ title: "Appeal Withdrawn", description: "Your appeal has been withdrawn."});
        fetchRemarks();
    } catch(error: any) {
        showAlert("Withdrawal Failed", error.message);
    }
  }


  const getProofUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getStatusBadge = (remark: NegativeCredit) => {
    if (remark.status === 'appealed' && remark.appeal) {
      switch (remark.appeal.status) {
        case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Appeal Pending</Badge>;
        case 'accepted': return <Badge variant="default" className="bg-green-100 text-green-800">Appeal Accepted</Badge>;
        case 'rejected': return <Badge variant="destructive">Appeal Rejected</Badge>;
      }
    }
    
    let variant: "default" | "secondary" | "destructive" = "secondary";
    switch (remark.status) {
        case 'approved': variant = 'default'; break;
        case 'rejected': variant = 'destructive'; break;
        case 'appealed': variant = 'secondary'; break;
    }
    return <Badge variant={variant} className={remark.status === 'approved' ? 'bg-green-100 text-green-800' : ''}>{remark.status}</Badge>;
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
                    placeholder="Explain why you are appealing this remark..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)} 
                    rows={4}
                    aria-required="true"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="proof" className="text-sm font-medium">Proof Document (Optional)</label>
                <FileUpload onFileSelect={setAppealProof} />
                 <div className="flex items-start gap-2 text-sm text-blue-700 p-3 bg-blue-50 rounded-md mt-2" role="note">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                        <strong>Tip:</strong> If you have multiple files, please combine them into a single .zip file (under 10MB) before uploading.
                    </p>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => isEdit ? setIsEditAppealDialogOpen(false) : setIsAppealDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleAppealSubmit(isEdit)} disabled={isSubmittingAppeal || !appealReason.trim()}>
                {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
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
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex gap-3 items-center">
            <Info className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-primary">Special Window Active: You can currently appeal any remark regardless of its date.</p>
        </div>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Remarks History</CardTitle>
            <CardDescription>
                A log of all negative remarks issued to you. 
                {amnestyActive 
                    ? " Amnesty mode is active: all remarks are currently appealable." 
                    : ` Appeals must be filed within ${APPEAL_WINDOW_DAYS} days of issuance unless re-opened by Admin.`
                }
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
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
                      <TableRow key={remark._id}>
                        <TableCell className="font-medium text-foreground">
                          {remark.title}
                          {isBlocked && (
                            <span className="ml-2 inline-flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded" title={eligibility.reason}>
                              <Clock className="h-3 w-3 mr-1" /> {eligibility.reason.includes('expired') ? 'Window Expired' : 'Blocked'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(remark)}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">{remark.points}</TableCell>
                        <TableCell className="text-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
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
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleWithdrawAppeal(remark._id)} className="bg-destructive hover:bg-destructive/90">Withdraw</AlertDialogAction>
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
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No remarks found.</TableCell></TableRow>
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
                <div className="space-y-4 py-4 text-sm">
                    <div>
                        <p className="font-medium text-muted-foreground">Title</p>
                        <p className="font-semibold">{selectedRemark.title}</p>
                    </div>
                    <div>
                        <p className="font-medium text-muted-foreground">Points Deducted</p>
                        <p className="font-bold text-destructive">{selectedRemark.points}</p>
                    </div>
                    <div>
                        <p className="font-medium text-muted-foreground">Date Issued</p>
                        <p>{new Date(selectedRemark.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="font-medium text-muted-foreground">Administrator's Notes</p>
                        <blockquote className="mt-1 border-l-2 pl-4 italic bg-muted/50 p-2 rounded-r-md">
                            {selectedRemark.notes || "No notes were provided."}
                        </blockquote>
                    </div>
                    {selectedRemark.proofUrl && (
                        <div>
                            <p className="font-medium text-muted-foreground">Proof Document</p>
                             {shortProofUrl ? (
                                <Button asChild variant="link" className="p-0 h-auto">
                                <a href={shortProofUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                            </Button>
                            ) : <span className="text-xs text-muted-foreground">Generating secure link...</span>}
                        </div>
                    )}
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  )
}
