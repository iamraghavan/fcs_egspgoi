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
  X,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

const API_BASE_URL = 'https://faculty-credit-system.vercel.app';

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

type RankingItem = {
  name: string;
  facultyID: string;
  department: string;
  positive: number;
  negative: number;
  total: number;
  count: number;
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
  
  // V2 View States
  const [view, setView] = useState<"transactions" | "ranking">("transactions");
  const [sortBy, setSortBy] = useState<"total" | "positive" | "negative" | "count">("total");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

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
  const [allUsers, setAllUsers] = useState<Faculty[]>([]);
  const [showFacultySuggestions, setShowFacultySuggestions] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Data State
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  // Fetch all users for autocomplete once
  useEffect(() => {
    const fetchAllUsers = async () => {
        if (!token) return;
        setIsUsersLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/users?limit=1000&sort=name`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAllUsers(data.items || []);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setIsUsersLoading(false);
        }
    };
    fetchAllUsers();
  }, [token]);

  // Local filtering for suggestions with safety checks
  const filteredFacultySuggestions = useMemo(() => {
    if (!facultyQuery || facultyQuery.length < 2) return [];
    const term = facultyQuery.toLowerCase();
    return allUsers.filter(f => 
        (f.name?.toLowerCase() || '').includes(term) || 
        (f.facultyID?.toLowerCase() || '').includes(term) ||
        (f.department?.toLowerCase() || '').includes(term)
    ).slice(0, 8);
  }, [allUsers, facultyQuery]);

  const fetchReportPreview = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    const params = new URLSearchParams({
      view,
      level,
      ...(view === 'ranking' && { sortBy, order }),
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
        setPreviewPage(1);
      } else {
        if (response.status === 404) {
            setReportData({ success: true, count: 0, data: [] });
        } else {
            throw new Error(data.message || "Failed to fetch report preview");
        }
      }
    } catch (error: any) {
      showAlert("Report Error", error.message);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [view, sortBy, order, level, levelId, academicYear, creditType, status, startDate, endDate, token, showAlert]);

  useEffect(() => {
    const timer = setTimeout(fetchReportPreview, 500);
    return () => clearTimeout(timer);
  }, [fetchReportPreview]);

  // Derived Statistics (Summary) - Only for Transaction view
  const computedSummary = useMemo((): ReportSummary | null => {
    if (view !== 'transactions' || !reportData || !reportData.data || !Array.isArray(reportData.data)) return null;
    
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
        
        const s = item.status || 'unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;

        const t = item.type === 'positive' ? 'positive' : 'negative';
        const typeObj = stats.byType.find(obj => obj.type === t);
        if (typeObj) typeObj.points += Math.abs(pts);
    });

    stats.avgPoints = stats.count > 0 ? stats.totalPoints / stats.count : 0;
    stats.byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    return stats;
  }, [reportData, view]);

  const handleDownload = (format: 'pdf' | 'excel' | 'html') => {
    const params = new URLSearchParams({
      view,
      level,
      ...(view === 'ranking' && { sortBy, order }),
      ...(levelId && { id: levelId }),
      ...(academicYear !== 'all' && { academicYear }),
      ...(creditType !== 'all' && { type: creditType }),
      ...(status !== 'all' && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      format
    });
    window.open(`${API_BASE_URL}/api/v1/reports/download?${params.toString()}&token=${token}`, '_blank');
    toast({ title: "Report Generation", description: `Your ${format.toUpperCase()} report is being prepared.` });
  };

  const generateShareLink = async () => {
    setIsSharing(true);
    const params = new URLSearchParams({
      view,
      level,
      ...(view === 'ranking' && { sortBy, order }),
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

  const renderRankingView = () => {
    if (!reportData || !Array.isArray(reportData.data)) return null;
    
    const data: RankingItem[] = reportData.data;
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / previewLimit);
    const paginatedData = data.slice(
        (previewPage - 1) * previewLimit,
        previewPage * previewLimit
    );

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-none border-cds-ui-03">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-cds-ui-01/30">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Faculty Rankings
                    </CardTitle>
                    <CardDescription className="text-xs">Aggregated credit summary per faculty associate.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={previewPage === 1} onClick={() => setPreviewPage(p => Math.max(1, p - 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2">Page {previewPage} of {totalPages || 1}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={previewPage >= totalPages} onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-cds-ui-01 border-b">
                            <tr className="text-left">
                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Faculty Associate</th>
                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Department</th>
                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05 text-right">Positive (+)</th>
                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05 text-right">Negative (-)</th>
                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05 text-right">Net Total</th>
                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05 text-center">Activities</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cds-ui-03">
                            {paginatedData.map((row, i) => (
                                <tr key={i} className="hover:bg-cds-ui-01/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-cds-text-01">{row.name}</div>
                                        <div className="text-[10px] text-cds-text-05 font-mono uppercase tracking-widest">{row.facultyID}</div>
                                    </td>
                                    <td className="p-4 text-[13px] text-cds-text-02">{row.department}</td>
                                    <td className="p-4 text-right font-bold text-green-600 tabular-nums">+{row.positive}</td>
                                    <td className="p-4 text-right font-bold text-red-600 tabular-nums">-{Math.abs(row.negative)}</td>
                                    <td className="p-4 text-right">
                                        <Badge className={cn(
                                            "rounded-none font-bold tabular-nums",
                                            row.total >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        )}>
                                            {row.total}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-center tabular-nums text-cds-text-05">{row.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter className="py-3 bg-cds-ui-01/30 border-t">
                <p className="text-[10px] text-cds-text-05 font-bold uppercase tracking-widest text-center w-full">
                    Displaying {totalRecords} faculty records identified.
                </p>
            </CardFooter>
        </Card>
    );
  };

  const renderTransactionsView = () => {
    if (!reportData || !computedSummary) return null;
    
    const { data } = reportData;
    const totalRecords = data?.length || 0;
    const totalPages = Math.ceil(totalRecords / previewLimit);
    const paginatedData = (data || []).slice(
        (previewPage - 1) * previewLimit,
        previewPage * previewLimit
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/10 rounded-none shadow-none">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Total Institution Points</CardDescription>
                        <CardTitle className="text-2xl font-bold tabular-nums">{computedSummary?.totalPoints || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="rounded-none shadow-none border-cds-ui-03">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Recorded Activities</CardDescription>
                        <CardTitle className="text-2xl font-bold tabular-nums">{computedSummary?.count || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="rounded-none shadow-none border-cds-ui-03">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Avg Credit Velocity</CardDescription>
                        <CardTitle className="text-2xl font-bold tabular-nums">{(computedSummary?.avgPoints || 0).toFixed(1)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-none shadow-none border-cds-ui-03">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-primary" />
                            Credit State Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={computedSummary?.byStatus || []}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    stroke="none"
                                >
                                    {(computedSummary?.byStatus || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--cds-ui-05)', border: 'none', color: '#fff', borderRadius: '0' }} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-none shadow-none border-cds-ui-03">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Performance Impact by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={computedSummary?.byType || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cds-ui-03)" />
                                <XAxis dataKey="type" stroke="var(--cds-text-05)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.toUpperCase()} />
                                <YAxis stroke="var(--cds-text-05)" fontSize={10} tickLine={false} axisLine={false}/>
                                <Tooltip cursor={{fill: 'var(--cds-ui-01)'}} />
                                <Bar dataKey="points" radius={0}>
                                    {(computedSummary?.byType || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.type === 'positive' ? 'var(--cds-support-02)' : 'var(--cds-support-01)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-none shadow-none border-cds-ui-03">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-cds-ui-01/30">
                    <div>
                        <CardTitle className="text-base">Transactional Audit Preview</CardTitle>
                        <CardDescription className="text-xs">Individual credit transaction history.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={previewPage === 1} onClick={() => setPreviewPage(p => Math.max(1, p - 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2">Page {previewPage} of {totalPages || 1}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={previewPage >= totalPages} onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-cds-ui-01 border-b">
                                <tr className="text-left">
                                    <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Date</th>
                                    <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Faculty Associate</th>
                                    <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Institutional Activity</th>
                                    <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Type</th>
                                    <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05">Status</th>
                                    <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-cds-text-05 text-right">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cds-ui-03">
                                {paginatedData.map((row, i) => (
                                    <tr key={i} className="hover:bg-cds-ui-01/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-cds-text-02 tabular-nums">
                                            {row.createdAt ? format(parseISO(row.createdAt), 'dd MMM yyyy') : 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-cds-text-01">{row.facultySnapshot?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-cds-text-05 font-mono uppercase tracking-widest">{row.facultySnapshot?.facultyID || row.faculty || 'N/A'}</div>
                                        </td>
                                        <td className="p-4">
                                            <p className="max-w-[250px] truncate text-[13px] font-medium" title={row.title}>{row.title}</p>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={cn(
                                                "rounded-none text-[10px] uppercase font-bold tracking-wider",
                                                row.type === 'positive' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'
                                            )}>
                                                {row.type}
                                            </Badge>
                                        </td>
                                        <td className="p-4 capitalize">
                                            <div className="flex items-center gap-2 text-[13px]">
                                                <div className="h-2 w-2 rounded-full" style={{backgroundColor: getStatusColor(row.status)}} />
                                                {row.status}
                                            </div>
                                        </td>
                                        <td className={cn(
                                            "p-4 text-right font-bold tabular-nums",
                                            row.type === 'positive' ? 'text-green-600' : 'text-red-600'
                                        )}>
                                            {row.type === 'positive' ? `+${row.points}` : row.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="py-3 border-t bg-cds-ui-01/30">
                    <p className="text-[10px] text-cds-text-05 font-bold uppercase tracking-widest text-center w-full">
                        Showing {(previewPage-1)*previewLimit + 1} to {Math.min(previewPage*previewLimit, totalRecords)} of {totalRecords} records.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
  };

  const renderPreview = () => {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full rounded-none" />
                    <Skeleton className="h-24 w-full rounded-none" />
                    <Skeleton className="h-24 w-full rounded-none" />
                </div>
                <Skeleton className="h-80 w-full rounded-none" />
            </div>
        );
    }

    if (!reportData || !reportData.data || (Array.isArray(reportData.data) && reportData.data.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-cds-ui-03 bg-cds-ui-01/20">
                <div className="p-4 bg-background border rounded-full shadow-sm mb-4">
                    <History className="h-10 w-10 text-cds-text-05" />
                </div>
                <h3 className="text-lg font-bold">No data matches your criteria</h3>
                <p className="text-sm text-cds-text-05 max-w-xs mx-auto mt-1">
                    Try adjusting your filters, selecting a different academic year, or changing the report level.
                </p>
            </div>
        );
    }

    return view === 'ranking' ? renderRankingView() : renderTransactionsView();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowFacultySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-sidebar-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-cds-text-01">Institutional Insights</h1>
          <p className="text-sm text-cds-text-05 mt-1">High-fidelity reporting and performance auditing.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-none font-semibold h-10 px-6" onClick={generateShareLink} disabled={!reportData || isSharing}>
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                Share Report
            </Button>
            <Select onValueChange={(v) => handleDownload(v as any)}>
                <SelectTrigger className="w-[160px] bg-primary text-primary-foreground border-none rounded-none h-10 font-bold uppercase tracking-wider text-[11px]">
                    <FileDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Export Data" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                    <SelectItem value="pdf">Portable PDF</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="html">Interactive Web</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <Card className="shadow-none rounded-none border-cds-ui-03">
            <CardHeader className="pb-4 bg-cds-ui-01/50 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Report Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Report Perspective</label>
                    <Select value={view} onValueChange={(v: any) => { setView(v); setPreviewPage(1); }}>
                        <SelectTrigger className="bg-cds-ui-01 border-none rounded-none focus:ring-1 focus:ring-primary h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="transactions"><History className="h-4 w-4 mr-2 inline" /> Transactions</SelectItem>
                            <SelectItem value="ranking"><Trophy className="h-4 w-4 mr-2 inline" /> Rankings</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {view === 'ranking' && (
                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Rank By</label>
                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="bg-cds-ui-01 border-none rounded-none h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="total">Net Credit Balance</SelectItem>
                                    <SelectItem value="positive">Total Positive (+)</SelectItem>
                                    <SelectItem value="negative">Total Deductions (-)</SelectItem>
                                    <SelectItem value="count">Activity Volume</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Sort Order</label>
                            <Select value={order} onValueChange={(v: any) => setOrder(v)}>
                                <SelectTrigger className="bg-cds-ui-01 border-none rounded-none h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="desc"><ArrowDown className="h-3 w-3 mr-2 inline" /> Highest First</SelectItem>
                                    <SelectItem value="asc"><ArrowUp className="h-3 w-3 mr-2 inline" /> Lowest First</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <Separator className="bg-cds-ui-03" />

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Auditing Level</label>
                    <Select value={level} onValueChange={(v: any) => { setLevel(v); setLevelId(""); setFacultyQuery(""); }}>
                        <SelectTrigger className="bg-cds-ui-01 border-none rounded-none focus:ring-1 focus:ring-primary h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="college"><LayoutDashboard className="h-4 w-4 mr-2 inline" /> Institution Wide</SelectItem>
                            <SelectItem value="department"><Building2 className="h-4 w-4 mr-2 inline" /> Department Unit</SelectItem>
                            <SelectItem value="faculty"><User className="h-4 w-4 mr-2 inline" /> Faculty Member</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {level === 'department' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Select Unit</label>
                        <Select value={levelId} onValueChange={setLevelId}>
                            <SelectTrigger className="bg-cds-ui-01 border-none rounded-none h-11">
                                <SelectValue placeholder="Pick a dept..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80 rounded-none">
                                {Object.entries(colleges).map(([collegeName, departments]) => (
                                    <SelectGroup key={collegeName}>
                                        <SelectLabel className="text-primary font-bold bg-muted/50 p-2">{collegeName}</SelectLabel>
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
                        <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Locate Member</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cds-text-05" />
                            <Input 
                                placeholder="Faculty name or ID..." 
                                className="pl-9 bg-cds-ui-01 border-none rounded-none h-11" 
                                value={facultyQuery}
                                onChange={(e) => { setFacultyQuery(e.target.value); setShowFacultySuggestions(true); }}
                                onFocus={() => setShowFacultySuggestions(true)}
                            />
                            {facultyQuery && (
                                <button 
                                    onClick={() => { setFacultyQuery(""); setLevelId(""); }}
                                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-cds-ui-03 rounded-full"
                                >
                                    <X className="h-3 w-3 text-cds-text-05" />
                                </button>
                            )}
                            {isUsersLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-cds-text-05" />
                                </div>
                            )}
                        </div>
                        {showFacultySuggestions && facultyQuery.length >= 2 && (
                            <div className="absolute z-[200] w-full mt-1 bg-background border border-cds-ui-03 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {filteredFacultySuggestions.length > 0 ? (
                                    filteredFacultySuggestions.map(f => (
                                        <button
                                            key={f._id}
                                            type="button"
                                            className="w-full text-left p-3 hover:bg-cds-ui-01 transition-colors border-b last:border-0"
                                            onClick={() => {
                                                setLevelId(f._id);
                                                setFacultyQuery(f.name);
                                                setShowFacultySuggestions(false);
                                            }}
                                        >
                                            <p className="text-sm font-bold text-cds-text-01">{f.name}</p>
                                            <p className="text-[10px] text-cds-text-05 font-mono uppercase tracking-widest">{f.facultyID} &middot; {f.department}</p>
                                        </button>
                                    ))
                                ) : !isUsersLoading ? (
                                    <div className="p-4 text-center text-xs text-cds-text-05 italic">
                                        No matches for "{facultyQuery}"
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}

                <Separator className="bg-cds-ui-03" />

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Academic Year</label>
                    <Select value={academicYear} onValueChange={setAcademicYear}>
                        <SelectTrigger className="bg-cds-ui-01 border-none rounded-none h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="all">All Academic Cycles</SelectItem>
                            <SelectItem value="2025-26">AY 2025-26</SelectItem>
                            <SelectItem value="2024-25">AY 2024-25</SelectItem>
                            <SelectItem value="2023-24">AY 2023-24</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {view === 'transactions' && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Type</label>
                            <Select value={creditType} onValueChange={(v: any) => setCreditType(v)}>
                                <SelectTrigger className="bg-cds-ui-01 border-none rounded-none h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Status</label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger className="bg-cds-ui-01 border-none rounded-none h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="appealed">Appealed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cds-text-05 uppercase tracking-widest">Activity Range</label>
                    <div className="grid grid-cols-1 gap-2">
                        <Input type="date" className="bg-cds-ui-01 border-none rounded-none text-xs h-10" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <Input type="date" className="bg-cds-ui-01 border-none rounded-none text-xs h-10" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0 pb-6">
                <p className="text-[10px] text-cds-text-05 text-center w-full italic">
                    Real-time aggregation: preview reflects live state.
                </p>
            </CardFooter>
          </Card>
        </aside>

        <main className="lg:col-span-3">
            {renderPreview()}
        </main>
      </div>
    </div>
  )
}
