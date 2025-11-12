
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, Legend, CartesianGrid } from "recharts";
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
import { Plus, Minus, FileText, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { gsap } from "gsap";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type CreditActivity = {
  _id: string;
  title: string;
  points: number;
  status: 'approved' | 'pending' | 'rejected' | 'appealed';
  createdAt: string;
  type: 'positive' | 'negative';
  appeal?: {
    status: 'pending' | 'accepted' | 'rejected';
  }
};

type UserProfileStats = {
    name: string;
    facultyID: string;
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
        series: {
            period: string;
            positivePoints: number;
            negativePoints: number;
            net: number;
        }[];
    };
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

// Helper function to determine if points should be displayed based on rules
const shouldShowPoints = (activity: CreditActivity): boolean => {
  if (activity.type === 'positive') {
    return activity.status === 'approved';
  }

  if (activity.type === 'negative') {
    // If no appeal, points are deducted if status is approved or rejected
    if (!activity.appeal) {
        return activity.status === 'approved' || activity.status === 'rejected';
    }
    // If an appeal exists, points are deducted only if the appeal is rejected.
    return activity.appeal.status === 'rejected';
  }

  return false;
};


export default function FacultyDashboard() {
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [userProfileStats, setUserProfileStats] = useState<UserProfileStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<CreditActivity[]>([]);
  const [creditHistory, setCreditHistory] = useState<{ month: string; netCredits: number; positive: number; negative: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const yearOptions = generateYearOptions();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const facultyId = searchParams.get('uid');

    if (!token || !facultyId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsResponse, activitiesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/credits/${facultyId}/credits?recalc=true`, { 
              headers: { "Authorization": `Bearer ${token}` } 
          }),
          fetch(`${API_BASE_URL}/api/v1/credits/credits/faculty/${facultyId}?limit=5`, { 
              headers: { "Authorization": `Bearer ${token}` } 
          })
        ]);

        const statsData = await statsResponse.json();
        if (statsData.success) {
          setUserProfileStats(statsData.data);
          
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const chartData = (statsData.data.stats.series || []).map((s: any) => ({
              month: monthNames[new Date(s.period).getMonth()],
              netCredits: s.net,
              positive: s.positivePoints,
              negative: s.negativePoints,
          }));
          setCreditHistory(chartData);

        } else {
           throw new Error(statsData.message || "Failed to fetch user stats.");
        }

        const activitiesData = await activitiesResponse.json();
        if (activitiesData.success) {
          setRecentActivities(activitiesData.items);
        } else {
            throw new Error(activitiesData.message || "Failed to fetch recent activities.");
        }

      } catch (error: any) {
        showAlert(
          "Failed to load dashboard",
          error.message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [searchParams, showAlert]);

  useEffect(() => {
    if (!loading && containerRef.current) {
        gsap.fromTo(
            ".dashboard-card",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }
        );
    }
  }, [loading]);

  if (loading) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-10 w-48" />
            </div>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24 dashboard-card" />
                <Skeleton className="h-24 dashboard-card" />
                <Skeleton className="h-24 dashboard-card" />
                <Skeleton className="h-24 dashboard-card" />
                <Skeleton className="h-24 dashboard-card" />
                <Skeleton className="h-24 dashboard-card" />
             </div>
             <div className="grid gap-6 md:grid-cols-2">
                <Card className="dashboard-card"><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>
                <Card className="dashboard-card"><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>
             </div>
             <Card className="md:col-span-2 lg:col-span-3 dashboard-card"><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-6" ref={containerRef}>
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground">Faculty Dashboard</h2>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue placeholder="Select Academic Year" />
          </SelectTrigger>
          <SelectContent>
             {yearOptions.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Credit Balance</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userProfileStats?.currentCredit ?? 0}</div>
            <p className="text-xs text-muted-foreground">Overall credit balance</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net For Year ({userProfileStats?.stats.currentYearStats?.academicYear})</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${userProfileStats?.stats?.currentYearStats?.netForYear ?? 0 >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{userProfileStats?.stats?.currentYearStats?.netForYear ?? 0}</div>
            <p className="text-xs text-muted-foreground">Net change for current year</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive Points (Year)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">+{userProfileStats?.stats?.currentYearStats?.positivePoints ?? 0}</div>
                 <p className="text-xs text-muted-foreground">{userProfileStats?.stats?.currentYearStats?.totalPositive ?? 0} activities this year</p>
            </CardContent>
        </Card>
        <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negative Points (Year)</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">{userProfileStats?.stats?.currentYearStats?.negativePoints ?? 0}</div>
                 <p className="text-xs text-muted-foreground">{userProfileStats?.stats?.currentYearStats?.totalNegative ?? 0} remarks this year</p>
            </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfileStats?.stats.totalCreditsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">Lifetime submissions & remarks</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive vs Negative</CardTitle>
             <div className="flex gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <TrendingDown className="h-4 w-4 text-red-500" />
             </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                <span className="text-green-600">{userProfileStats?.stats.totalPositiveCount ?? 0}</span>
                <span className="text-muted-foreground mx-2">/</span>
                <span className="text-red-600">{userProfileStats?.stats.totalNegativeCount ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total positive vs. negative activities</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
            <CardHeader>
                <CardTitle>Net Credit Change</CardTitle>
                <CardDescription>
                Your net credit balance changes over time.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={creditHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                         <defs>
                            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip />
                        <Area type="monotone" dataKey="netCredits" name="Net Credits" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#chart-gradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="dashboard-card">
            <CardHeader>
                <CardTitle>Positive vs. Negative Credits</CardTitle>
                <CardDescription>Comparison of credits gained vs. lost.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={creditHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="positive" fill="#16a34a" name="Positive" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="negative" fill="#dc2626" name="Negative" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="md:col-span-2 lg:col-span-3 dashboard-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity._id}>
                    <TableCell className="font-medium">
                      {activity.title}
                    </TableCell>
                    <TableCell>
                       <Badge variant={activity.type === 'positive' ? 'default' : 'destructive'} className={activity.type === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {activity.type}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.status === 'approved' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}>
                        {activity.status === 'appealed' && activity.appeal ? activity.appeal.status : activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                       {shouldShowPoints(activity) ? (
                        <span className={activity.type === 'positive' ? 'text-green-600' : 'text-red-600'}>
                          {activity.type === 'positive' ? `+${activity.points}` : `${activity.points}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    