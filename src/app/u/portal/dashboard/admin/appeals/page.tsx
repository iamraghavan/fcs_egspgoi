"use client"

import { API_ORIGIN } from '@/lib/api-url';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import React, { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { colleges } from "@/lib/colleges"
import { Search, File as FileIcon, Plus, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { shortenUrl } from "@/lib/url-shortener"

const API_BASE_URL = API_ORIGIN;

type Appeal = {
  creditId: string;
  _id: string;
  faculty: {
    name: string;
    college: string;
    department: string;
    facultyID: string;
    profileImage?: string;
  };
  title: string;
  notes?: string;
  proofUrl?: string;
  creditProofUrl?: string;
  appealProofUrl?: string;
  points: number;
  academicYear?: string;
  status?: string;
  appeal: {
    status: 'pending' | 'accepted' | 'rejected';
    reason: string;
    submittedAt?: string;
    createdAt?: string;
    decisionNotes?: string;
  };
  createdAt: string;
  [key: string]: any; // Allow for other properties
};

type AppealStatus = 'pending' | 'accepted' | 'rejected' | 'all';

function formatDateTime(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date);
}

function formatAppealDate(appeal: Appeal) {
  return formatDateTime(appeal.appeal?.submittedAt || appeal.appeal?.createdAt);
}

type Departments = {
    [key: string]: string[];
};

export default function AppealReviewPage() {
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const [allAppeals, setAllAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering and searching state
  const [statusFilter, setStatusFilter] = useState<AppealStatus>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('-appealDate');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});
  const [proofLinks, setProofLinks] = useState<{ credit?: string; appeal?: string }>({});
  
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeFilterCount = [collegeFilter !== 'all', departmentFilter !== 'all', yearFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

  const fetchAppeals = async (currentPage: number, signal?: AbortSignal) => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "You are not logged in.");
        setIsLoading(false);
        return;
    }

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort
      });
      
      if (statusFilter !== 'all') {
        params.append('appealStatus', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
       if (collegeFilter !== 'all') {
        params.append('college', collegeFilter);
      }
      if (departmentFilter !== 'all') {
        params.append('department', departmentFilter);
      }
      if (yearFilter !== 'all') params.append('academicYear', yearFilter);
      if (dateFrom) params.append('submittedFrom', dateFrom);
      if (dateTo) params.append('submittedTo', dateTo);
      
      const url = `${API_BASE_URL}/api/v1/admin/credits/negative/appeals/all?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (response.status === 404) {
        setAllAppeals([]);
        setTotal(0);
        setSelectedAppeal(null);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.trim().startsWith("<!DOCTYPE")) {
            throw new Error(`API endpoint not found or returned an invalid response. Status: ${response.status}`);
        }
        let message = `Failed to fetch appeals. Status: ${response.status}`;
        try { message = JSON.parse(errorText).message || message; } catch { /* keep status message */ }
        throw new Error(message);
      }

      const data = await response.json();
      if (data.success) {
        setAllAppeals(data.items);
        setTotal(data.total);
        setAvailableYears(data.filters?.years || []);
        
        setSelectedAppeal(previous => data.items.find((a: Appeal) => a._id === previous?._id) || null);

      } else {
        throw new Error(data.message || 'Failed to fetch appeals, unexpected response structure.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      showAlert('Error fetching appeals', err.message);
      setAllAppeals([]);
      setTotal(0);
    } finally {
        if (!signal?.aborted) setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const debounceTimer = setTimeout(() => fetchAppeals(page, controller.signal), searchTerm ? 350 : 0);
    return () => { clearTimeout(debounceTimer); controller.abort(); };
  }, [page, statusFilter, collegeFilter, departmentFilter, yearFilter, dateFrom, dateTo, sort, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, collegeFilter, departmentFilter, yearFilter, dateFrom, dateTo, sort, searchTerm]);

  useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
    } else {
      setFilteredDepartments({});
    }
    setDepartmentFilter("all"); 
  }, [collegeFilter]);

  const getProofUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    let active = true;
    setProofLinks({});
    const createLink = (kind: 'credit' | 'appeal', value?: string) => {
      if (!value) return;
      const url = getProofUrl(value);
      shortenUrl(url).then(link => {
        if (active) setProofLinks(previous => ({ ...previous, [kind]: link }));
      }).catch(() => {
        if (active) setProofLinks(previous => ({ ...previous, [kind]: url }));
      });
    };
    createLink('credit', selectedAppeal?.creditProofUrl);
    createLink('appeal', selectedAppeal?.appealProofUrl);
    return () => { active = false; };
  }, [selectedAppeal?.creditProofUrl, selectedAppeal?.appealProofUrl]);

  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    if (!selectedAppeal || isSubmitting) {
        showAlert('Error', 'No appeal selected.');
        return;
    };

    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "You are not logged in.");
        return;
    }

    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative/${selectedAppeal.creditId}/appeal`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                status: decision, 
                notes: comments || `Appeal decision: ${decision}`
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${decision} appeal.`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || `Failed to ${decision} appeal.`);
        }

        toast({ title: "Decision Submitted", description: `The appeal has been marked as ${decision}.`});
        
        await fetchAppeals(page);
        
        setComments("");

    } catch (error: any) {
         showAlert('Decision Failed', error.message);
    } finally {
        setIsSubmitting(false);
    }
  }

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('pending');
    setCollegeFilter('all');
    setDepartmentFilter('all');
    setYearFilter('all');
    setDateFrom('');
    setDateTo('');
    setSort('-appealDate');
    setPage(1);
  };
  
  const getStatusColor = (status: Appeal['appeal']['status']) => {
      switch (status) {
          case 'accepted': return 'bg-green-100 text-green-800';
          case 'rejected': return 'bg-red-100 text-red-800';
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appeal Review</CardTitle>
            <CardDescription>
                Review and process faculty appeals for credit adjustments.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="relative flex-1">
                  <Label htmlFor="appeal-search">Search appeals</Label>
                  <Search aria-hidden="true" className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
                  <Input id="appeal-search" placeholder="Faculty, ID, activity, or reason" className="mt-1 pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="sm:w-44">
                  <Label htmlFor="appeal-status">Status</Label>
                  <Select value={statusFilter} onValueChange={value => setStatusFilter(value as AppealStatus)}>
                    <SelectTrigger id="appeal-status" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="all">All statuses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant={showAdvanced ? 'secondary' : 'outline'} aria-expanded={showAdvanced} aria-controls="appeal-advanced-filters" onClick={() => setShowAdvanced(value => !value)}>
                  <SlidersHorizontal aria-hidden="true" className="mr-2 h-4 w-4" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </Button>
                <Button type="button" variant="ghost" onClick={resetFilters}><RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" /> Reset</Button>
              </div>
              {showAdvanced && (
                <div id="appeal-advanced-filters" className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div><Label htmlFor="appeal-college">College</Label><Select value={collegeFilter} onValueChange={setCollegeFilter}><SelectTrigger id="appeal-college" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All colleges</SelectItem>{Object.keys(colleges).map(college => <SelectItem key={college} value={college}>{college}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="appeal-department">Department</Label><Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={collegeFilter === 'all'}><SelectTrigger id="appeal-department" className="mt-1"><SelectValue placeholder="Choose a college first" /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{Object.entries(filteredDepartments).map(([group, courses]) => <SelectGroup key={group}><SelectLabel>{group}</SelectLabel>{courses.map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}</SelectGroup>)}</SelectContent></Select></div>
                  <div><Label htmlFor="appeal-year">Academic year</Label><Select value={yearFilter} onValueChange={setYearFilter}><SelectTrigger id="appeal-year" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="appeal-from">Submitted from</Label><Input id="appeal-from" type="date" className="mt-1" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} /></div>
                  <div><Label htmlFor="appeal-to">Submitted through</Label><Input id="appeal-to" type="date" className="mt-1" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} /></div>
                  <div><Label htmlFor="appeal-sort">Sort by</Label><Select value={sort} onValueChange={setSort}><SelectTrigger id="appeal-sort" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="-appealDate">Newest appeals</SelectItem><SelectItem value="appealDate">Oldest appeals</SelectItem><SelectItem value="-createdAt">Newest credit</SelectItem></SelectContent></Select></div>
                </div>
              )}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4" role="status" aria-live="polite">
                    {isLoading ? 'Loading appeals…' : total ? `Showing ${(page - 1) * limit + 1}–${(page - 1) * limit + allAppeals.length} of ${total} appeals` : 'No appeals match these filters'}
                </p>
              <div className="overflow-x-auto border rounded-lg" aria-busy={isLoading}>
                <Table>
                  <caption className="sr-only">Faculty credit appeals. Use the plus button to open the appeal and issued negative credit details.</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Appealed on</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center h-24">Loading appeals...</TableCell></TableRow>
                    ) : allAppeals.length > 0 ? (
                        allAppeals.map((appeal) => (
                        <TableRow
                            key={appeal._id}
                            className={selectedAppeal?._id === appeal._id ? "bg-primary/10" : ""}
                        >
                            <TableCell>
                            <div className="font-medium text-foreground">
                                {appeal.faculty?.name || 'Unknown faculty'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {appeal.faculty?.facultyID || appeal.faculty?.department || '—'}
                            </div>
                            </TableCell>
                            <TableCell className="max-w-64 truncate" title={appeal.title}>{appeal.title || 'Untitled credit'}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatAppealDate(appeal)}</TableCell>
                            <TableCell>
                            <Badge className={getStatusColor(appeal.appeal.status)}>
                                {appeal.appeal.status}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="outline" size="sm" aria-label={`Open appeal and negative credit details for ${appeal.faculty?.name || 'faculty'}: ${appeal.title || 'untitled credit'}`} onClick={() => { setSelectedAppeal(appeal); setComments(''); }}>
                                <Plus aria-hidden="true" className="mr-1.5 h-4 w-4" /> Review details
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={5} className="text-center h-24">No appeals found. Try another status, date range, or search term.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
      </div>
      <Sheet open={!!selectedAppeal} onOpenChange={open => { if (!open && !isSubmitting) setSelectedAppeal(null); }}>
        <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
          {selectedAppeal && (
            <>
              <SheetHeader className="border-b px-6 py-5 pr-14 text-left">
                <SheetTitle>Review faculty appeal</SheetTitle>
                <SheetDescription>See the issued negative credit and the faculty response before recording a decision.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{selectedAppeal.faculty?.name || 'Unknown faculty'}</p>
                    <p className="text-sm text-muted-foreground">{selectedAppeal.faculty?.facultyID || 'No faculty ID'} · {selectedAppeal.faculty?.department || 'No department'}</p>
                    <p className="text-sm text-muted-foreground">{selectedAppeal.faculty?.college || 'College unavailable'}</p>
                  </div>
                  <Badge className={getStatusColor(selectedAppeal.appeal.status)}>{selectedAppeal.appeal.status}</Badge>
                </div>

                <section aria-labelledby="issued-credit-heading" className="space-y-4 rounded-lg border p-4">
                  <div>
                    <h3 id="issued-credit-heading" className="font-semibold">Issued negative credit</h3>
                    <p className="text-sm text-muted-foreground">The credit the faculty member is appealing.</p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2"><p className="text-muted-foreground">Activity / reason</p><p className="font-medium">{selectedAppeal.title || 'Untitled credit'}</p></div>
                    <div><p className="text-muted-foreground">Points deducted</p><p className="font-semibold text-destructive">−{Math.abs(selectedAppeal.points)} points</p></div>
                    <div><p className="text-muted-foreground">Issued on</p><p className="font-medium">{formatDateTime(selectedAppeal.createdAt)}</p></div>
                    <div><p className="text-muted-foreground">Academic year</p><p className="font-medium">{selectedAppeal.academicYear || 'Not provided'}</p></div>
                    <div><p className="text-muted-foreground">Credit status</p><p className="font-medium capitalize">{selectedAppeal.status || 'Not provided'}</p></div>
                  </div>
                  <div className="text-sm"><p className="text-muted-foreground">Credit notes</p><p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3">{selectedAppeal.notes || 'No notes provided.'}</p></div>
                  {selectedAppeal.creditProofUrl && (proofLinks.credit
                    ? <Button asChild variant="outline" size="sm"><a href={proofLinks.credit} target="_blank" rel="noopener noreferrer"><FileIcon aria-hidden="true" className="mr-2 h-4 w-4" /> View credit proof</a></Button>
                    : <p className="text-xs text-muted-foreground">Preparing credit proof link…</p>)}
                  <p className="break-all text-xs text-muted-foreground">Credit ID: {selectedAppeal.creditId}</p>
                </section>

                <section aria-labelledby="faculty-appeal-heading" className="space-y-4 rounded-lg border p-4">
                  <div>
                    <h3 id="faculty-appeal-heading" className="font-semibold">Faculty appeal</h3>
                    <p className="text-sm text-muted-foreground">Submitted {formatAppealDate(selectedAppeal)}</p>
                  </div>
                  <div className="text-sm"><p className="text-muted-foreground">Reason for appeal</p><p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3">{selectedAppeal.appeal.reason || 'No reason provided.'}</p></div>
                  {selectedAppeal.appealProofUrl && (proofLinks.appeal
                    ? <Button asChild variant="outline" size="sm"><a href={proofLinks.appeal} target="_blank" rel="noopener noreferrer"><FileIcon aria-hidden="true" className="mr-2 h-4 w-4" /> View appeal proof</a></Button>
                    : <p className="text-xs text-muted-foreground">Preparing appeal proof link…</p>)}
                </section>

                <section aria-labelledby="appeal-decision-heading" className="space-y-3 border-t pt-5">
                  <h3 id="appeal-decision-heading" className="font-semibold">Decision</h3>
                  {selectedAppeal.appeal.status === 'pending' ? (
                    <>
                      <Label htmlFor="appeal-decision-notes">Decision rationale</Label>
                      <Textarea id="appeal-decision-notes" placeholder="Explain the reason for your decision" rows={3} value={comments} onChange={e => setComments(e.target.value)} disabled={isSubmitting} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button type="button" className="bg-green-600 text-white hover:bg-green-700" disabled={isSubmitting} onClick={() => handleDecision('accepted')}>{isSubmitting ? 'Saving…' : 'Accept appeal'}</Button>
                        <Button type="button" variant="destructive" disabled={isSubmitting} onClick={() => handleDecision('rejected')}>{isSubmitting ? 'Saving…' : 'Reject appeal'}</Button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-md bg-muted/50 p-3 text-sm">
                      <p>This appeal was {selectedAppeal.appeal.status}.</p>
                      {selectedAppeal.appeal.decisionNotes && <p className="mt-2 whitespace-pre-wrap"><span className="font-medium">Decision notes:</span> {selectedAppeal.appeal.decisionNotes}</p>}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
