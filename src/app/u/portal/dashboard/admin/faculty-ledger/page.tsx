"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownUp, Building2, FileSpreadsheet, FileText, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
type Faculty = { id: string; facultyID?: string; prefix?: string; name: string; college?: string; department?: string; designation?: string };
type Row = { rank: number; faculty: Faculty; positivePoints: number; negativePoints: number; netCredits: number; records: number };
type Report = { rows: Row[]; summary: { facultyCount: number; positivePoints: number; negativePoints: number; netCredits: number }; options: { colleges: string[]; departments: string[] } };

export default function FacultyLedgerPage() {
  const { showAlert } = useAlert();
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("desc");
  const [groupBy, setGroupBy] = useState("institution");
  const [college, setCollege] = useState("all");
  const [department, setDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const params = useCallback((format?: string) => {
    const value = new URLSearchParams({ type, sort, groupBy });
    if (college !== "all") value.set("college", college);
    if (department !== "all") value.set("department", department);
    if (startDate) value.set("startDate", startDate);
    if (endDate) value.set("endDate", endDate);
    if (format) value.set("format", format);
    return value.toString();
  }, [type, sort, groupBy, college, department, startDate, endDate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/v1/admin/faculty-ledger/ranking?${params()}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to load faculty ledger");
      setReport(body.data);
    } catch (error: any) { showAlert("Faculty Ledger Error", error.message); }
    finally { setLoading(false); }
  }, [params, showAlert]);

  useEffect(() => { load(); }, [load]);

  const exportReport = async (format: "pdf" | "excel") => {
    setExporting(format);
    try {
      const response = await fetch(`${API}/api/v1/admin/faculty-ledger/ranking/export?${params(format)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Export failed"); }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `Faculty_Ledger.${format === "excel" ? "xlsx" : "pdf"}`;
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
    } catch (error: any) { showAlert("Export Error", error.message); }
    finally { setExporting(null); }
  };

  return <div className="space-y-6 max-w-7xl mx-auto">
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6" />Faculty Ledger</h1><p className="text-sm text-cds-text-05 mt-1">Institution, college, and department-wise faculty credit ranking.</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={!report || !!exporting} onClick={() => exportReport("pdf")}><FileText className="h-4 w-4 mr-2" />{exporting === "pdf" ? "Preparing..." : "Export PDF"}</Button><Button disabled={!report || !!exporting} onClick={() => exportReport("excel")}><FileSpreadsheet className="h-4 w-4 mr-2" />{exporting === "excel" ? "Preparing..." : "Export Excel"}</Button></div>
    </header>

    <Card className="rounded-none"><CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Select value={groupBy} onValueChange={setGroupBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="institution">Institution wise</SelectItem><SelectItem value="college">College wise</SelectItem><SelectItem value="department">Department wise</SelectItem></SelectContent></Select>
      <Select value={college} onValueChange={value => { setCollege(value); setDepartment("all"); }}><SelectTrigger><SelectValue placeholder="All colleges" /></SelectTrigger><SelectContent><SelectItem value="all">All colleges</SelectItem>{report?.options.colleges.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={department} onValueChange={setDepartment}><SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{report?.options.departments.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Top credit to low</SelectItem><SelectItem value="asc">Low credit to top</SelectItem></SelectContent></Select>
      <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All credits</SelectItem><SelectItem value="positive">Positive credits</SelectItem><SelectItem value="negative">Negative credits</SelectItem></SelectContent></Select>
      <Input type="date" aria-label="From date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <Input type="date" aria-label="To date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); }} disabled={!startDate && !endDate}>Clear dates</Button>
    </CardContent></Card>

    {loading && <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-80" /></div>}
    {!loading && report && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Faculty" value={report.summary.facultyCount} neutral /><Metric label="Positive credits" value={`+${report.summary.positivePoints}`} positive /><Metric label="Negative credits" value={`-${report.summary.negativePoints}`} /><Metric label="Net credits" value={report.summary.netCredits > 0 ? `+${report.summary.netCredits}` : report.summary.netCredits} positive={report.summary.netCredits >= 0} /></div>
      <Card className="rounded-none overflow-hidden"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />{groupBy[0].toUpperCase() + groupBy.slice(1)} faculty ranking</CardTitle><Badge variant="outline"><ArrowDownUp className="h-3 w-3 mr-1" />{sort === "desc" ? "Highest first" : "Lowest first"}</Badge></CardHeader><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-3 text-center">Rank</th><th className="p-3 text-left">Faculty</th><th className="p-3 text-left">College</th><th className="p-3 text-left">Department</th><th className="p-3 text-right">Positive</th><th className="p-3 text-right">Negative</th><th className="p-3 text-right">Net credit</th><th className="p-3 text-right">Records</th></tr></thead><tbody>
          {report.rows.map(row => <tr key={row.faculty.id} className="border-t"><td className="p-3 text-center font-bold">#{row.rank}</td><td className="p-3"><p className="font-semibold">{row.faculty.prefix} {row.faculty.name}</p><p className="text-xs text-muted-foreground">{row.faculty.facultyID || "No faculty ID"}</p></td><td className="p-3">{row.faculty.college || "N/A"}</td><td className="p-3">{row.faculty.department || "N/A"}</td><td className="p-3 text-right font-medium text-green-700">+{row.positivePoints}</td><td className="p-3 text-right font-medium text-red-700">-{row.negativePoints}</td><td className={cn("p-3 text-right text-base font-bold", row.netCredits >= 0 ? "text-green-700" : "text-red-700")}>{row.netCredits > 0 ? "+" : ""}{row.netCredits}</td><td className="p-3 text-right">{row.records}</td></tr>)}
          {!report.rows.length && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No faculty match the selected filters.</td></tr>}
        </tbody></table>
      </CardContent></Card>
    </>}
  </div>;
}

function Metric({ label, value, positive = false, neutral = false }: { label: string; value: string | number; positive?: boolean; neutral?: boolean }) {
  return <Card className="rounded-none"><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className={cn("text-2xl font-bold mt-1", neutral ? "text-foreground" : positive ? "text-green-700" : "text-red-700")}>{value}</p></CardContent></Card>;
}
