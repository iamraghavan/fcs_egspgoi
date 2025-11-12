
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
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Eye, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { colleges } from "@/lib/colleges";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type IssuedRemark = {
    _id: string;
    academicYear: string;
    createdAt: string;
    faculty: string;
    facultySnapshot: {
        name: string;
        college: string;
        facultyID: string;
        department: string;
        profileImage?: string;
    };
    issuedBy: string;
    issuedBySnapshot: {
        _id: string;
        name: string;
        email: string;
    };
    notes?: string;
    points: number;
    proofUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed';
    type: 'negative';
    updatedAt: string;
    creditTitle?: string;
};

type Departments = {
    [key: string]: string[];
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


export default function IssuedHistoryPage() {
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Data for table
  const [remarks, setRemarks] = useState<IssuedRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});
  
  // Details view state
  const [selectedRemark, setSelectedRemark] = useState<IssuedRemark | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const uid = searchParams.get('uid');
  const totalPages = Math.ceil(total / limit);

  const fetchRemarks = async (currentPage: number) => {
      setIsLoadingRemarks(true);
      if (!adminToken) {
          setIsLoadingRemarks(false);
          return;
      }
  
      try {
          const params = new URLSearchParams({
              page: currentPage.toString(),
              limit: limit.toString(),
              sort: '-createdAt',
          });

          if (searchTerm) params.append('search', searchTerm);
          if (statusFilter !== 'all') params.append('status', statusFilter);
          if (academicYearFilter !== 'all') params.append('academicYear', academicYearFilter);
          if (collegeFilter !== 'all') params.append('college', collegeFilter);
          if (departmentFilter !== 'all') params.append('department', departmentFilter);
          if (dateRange?.from) params.append('fromDate', format(dateRange.from, 'yyyy-MM-dd'));
          if (dateRange?.to) params.append('toDate', format(dateRange.to, 'yyyy-MM-dd'));

          const response = await fetch(`${API_BASE_URL}/api/v1/admin/oa/credits/issued?${params.toString()}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          const data = await response.json();
          if (data.success) {
              setRemarks(data.data.items);
              setTotal(data.data.totalFiltered);
          } else {
              throw new Error(data.message || "Failed to fetch remarks");
          }
      } catch (error: any) {
          showAlert("Error fetching remarks", error.message);
          setRemarks([]);
          setTotal(0);
      } finally {
          setIsLoadingRemarks(false);
      }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (adminToken) {
            fetchRemarks(page);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [page, adminToken, searchTerm, statusFilter, academicYearFilter, collegeFilter, departmentFilter, dateRange]);
  
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, academicYearFilter, collegeFilter, departmentFilter, dateRange]);

  useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
    } else {
      setFilteredDepartments({});
    }
    setDepartmentFilter("all"); 
  }, [collegeFilter]);

  const handleDelete = async (id: string) => {
    if (!adminToken) {
        showAlert("Authentication Error", "Admin token not found.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/admin/oa/credits/issued/${id}?soft=true`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${adminToken}` },
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || "Failed to delete remark.");
        }

        toast({ title: "Remark Deleted", description: "The remark has been successfully (soft) deleted." });
        fetchRemarks(page);
    } catch (error: any) {
        showAlert("Delete Failed", error.message);
    }
  };
  
  const getProofUrl = (url: string) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getStatusBadge = (status: IssuedRemark['status']) => {
    let variant: "default" | "secondary" | "destructive" = "secondary";
    let className = "";
    switch (status) {
        case 'approved': 
            variant = 'default';
            className = 'bg-green-100 text-green-800';
            break;
        case 'rejected':
            variant = 'destructive';
            className = 'bg-red-100 text-red-800';
            break;
        case 'appealed':
            variant = 'default';
            className = 'bg-blue-100 text-blue-800';
            break;
        case 'pending':
        default:
            variant = 'secondary';
            className = 'bg-yellow-100 text-yellow-800';
            break;
    }
    return <Badge variant={variant} className={className}>{status}</Badge>;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Issued Remarks History
          </h1>
          <p className="mt-1 text-muted-foreground">
            A log of all negative remarks that you have issued.
          </p>
        </div>
         <Button asChild>
            <Link href={`/u/portal/dashboard/oa?uid=${uid}`}>
                Issue New Remark
            </Link>
        </Button>
      </header>
        
      <Card>
        <CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative col-span-1 lg:col-span-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by title, faculty name, notes..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="appealed">Appealed</SelectItem>
                  </SelectContent>
                </Select>
                 <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by year..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? ( <> {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")} </> ) : ( format(dateRange.from, "LLL dd, y") )
                        ) : ( <span>Pick a date range</span> )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>

                <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by college..." /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Colleges</SelectItem>
                      {Object.keys(colleges).map(college => (<SelectItem key={college} value={college}>{college}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={!filteredDepartments || Object.keys(filteredDepartments).length === 0}>
                    <SelectTrigger><SelectValue placeholder="Filter by department..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {Object.entries(filteredDepartments).map(([group, courses]) => (
                            <SelectGroup key={group}>
                                <SelectLabel>{group}</SelectLabel>
                                {courses.map(course => (<SelectItem key={course} value={course}>{course}</SelectItem>))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRemarks ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">Loading remarks...</TableCell></TableRow>
                ) : remarks.length > 0 ? (
                  remarks.map((remark) => (
                  <TableRow key={remark._id}>
                    <TableCell>
                        <div className="font-medium text-foreground">{remark.facultySnapshot.name}</div>
                        <div className="text-sm text-muted-foreground">{remark.facultySnapshot.facultyID}</div>
                        <div className="text-xs text-muted-foreground">{remark.facultySnapshot.department}</div>
                    </TableCell>
                    <TableCell>{remark.title}</TableCell>
                    <TableCell>{getStatusBadge(remark.status)}</TableCell>
                    <TableCell>{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{remark.points}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog open={isDetailsOpen && selectedRemark?._id === remark._id} onOpenChange={(isOpen) => {
                            if (isOpen) {
                                setSelectedRemark(remark);
                                setIsDetailsOpen(true);
                            } else {
                                setIsDetailsOpen(false);
                                setSelectedRemark(null);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setSelectedRemark(remark);
                                    setIsDetailsOpen(true);
                                }}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                <DialogTitle>Remark Details</DialogTitle>
                                </DialogHeader>
                                {selectedRemark && (
                                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4 text-sm">
                                    <p><strong className="font-medium text-muted-foreground block">Faculty Name:</strong> {selectedRemark.facultySnapshot.name}</p>
                                    <p><strong className="font-medium text-muted-foreground block">Faculty ID:</strong> {selectedRemark.facultySnapshot.facultyID}</p>
                                    <p><strong className="font-medium text-muted-foreground block">Department:</strong> {selectedRemark.facultySnapshot.department}</p>
                                    <p><strong className="font-medium text-muted-foreground block">Remark Title:</strong> {selectedRemark.title}</p>
                                    <p><strong className="font-medium text-muted-foreground block">Points:</strong> <span className="font-bold text-destructive">{selectedRemark.points}</span></p>
                                    <p><strong className="font-medium text-muted-foreground block">Date Issued:</strong> {new Date(selectedRemark.createdAt).toLocaleString()}</p>
                                    <p><strong className="font-medium text-muted-foreground block">Notes / Rationale:</strong></p>
                                    <p className="pl-2 border-l-4 border-muted italic bg-muted/50 p-2 rounded-r-md">{selectedRemark.notes || 'N/A'}</p>
                                     <div>
                                        <strong className="font-medium text-muted-foreground block">Proof Document:</strong>
                                        {selectedRemark.proofUrl ? (
                                             <Button asChild variant="link" className="p-0 h-auto">
                                                <a href={getProofUrl(selectedRemark.proofUrl)} target="_blank" rel="noopener noreferrer">View Document</a>
                                            </Button>
                                        ) : "Not Provided"}
                                    </div>
                                    <p className="border-t pt-4 mt-4"><strong className="font-medium text-muted-foreground block">Remark ID:</strong> <span className="font-mono text-xs">{selectedRemark._id}</span></p>
                                </div>
                                )}
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will mark the remark as deleted. It can be recovered by an administrator, but will be hidden from most views.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(remark._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">No remarks found for the selected filters.</TableCell></TableRow>
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
  )
}
