"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Download, Calendar as CalendarIcon, ShieldOff, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

type Enquiry = {
    name: string;
    phone: string;
    email?: string;
    college: string;
    course: string;
    address: string;
    enquiryDate: string;
};

const SECRET_TOKEN = process.env.NEXT_PUBLIC_DATA_ACCESS_TOKEN || '3a9e7b1f-8c6d-4a5b-9f1c-2d0b8e6a5c4d';

function DataViewer() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        if (!token) {
            setError("Access token is required.");
            setLoading(false);
            return;
        }

        if (token !== SECRET_TOKEN) {
            setError("Invalid access token. Unauthorized.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admissions-data?token=${token}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Failed to fetch data. Status: ${res.status}`);
                }
                const data: Enquiry[] = await res.json();
                setEnquiries(data.sort((a, b) => new Date(b.enquiryDate).getTime() - new Date(a.enquiryDate).getTime()));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [token]);

    const filteredEnquiries = useMemo(() => {
        return enquiries.filter(enquiry => {
            const lowercasedTerm = searchTerm.toLowerCase();
            const matchesSearch = (
                enquiry.name.toLowerCase().includes(lowercasedTerm) ||
                enquiry.phone.toLowerCase().includes(lowercasedTerm) ||
                (enquiry.email && enquiry.email.toLowerCase().includes(lowercasedTerm)) ||
                enquiry.address.toLowerCase().includes(lowercasedTerm)
            );

            const enquiryDate = parseISO(enquiry.enquiryDate);
            const matchesDate = (
                !dateRange ||
                (!dateRange.from && !dateRange.to) ||
                (dateRange.from && !dateRange.to && enquiryDate >= dateRange.from) ||
                (!dateRange.from && dateRange.to && enquiryDate <= dateRange.to) ||
                (dateRange.from && dateRange.to && enquiryDate >= dateRange.from && enquiryDate <= dateRange.to)
            );

            return matchesSearch && matchesDate;
        });
    }, [enquiries, searchTerm, dateRange]);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredEnquiries);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
        XLSX.writeFile(workbook, "AdmissionEnquiries.xlsx");
    };
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <ShieldOff className="mx-auto h-16 w-16 text-destructive mb-4" />
                        <CardTitle className="text-2xl">Access Denied</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle>Admission Enquiries</CardTitle>
                            <CardDescription>
                                A total of {filteredEnquiries.length} {filteredEnquiries.length === 1 ? 'enquiry' : 'enquiries'} found.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch gap-2 w-full md:w-auto">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, phone, email..."
                                    className="pl-10 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                             <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className="w-full md:w-[240px] justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                      dateRange.to ? (
                                        <>
                                          {format(dateRange.from, "LLL dd, y")} -{" "}
                                          {format(dateRange.to, "LLL dd, y")}
                                        </>
                                      ) : (
                                        format(dateRange.from, "LLL dd, y")
                                      )
                                    ) : (
                                      <span>Pick a date range</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                  />
                                </PopoverContent>
                              </Popover>
                            <Button onClick={handleExport} disabled={filteredEnquiries.length === 0}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Course</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>Loading enquiries...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEnquiries.length > 0 ? (
                                    filteredEnquiries.map((enquiry, index) => (
                                        <TableRow key={`${enquiry.phone}-${index}`}>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(parseISO(enquiry.enquiryDate), "PPp")}
                                            </TableCell>
                                            <TableCell className="font-medium">{enquiry.name}</TableCell>
                                            <TableCell>{enquiry.phone}</TableCell>
                                            <TableCell className="text-muted-foreground">{enquiry.email || 'N/A'}</TableCell>
                                            <TableCell className="text-muted-foreground">{enquiry.address}</TableCell>
                                            <TableCell>{enquiry.course}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No enquiries found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DataViewerPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <DataViewer />
        </Suspense>
    );
}