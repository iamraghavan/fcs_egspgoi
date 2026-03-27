"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  LineChart, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";
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
import { Users, FolderKanban, ShieldAlert, BarChartHorizontal, Megaphone, Send, Activity, TrendingUp, Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import _ from "lodash";

const API_BASE_URL = 'https://faculty-credit-system.vercel.app';

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
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [creditTrends, setCreditTrends] = useState<CreditTrendData | null>(null);
  const [trendsTimescale, setTrendsTimescale] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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
             fetch(`${API_BASE_URL}/api/v1/admin/credits/positive?limit=8&sort=-createdAt`, { headers: { Authorization: `Bearer ${token}` } }),
             fetch(`${API_BASE_URL}/api/v1/analytics/credit-trends`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const usersData = await usersRes.json();
        const creditsData = await creditsRes.json();
        const recentActivitiesData = await recentActivitiesRes.json();
        const trendsData = await trendsRes.json();


        if (!usersData.success || !creditsData.success || !trendsData.success) {
            throw new Error(usersData.message || creditsData.message || trendsData.message || 'Failed to fetch analytics');
        }

        // Optimized formatting using Lodash
        const formattedUserGrowth = _.map(usersData.userGrowth, (users, month) => ({ month, users: Number(users) }));
        
        const formattedCreditStatus = _.map(creditsData.byStatus, (value, name) => {
            let color = 'var(--cds-interactive-01)';
            if (name === 'pending') color = 'var(--cds-support-03)';
            if (name === 'rejected') color = 'var(--cds-support-01)';
            if (name === 'approved') color = 'var(--cds-support-02)';
            return { name, value: Number(value), color };
        });
        
        const rawActivities = recentActivitiesData.items || recentActivitiesData.data || [];
        const formattedRecentActivities = _.map(rawActivities, (item: any) => ({
             id: item._id,
             description: `Submission: "${item.title}"`,
             user: item.facultySnapshot?.name || item.faculty?.name || 'N/A',
             date: new Date(item.createdAt).toLocaleDateString()
        }));

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
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" }
        );
    }
  }, [loading]);

  const overviewCards = [
    { title: "Total Users", value: analytics?.totalUsers ?? 0, icon: Users, accent: "primary" },
    { title: "Submitted Work", value: analytics?.totalCredits ?? 0, icon: BarChartHorizontal, accent: "blue" },
    { title: "Pending Review", value: analytics?.pendingSubmissions ?? 0, icon: Clock, accent: "yellow" },
    { title: "Active Appeals", value: analytics?.activeAppeals ?? 0, icon: ShieldAlert, accent: "red" },
  ];

  const trendData = useMemo(() => {
    if (!creditTrends) return [];
    const data = creditTrends[trendsTimescale];
    if (!data) return [];
    const key = trendsTimescale === 'daily' ? 'date' : trendsTimescale === 'weekly' ? 'week' : 'month';
    return data.map(item => ({...item, name: item[key as keyof typeof item]}));
  }, [creditTrends, trendsTimescale]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementBody) {
        showAlert("Incomplete Form", "Title and message are required.");
        return;
    }

    setIsBroadcasting(true);
    const token = localStorage.getItem("token");
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/notifications/broadcast`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: announcementTitle,
                body: announcementBody,
                role: 'faculty'
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Failed to send broadcast.");
        }

        toast({ title: "Broadcast Sent", description: "Announcement sent to all faculty members." });
        setAnnouncementTitle("");
        setAnnouncementBody("");
    } catch (err: any) {
        showAlert("Broadcast Failed", err.message);
    } finally {
        setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8" ref={containerRef}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sidebar-border pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-cds-text-01">System Administrator</h2>
          <p className="text-sm text-cds-text-05 mt-1">Institutional overview for Academic Year {academicYear}</p>
        </div>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-full sm:w-[220px] bg-cds-ui-01 border-none rounded-none">
            <SelectValue placeholder="Select Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(year => (
                <SelectItem key={year} value={year}>AY {year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
            <Card key={card.title} className="dashboard-card border-none bg-cds-ui-01 hover:bg-cds-ui-03 transition-colors rounded-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-cds-text-05">{card.title}</CardTitle>
                <card.icon className={cn(
                    "h-4 w-4",
                    card.accent === 'primary' && "text-primary",
                    card.accent === 'blue' && "text-blue-600",
                    card.accent === 'yellow' && "text-amber-500",
                    card.accent === 'red' && "text-red-600",
                )} />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-20 bg-cds-ui-03" /> : <div className="text-3xl font-bold tracking-tighter text-cds-text-01 tabular-nums">{card.value}</div>}
              </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-16 gap-6">
          {/* Main Action Area */}
          <div className="lg:col-span-10 space-y-6">
              <Card className="dashboard-card border rounded-none shadow-none">
                  <CardHeader className="bg-cds-ui-01/50 border-b border-sidebar-border">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-none">
                            <Megaphone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                              <CardTitle className="text-base font-semibold">Broadcast Announcement</CardTitle>
                              <CardDescription className="text-xs">Publish institutional updates to all faculty members via push notifications.</CardDescription>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                      <form onSubmit={handleBroadcast} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                              <Input 
                                placeholder="Subject title (e.g., Extended Appeal Deadline)" 
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                required
                                className="bg-cds-ui-01 border-none focus:ring-1 focus:ring-primary rounded-none h-11"
                              />
                              <Textarea 
                                placeholder="Type the notification content here..." 
                                rows={3} 
                                value={announcementBody}
                                onChange={(e) => setAnnouncementBody(e.target.value)}
                                required
                                className="bg-cds-ui-01 border-none focus:ring-1 focus:ring-primary rounded-none resize-none"
                              />
                          </div>
                          <div className="flex justify-end">
                              <Button type="submit" disabled={isBroadcasting || loading} className="rounded-none px-8 font-semibold">
                                  {isBroadcasting ? "Broadcasting..." : (
                                      <><Send className="mr-2 h-4 w-4" /> Send Broadcast</>
                                  )}
                              </Button>
                          </div>
                      </form>
                  </CardContent>
              </Card>

              <Card className="dashboard-card border rounded-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Credit Processing Trends
                        </CardTitle>
                        <CardDescription className="text-xs">Activity volume across approved and rejected submissions.</CardDescription>
                    </div>
                     <Select value={trendsTimescale} onValueChange={(v) => setTrendsTimescale(v as any)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-cds-ui-01 border-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily View</SelectItem>
                            <SelectItem value="weekly">Weekly View</SelectItem>
                            <SelectItem value="monthly">Monthly View</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-[300px] w-full bg-cds-ui-01" /> :
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--cds-support-02)" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="var(--cds-support-02)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sidebar-border)" />
                                <XAxis dataKey="name" stroke="var(--cds-text-05)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="var(--cds-text-05)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--cds-ui-05)', border: 'none', color: '#fff', borderRadius: '0' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} />
                                <Area type="monotone" dataKey="approved" stroke="var(--cds-support-02)" fillOpacity={1} fill="url(#colorApproved)" name="Approved" strokeWidth={2} />
                                <Area type="monotone" dataKey="rejected" stroke="var(--cds-support-01)" fill="transparent" name="Rejected" strokeWidth={2} strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="pending" stroke="var(--cds-support-03)" fill="transparent" name="Pending" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>}
                </CardContent>
            </Card>
          </div>

          {/* Sidebar Insights */}
          <div className="lg:col-span-6 space-y-6">
              <Card className="dashboard-card border rounded-none shadow-none">
                  <CardHeader>
                      <CardTitle className="text-base font-semibold">Credit Status Distribution</CardTitle>
                      <CardDescription className="text-xs">Overall health of submitted performance records.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    {loading ? <Skeleton className="h-[220px] w-full bg-cds-ui-01" /> : 
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.creditStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {analytics?.creditStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--cds-ui-05)', border: 'none', color: '#fff', borderRadius: '0' }}
                                />
                                <Legend iconType="rect" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                      </div>}
                  </CardContent>
              </Card>

              <Card className="dashboard-card border rounded-none shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                          <CardTitle className="text-base font-semibold">System Activity Log</CardTitle>
                          <CardDescription className="text-xs">Recent mission-critical system events.</CardDescription>
                      </div>
                      <Activity className="h-4 w-4 text-cds-text-05" />
                  </CardHeader>
                  <CardContent className="pt-2">
                    {loading ? <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full bg-cds-ui-01" />)}</div> : 
                      <div className="space-y-1 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                        {analytics?.recentActivities?.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-cds-ui-01 transition-colors border-b border-sidebar-border last:border-0 group">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-background border border-sidebar-border group-hover:border-primary/30 transition-colors">
                              <FolderKanban className="h-3.5 w-3.5 text-cds-text-05 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[13px] font-medium leading-tight text-cds-text-01 line-clamp-2">{activity.description}</p>
                              <div className="flex items-center gap-2 text-[10px] text-cds-text-05 font-medium tracking-wide uppercase">
                                <span>{activity.user}</span>
                                <span className="h-1 w-1 rounded-full bg-cds-ui-04" />
                                <span>{activity.date}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!analytics?.recentActivities || analytics.recentActivities.length === 0) && (
                            <div className="py-10 text-center text-xs text-cds-text-05 italic">No recent activity recorded.</div>
                        )}
                      </div>}
                  </CardContent>
              </Card>
          </div>
      </div>

      {/* User Growth Utility Area */}
      <Card className="dashboard-card border rounded-none shadow-none bg-cds-ui-01/30">
          <CardHeader>
              <CardTitle className="text-base font-semibold">Registration Growth</CardTitle>
              <CardDescription className="text-xs">Faculty enrollment trends over the current fiscal cycle.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[200px] w-full bg-cds-ui-01" /> : 
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sidebar-border)" />
                        <XAxis dataKey="month" stroke="var(--cds-text-05)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--cds-text-05)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--cds-ui-05)', border: 'none', color: '#fff', borderRadius: '0' }} />
                        <Line type="stepAfter" dataKey="users" name="Enrollments" stroke="var(--cds-interactive-01)" strokeWidth={3} dot={{ r: 4, fill: 'var(--cds-interactive-01)', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
              </div>}
          </CardContent>
      </Card>
    </div>
  )
}
