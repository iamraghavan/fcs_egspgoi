
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { colleges } from "@/lib/colleges"
import { Search } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type Appeal = {
  _id: string; // This is the credit ID
  faculty: {
    _id: string;
    name: string;
    college: string;
    department: string;
  };
  title: string;
  notes: string; // Original notes of the negative credit
  appeal: {
    _id: string; // This is the appeal ID
    by: string;
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  };
  createdAt: string; // Credit creation date
};

type Departments = {
    [key: string]: string[];
};

export default function AppealReviewPage() {
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const [allAppeals, setAllAppeals] = useState<Appeal[]>([]);
  const [selectedAppealId, setSelectedAppealId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState("");

  // Filtering and searching state
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});

  const selectedAppeal = useMemo(() => allAppeals.find(a => a.appeal._id === selectedAppealId), [allAppeals, selectedAppealId]);

  const fetchAppeals = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "You are not logged in.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative/appeals/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(JSON.parse(errorText).message || `Failed to fetch appeals. Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.negativeAppeals) {
        const sortedAppeals = data.negativeAppeals.sort((a: Appeal, b: Appeal) => new Date(b.appeal.createdAt).getTime() - new Date(a.appeal.createdAt).getTime());
        setAllAppeals(sortedAppeals);
        
        if (sortedAppeals.length > 0) {
           const firstPending = sortedAppeals.find(a => a.appeal.status === 'pending');
           if (firstPending) {
               setSelectedAppealId(firstPending.appeal._id);
           } else {
               setSelectedAppealId(sortedAppeals[0].appeal._id);
           }
        } else {
           setSelectedAppealId(null);
        }

      } else {
        throw new Error('Failed to fetch appeals, unexpected response structure.');
      }
    } catch (err: any) {
      showAlert('Error fetching appeals', err.message);
      setAllAppeals([]);
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAppeals();
  }, []);

  useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
    } else {
      setFilteredDepartments({});
    }
    setDepartmentFilter("all"); // Reset department filter when college changes
  }, [collegeFilter]);

  const filteredAppeals = useMemo(() => {
    return allAppeals.filter(appeal => {
      if (statusFilter !== 'all' && appeal.appeal.status !== statusFilter) {
        return false;
      }
      if (collegeFilter !== 'all' && appeal.faculty.college !== collegeFilter) {
        return false;
      }
      if (departmentFilter !== 'all' && appeal.faculty.department !== departmentFilter) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = appeal.faculty.name.toLowerCase().includes(term) ||
                        appeal.faculty._id.toLowerCase().includes(term) ||
                        appeal.title.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [allAppeals, statusFilter, searchTerm, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    if (filteredAppeals.length > 0 && !filteredAppeals.some(a => a.appeal._id === selectedAppealId)) {
        setSelectedAppealId(filteredAppeals[0].appeal._id);
    } else if (filteredAppeals.length === 0) {
        setSelectedAppealId(null);
    }
  }, [filteredAppeals, selectedAppealId]);

  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    if (!selectedAppealId) {
        showAlert('Error', 'No appeal selected.');
        return;
    };

    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "You are not logged in.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative/appeal/${selectedAppealId}`, {
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
        
        await fetchAppeals(); 
        
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
      <div className="flex-grow lg:w-2/3 space-y-8">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Appeal Review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and process faculty appeals for credit adjustments.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-4">
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
            <p className="text-sm text-muted-foreground mb-4">
                Displaying {filteredAppeals.length} of {allAppeals.length} appeals.
            </p>
          <div className="overflow-x-auto">
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
                    <TableRow key="loading-row"><TableCell colSpan={5} className="text-center h-24">Loading appeals...</TableCell></TableRow>
                ) : filteredAppeals.length > 0 ? (
                    filteredAppeals.map((appeal) => (
                    <TableRow
                        key={appeal.appeal._id}
                        className={`cursor-pointer ${selectedAppealId === appeal.appeal._id ? "bg-primary/10" : ""}`}
                        onClick={() => setSelectedAppealId(appeal.appeal._id)}
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
                        <TableCell>{new Date(appeal.appeal.createdAt).toLocaleDateString()}</TableCell>
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
                    <TableRow key="no-results-row"><TableCell colSpan={5} className="text-center h-24">No appeals found for the selected filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <aside className="w-full lg:w-1/3 lg:max-w-md">
        <div className="sticky top-8 space-y-6">
          {selectedAppeal ? (
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-4 border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedAppeal.faculty.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Appeal for: {selectedAppeal.title} ({new Date(selectedAppeal.appeal.createdAt).toLocaleDateString()})
                </p>
              </div>
            </div>
            <div className="space-y-4">
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
            </div>
          </div>
          ) : (
            <div className="bg-card p-6 rounded-lg shadow-sm text-center text-muted-foreground">
                <p>{isLoading ? "Loading..." : "Select an appeal to review."}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

    