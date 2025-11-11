
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSearchParams } from "next/navigation"
import { useAlert } from "@/context/alert-context"
import { useToast } from "@/hooks/use-toast"
import { colleges } from "@/lib/colleges"
import { ChevronDown, ChevronUp, FileDown, Filter, Search, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import * as XLSX from 'xlsx';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type Submission = {
  _id: string;
  faculty: {
    _id: string;
    name: string;
    department: string;
    college: string;
    profileImage?: string;
  } | string;
  facultySnapshot?: {
    name: string;
    department: string;
    college: string;
    profileImage?: string;
  };
  issuedByObj?: {
      name: string;
  };
  creditTitleObj?: {
      title: string;
  };
  title: string;
  categories: { _id: string; title: string; }[];
  description?: string;
  proofUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  points: number;
  notes?: string;
};

type Aggregates = {
    countsByStatus: { [key: string]: number };
    totalPoints: number;
    avgPoints: number;
}

const buildQueryString = (filters: any) => {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
            if (Array.isArray(filters[key]) && filters[key].length > 0) {
                params.append(key, filters[key].join(','));
            } else if (!Array.isArray(filters[key])) {
                params.append(key, filters[key]);
            }
        }
    }
    return params.toString();
};

export default function ReviewSubmissionsPage() {
    const { showAlert } = useAlert();
    const { toast } = useToast();
    
    // Data states
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [aggregates, setAggregates] = useState<Aggregates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: ['pending'],
        academicYear: '',
        fromDate: '',
        toDate: '',
        pointsMin: '',
        pointsMax: '',
        hasProof: undefined,
        hasAppeal: undefined,
        sort: '-createdAt',
        page: 1,
        limit: 20,
    });
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    
    // Pagination states
    const [total, setTotal] = useState(0);
    const totalPages = Math.ceil(total / filters.limit);
    
    const handleFilterChange = (key: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            showAlert("Authentication Error", "Admin token not found.");
            setIsLoading(false);
            return;
        }
        
        const queryFilters = { ...filters };
        if (dateRange?.from) queryFilters.fromDate = format(dateRange.from, 'yyyy-MM-dd');
        if (dateRange?.to) queryFilters.toDate = format(dateRange.to, 'yyyy-MM-dd');

        const queryString = buildQueryString(queryFilters);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/positive?${queryString}`, {
                headers: { "Authorization": `Bearer ${token}` },
                cache: 'no-store'
            });

            const data = await response.json();
            if (data.success) {
                setSubmissions(data.items);
                setTotal(data.meta.total);
                setAggregates(data.aggregates);
                
                if (data.items.length > 0 && !selectedSubmission) {
                    setSelectedSubmission(data.items[0]);
                } else if (data.items.length === 0) {
                    setSelectedSubmission(null);
                }
            } else {
                if (response.status === 404) {
                    setSubmissions([]);
                    setTotal(0);
                    setAggregates(null);
                } else {
                    throw new Error(data.message || "Failed to fetch submissions");
                }
            }
        } catch (error: any) {
            showAlert("Error Fetching Data", error.message);
            setSubmissions([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [filters, dateRange, showAlert]);
    
    useEffect(() => {
        const debounceTimer = setTimeout(() => fetchSubmissions(), 500);
        return () => clearTimeout(debounceTimer);
    }, [fetchSubmissions]);

    const handleUpdateStatus = async (newStatus: "approved" | "rejected") => {
        if (!selectedSubmission) return;

        setIsSubmitting(true);
        const token = localStorage.getItem("token");
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/positive/${selectedSubmission._id}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    notes: newStatus === 'rejected' ? 'See conversation for details' : 'Approved',
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast({ title: `Submission ${newStatus}`, description: "The submission status has been updated." });
                fetchSubmissions(); // Refresh list
            } else {
                throw new Error(data.message || 'Failed to update status');
            }
        } catch (error: any) {
             showAlert("Update Failed", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const exportToCsv = () => {
        if (submissions.length === 0) {
            toast({ variant: 'destructive', title: "No data to export" });
            return;
        }
        const dataToExport = submissions.map(s => ({
            _id: s._id,
            createdAt: s.createdAt,
            title: s.title,
            facultyName: getFacultyDetails(s)?.name || 'N/A',
            points: s.points,
            status: s.status,
            issuedBy: s.issuedByObj?.name || 'N/A',
            categories: s.categories.map(c => c.title).join(', '),
            proofUrl: s.proofUrl,
            notes: s.notes || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
        XLSX.writeFile(workbook, "GoodWorksSubmissions.xlsx");
    };

    const getFacultyDetails = (submission: Submission) => submission.facultySnapshot || (typeof submission.faculty === 'object' ? submission.faculty : undefined);

    const renderAggregates = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{total}</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{aggregates?.countsByStatus.pending || 0}</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg. Points</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{aggregates?.avgPoints.toFixed(1) || 0}</p></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Points</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{aggregates?.totalPoints || 0}</p></CardContent>
            </Card>
        </div>
    );

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Good Works Submissions</h2>
            <p className="text-muted-foreground">Review and process faculty submissions for good works.</p>
          </div>
          <Button onClick={exportToCsv} variant="outline"><FileDown className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
        
        <Collapsible open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
            <div className="flex items-center justify-between">
                 <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by title, faculty..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="pl-10"/>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-4">
                        <Filter className="h-4 w-4 mr-2" />
                        <span>Filters</span>
                        {isFilterPanelOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div>
                        <Label>Status</Label>
                        <Select value={filters.status.join(',')} onValueChange={v => handleFilterChange('status', v.split(','))}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="approved">Approved</SelectItem>
                               <SelectItem value="rejected">Rejected</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label>Sort By</Label>
                        <Select value={filters.sort} onValueChange={v => handleFilterChange('sort', v)}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="-createdAt">Newest</SelectItem>
                               <SelectItem value="createdAt">Oldest</SelectItem>
                               <SelectItem value="-points">Points (High-Low)</SelectItem>
                               <SelectItem value="points">Points (Low-High)</SelectItem>
                               <SelectItem value="title">Title (A-Z)</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                    {dateRange?.from ? format(dateRange.from, "LLL dd, y") : <span>Pick a start date</span>}
                                    {dateRange?.to && ` - ${format(dateRange.to, "LLL dd, y")}`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <Label>Min Points</Label>
                            <Input type="number" value={filters.pointsMin} onChange={e => handleFilterChange('pointsMin', e.target.value)} placeholder="0"/>
                        </div>
                        <div>
                            <Label>Max Points</Label>
                            <Input type="number" value={filters.pointsMax} onChange={e => handleFilterChange('pointsMax', e.target.value)} placeholder="100"/>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                        <Switch id="has-proof" checked={filters.hasProof} onCheckedChange={v => handleFilterChange('hasProof', v)}/>
                        <Label htmlFor="has-proof">Has Proof</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                        <Switch id="has-appeal" checked={filters.hasAppeal} onCheckedChange={v => handleFilterChange('hasAppeal', v)}/>
                        <Label htmlFor="has-appeal">Has Appeal</Label>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
        
        {aggregates && renderAggregates()}
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={`loader-${i}`}>
                                <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-40"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-10"/></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                            </TableRow>
                         ))
                    ) : submissions.length > 0 ? (
                        submissions.map((submission) => {
                        const facultyDetails = getFacultyDetails(submission);
                        return (
                            <TableRow key={submission._id} className={`cursor-pointer ${selectedSubmission?._id === submission._id ? "bg-primary/10" : ""}`} onClick={() => setSelectedSubmission(submission)}>
                                <TableCell className="font-medium">{facultyDetails?.name}</TableCell>
                                <TableCell>{submission.title}</TableCell>
                                <TableCell>{submission.issuedByObj?.name}</TableCell>
                                <TableCell>{submission.points}</TableCell>
                                <TableCell><Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'pending' ? 'secondary' : 'destructive'} className={submission.status === 'approved' ? 'bg-green-100 text-green-800' : submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{submission.status}</Badge></TableCell>
                                <TableCell>{new Date(submission.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        )
                        })
                    ) : (
                        <TableRow><TableCell colSpan={6} className="text-center h-24">No submissions found.</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
           <CardFooter className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page</span>
                     <Select value={filters.limit.toString()} onValueChange={v => handleFilterChange('limit', parseInt(v))}>
                       <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                       <SelectContent>
                           <SelectItem value="10">10</SelectItem>
                           <SelectItem value="20">20</SelectItem>
                           <SelectItem value="50">50</SelectItem>
                           <SelectItem value="100">100</SelectItem>
                       </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {filters.page} of {totalPages || 1}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page >= totalPages}>Next</Button>
                </div>
            </CardFooter>
        </Card>
      </div>
      <aside className="lg:col-span-1 flex flex-col gap-6 h-fit sticky top-6">
        {selectedSubmission ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Faculty Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={getFacultyDetails(selectedSubmission)?.profileImage} />
                    <AvatarFallback>{getFacultyDetails(selectedSubmission)?.name?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{getFacultyDetails(selectedSubmission)?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{getFacultyDetails(selectedSubmission)?.department || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Submission Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Title</p>
                  <p className="font-semibold">{selectedSubmission.title}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Points</p>
                  <p className="font-semibold">{selectedSubmission.points}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Notes</p>
                  <p>{selectedSubmission.notes || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Document</p>
                  <Button variant="link" className="p-0 h-auto" onClick={() => window.open(selectedSubmission.proofUrl, '_blank')} disabled={!selectedSubmission.proofUrl}>View Document</Button>
                </div>
              </CardContent>
            </Card>
            {selectedSubmission.status === 'pending' && (
              <CardFooter className="flex flex-col gap-3">
                  <div className="flex gap-3 w-full">
                      <Button className="flex-1" onClick={() => handleUpdateStatus('approved')} disabled={isSubmitting}>Approve</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => handleUpdateStatus('rejected')} disabled={isSubmitting}>Reject</Button>
                  </div>
              </CardFooter>
            )}
          </div>
        ) : (
            <Card className="flex items-center justify-center h-full"><CardContent className="text-center text-muted-foreground p-6">Select a submission to view details</CardContent></Card>
        )}
      </aside>
    </div>
  )
}
