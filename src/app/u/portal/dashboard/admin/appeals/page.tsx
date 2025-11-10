
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import React, { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { colleges } from "@/lib/colleges"
import { Search } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

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
  appeal: {
    status: 'pending' | 'accepted' | 'rejected';
    reason: string;
    submittedAt: string;
  };
  createdAt: string; 
};

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

  // Filtering and searching state
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});
  
  const totalPages = Math.ceil(total / limit);

  const fetchAppeals = async (currentPage: number) => {
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
        sort: '-createdAt'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
       if (collegeFilter !== 'all') {
        params.append('college', collegeFilter);
      }
      if (departmentFilter !== 'all') {
        params.append('department', departmentFilter);
      }

      const url = `${API_BASE_URL}/api/v1/admin/credits/negative/appeals/${statusFilter}?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.trim().startsWith("<!DOCTYPE")) {
            throw new Error(`API endpoint not found or returned an invalid response. Status: ${response.status}`);
        }
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `Failed to fetch appeals. Status: ${response.status}`);
        } catch (e) {
            throw new Error(`An unexpected error occurred: ${errorText}`);
        }
      }

      const data = await response.json();
      if (data.success) {
        setAllAppeals(data.items);
        setTotal(data.total);
        
        if (data.items.length > 0) {
           const currentSelection = data.items.find((a: Appeal) => a._id === selectedAppeal?._id);
           setSelectedAppeal(currentSelection || data.items[0]);
        } else {
           setSelectedAppeal(null);
        }

      } else {
        throw new Error(data.message || 'Failed to fetch appeals, unexpected response structure.');
      }
    } catch (err: any) {
      showAlert('Error fetching appeals', err.message);
      setAllAppeals([]);
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => fetchAppeals(page), 500);
    return () => clearTimeout(debounceTimer);
  }, [page, statusFilter, collegeFilter, departmentFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, collegeFilter, departmentFilter, searchTerm]);

  useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
    } else {
      setFilteredDepartments({});
    }
    setDepartmentFilter("all"); 
  }, [collegeFilter]);


  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    if (!selectedAppeal) {
        showAlert('Error', 'No appeal selected.');
        return;
    };

    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "You are not logged in.");
        return;
    }

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
        
        fetchAppeals(page);
        
        setComments("");

    } catch (error: any) {
         showAlert('Decision Failed', error.message);
    }
  }
  
  const getStatusColor = (status: Appeal['appeal']['status']) => {
      switch (status) {
          case 'accepted': return 'bg-green-100 text-green-800';
          case 'rejected': return 'bg-red-100 text-red-800';
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-grow lg:w-2/3 space-y-6">
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
                 <div className="flex flex-col md:flex-row flex-wrap gap-4">
                  <div className="relative flex-grow min-w-[200px] md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by faculty, title..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                      <SelectTrigger className="flex-grow min-w-[180px]"><SelectValue placeholder="Select College" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Colleges</SelectItem>
                          {Object.keys(colleges).map(college => (<SelectItem key={college} value={college}>{college}</SelectItem>))}
                      </SelectContent>
                  </Select>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={Object.keys(filteredDepartments).length === 0}>
                      <SelectTrigger className="flex-grow min-w-[180px]"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {Object.entries(filteredDepartments).map(([group, courses]) => (
                              <SelectGroup key={group}>
                                  <SelectLabel>{group}</SelectLabel>
                                  {courses.map(course => (
                                      <SelectItem key={course} value={course}>{course}</SelectItem>
                                  ))}
                              </SelectGroup>
                          ))}
                      </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 justify-start md:justify-end flex-grow">
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Displaying {allAppeals.length} of {total} appeals.
                </p>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="relative px-6 py-3">
                        <span className="sr-only">View</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                        <TableRow key="loading"><TableCell colSpan={5} className="text-center h-24">Loading appeals...</TableCell></TableRow>
                    ) : allAppeals.length > 0 ? (
                        allAppeals.map((appeal, index) => (
                        <TableRow
                            key={`${appeal._id}-${index}`}
                            className={`cursor-pointer ${selectedAppeal?._id === appeal._id ? "bg-primary/10" : ""}`}
                            onClick={() => setSelectedAppeal(appeal)}
                        >
                            <TableCell>
                            <div className="font-medium text-foreground">
                                {appeal.faculty.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {appeal.faculty.department}
                            </div>
                            </TableCell>
                            <TableCell>{appeal.title}</TableCell>
                            <TableCell>{new Date(appeal.appeal.submittedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                            <Badge className={getStatusColor(appeal.appeal.status)}>
                                {appeal.appeal.status}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="link" className="text-primary">
                                View
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow key="no-results"><TableCell colSpan={5} className="text-center h-24">No appeals found for the selected filters.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
      </div>
      <aside className="w-full lg:w-1/3 lg:max-w-md">
        <div className="sticky top-6 space-y-6">
          {selectedAppeal ? (
          <Card>
            <CardHeader className="flex items-center gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedAppeal.faculty.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Appeal for: {selectedAppeal.title}
                </p>
                <p className="text-xs text-muted-foreground">
                    ({new Date(selectedAppeal.appeal.submittedAt).toLocaleDateString()})
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Tabs defaultValue="evidence">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="remark">Original Remark</TabsTrigger>
                  <TabsTrigger value="evidence">Faculty's Reason</TabsTrigger>
                </TabsList>
                <TabsContent value="remark" className="py-5">
                    <p className="text-sm text-muted-foreground italic">
                      "{selectedAppeal.notes}"
                    </p>
                </TabsContent>
                <TabsContent value="evidence" className="py-5">
                   <p className="text-sm text-muted-foreground italic">
                     "{selectedAppeal.appeal.reason}"
                  </p>
                   {/* This should ideally link to the proof of the original credit */}
                   <Button variant="link" className="p-0 h-auto">View Original Document</Button>
                </TabsContent>
              </Tabs>
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-foreground">
                  Decision
                </h4>
                <div>
                    <Label
                    className="block text-sm font-medium text-muted-foreground"
                    htmlFor="comments"
                    >
                    Rationale
                    </Label>
                    <div className="mt-1">
                    <Textarea
                        id="comments"
                        name="comments"
                        placeholder="Add comments for your decision (optional)"
                        rows={3}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        disabled={selectedAppeal.appeal.status !== 'pending'}
                    />
                    </div>
                </div>
                {selectedAppeal.appeal.status === 'pending' ? (
                    <div className="flex items-center gap-4">
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        type="button"
                        onClick={() => handleDecision('accepted')}
                    >
                        Accept Appeal
                    </Button>
                    <Button
                        className="w-full"
                        variant="destructive"
                        type="button"
                        onClick={() => handleDecision('rejected')}
                    >
                        Reject Appeal
                    </Button>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-4 border rounded-md">
                        This appeal has already been {selectedAppeal.appeal.status}.
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
          ) : (
            <Card className="h-96 flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                    <p>{isLoading ? "Loading..." : "Select an appeal to review."}</p>
                </CardContent>
            </Card>
          )}
        </div>
      </aside>
    </div>
  )
}
