
"use client"

import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAlert } from "@/context/alert-context";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type NegativeCredit = {
  _id: string;
  title: string;
  createdAt: string;
  points: number;
  notes: string;
  proofUrl?: string;
  faculty: { // Corrected type
    _id: string;
    name: string;
  };
  appeal?: {
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

export default function AppealsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const facultyId = searchParams.get('uid');
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

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
        
        let url = `${API_BASE_URL}/api/v1/credits/credits/faculty/${facultyId}/negative`;
        if (filter !== 'all') {
            params.append('appealStatus', filter);
        }

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
            const fetchedAppeals = resData.items.filter((credit: NegativeCredit): credit is Appeal => 
              !!credit.appeal
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
  }, [facultyId, filter]);

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
    const currentIndex = statusOrder.indexOf(currentStatus);
    const itemIndex = statusOrder.indexOf(status);

    const isPast = itemIndex < currentIndex && currentStatus !== 'rejected';
    if(status === 'submitted' && currentStatus !== 'submitted') isPast;


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

        <div className="flex items-center gap-2 border-b pb-2">
            <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'pending' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('pending')}>Pending</Button>
            <Button variant={filter === 'accepted' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('accepted')}>Accepted</Button>
            <Button variant={filter === 'rejected' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('rejected')}>Rejected</Button>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">View</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Loading appeals...</TableCell></TableRow>
                ) : appeals.length > 0 ? (
                    appeals.map((appeal) => (
                    <TableRow
                        key={appeal._id}
                        className={`cursor-pointer ${selectedAppeal?._id === appeal._id ? "bg-primary/5" : ""}`}
                        onClick={() => setSelectedAppeal(appeal)}
                    >
                        <TableCell className="font-medium">{appeal.title}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(appeal.appeal.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(appeal.appeal.status)} className={getStatusColor(appeal.appeal.status)}>
                                {appeal.appeal.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">No appeals found for this filter.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <aside className={cn(
        "bg-card rounded-lg border flex-col p-6 gap-6 h-fit sticky top-6 transition-all duration-300",
        selectedAppeal ? "w-full md:w-1/3 flex" : "w-0 hidden"
      )}>
        {selectedAppeal ? (
            <div className="flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4">Appeal Details</h3>
                
                <>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                            <CardTitle className="text-base">Original Remark</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="font-semibold">{selectedAppeal.title} (<span className="text-red-600">{selectedAppeal.points}</span> points)</p>
                                <p className="text-muted-foreground italic">"{selectedAppeal.notes}"</p>
                                <p className="text-xs text-muted-foreground">Issued on: {new Date(selectedAppeal.createdAt).toLocaleString()}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                            <CardTitle className="text-base">Your Appeal</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="text-muted-foreground italic">"{selectedAppeal.appeal.reason}"</p>
                                <p className="text-xs text-muted-foreground">Submitted on: {new Date(selectedAppeal.appeal.createdAt).toLocaleString()}</p>
                            </CardContent>
                        </Card>

                    </div>
                      <div className="mt-6 border-t pt-6">
                        <h4 className="font-semibold mb-4">Appeal Timeline</h4>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="flex-shrink-0">{getTimelineIcon('submitted', selectedAppeal.appeal.status)}</div>
                                    <div className="w-px h-full bg-border"></div>
                                </div>
                                <div>
                                    <p className="font-medium">Submitted</p>
                                    <p className="text-sm text-muted-foreground">{new Date(selectedAppeal.appeal.createdAt).toDateString()}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className="flex-shrink-0">{getTimelineIcon('pending', selectedAppeal.appeal.status)}</div>
                                    <div className="w-px h-full bg-border"></div>
                                </div>
                                <div>
                                    <p className="font-medium">In Review</p>
                                    <p className="text-sm text-muted-foreground">The admin team is reviewing your appeal.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="flex-shrink-0">{getTimelineIcon(selectedAppeal.appeal.status, selectedAppeal.appeal.status)}</div>
                                <div>
                                    <p className="font-medium">Final Decision</p>
                                    {(selectedAppeal.appeal.status === 'accepted' || selectedAppeal.appeal.status === 'rejected') ? (
                                        <p className="text-sm text-muted-foreground">
                                            Your appeal has been {selectedAppeal.appeal.status}.
                                        </p>
                                    ): (
                                        <p className="text-sm text-muted-foreground">A decision is pending.</p>
                                    )}
                                </div>
                            </li>
                        </ul>
                    </div>
                </>
            </div>
        ) : (
            <div className="bg-background p-4 rounded-lg flex items-center justify-center text-center text-muted-foreground h-full">
                <p>{isLoading ? "Loading..." : "Select an appeal to view details"}</p>
            </div>
        )}
      </aside>
    </div>
  )
}
