
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, PieChart, Pie, Cell, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { gsap } from "gsap";
import { Users, FolderKanban, ShieldAlert, BarChartHorizontal } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

// --- MOCK DATA (to be replaced with API calls) ---
const userGrowthData = [
  { month: 'Jan', users: 4 },
  { month: 'Feb', users: 3 },
  { month: 'Mar', users: 5 },
  { month: 'Apr', users: 8 },
  { month: 'May', users: 7 },
  { month: 'Jun', users: 12 },
];

const topFacultyData = [
    { name: "Dr. Evelyn Reed", credits: 145, avatar: "/avatars/01.png" },
    { name: "Prof. Samuel Cruz", credits: 132, avatar: "/avatars/02.png" },
    { name: "Dr. Isabella Hayes", credits: 128, avatar: "/avatars/03.png" },
    { name: "Prof. Liam Steiner", credits: 110, avatar: "/avatars/04.png" },
    { name: "Dr. Olivia Chen", credits: 98, avatar: "/avatars/05.png" },
];

const recentActivitiesData = [
    { id: 1, description: "Dr. Smith's submission for 'Research Grant' was approved.", user: "Dr. Smith", date: "2023-10-26" },
    { id: 2, description: "A new appeal was filed by Prof. Jane Doe regarding a performance remark.", user: "Prof. Jane Doe", date: "2023-10-25" },
    { id: 3, description: "Bulk credit import for 'Semester Results' completed successfully.", user: "System", date: "2023-10-24" },
];

const creditStatusData = [
  { name: 'Approved', value: 240, color: 'hsl(var(--chart-2))' },
  { name: 'Pending', value: 50, color: 'hsl(var(--chart-3))' },
  { name: 'Rejected', value: 22, color: 'hsl(var(--chart-5))' },
];

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
  
  // States for analytics data
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [activeAppeals, setActiveAppeals] = useState(0);

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
        // In a real app, these would be separate analytics endpoints
        const usersRes = await fetch(`${API_BASE_URL}/api/v1/users?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
        const usersData = await usersRes.json();
        if (usersData.success) setTotalUsers(usersData.total);
        
        const creditsRes = await fetch(`${API_BASE_URL}/api/v1/admin/credits/positive?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
        const creditsData = await creditsRes.json();
        if (creditsData.success) {
            setTotalCredits(creditsData.total);
            setPendingSubmissions(creditsData.total); // Assuming total is pending for now
        }
        
        const appealsRes = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative/appeals/all?status=pending`, { headers: { Authorization: `Bearer ${token}` } });
        const appealsData = await appealsRes.json();
        if (appealsData.success) setActiveAppeals(appealsData.negativeAppeals?.length || 0);

      } catch (error: any) {
        showAlert("Failed to load dashboard data", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

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
    { title: "Total Users", value: totalUsers, icon: Users },
    { title: "Total Credits Submitted", value: totalCredits, icon: BarChartHorizontal },
    { title: "Pending Submissions", value: pendingSubmissions, icon: FolderKanban },
    { title: "Active Appeals", value: activeAppeals, icon: ShieldAlert },
  ];

  return (
    <div className="space-y-8" ref={containerRef}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground">An overview of the faculty credit system.</p>
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
                  <CardDescription>New user registrations over the last 6 months.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-[250px] w-full" /> : 
                  <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={userGrowthData}>
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
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
                            data={creditStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                          >
                            {creditStatusData.map((entry, index) => (
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
              <CardHeader>
                  <CardTitle>Top Faculty</CardTitle>
                  <CardDescription>Leaderboard of faculty with the most credits.</CardDescription>
              </CardHeader>
              <CardContent>
                 {loading ? <Skeleton className="h-[280px] w-full" /> : 
                  <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Credits</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topFacultyData.map((faculty, index) => (
                                <TableRow key={faculty.name}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={faculty.avatar} alt={faculty.name} />
                                                <AvatarFallback>{faculty.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{faculty.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-primary">{faculty.credits}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                  </div>}
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
                    {recentActivitiesData.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
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

    