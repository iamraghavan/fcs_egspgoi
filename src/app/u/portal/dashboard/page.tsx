"use client";

import { API_V1 } from '@/lib/api-url';
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, Legend, CartesianGrid, Bar, BarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, Activity, Award, AlertCircle, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";

const API_BASE_URL = API_V1;

function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

type CreditActivity = {
  _id: string;
  title: string;
  points: number;
  status: 'approved' | 'pending' | 'rejected' | 'appealed' | 'deleted';
  createdAt: string;
  academicYear: string;
  type: 'positive' | 'negative';
  appeal?: { status: 'pending' | 'accepted' | 'rejected'; }
};

type UserProfileStats = {
    currentCredit: number;
    totalPositiveCredit: number;
    totalNegativeCredit: number;
    stats: {
        totalCreditsCount: number;
        totalPositiveCount: number;
        totalNegativeCount: number;
        currentYearStats: {
            academicYear: string;
            positivePoints: number;
            negativePoints: number;
            netForYear: number;
        } | null;
        series: { period: string; positivePoints: number; negativePoints: number; net: number; }[];
    };
};

export default function FacultyDashboard() {
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const yearStart = Number(currentAcademicYear().slice(0, 4));
  const yearOptions = Array.from({ length: 5 }, (_, index) => {
    const start = yearStart - index;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<CreditActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async (forceRecalc = false) => {
    const token = localStorage.getItem("token");
    const uid = searchParams.get('uid');
    if (!token || !uid) return;

    if (forceRecalc) setIsSyncing(true);
    else setLoading(true);

    try {
      const summaryParams = new URLSearchParams({ academicYear });
      if (forceRecalc) summaryParams.set('recalc', 'true');
      const headers = { Authorization: `Bearer ${token}` };
      const [response, activityResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/credits/${encodeURIComponent(uid)}/credits?${summaryParams}`, { headers }),
        fetch(`${API_BASE_URL}/credits/credits/faculty/${encodeURIComponent(uid)}?limit=8`, { headers }),
      ]);
      
      if ([response.status, activityResponse.status].some(status => status === 401 || status === 403)) {
        localStorage.clear();
        router.replace('/u/portal/auth?faculty_login&reason=session_expired');
        return;
      }

      if (!response.ok || !activityResponse.ok) {
        throw new Error('System synchronization error.');
      }

      const [resData, activityData] = await Promise.all([response.json(), activityResponse.json()]);
      if (!resData.success || !resData.data?.stats || !activityData.success) {
        throw new Error(resData.message || activityData.message || 'Unable to load credit totals.');
      }
      setStats(resData.data);
      setRecentActivities(activityData.items || []);
      if (forceRecalc) toast({ title: "Credits Synced", description: "Balance updated successfully." });
    } catch (e: any) {
      showAlert("Sync Error", e.message || "Failed to connect to the performance engine.");
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [searchParams, academicYear, showAlert, toast, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = (stats?.stats?.series || []).map(s => ({
      name: format(parseISO(s.period + '-01'), 'MMM'),
      net: s.net,
      pos: s.positivePoints,
      neg: Math.abs(s.negativePoints),
  }));

  if (loading) return (
    <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-64 rounded-none bg-cds-ui-01" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-none bg-cds-ui-01" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-none bg-cds-ui-01" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-cds-text-01">Performance Overview</h1>
            <p className="text-sm text-cds-text-05">Institutional metrics for Academic Year {academicYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-none h-10 px-4 cursor-pointer" disabled={isSyncing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "Syncing..." : "Sync Credits"}</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-none border-cds-ui-03">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-bold">Institutional Sync Required?</AlertDialogTitle>
                <AlertDialogDescription>This action will recalculate your entire credit balance based on the official transaction log. Continue?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="rounded-none bg-primary text-primary-foreground"
                  onClick={() => fetchData(true)}
                >
                  Confirm Sync
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-full sm:w-[180px] bg-cds-ui-01 border-none rounded-none shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {yearOptions.map(year => <SelectItem key={year} value={year}>AY {year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest opacity-80">Net Credit Balance</CardTitle>
            <Star className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.currentCredit ?? 0).toLocaleString()}</div>
            <p className="text-[10px] mt-1 opacity-70 italic">Overall institutional standing</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card border-none bg-cds-ui-01">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Net for Year</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.stats?.currentYearStats?.netForYear ?? 0).toLocaleString()}</div>
            <p className="text-[10px] mt-1 text-cds-text-05 italic">Current performance cycle</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card border-l-4 border-l-cds-support-02 border-y-0 border-r-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-green-600">Overall Positive</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{(stats?.totalPositiveCredit ?? 0).toLocaleString()}</div>
            <p className="text-[10px] mt-1 text-cds-text-05 italic">{academicYear}: +{(stats?.stats?.currentYearStats?.positivePoints ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card border-l-4 border-l-cds-support-01 border-y-0 border-r-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-red-600">Overall Negative</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">-{(stats?.totalNegativeCredit ?? 0).toLocaleString()}</div>
            <p className="text-[10px] mt-1 text-cds-text-05 italic">{academicYear}: -{(stats?.stats?.currentYearStats?.negativePoints ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card p-4">
            <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Growth Trend
                </CardTitle>
            </CardHeader>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--cds-interactive-01)" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="var(--cds-interactive-01)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sidebar-border)" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '0', border: 'none', backgroundColor: 'var(--cds-ui-05)', color: '#fff' }} />
                        <Area type="monotone" dataKey="net" stroke="var(--cds-interactive-01)" fillOpacity={1} fill="url(#colorNet)" strokeWidth={2} name="Net Credits" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
        <Card className="dashboard-card p-4">
            <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Impact Analysis
                </CardTitle>
            </CardHeader>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sidebar-border)" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '0', border: 'none', backgroundColor: 'var(--cds-ui-05)', color: '#fff' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                        <Bar dataKey="pos" fill="var(--cds-support-02)" radius={0} name="Positive" />
                        <Bar dataKey="neg" fill="var(--cds-support-01)" radius={0} name="Negative" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
          <CardDescription className="text-xs">Latest system-wide updates to your profile credits.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Title</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Type</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Status</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Points</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-cds-text-05">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((act) => (
                  <TableRow key={act._id} className="hover:bg-cds-ui-01/50 transition-colors border-b last:border-0">
                    <TableCell className="font-medium text-[13px] text-cds-text-01">{act.title}</TableCell>
                    <TableCell>
                       <Badge variant={(act.type === 'positive' || (Number(act.points) > 0)) ? 'default' : 'destructive'} className="rounded-none text-[10px] h-5 uppercase tracking-wider font-bold">
                          {act.type || (Number(act.points) > 0 ? 'positive' : 'negative')}
                        </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-[12px] text-cds-text-02 font-medium">{act.status}</TableCell>
                    <TableCell className={cn("text-right font-bold tabular-nums", (act.type === 'positive' || (Number(act.points) > 0)) ? "text-cds-support-02" : "text-cds-support-01")}>
                       {(act.type === 'positive' || Number(act.points) > 0) ? `+${Math.abs(act.points)}` : `-${Math.abs(act.points)}`}
                    </TableCell>
                    <TableCell className="text-right text-[11px] text-cds-text-05 tabular-nums font-medium">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {recentActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs italic text-cds-text-05">No recent activities found.</TableCell>
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
