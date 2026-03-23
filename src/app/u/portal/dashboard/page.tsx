"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { TrendingUp, TrendingDown, Star, Activity, Award, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";

const API_BASE_URL = 'https://faculty-credit-system.vercel.app';

type CreditActivity = {
  _id: string;
  title: string;
  points: number;
  status: 'approved' | 'pending' | 'rejected' | 'appealed';
  createdAt: string;
  type: 'positive' | 'negative';
  appeal?: { status: 'pending' | 'accepted' | 'rejected'; }
};

type UserProfileStats = {
    currentCredit: number;
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
  const searchParams = useSearchParams();
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<CreditActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = searchParams.get('uid');
    if (!token || !uid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sRes, aRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/credits/${uid}/credits?recalc=true`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/credits/credits/faculty/${uid}?limit=5`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        const sData = await sRes.json();
        const aData = await aRes.json();
        if (sData.success) setStats(sData.data);
        if (aData.success) setRecentActivities(aData.items);
      } catch (e: any) {
        showAlert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams, showAlert]);

  const chartData = (stats?.stats.series || []).map(s => ({
      name: new Date(s.period).toLocaleString('en-us', { month: 'short' }),
      net: s.net,
      pos: s.positivePoints,
      neg: Math.abs(s.negativePoints),
  }));

  if (loading) return (
    <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96 w-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-cds-text-01">Performance Overview</h1>
            <p className="text-sm text-cds-text-05">Institutional metrics for Academic Year {academicYear}</p>
        </div>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-[180px] bg-cds-ui-01 border-none rounded-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-26">AY 2025-26</SelectItem>
            <SelectItem value="2024-25">AY 2024-25</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80">Net Credit Balance</CardTitle>
            <Star className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.currentCredit || 0}</div>
            <p className="text-[10px] mt-1 opacity-70 italic">Overall institutional standing</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-cds-text-05">Net for Year</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.stats.currentYearStats?.netForYear || 0}</div>
            <p className="text-[10px] mt-1 text-cds-text-05 italic">Current performance cycle</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card border-l-4 border-l-green-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-green-600">Good Works</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{stats?.stats.currentYearStats?.positivePoints || 0}</div>
            <p className="text-[10px] mt-1 text-cds-text-05 italic">Positive credits earned</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card border-l-4 border-l-red-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-600">Negative Remarks</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.stats.currentYearStats?.negativePoints || 0}</div>
            <p className="text-[10px] mt-1 text-cds-text-05 italic">Credit deductions received</p>
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
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="net" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNet)" strokeWidth={2} />
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                        <Bar dataKey="pos" fill="#10b981" radius={[2, 2, 0, 0]} name="Positive" />
                        <Bar dataKey="neg" fill="#ef4444" radius={[2, 2, 0, 0]} name="Negative" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-base">Recent Activities</CardTitle>
          <CardDescription>Latest system-wide updates to your profile credits.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-cds-ui-01">
                <TableRow>
                  <TableHead className="text-xs uppercase font-bold text-cds-text-05">Title</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-cds-text-05">Type</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-cds-text-05">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase font-bold text-cds-text-05">Points</TableHead>
                  <TableHead className="text-right text-xs uppercase font-bold text-cds-text-05">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((act) => (
                  <TableRow key={act._id} className="hover:bg-cds-ui-01/50 transition-colors">
                    <TableCell className="font-medium text-[13px]">{act.title}</TableCell>
                    <TableCell>
                       <Badge variant={act.type === 'positive' ? 'default' : 'destructive'} className="rounded-none text-[10px] h-5">
                          {act.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-[12px] text-cds-text-02">{act.status}</TableCell>
                    <TableCell className={cn("text-right font-bold tabular-nums", act.type === 'positive' ? 'text-green-600' : 'text-red-600')}>
                       {act.type === 'positive' ? `+${act.points}` : act.points}
                    </TableCell>
                    <TableCell className="text-right text-xs text-cds-text-05 tabular-nums">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
