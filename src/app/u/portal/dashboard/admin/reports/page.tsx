
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlert } from "@/context/alert-context"
import { colleges } from "@/lib/colleges"
import { 
  FileDown, 
  Share2, 
  Search, 
  Filter, 
  LayoutDashboard, 
  Building2, 
  User, 
  Loader2,
  PieChart as PieChartIcon,
  TrendingUp,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in';

type Faculty = {
  _id: string;
  name: string;
  department: string;
  facultyID: string;
}

type ReportSummary = {
  totalPoints: number;
  count: number;
  avgPoints: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; points: number }[];
}

type ReportData = {
  success: boolean;
  count: number;
  summary?: ReportSummary;
  data: any[];
};

export default function DynamicReportsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  
  // Filter States
  const [level, setLevel] = useState<"college" | "department" | "faculty">("college");
  const [levelId, setLevelId] = useState("");
  const [academicYear, setAcademicYear] = useState("all");
  const [creditType, setCreditType] = useState<"all" | "positive" | "negative">("all");
  const [status, setStatus] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State for Table Preview
  const [previewPage, setPreviewPage] = useState(1);
  const previewLimit = 15;

  // Search/Autocomplete States
  const [facultyQuery, setFacultyQuery] = useState("");
  const [facultyResults, setFacultyList] = useState<Faculty[]>([]);
  const [showFacultySuggestions, setShowFacultySuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Data State
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  // Handle Faculty Search
  useEffect(() => {
    if (level !== 'faculty' || facultyQuery.length < 2) {
        setFacultyList([]);
        return;
    }
    const timer = setTimeout(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/users?search=${encodeURIComponent(facultyQuery)}&limit=5`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setFacultyList(data.items);
        } catch (e) {
            console.error("Faculty fetch failed", e);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [facultyQuery, level, token]);

  const fetchReportPreview = useCallback(async () => {
    if (!token) return;
    if ((level === 'department' || level === 'faculty') && !levelId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      level,
      ...(levelId && { id: levelId }),
      ...(academicYear !== 'all' && { academicYear }),
      ...(creditType !== 'all' && { type: creditType }),
      ...(status !== 'all' && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setReportData(data);
        setPreviewPage(1); // Reset pagination on new fetch
      } else {
        throw new Error(data.message || "Failed to fetch report preview");
      }
    } catch (error: any) {
      showAlert("Report Error", error.message);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [level, levelId, academicYear, creditType, status, startDate, endDate, token, showAlert]);

  useEffect(() => {
    const timer = setTimeout(fetchReportPreview, 500);
    return () => clearTimeout(timer);
  }, [fetchReportPreview]);

  // Derived Statistics (Summary)
  const computedSummary = useMemo((): ReportSummary | null => {
    if (!reportData || !reportData.data || !Array.isArray(reportData.data)) return null;
    
    // If server already provided summary, use it
    if (reportData.summary) return reportData.summary;

    const data = reportData.data;
    const stats: ReportSummary = {
        totalPoints: 0,
        count: data.length,
        avgPoints: 0,
        byStatus: [],
        byType: [
            { type: 'positive', points: 0 },
            { type: 'negative', points: 0 }
        ]
    };

    const statusCounts: Record<string, number> = {};

    data.forEach(item => {
        const pts = Number(item.points) || 0;
        stats.totalPoints += pts;
        
        // Group by status
        const s = item.status || 'unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;

        // Group by type
        const t = item.type === 'positive' ? 'positive' : 'negative';
        const typeObj = stats.byType.find(obj => obj.type === t);
        if (typeObj) typeObj.points += pts;
    });

    stats.avgPoints = stats.count > 0 ? stats.totalPoints / stats.count : 0;
    stats.byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    return stats;
  }, [reportData]);

  const handleDownload = (format: 'pdf' | 'excel') => {
    const params = new URLSearchParams({
      level,
      ...(levelId && { id: levelId }),
      ...(academicYear !== 'all' && { academicYear }),
      ...(creditType !== 'all' && { type: creditType }),
      ...(status !== 'all' && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      format
    });
    window.open(`${API_BASE_URL}/api/v1/reports/download?${params.toString()}&token=${token}`, '_blank');
    toast({ title: "Download Started", description: `Your ${format.toUpperCase()} report is being generated.` });
  };

  const generateShareLink = async () => {
    setIsSharing(true);
    const params = new URLSearchParams({
      level,
      ...(levelId && { id: levelId }),
      ...(academicYear !== 'all' && { academicYear }),
      ...(creditType !== 'all' && { type: creditType }),
      ...(status !== 'all' && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      format: 'pdf',
      share: 'true'
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/download?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.shareLink) {
        await navigator.clipboard.writeText(data.shareLink);
        toast({ title: "Link Copied!", description: "Shareable report link copied to clipboard." });
      } else {
        throw new Error("Could not generate link");
      }
    } catch (e: any) {
      showAlert("Share Failed", e.message);
    } finally {
      setIsSharing(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
        case 'approved': return '#10b981';
        case 'pending': return '#f59e0b';
        case 'rejected': return '#ef4444';
        case 'appealed': return '#3b82f6';
        default: return '#6b7280';
    }
  };

  const renderPreview = () => {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-80 w-full" />
            </div>
        );
    }

    if (!reportData || !computedSummary) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                    <History className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No data available</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    Try adjusting your filters or selecting a different reporting level.
                </p>
            </div>
        );
    }

    const { data } = reportData;
    const totalRecords = data?.length || 0;
    const totalPages = Math.ceil(totalRecords / previewLimit);
    const paginatedData = (data || []).slice(
        (previewPage - 1) * previewLimit,
        previewPage * previewLimit
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase text-primary">Total Points</CardDescription>
                        <CardTitle className="text-2xl">{computedSummary.totalPoints ?? 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase">Total Activities</CardDescription>
                        <CardTitle className="text-2xl">{computedSummary.count ?? 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase">Avg per Activity</CardDescription>
                        <CardTitle className="text-2xl">{(computedSummary.avgPoints ?? 0).toFixed(1)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-primary" />
                            Distribution by Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={computedSummary.byStatus || []}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {(computedSummary.byStatus || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Points by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={computedSummary.byType || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                                    {(computedSummary.byType || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.type === 'positive' ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Data Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base">Data Preview</CardTitle>
                        <CardDescription>Displaying {totalRecords} records found.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8" 
                            disabled={previewPage === 1}
                            onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-medium px-2">Page {previewPage} of {totalPages || 1}</span>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8" 
                            disabled={previewPage >= totalPages}
                            onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="text-left">
                                    <th className="p-3 font-medium text-muted-foreground">Date</th>
                                    <th className="p-3 font-medium text-muted-foreground">Faculty</th>
                                    <th className="p-3 font-medium text-muted-foreground">Activity</th>
                                    <th className="p-3 font-medium text-muted-foreground">Type</th>
                                    <th className="p-3 font-medium text-muted-foreground">Status</th>
                                    <th className="p-3 font-medium text-muted-foreground text-right">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {paginatedData.map((row, i) => (
                                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-3 whitespace-nowrap text-muted-foreground tabular-nums">
                                            {row.createdAt ? format(parseISO(row.createdAt), 'dd MMM yyyy') : 'N/A'}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium text-foreground">
                                                {row.facultySnapshot?.name || 'Unknown'}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-mono">
                                                {row.facultySnapshot?.facultyID || row.faculty || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <p className="max-w-[200px] truncate" title={row.title}>
                                                {row.title}
                                            </p>
                                        </td>
                                        <td className="p-3">
                                            <Badge variant="outline" className={row.type === 'positive' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}>
                                                {row.type}
                                            </Badge>
                                        </td>
                                        <td className="p-3 capitalize">
                                            <div className="flex items-center gap-1.5">
                                                <div 
                                                    className="h-1.5 w-1.5 rounded-full" 
                                                    style={{backgroundColor: getStatusColor(row.status)}}
                                                />
                                                {row.status}
                                            </div>
                                        </td>
                                        <td className={`p-3 text-right font-bold tabular-nums ${row.type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                                            {row.type === 'positive' ? `+${row.points}` : row.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="py-3 border-t bg-muted/10">
                    <p className="text-[10px] text-muted-foreground text-center w-full">
                        Showing {(previewPage-1)*previewLimit + 1} to {Math.min(previewPage*previewLimit, totalRecords)} of {totalRecords} records.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground mt-1">Generate, analyze and export institution-wide performance data.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={generateShareLink} disabled={!reportData || isSharing}>
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                Share
            </Button>
            <Select onValueChange={(v) => handleDownload(v as any)}>
                <SelectTrigger className="w-[140px] bg-primary text-primary-foreground border-none">
                    <FileDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pdf">Portable PDF</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6">
          <Card className="shadow-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Report Config
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Level</label>
                    <Select value={level} onValueChange={(v: any) => { setLevel(v); setLevelId(""); setFacultyQuery(""); }}>
                        <SelectTrigger className="bg-muted/30">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="college"><LayoutDashboard className="h-4 w-4 mr-2 inline" /> College Wide</SelectItem>
                            <SelectItem value="department"><Building2 className="h-4 w-4 mr-2 inline" /> Department</SelectItem>
                            <SelectItem value="faculty"><User className="h-4 w-4 mr-2 inline" /> Faculty</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {level === 'department' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Department</label>
                        <Select value={levelId} onValueChange={setLevelId}>
                            <SelectTrigger className="bg-muted/30">
                                <SelectValue placeholder="Pick a dept..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {Object.entries(colleges).map(([collegeName, departments]) => (
                                    <SelectGroup key={collegeName}>
                                        <SelectLabel className="text-primary font-bold">{collegeName}</SelectLabel>
                                        {Object.entries(departments).map(([group, courses]) => (
                                            <SelectGroup key={group}>
                                                {courses.map(course => (
                                                    <SelectItem key={course} value={course}>{course}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {level === 'faculty' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 relative" ref={suggestionRef}>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Find Faculty</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Name or ID..." 
                                className="pl-9 bg-muted/30" 
                                value={facultyQuery}
                                onChange={(e) => { setFacultyQuery(e.target.value); setShowFacultySuggestions(true); }}
                                onFocus={() => setShowFacultySuggestions(true)}
                            />
                        </div>
                        {showFacultySuggestions && facultyResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg overflow-hidden">
                                {facultyResults.map(f => (
                                    <button
                                        key={f._id}
                                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-0"
                                        onClick={() => {
                                            setLevelId(f._id);
                                            setFacultyQuery(f.name);
                                            setShowFacultySuggestions(false);
                                        }}
                                    >
                                        <p className="text-sm font-semibold">{f.name}</p>
                                        <p className="text-xs text-muted-foreground">{f.facultyID} &middot; {f.department}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <Separator />

                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Academic Year</label>
                    <Select value={academicYear} onValueChange={setAcademicYear}>
                        <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            <SelectItem value="2025-26">2025-26</SelectItem>
                            <SelectItem value="2024-25">2024-25</SelectItem>
                            <SelectItem value="2023-24">2023-24</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                        <Select value={creditType} onValueChange={(v: any) => setCreditType(v)}>
                            <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                            <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="appealed">Appealed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Range</label>
                    <div className="grid grid-cols-1 gap-2">
                        <Input type="date" className="bg-muted/30 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <Input type="date" className="bg-muted/30 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <p className="text-[10px] text-muted-foreground text-center w-full italic">
                    Preview updates automatically as you change filters.
                </p>
            </CardFooter>
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3">
            {renderPreview()}
        </main>
      </div>
    </div>
  )
}
