
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Tooltip, Area, Legend } from "recharts"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlert } from "@/context/alert-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in';

type ReportData = {
  distribution?: { name: string; value: number }[];
  trends?: { name: string; value: number }[];
};

export default function ReportsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("distribution");
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReportData(null);
    const token = localStorage.getItem("token");

    if (!token) {
      showAlert("Authentication Error", "Admin token not found.");
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        reportType,
        ...(startDate && { fromDate: startDate }),
        ...(endDate && { toDate: endDate }),
      });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reports?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate report");
      }
      
      setReportData(data.data);
      toast({ title: "Report Generated", description: "The report has been successfully generated." });

    } catch (error: any) {
      showAlert("Error Generating Report", error.message);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="flex items-center justify-center text-center text-muted-foreground bg-card p-6 rounded-xl shadow-sm h-full">
          <p>Please configure and generate a report to see the results.</p>
        </div>
      );
    }
    
    const hasDistributionData = reportData.distribution && reportData.distribution.length > 0;
    const hasTrendsData = reportData.trends && reportData.trends.length > 0;

    if (!hasDistributionData && !hasTrendsData) {
      return (
         <div className="flex items-center justify-center text-center text-muted-foreground bg-card p-6 rounded-xl shadow-sm h-full">
          <p>No data found for the selected criteria.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {hasDistributionData && (
           <Card>
            <CardHeader>
              <CardTitle>Credit Distribution by Department</CardTitle>
              <CardDescription>Distribution of credits across different departments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.distribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                          <Tooltip />
                          <Bar dataKey="value" name="Credits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {hasTrendsData && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
              <CardDescription>Credit trends over the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.trends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <defs>
                              <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" name="Credits" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                          <Area type="monotone" dataKey="value" stroke="false" fill="url(#chart-gradient)" />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Generate and analyze faculty performance reports.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-card p-6 rounded-xl shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Report Configuration
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="start-date">Start Date</label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="end-date">End Date</label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="report-type">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribution">Credit Distribution by Department</SelectItem>
                  <SelectItem value="trends">Performance Trends Over Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="w-full" onClick={handleGenerateReport} disabled={isLoading}>
                <span className="material-symbols-outlined text-base">summarize</span>
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>
              <Button className="w-full" variant="secondary" type="button" disabled={!reportData}>
                <span className="material-symbols-outlined text-base">download</span>
                Export
              </Button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          {renderReportContent()}
        </div>
      </div>
    </div>
  )
}
