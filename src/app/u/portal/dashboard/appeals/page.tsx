"use client"

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAlert } from "@/context/alert-context";
import { FileUpload } from "@/components/file-upload";
import { Edit, Trash2, Search, Filter } from "lucide-react";


const API_BASE_URL = 'https://faculty-credit-system.vercel.app';

type NegativeCredit = {
  _id: string;
  title: string;
  createdAt: string;
  points: number;
  notes?: string;
  proofUrl?: string;
  academicYear?: string;
  faculty: {
    _id: string;
    name: string;
  } | string;
  appeal?: {
    _id?: string;
    by: string;
    reason: string;
    createdAt: string;
    status: 'pending' | 'accepted' | 'rejected';
  }
  status: 'pending' | 'approved' | 'rejected' | 'appealed';
};

type Appeal = NegativeCredit & {
  appeal: NonNullable<NegativeCredit['appeal']>;
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

export default function AppealsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  
  // Filtering state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  
  // State for editing appeals
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealProof, setAppealProof] = useState<File | null>(null);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const facultyId = searchParams.get('uid');
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const yearOptions = generateYearOptions();

  const fetchAppeals = async () => {
      setIsLoading(true);
      if (!token || !facultyId) {
        showAlert("Authentication Error", "You are not logged in.");
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({ 
            limit: '200', 
            sort: '-appeal.createdAt',
        });
        
        const url = `${API_BASE_URL}/api/v1/credits/credits/faculty/${facultyId}/negative`;

        const response = await fetch(`${url}?${params.toString()}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
             try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || "Server returned an error");
            } catch (e) {
                throw new Error(`Failed to fetch data. Status: ${response.status}.`);
            }
        }

        const resData = await response.json();

        if (resData.success) {
            // Relaxed filter: just check if credit.appeal exists (backend might not send _id inside the appeal object)
            const fetchedAppeals = resData.items.filter((credit: NegativeCredit): credit is Appeal => 
              !!credit.appeal && credit.status === 'appealed'
            );
            
            setAppeals(fetchedAppeals);

            if (fetchedAppeals.length > 0) {
              const currentSelection = fetchedAppeals.find((item: Appeal) => item._id === selectedAppeal?._id) || fetchedAppeals[0];
              setSelectedAppeal(currentSelection);
            } else {
              setSelectedAppeal(null);
            }
        } else {
            throw new Error(resData.message || "Failed to fetch data.");
        }
      } catch (error: any) {
          showAlert("Failed to fetch data", error.message);
          setAppeals([]);
      } finally {
          setIsLoading(false);
      }
  };
  
  useEffect(() => {
    if (facultyId) {
        fetchAppeals();
    }
  }, [facultyId]);

  const filteredAppeals = useMemo(() => {
    return appeals.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.appeal.status === statusFilter;
      const matchesYear = yearFilter === 'all' || item.academicYear === yearFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(term) || 
                           item.appeal.reason.toLowerCase().includes(term) ||
                           (item.notes && item.notes.toLowerCase().includes(term));
      
      return matchesStatus && matchesYear && matchesSearch;
    });
  }, [appeals, statusFilter, yearFilter, searchTerm]);
  
  const handleAppealSubmit = async () => {
    if (!selectedAppeal || !selectedAppeal._id || !appealReason.trim()) {
        showAlert("Incomplete Form", "Cannot submit appeal: ID is missing or reason is empty.");
        return;
    }
    setIsSubmittingAppeal(true);
    
    const formData = new FormData();
    formData.append("reason", appealReason);
    if (appealProof) {
      formData.append("proof", appealProof);
    }
    
    const url = `${API_BASE_URL}/api/v1/credits/credits/appeals/${selectedAppeal._id}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || `Failed to update appeal.`);
        }
        
        toast({
            title: `Appeal Updated`,
            description: `Your appeal has been successfully updated.`,
        });

        setIsEditDialogOpen(false);
        fetchAppeals();

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
        fetchAppeals();
    } catch(error: any) {
        showAlert("Withdrawal Failed", error.message);
    }
  };

  const getStatusVariant = (status: Appeal['appeal']['status']) => {
      switch (status) {
          case 'accepted': return 'default';
          case 'rejected': return 'destructive';
          case 'pending': return 'secondary';
          default: return 'secondary';
      }
  };
  
  const getStatusColor = (status: Appeal['appeal']['status']) => {
      switch (status) {
          case 'accepted': return 'bg-green-100 text-green-800';
          case 'rejected': return 'bg-red-100 text-red-800';
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };
  
  const getTimelineIcon = (status: 'submitted' | Appeal['appeal']['status'], currentStatus: Appeal['appeal']['status']) => {
    const statusOrder = ['submitted', 'pending', 'accepted', 'rejected'];
    const currentIndex = statusOrder.indexOf(currentStatus || 'pending');
    const itemIndex = statusOrder.indexOf(status);

    const isPast = itemIndex < currentIndex && currentStatus !== 'rejected';
    const isCurrent = status === currentStatus;

    if (isPast || (status === 'submitted' && currentStatus !== 'submitted')) {
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="material-symbols-outlined text-base">check</span>
        </div>
      );
    }
    
    if (isCurrent) {
        let icon, colorClass;
        switch(currentStatus) {
            case 'pending':
                icon = 'timelapse';
                colorClass = 'bg-primary/20 text-primary animate-pulse';
                break;
            case 'accepted':
                icon = 'check_circle';
                colorClass = 'bg-green-100 text-green-600';
                break;
            case 'rejected':
                icon = 'cancel';
                colorClass = 'bg-red-100 text-destructive';
                break;
            default:
                icon = 'radio_button_unchecked';
                colorClass = 'bg-muted text-muted-foreground';
        }
       return (
         <div className={`flex h-6 w-6 items-center justify-center rounded-full ${colorClass}`}>
           <span className="material-symbols-outlined text-base">{icon}</span>
         </div>
       );
    }

    return (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <span className="material-symbols-outlined text-base">radio_button_unchecked</span>
        </div>
    );
  };


  return (
    <div className="flex flex-col md:flex-row flex-1 gap-6">
      <div className={cn(
        "flex flex-col gap-6 w-full",
        selectedAppeal ? "md:w-2/3" : "md:w-full"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Appeals</h2>
            <p className="text-muted-foreground">Review and track your submitted appeals.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 border-b pb-4">
            <div className="relative flex-grow w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search appeals..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto whitespace-nowrap pb-2 sm:pb-0">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {yearOptions.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="btn-filter-wrap">
                    {['all', 'pending', 'accepted', 'rejected'].map((s) => (
                        <Button 
                            key={s}
                            variant="ghost"
                            size="sm" 
                            className={cn(
                                "btn-filter",
                                statusFilter === s ? "btn-filter-active" : "btn-filter-inactive"
                            )}
                            onClick={() => setStatusFilter(s as any)}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">View</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading appeals...</TableCell></TableRow>
                ) : filteredAppeals.length > 0 ? (
                    filteredAppeals.map((appeal) => (
                    <TableRow
                        key={appeal._id}
                        className={`cursor-pointer transition-colors ${selectedAppeal?._id === appeal._id ? "bg-primary/5" : "hover:bg-muted/50"}`}
                        onClick={() => setSelectedAppeal(appeal)}
                    >
                        <TableCell className="font-medium">{appeal.title}</TableCell>
                        <TableCell className="text-sm">{appeal.academicYear || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(appeal.appeal.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(appeal.appeal.status)} className={getStatusColor(appeal.appeal.status)}>
                                {appeal.appeal.status || 'pending'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No appeals found matching your criteria.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <aside className={cn(
        "bg-card rounded-lg border flex-col p-6 gap-6 h-fit sticky top-6 transition-all duration-300 shadow-sm",
        selectedAppeal ? "w-full md:w-1/3 flex" : "w-0 hidden"
      )}>
        {selectedAppeal ? (
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">Appeal Details</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setSelectedAppeal(null)}>
                        <span className="material-symbols-outlined">close</span>
                    </Button>
                </div>
                
                <div className="space-y-4">
                    <Card className="shadow-none bg-muted/30">
                        <CardHeader className="pb-2 p-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Original Remark</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm p-4 pt-0">
                            <p className="font-semibold text-base">{selectedAppeal.title} (<span className="text-red-600">{selectedAppeal.points}</span> points)</p>
                            <p className="text-muted-foreground italic line-clamp-3">"{selectedAppeal.notes || 'No original notes'}"</p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                <span>Issued: {new Date(selectedAppeal.createdAt).toLocaleDateString()}</span>
                                <span>Year: {selectedAppeal.academicYear}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border-primary/20">
                        <CardHeader className="pb-2 p-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Your Rationale</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm p-4 pt-0">
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">"{selectedAppeal.appeal.reason}"</p>
                            <p className="text-xs text-muted-foreground pt-2">Submitted: {new Date(selectedAppeal.appeal.createdAt).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="mt-6 border-t pt-6">
                    <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Appeal Timeline</h4>
                    <ul className="space-y-6">
                        <li className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="flex-shrink-0">{getTimelineIcon('submitted', selectedAppeal.appeal.status || 'pending')}</div>
                                <div className="w-px h-full bg-border mt-1"></div>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Submitted</p>
                                <p className="text-xs text-muted-foreground">{new Date(selectedAppeal.appeal.createdAt).toDateString()}</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                                <div className="flex flex-col items-center">
                                <div className="flex-shrink-0">{getTimelineIcon('pending', selectedAppeal.appeal.status || 'pending')}</div>
                                <div className="w-px h-full bg-border mt-1"></div>
                            </div>
                            <div>
                                <p className="font-medium text-sm">In Review</p>
                                <p className="text-xs text-muted-foreground">The admin team is reviewing your justification.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="flex-shrink-0">{getTimelineIcon(selectedAppeal.appeal.status || 'pending', selectedAppeal.appeal.status || 'pending')}</div>
                            <div>
                                <p className="font-medium text-sm">Final Decision</p>
                                {(selectedAppeal.appeal.status === 'accepted' || selectedAppeal.appeal.status === 'rejected') ? (
                                    <p className="text-xs text-muted-foreground">
                                        Decision reached on: {new Date(selectedAppeal.updatedAt || selectedAppeal.appeal.createdAt).toLocaleDateString()}
                                    </p>
                                ): (
                                    <p className="text-xs text-muted-foreground">Awaiting administrative action.</p>
                                )}
                            </div>
                        </li>
                    </ul>
                </div>
                
                {(!selectedAppeal.appeal.status || selectedAppeal.appeal.status === 'pending') && (
                    <div className="mt-6 border-t pt-6">
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Actions</h4>
                        <div className="flex flex-col gap-2">
                            <Button onClick={() => { setAppealReason(selectedAppeal.appeal.reason); setAppealProof(null); setIsEditDialogOpen(true); }} >
                                <Edit className="mr-2 h-4 w-4" /> Edit Justification
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Withdraw Appeal
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This action will permanently withdraw your appeal. You may not be able to appeal this remark again.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleWithdrawAppeal(selectedAppeal._id)} className="bg-destructive hover:bg-destructive/90">
                                            Confirm & Withdraw
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-background p-4 rounded-lg flex items-center justify-center text-center text-muted-foreground h-full">
                <p>{isLoading ? "Loading..." : "Select an appeal to view details"}</p>
            </div>
        )}
      </aside>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Justification for "{selectedAppeal?.title}"</DialogTitle>
            <DialogDescription>
              Update your reason for appealing. Attaching new proof is optional.
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
                <label htmlFor="proof" className="text-sm font-medium">Supporting Evidence (Optional)</label>
                <FileUpload onFileSelect={setAppealProof} />
                <p className="text-xs text-muted-foreground">New uploads will replace previous attachments.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAppealSubmit} disabled={isSubmittingAppeal || !appealReason.trim()}>
                {isSubmittingAppeal ? 'Updating...' : 'Update Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}