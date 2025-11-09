
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { gsap } from "gsap";
import { Users, FolderKanban, ShieldAlert, BarChartHorizontal } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type AnalyticsData = {
    totalUsers: number;
    totalCredits: number;
    pendingSubmissions: number;
    activeAppeals: number;
    userGrowth: { month: string; users: number }[];
    recentActivities: { id: string; description: string; user: string; date: string }[];
    creditStatus: { name: string; value: number; color: string }[];
};

type CreditTrendData = {
  daily: { date: string; pending: number; approved: number; rejected: number }[];
  weekly: { week: string; pending: number; approved: number; rejected: number }[];
  monthly: { month: string; pending: number; approved: number; rejected: number }[];
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

export default function AdminDashboard() {
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const yearOptions = generateYearOptions();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [creditTrends, setCreditTrends] = useState<CreditTrendData | null>(null);
  const [trendsTimescale, setTrendsTimescale] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("Authentication Error", "Admin token not found.");
        setLoading(false);
        return;
      }
      try {
        const [usersRes, creditsRes, recentActivitiesRes, trendsRes] = await Promise.all([
             fetch(`${API_BASE_URL}/api/v1/analytics/users`, { headers: { Authorization: `Bearer ${token}` } }),
             fetch(`${API_BASE_URL}/api/v1/analytics/credits`, { headers: { Authorization: `Bearer ${token}` } }),
             fetch(`${API_BASE_URL}/api/v1/admin/credits/positive?limit=5&sort=-createdAt`, { headers: { Authorization: `Bearer ${token}` } }),
             fetch(`${API_BASE_URL}/api/v1/analytics/credit-trends`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const usersData = await usersRes.json();
        const creditsData = await creditsRes.json();
        const recentActivitiesData = await recentActivitiesRes.json();
        const trendsData = await trendsRes.json();


        if (!usersData.success || !creditsData.success || !trendsData.success) {
            throw new Error(usersData.message || creditsData.message || trendsData.message || 'Failed to fetch analytics');
        }

        const formattedUserGrowth = usersData.userGrowth ? Object.entries(usersData.userGrowth).map(([month, users]) => ({ month, users: Number(users) })) : [];
        const formattedCreditStatus = creditsData.byStatus ? Object.entries(creditsData.byStatus).map(([name, value], index) => ({ name, value: Number(value), color: `hsl(var(--chart-${index + 1}))`})) : [];
        
        const formattedRecentActivities = recentActivitiesData.success ? recentActivitiesData.items.map((item: any) => ({
             id: item._id,
             description: `New submission: "${item.title}"`,
             user: item.faculty.name,
             date: new Date(item.createdAt).toISOString().split('T')[0]
        })) : [];

        setAnalytics({
            totalUsers: usersData.totalUsers,
            totalCredits: creditsData.totalCredits,
            pendingSubmissions: creditsData.byStatus?.pending || 0,
            activeAppeals: creditsData.appealStats?.totalAppeals || 0,
            userGrowth: formattedUserGrowth,
            creditStatus: formattedCreditStatus,
            recentActivities: formattedRecentActivities,
        });

        setCreditTrends(trendsData.data);

      } catch (error: any) {
        showAlert("Failed to load dashboard data", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [academicYear, showAlert]);

  useEffect(() => {
    if (!loading && containerRef.current) {
        gsap.fromTo(
            ".dashboard-card",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }
        );
    }
  }, [loading]);

  const overviewCards = [
    { title: "Total Users", value: analytics?.totalUsers ?? 0, icon: Users },
    { title: "Total Credits Submitted", value: analytics?.totalCredits ?? 0, icon: BarChartHorizontal },
    { title: "Pending Submissions", value: analytics?.pendingSubmissions ?? 0, icon: FolderKanban },
    { title: "Active Appeals", value: analytics?.activeAppeals ?? 0, icon: ShieldAlert },
  ];

  const trendData = useMemo(() => {
    if (!creditTrends) return [];
    const data = creditTrends[trendsTimescale];
    const key = trendsTimescale === 'daily' ? 'date' : trendsTimescale === 'weekly' ? 'week' : 'month';
    return data.map(item => ({...item, name: item[key as keyof typeof item]}));
  }, [creditTrends, trendsTimescale]);

  return (
    <div className="space-y-8" ref={containerRef}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground">An overview of the faculty credit system for the academic year {academicYear}.</p>
        </div>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Select Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(year => (
                <SelectItem key={year} value={year}>Academic Year {year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
            <Card key={card.title} className="dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{card.value}</div>}
              </CardContent>
            </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 dashboard-card">
              <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-[250px] w-full" /> : 
                  <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics?.userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="users" name="New Users" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                  </ResponsiveContainer>}
              </CardContent>
          </Card>
          <Card className="lg:col-span-2 dashboard-card">
              <CardHeader>
                  <CardTitle>Credits by Status</CardTitle>
                  <CardDescription>A breakdown of all submitted credits.</CardDescription>
              </CardHeader>
              <CardContent>
                 {loading ? <Skeleton className="h-[250px] w-full" /> : 
                  <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                          <Pie
                            data={analytics?.creditStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                          >
                            {analytics?.creditStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>}
              </CardContent>
          </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Credit Request Trends</CardTitle>
                        <CardDescription>Trends for pending, approved, and rejected credits.</CardDescription>
                    </div>
                     <Select value={trendsTimescale} onValueChange={(v) => setTrendsTimescale(v as any)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-[280px] w-full" /> :
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" />
                            <Line type="monotone" dataKey="approved" stroke="#10b981" name="Approved" />
                            <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="Rejected" />
                        </LineChart>
                    </ResponsiveContainer>}
                </CardContent>
            </Card>
          <Card className="lg:col-span-2 dashboard-card">
              <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>A log of recent important events.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-[280px] w-full" /> : 
                  <div className="space-y-4">
                    {analytics?.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-snug">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.user} &middot; {activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>}
              </CardContent>
          </Card>
      </div>

    </div>
  )
}
