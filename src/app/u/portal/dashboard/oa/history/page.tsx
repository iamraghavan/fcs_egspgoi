
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
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Eye } from "lucide-react";
import { useAlert } from "@/context/alert-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";


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
    title: string;
    type: 'negative';
    updatedAt: string;
    creditTitle?: string;
};

export default function IssuedHistoryPage() {
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();

  // Data for table and filters
  const [remarks, setRemarks] = useState<IssuedRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
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
  }, [page, adminToken, searchTerm]);
  
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);
  
  const getProofUrl = (url: string) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
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
            <div className="relative lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by title, faculty name, notes..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Remark Title</TableHead>
                  <TableHead>Date</TableHead>
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
                    <TableCell>
                        <div className="font-medium text-foreground">{remark.facultySnapshot.name}</div>
                        <div className="text-sm text-muted-foreground">{remark.facultySnapshot.facultyID}</div>
                        <div className="text-xs text-muted-foreground">{remark.facultySnapshot.department}</div>
                    </TableCell>
                    <TableCell>{remark.title}</TableCell>
                    <TableCell>{new Date(remark.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{remark.points}</TableCell>
                    <TableCell className="text-center">
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
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No remarks found for the selected filters.</TableCell></TableRow>
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
