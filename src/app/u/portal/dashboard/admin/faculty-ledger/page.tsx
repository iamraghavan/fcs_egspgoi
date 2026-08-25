"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownUp, Building2, FileSpreadsheet, FileText, Trophy, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
type Faculty = { id: string; facultyID?: string; prefix?: string; name: string; email?: string; phone?: string; whatsappNumber?: string; college?: string; department?: string; designation?: string; roleCategory?: string; role?: string; isActive?: boolean; joinedAt?: string; currentCredit?: number; creditsByYear?: Record<string, number> };
type Row = { rank: number; rankingPoints: number; faculty: Faculty; positivePoints: number; negativePoints: number; netCredits: number; records: number };
type Report = { rows: Row[]; summary: { facultyCount: number; positivePoints: number; negativePoints: number; netCredits: number }; options: { colleges: string[]; departments: string[] } };
type Credit = { _id: string; createdAt?: string; academicYear?: string; type?: string; title?: string; points?: number; status?: string; categories?: string[]; notes?: string; proofUrl?: string; appeal?: { status?: string; reason?: string } };
type Ledger = { faculty: Faculty; summary: { totalRecords: number; positivePoints: number; negativePoints: number; effectiveNet: number }; credits: Credit[] };

async function saveDownload(response: Response, fallback: string) {
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export default function FacultyLedgerPage() {
  const { showAlert } = useAlert();
  const [type, setType] = useState("all");
  const [groupBy, setGroupBy] = useState("institution");
  const [college, setCollege] = useState("all");
  const [department, setDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerType, setLedgerType] = useState("all");
  const [ledgerStatus, setLedgerStatus] = useState("all");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledgerExporting, setLedgerExporting] = useState<"pdf" | "excel" | null>(null);

  const rankingParams = useCallback((format?: string) => {
    const p = new URLSearchParams({ type, sort: "desc", groupBy });
    if (college !== "all") p.set("college", college);
    if (department !== "all") p.set("department", department);
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    if (format) p.set("format", format);
    return p.toString();
  }, [type, groupBy, college, department, startDate, endDate]);

  const individualParams = useCallback((format?: string) => {
    const p = new URLSearchParams({ type: ledgerType, status: ledgerStatus });
    if (ledgerFrom) p.set("startDate", ledgerFrom);
    if (ledgerTo) p.set("endDate", ledgerTo);
    if (format) p.set("format", format);
    return p.toString();
  }, [ledgerType, ledgerStatus, ledgerFrom, ledgerTo]);

  const loadRanking = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/v1/admin/faculty-ledger/ranking?${rankingParams()}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to load faculty ledger");
      setReport(body.data);
    } catch (error: any) { showAlert("Faculty Ledger Error", error.message); }
    finally { setLoading(false); }
  }, [rankingParams, showAlert]);

  const loadIndividual = useCallback(async (faculty: Faculty) => {
    setLedgerLoading(true);
    try {
      const response = await fetch(`${API}/api/v1/admin/faculty/${encodeURIComponent(faculty.id)}/credit-ledger?${individualParams()}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to load individual faculty ledger");
      setLedger(body.data);
    } catch (error: any) { showAlert("Individual Ledger Error", error.message); }
    finally { setLedgerLoading(false); }
  }, [individualParams, showAlert]);

  useEffect(() => { loadRanking(); }, [loadRanking]);
  useEffect(() => { if (selected) loadIndividual(selected); }, [selected, loadIndividual]);

  const exportFile = async (format: "pdf" | "excel", faculty?: Faculty) => {
    faculty ? setLedgerExporting(format) : setExporting(format);
    try {
      const path = faculty
        ? `/api/v1/admin/faculty/${encodeURIComponent(faculty.id)}/credit-ledger/export?${individualParams(format)}`
        : `/api/v1/admin/faculty-ledger/ranking/export?${rankingParams(format)}`;
      const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Export failed"); }
      await saveDownload(response, `Faculty_Ledger.${format === "excel" ? "xlsx" : "pdf"}`);
    } catch (error: any) { showAlert("Export Error", error.message); }
    finally { faculty ? setLedgerExporting(null) : setExporting(null); }
  };

  const openLedger = (faculty: Faculty) => {
    setLedger(null); setLedgerType("all"); setLedgerStatus("all"); setLedgerFrom(""); setLedgerTo(""); setSelected(faculty);
    setTimeout(() => document.getElementById("individual-faculty-ledger")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  return <div className="space-y-6 max-w-7xl mx-auto">
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6" />Faculty Ledger</h1><p className="text-sm text-muted-foreground mt-1">Institution, college, department, and individual faculty credit ledgers.</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={!report || !!exporting} onClick={() => exportFile("pdf")}><FileText className="h-4 w-4 mr-2" />{exporting === "pdf" ? "Preparing..." : "Export PDF"}</Button><Button disabled={!report || !!exporting} onClick={() => exportFile("excel")}><FileSpreadsheet className="h-4 w-4 mr-2" />{exporting === "excel" ? "Preparing..." : "Export Excel"}</Button></div>
    </header>

    <Card className="rounded-none"><CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Select value={groupBy} onValueChange={setGroupBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="institution">Institution wise</SelectItem><SelectItem value="college">College wise</SelectItem><SelectItem value="department">Department wise</SelectItem></SelectContent></Select>
      <Select value={college} onValueChange={value => { setCollege(value); setDepartment("all"); }}><SelectTrigger><SelectValue placeholder="All colleges" /></SelectTrigger><SelectContent><SelectItem value="all">All colleges</SelectItem>{report?.options.colleges.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
      <Select value={department} onValueChange={setDepartment}><SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{report?.options.departments.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
      <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All credits</SelectItem><SelectItem value="positive">Positive credits</SelectItem><SelectItem value="negative">Negative credits</SelectItem></SelectContent></Select>
      <Input type="date" aria-label="From date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <Input type="date" aria-label="To date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); }} disabled={!startDate && !endDate}>Clear dates</Button>
    </CardContent></Card>

    {loading && <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-80" /></div>}
    {!loading && report && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Faculty" value={report.summary.facultyCount} neutral /><Metric label="Positive credits" value={`+${report.summary.positivePoints}`} positive /><Metric label="Negative credits" value={`-${report.summary.negativePoints}`} /><Metric label="Net credits" value={report.summary.netCredits > 0 ? `+${report.summary.netCredits}` : report.summary.netCredits} positive={report.summary.netCredits >= 0} /></div>
      <Card className="rounded-none overflow-hidden"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />{groupBy[0].toUpperCase() + groupBy.slice(1)} faculty ranking</CardTitle><Badge variant="outline"><ArrowDownUp className="h-3 w-3 mr-1" />Highest first</Badge></CardHeader><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-3 text-center">Rank</th><th className="p-3 text-left">Faculty</th><th className="p-3 text-left">College</th><th className="p-3 text-left">Department</th><th className="p-3 text-right">Positive</th><th className="p-3 text-right">Negative</th><th className="p-3 text-right">Ranking</th><th className="p-3 text-right">Records</th><th className="p-3 text-right">Action</th></tr></thead><tbody>
          {report.rows.map(row => <tr key={row.faculty.id} className="border-t hover:bg-muted/40"><td className="p-3 text-center font-bold">#{row.rank}</td><td className="p-3"><p className="font-semibold">{row.faculty.prefix} {row.faculty.name}</p><p className="text-xs text-muted-foreground">{row.faculty.facultyID || "No faculty ID"}</p></td><td className="p-3">{row.faculty.college || "N/A"}</td><td className="p-3">{row.faculty.department || "N/A"}</td><td className="p-3 text-right text-green-700">+{row.positivePoints}</td><td className="p-3 text-right text-red-700">-{row.negativePoints}</td><td className="p-3 text-right font-bold">{row.rankingPoints}</td><td className="p-3 text-right">{row.records}</td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => openLedger(row.faculty)}><UserRound className="h-4 w-4 mr-1" />View ledger</Button></td></tr>)}
          {!report.rows.length && <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">No faculty match the selected filters.</td></tr>}
        </tbody></table>
      </CardContent></Card>
    </>}

    {selected && <Card id="individual-faculty-ledger" className="rounded-none border-primary/30 shadow-lg">
      <CardHeader className="border-b flex-row items-start justify-between"><div><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" />Individual Faculty Ledger</CardTitle><p className="text-sm text-muted-foreground mt-1">Profile, transactions, filtered totals, evidence, appeals, and signed exports.</p></div><Button size="icon" variant="ghost" aria-label="Close individual ledger" onClick={() => { setSelected(null); setLedger(null); }}><X className="h-4 w-4" /></Button></CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Select value={ledgerType} onValueChange={setLedgerType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All credit types</SelectItem><SelectItem value="positive">Positive credits</SelectItem><SelectItem value="negative">Negative credits</SelectItem></SelectContent></Select>
          <Select value={ledgerStatus} onValueChange={setLedgerStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
          <Input type="date" aria-label="Individual ledger from date" value={ledgerFrom} onChange={e => setLedgerFrom(e.target.value)} />
          <Input type="date" aria-label="Individual ledger to date" value={ledgerTo} onChange={e => setLedgerTo(e.target.value)} />
        </div>
        {ledgerLoading && <Skeleton className="h-72" />}
        {!ledgerLoading && ledger && <>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{ledger.faculty.prefix} {ledger.faculty.name}</h2><p className="text-sm text-muted-foreground">{ledger.faculty.facultyID || "No faculty ID"} · {ledger.faculty.designation || "No designation"}</p></div><div className="flex gap-2"><Button variant="outline" disabled={!!ledgerExporting} onClick={() => exportFile("pdf", selected)}><FileText className="h-4 w-4 mr-2" />{ledgerExporting === "pdf" ? "Signing..." : "Signed PDF"}</Button><Button disabled={!!ledgerExporting} onClick={() => exportFile("excel", selected)}><FileSpreadsheet className="h-4 w-4 mr-2" />{ledgerExporting === "excel" ? "Signing..." : "Signed Excel"}</Button></div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Email" value={ledger.faculty.email} /><Detail label="Phone" value={ledger.faculty.phone} /><Detail label="WhatsApp" value={ledger.faculty.whatsappNumber} /><Detail label="Status" value={ledger.faculty.isActive ? "Active" : "Inactive"} /><Detail label="College / Institution" value={ledger.faculty.college} /><Detail label="Department" value={ledger.faculty.department} /><Detail label="Designation" value={ledger.faculty.designation} /><Detail label="Professional category" value={ledger.faculty.roleCategory} /><Detail label="System role" value={ledger.faculty.role} /><Detail label="Joined" value={ledger.faculty.joinedAt ? new Date(ledger.faculty.joinedAt).toLocaleString("en-IN") : undefined} /><Detail label="Stored credit balance" value={ledger.faculty.currentCredit} /><Detail label="Credits by year" value={Object.entries(ledger.faculty.creditsByYear || {}).map(([year, points]) => `${year}: ${points}`).join(", ") || undefined} /></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Records" value={ledger.summary.totalRecords} neutral /><Metric label="Positive" value={`+${ledger.summary.positivePoints}`} positive /><Metric label="Negative" value={`-${ledger.summary.negativePoints}`} /><Metric label="Effective net" value={ledger.summary.effectiveNet > 0 ? `+${ledger.summary.effectiveNet}` : ledger.summary.effectiveNet} positive={ledger.summary.effectiveNet >= 0} /></div>
          <div className="overflow-x-auto border"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Activity / details</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Points</th><th className="p-3 text-left">Evidence / appeal</th></tr></thead><tbody>
            {ledger.credits.map(credit => <tr key={credit._id} className="border-t align-top"><td className="p-3 whitespace-nowrap">{credit.createdAt ? new Date(credit.createdAt).toLocaleDateString("en-IN") : "N/A"}</td><td className="p-3 min-w-64"><p className="font-medium">{credit.title || "Untitled activity"}</p><p className="text-xs text-muted-foreground">{[credit.academicYear, credit.categories?.join(", "), credit.notes].filter(Boolean).join(" · ") || "No additional details"}</p><p className="text-xs text-muted-foreground mt-1">Credit ID: {credit._id}</p></td><td className="p-3 capitalize">{credit.type || "N/A"}</td><td className="p-3 capitalize">{credit.status || "N/A"}</td><td className={cn("p-3 text-right font-bold", credit.type === "positive" ? "text-green-700" : "text-red-700")}>{credit.type === "positive" ? "+" : "-"}{Math.abs(Number(credit.points) || 0)}</td><td className="p-3 min-w-48">{credit.proofUrl ? <a className="text-primary underline" href={credit.proofUrl} target="_blank" rel="noreferrer">Open proof</a> : "No proof"}{credit.appeal?.status && <p className="text-xs mt-1">Appeal: {credit.appeal.status}{credit.appeal.reason ? ` — ${credit.appeal.reason}` : ""}</p>}</td></tr>)}
            {!ledger.credits.length && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No credit records match these filters.</td></tr>}
          </tbody></table></div>
          <p className="text-xs text-muted-foreground">Each signed export includes Document ID, Issued At (ISO), Document Type, Content SHA-256, Signature Algorithm, Digital Signature, Verification URL, and a QR code.</p>
        </>}
      </CardContent>
    </Card>}
  </div>;
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return <div className="border bg-muted/20 p-3"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-medium break-words">{value === undefined || value === "" ? "N/A" : value}</p></div>;
}

function Metric({ label, value, positive = false, neutral = false }: { label: string; value: string | number; positive?: boolean; neutral?: boolean }) {
  return <Card className="rounded-none"><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className={cn("text-2xl font-bold mt-1", neutral ? "text-foreground" : positive ? "text-green-700" : "text-red-700")}>{value}</p></CardContent></Card>;
}
