
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
import { Eye, Badge, AlertTriangle, Info } from "lucide-react";
import { useAlert } from "@/context/alert-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

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

export default function NegativeRemarksPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Data for table and filters
  const [remarks, setRemarks] = useState<NegativeCredit[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  
  // Details view state
  const [selectedRemark, setSelectedRemark] = useState<NegativeCredit | null>(null);

  // Appeal state
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealProof, setAppealProof] = useState<File | null>(null);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);


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
        // Avoid double-toasting if already handled
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
  
  const handleOpenAppealDialog = (remark: NegativeCredit) => {
    setSelectedRemark(remark);
    setIsAppealDialogOpen(true);
    setAppealReason("");
    setAppealProof(null);
  };

  const handleAppealSubmit = async () => {
    if (!selectedRemark || !appealReason.trim() || !appealProof) {
        showAlert(
            "Incomplete Form",
            "Please provide a reason and a proof document for your appeal.",
        );
        return;
    }
    setIsSubmittingAppeal(true);
    
    const formData = new FormData();
    formData.append("reason", appealReason);
    if (appealProof) {
      formData.append("proof", appealProof);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/${selectedRemark._id}/appeal`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "Failed to submit appeal.");
        }
        
        toast({
            title: "Appeal Submitted",
            description: "Your appeal has been successfully submitted for review.",
        });

        setIsAppealDialogOpen(false);
        setAppealReason("");
        setAppealProof(null);
        fetchRemarks(); // Refresh the list to show the 'appealed' status
        router.push(`/u/portal/dashboard/appeals?uid=${searchParams.get('uid')}`);

    } catch (error: any) {
        showAlert(
            "Appeal Failed",
            error.message,
        );
    } finally {
        setIsSubmittingAppeal(false);
    }
  };


  const getProofUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
        return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getStatusBadge = (status: NegativeCredit['status']) => {
    switch (status) {
        case 'approved': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800" role="status">Approved</div>
        case 'rejected': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800" role="status">Rejected</div>
        case 'appealed': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800" role="status">Appealed</div>
        case 'pending':
        default:
            return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800" role="status">Pending</div>
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            My Negative Remarks
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review and manage negative credits.
          </p>
        </div>
      </header>
        
      <Card>
        <CardHeader>
            <CardTitle>Remarks History</CardTitle>
            <CardDescription>A log of all negative remarks issued to you.</CardDescription>
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
                  remarks.map((remark) => (
                  <TableRow key={remark._id}>
                    <TableCell className="font-medium text-foreground">{remark.title}</TableCell>
                    <TableCell>{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(remark.status)}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{remark.points}</TableCell>
                    <TableCell className="text-center">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleOpenAppealDialog(remark)}
                            disabled={remark.status === 'appealed' || (remark.appealCount && remark.appealCount >= 2)}
                        >
                            {remark.status === 'appealed' ? 'Appealed' : 'Appeal'}
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No remarks found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create an Appeal for "{selectedRemark?.title}"</DialogTitle>
            <DialogDescription>
              Provide a reason for your appeal and attach a mandatory proof document. This action cannot be undone.
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
                <label htmlFor="proof" className="text-sm font-medium">Proof Document <span className="text-red-500">*</span></label>
                <FileUpload onFileSelect={setAppealProof} />
                <div className="flex items-start gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-md" role="alert">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                        <strong>Note:</strong> A proof document is mandatory for all appeals. Appeals submitted without proof will not be considered. If you do not appeal within one week, the remark will be finalized and cannot be appealed later.
                    </p>
                </div>
                 <div className="flex items-start gap-2 text-sm text-green-700 p-3 bg-green-50 rounded-md mt-2" role="note">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                        <strong>Tip:</strong> If you have multiple files, please combine them into a single .zip file (under 10MB) before uploading.
                    </p>
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAppealSubmit} disabled={isSubmittingAppeal || !appealReason.trim() || !appealProof}>
                {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
