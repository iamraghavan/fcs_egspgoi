"use client";

import { API_ORIGIN } from '@/lib/api-url';
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Building2, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, MoreHorizontal, Search, Trophy, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const API = API_ORIGIN;
type Faculty = { id: string; facultyID?: string; prefix?: string; name: string; email?: string; phone?: string; whatsappNumber?: string; college?: string; department?: string; designation?: string; roleCategory?: string; role?: string; isActive?: boolean; joinedAt?: string; currentCredit?: number; totalPositiveCredit?: number; totalNegativeCredit?: number; creditsByYear?: Record<string, number> };
type Row = { rank: number | null; rankingGroup: string; rankingPoints: number; faculty: Faculty; positivePoints: number; negativePoints: number; netCredits: number; records: number; statusCounts: Record<string, number>; appealStatusCounts: Record<string, number> };
type Report = { rows: Row[]; summary: { facultyCount: number; positivePoints: number; negativePoints: number; netCredits: number }; options: { colleges: string[]; departments: string[] } };
type Credit = { _id: string; createdAt?: string; updatedAt?: string; academicYear?: string; type?: string; title?: string; points?: number; effectivePoints?: number; status?: string; categories?: string[]; notes?: string; proofUrl?: string; issuedBy?: string; issuedByName?: string; appealCount?: number; appeal?: { status?: string; reason?: string; createdAt?: string; submittedAt?: string; updatedAt?: string; notes?: string; proofUrl?: string; reviewedBy?: string; reviewedByName?: string } | null };
type Ledger = { faculty: Faculty; summary: { totalRecords: number; positivePoints: number; negativePoints: number; effectivePositivePoints: number; effectiveNegativePoints: number; effectiveNet: number }; credits: Credit[] };

function formatTimestamp(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function signedPoints(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function deductedPoints(value: number) {
  return value > 0 ? `−${value}` : "0";
}

function facultyInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map(word => word[0]).join("") : words[0]?.slice(0, 2) || "F").toUpperCase();
}

function proofHref(value?: string) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `${API}${value.startsWith("/") ? "" : "/"}${value}`;
}

function impactExplanation(credit: Credit) {
  if (credit.appeal?.status === "pending") return "Deduction remains active while the appeal is reviewed";
  if (credit.appeal?.status === "accepted") return "Deduction removed after the appeal was accepted";
  if (credit.appeal?.status === "rejected") return "Deduction restored after the appeal was rejected";
  if (credit.status === "deleted") return "Deleted credit does not affect the balance";
  if (credit.type === "positive" && credit.status !== "approved") return "Positive credit awaits approval";
  if (credit.type === "negative") return "Deducted when issued";
  return "Approved credit added to the balance";
}

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
  const [rankingSort, setRankingSort] = useState<"asc" | "desc">("desc");
  const [college, setCollege] = useState("all");
  const [department, setDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [rankingSearch, setRankingSearch] = useState("");
  const [rankingPage, setRankingPage] = useState(1);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerType, setLedgerType] = useState("all");
  const [ledgerStatus, setLedgerStatus] = useState("all");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledgerExporting, setLedgerExporting] = useState<"pdf" | "excel" | null>(null);

  const rankingParams = useCallback((format?: string) => {
    const p = new URLSearchParams({ type, sort: rankingSort, groupBy });
    if (college !== "all") p.set("college", college);
    if (department !== "all") p.set("department", department);
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    if (format) p.set("format", format);
    return p.toString();
  }, [type, rankingSort, groupBy, college, department, startDate, endDate]);

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

  const matchingRows = useMemo(() => {
    const query = rankingSearch.trim().toLocaleLowerCase();
    if (!query) return report?.rows || [];
    return (report?.rows || []).filter(({ faculty }) =>
      [faculty.name, faculty.facultyID, faculty.college, faculty.department]
        .some(value => String(value || "").toLocaleLowerCase().includes(query)));
  }, [report, rankingSearch]);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(matchingRows.length / pageSize));
  const currentPage = Math.min(rankingPage, pageCount);
  const visibleRows = matchingRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const scoreLabel = type === "positive" ? "Approved positive" : type === "negative" ? "Deducted points" : "Net score";
  const scoreExplanation = type === "positive"
    ? "Approved positive credits count toward the score."
    : type === "negative"
      ? "Issued negative credits count until an appeal is accepted."
      : "Net score = approved positive credits minus active negative deductions.";
  const rankLabel = groupBy === "college" ? "College rank" : groupBy === "department" ? "Department rank" : "Overall rank";

  useEffect(() => { setRankingPage(1); }, [rankingSearch, report]);

  const exportFile = async (format: "pdf" | "excel", faculty?: Faculty, fullHistory = false) => {
    faculty ? setLedgerExporting(format) : setExporting(format);
    try {
      const ledgerParams = fullHistory ? new URLSearchParams({ type: "all", status: "all", format }).toString() : individualParams(format);
      const path = faculty
        ? `/api/v1/admin/faculty/${encodeURIComponent(faculty.id)}/credit-ledger/export?${ledgerParams}`
        : `/api/v1/admin/faculty-ledger/ranking/export?${rankingParams(format)}`;
      const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Export failed"); }
      await saveDownload(response, `Faculty_Ledger.${format === "excel" ? "xlsx" : "pdf"}`);
    } catch (error: any) { showAlert("Export Error", error.message); }
    finally { faculty ? setLedgerExporting(null) : setExporting(null); }
  };

  const openLedger = (faculty: Faculty) => {
    setLedger(null); setLedgerType("all"); setLedgerStatus("all"); setLedgerFrom(""); setLedgerTo(""); setSelected(faculty);
  };

  return <div className="space-y-6 max-w-7xl mx-auto">
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6" />Faculty Ledger</h1><p className="text-sm text-muted-foreground mt-1">Institution, college, department, and individual faculty credit ledgers.</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={!report || !!exporting} onClick={() => exportFile("pdf")}><FileText className="h-4 w-4 mr-2" />{exporting === "pdf" ? "Preparing..." : "Export PDF"}</Button><Button disabled={!report || !!exporting} onClick={() => exportFile("excel")}><FileSpreadsheet className="h-4 w-4 mr-2" />{exporting === "excel" ? "Preparing..." : "Export Excel"}</Button></div>
    </header>

    <Card className="rounded-xl"><CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1.5"><label htmlFor="ranking-scope" className="text-xs font-medium text-muted-foreground">Ranking scope</label><Select value={groupBy} onValueChange={setGroupBy}><SelectTrigger id="ranking-scope"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="institution">Institution</SelectItem><SelectItem value="college">College</SelectItem><SelectItem value="department">Department</SelectItem></SelectContent></Select></div>
      <div className="space-y-1.5"><label htmlFor="ranking-college" className="text-xs font-medium text-muted-foreground">College</label><Select value={college} onValueChange={value => { setCollege(value); setDepartment("all"); }}><SelectTrigger id="ranking-college"><SelectValue placeholder="All colleges" /></SelectTrigger><SelectContent><SelectItem value="all">All colleges</SelectItem>{report?.options.colleges.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><label htmlFor="ranking-department" className="text-xs font-medium text-muted-foreground">Department</label><Select value={department} onValueChange={setDepartment}><SelectTrigger id="ranking-department"><SelectValue placeholder="All departments" /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{report?.options.departments.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><label htmlFor="ranking-type" className="text-xs font-medium text-muted-foreground">Credit type</label><Select value={type} onValueChange={setType}><SelectTrigger id="ranking-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All credits</SelectItem><SelectItem value="positive">Positive credits</SelectItem><SelectItem value="negative">Negative credits</SelectItem></SelectContent></Select></div>
      <div className="space-y-1.5"><label htmlFor="ranking-from" className="text-xs font-medium text-muted-foreground">Issued from</label><Input id="ranking-from" type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} /></div>
      <div className="space-y-1.5"><label htmlFor="ranking-to" className="text-xs font-medium text-muted-foreground">Issued through</label><Input id="ranking-to" type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} /></div>
      <Button variant="outline" className="self-end" onClick={() => { setGroupBy("institution"); setCollege("all"); setDepartment("all"); setType("all"); setRankingSort("desc"); setRankingSearch(""); setStartDate(""); setEndDate(""); }} disabled={groupBy === "institution" && college === "all" && department === "all" && type === "all" && rankingSort === "desc" && !rankingSearch && !startDate && !endDate}>Reset filters</Button>
    </CardContent></Card>

    {loading && <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-80" /></div>}
    {!loading && report && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Faculty" value={report.summary.facultyCount} neutral /><Metric label="Positive credits" value={signedPoints(report.summary.positivePoints)} positive /><Metric label="Negative credits" value={deductedPoints(report.summary.negativePoints)} /><Metric label="Net credits" value={signedPoints(report.summary.netCredits)} positive={report.summary.netCredits >= 0} /></div>
      <Card className="overflow-hidden rounded-xl">
        <CardHeader className="gap-4 border-b bg-muted/20 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" />{groupBy[0].toUpperCase() + groupBy.slice(1)} faculty ranking</CardTitle>
            <p className="text-sm text-muted-foreground">{groupBy === "institution" ? "One ranking across the selected faculty" : groupBy === "college" ? "Ranks restart at #1 within each college" : "Ranks restart at #1 within each department of each college"}. Ranked by {scoreLabel.toLowerCase()} in the selected order.</p>
            <p className="text-xs text-muted-foreground">{scoreExplanation}</p>
            <p className="text-xs text-muted-foreground">Records includes every matching credit, including pending and appealed entries.</p>
            <p className="text-xs text-muted-foreground">Faculty with no effective points in this view remain visible as unranked.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={rankingSort} onValueChange={value => setRankingSort(value as "asc" | "desc")}>
              <SelectTrigger className="w-36" aria-label="Sort faculty ranking"><ArrowDownUp className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="desc">High to low</SelectItem><SelectItem value="asc">Low to high</SelectItem></SelectContent>
            </Select>
            <div className="relative w-full sm:w-72">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search faculty ranking" className="pl-9" placeholder="Search faculty, ID, college..." value={rankingSearch} onChange={event => setRankingSearch(event.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr>
                <th scope="col" className="w-20 px-4 py-3 text-center">{rankLabel}</th>
                <th scope="col" className="px-4 py-3 text-left">Faculty</th>
                <th scope="col" className="px-4 py-3 text-left">College / department</th>
                <th scope="col" className="px-4 py-3 text-right">Positive</th>
                <th scope="col" className="px-4 py-3 text-right">Negative</th>
                <th scope="col" className="px-4 py-3 text-right">{scoreLabel}</th>
                <th scope="col" className="px-4 py-3 text-right">Records</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {visibleRows.map((row, index) => <Fragment key={row.faculty.id}>
                  {groupBy !== "institution" && (index === 0 || visibleRows[index - 1].rankingGroup !== row.rankingGroup) && <tr className="border-t bg-muted/40"><th colSpan={8} scope="rowgroup" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.rankingGroup}</th></tr>}
                  <tr className={cn("border-t transition-colors hover:bg-muted/40", row.rank === 1 && "bg-primary/5")}>
                  <td className="px-4 py-3 text-center">{row.rank === null ? <span className="text-xs font-medium text-muted-foreground">Unranked</span> : <span className={cn("inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-bold tabular-nums", row.rank === 1 ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" : row.rank <= 3 ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>#{row.rank}</span>}</td>
                  <td className="px-4 py-3"><div className="flex min-w-56 items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{facultyInitials(row.faculty.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="font-semibold leading-snug text-foreground">{`${row.faculty.prefix || ""} ${row.faculty.name}`.trim()}</p><p className="mt-0.5 text-xs text-muted-foreground">Faculty ID <span className="font-medium text-foreground">{row.faculty.facultyID || "Not recorded"}</span></p></div>
                  </div></td>
                  <td className="px-4 py-3"><p className="max-w-56 font-medium leading-snug">{row.faculty.college || "College not recorded"}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.faculty.department || "Department not recorded"}</p></td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-green-700">{signedPoints(row.positivePoints)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-red-700">{deductedPoints(row.negativePoints)}</td>
                  <td className="px-4 py-3 text-right tabular-nums"><p className="font-bold">{type === "negative" ? row.rankingPoints : signedPoints(row.rankingPoints)}</p>{type === "all" && <p className="whitespace-nowrap text-xs font-normal text-muted-foreground">{signedPoints(row.positivePoints)} − {row.negativePoints} = {signedPoints(row.rankingPoints)}</p>}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.records ? <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="sm" className="gap-1 font-semibold tabular-nums" aria-label={`Show record breakdown for ${row.faculty.name}`}>{row.records}<ChevronDown className="h-3 w-3" /></Button></PopoverTrigger>
                    <PopoverContent align="end" className="w-64 space-y-3 text-sm">
                      <div><p className="font-semibold">{row.records} credit records</p><p className="text-xs text-muted-foreground">Within the selected type and date filters</p></div>
                      <div><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Credit status</p>{Object.entries(row.statusCounts || {}).map(([status, count]) => <div key={status} className="flex justify-between capitalize"><span>{status}</span><span className="font-medium tabular-nums">{count}</span></div>)}</div>
                      {!!Object.keys(row.appealStatusCounts || {}).length && <div className="border-t pt-2"><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Appeals</p>{Object.entries(row.appealStatusCounts).map(([status, count]) => <div key={status} className="flex justify-between capitalize"><span>{status}</span><span className="font-medium tabular-nums">{count}</span></div>)}</div>}
                    </PopoverContent>
                  </Popover> : <span className="px-3">0</span>}</td>
                  <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => openLedger(row.faculty)}><UserRound className="mr-1 h-4 w-4" />View ledger</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" disabled={!!ledgerExporting} aria-label={`More actions for ${row.faculty.name}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => void exportFile("pdf", row.faculty, true)}><FileText className="mr-2 h-4 w-4" />Download full ledger PDF</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void exportFile("excel", row.faculty, true)}><FileSpreadsheet className="mr-2 h-4 w-4" />Download full ledger Excel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div></td>
                  </tr>
                </Fragment>)}
                {!visibleRows.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">{rankingSearch ? "No faculty match your search." : "No faculty match the selected filters."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
            <span>Showing {matchingRows.length ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, matchingRows.length)} of {matchingRows.length} faculty</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" aria-label="Previous ranking page" disabled={currentPage <= 1} onClick={() => setRankingPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="min-w-20 text-center tabular-nums">{currentPage} of {pageCount}</span>
              <Button variant="outline" size="sm" aria-label="Next ranking page" disabled={currentPage >= pageCount} onClick={() => setRankingPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>}

    {selected && <Sheet open onOpenChange={open => { if (!open) { setSelected(null); setLedger(null); } }}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:w-[75vw] sm:max-w-none">
        <SheetHeader className="border-b px-6 py-5 pr-14 text-left">
          <SheetTitle>Individual faculty ledger</SheetTitle>
          <SheetDescription>{selected.prefix} {selected.name} · {selected.facultyID || "No faculty ID"} — credit history, issuers, appeals, and balance impact.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={ledgerType} onValueChange={setLedgerType}><SelectTrigger aria-label="Filter credit type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All credit types</SelectItem><SelectItem value="positive">Positive credits</SelectItem><SelectItem value="negative">Negative credits</SelectItem></SelectContent></Select>
            <Select value={ledgerStatus} onValueChange={setLedgerStatus}><SelectTrigger aria-label="Filter credit status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="appealed">Appealed</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="deleted">Deleted</SelectItem></SelectContent></Select>
            <Input type="date" aria-label="Ledger from date" value={ledgerFrom} onChange={e => setLedgerFrom(e.target.value)} />
            <Input type="date" aria-label="Ledger to date" value={ledgerTo} onChange={e => setLedgerTo(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!!ledgerExporting || !ledger} onClick={() => exportFile("pdf", selected)}><FileText className="mr-2 h-4 w-4" />{ledgerExporting === "pdf" ? "Signing..." : "Signed PDF"}</Button>
            <Button variant="outline" disabled={!!ledgerExporting || !ledger} onClick={() => exportFile("excel", selected)}><FileSpreadsheet className="mr-2 h-4 w-4" />{ledgerExporting === "excel" ? "Signing..." : "Signed Excel"}</Button>
          </div>
          {ledgerLoading && <Skeleton className="h-72" />}
          {!ledgerLoading && ledger && <>
            <section aria-label="Faculty profile" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Detail label="College / institution" value={ledger.faculty.college} />
              <Detail label="Department" value={ledger.faculty.department} />
              <Detail label="Designation" value={ledger.faculty.designation} />
              <Detail label="Status" value={ledger.faculty.isActive ? "Active" : "Inactive"} />
              <Detail label="Email" value={ledger.faculty.email} />
              <Detail label="Phone" value={ledger.faculty.phone} />
              <Detail label="Professional category" value={ledger.faculty.roleCategory} />
              <Detail label="Joined" value={formatTimestamp(ledger.faculty.joinedAt)} />
            </section>
            <section aria-label="Filtered credit totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Records" value={ledger.summary.totalRecords} neutral />
              <Metric label="Effective positive" value={signedPoints(ledger.summary.effectivePositivePoints)} positive />
              <Metric label="Effective negative" value={deductedPoints(ledger.summary.effectiveNegativePoints)} />
              <Metric label="Effective net" value={ledger.summary.effectiveNet} positive={ledger.summary.effectiveNet >= 0} />
            </section>
            <p className="text-xs text-muted-foreground">Totals above follow the selected filters. Full faculty balance: {signedPoints(ledger.faculty.currentCredit ?? 0)} = {signedPoints(ledger.faculty.totalPositiveCredit ?? 0)} − {ledger.faculty.totalNegativeCredit ?? 0}.</p>
            <section aria-labelledby="credit-activity-heading" className="space-y-3">
              <div><h3 id="credit-activity-heading" className="font-semibold">Credit activity</h3><p className="text-sm text-muted-foreground">Open a record to see the issuer, evidence, appeal, and decision timeline.</p></div>
              {ledger.credits.map(credit => <details key={credit._id} className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                  <div className="min-w-48 flex-1"><p className="font-medium">{credit.title || "Untitled credit"}</p><p className="text-xs text-muted-foreground">{formatTimestamp(credit.createdAt)} · {credit.issuedByName || (credit.type === "positive" ? "Faculty submission" : "Issuer not recorded")}</p></div>
                  <Badge variant="outline" className="capitalize">{credit.type || "Unknown type"}</Badge>
                  <Badge variant="secondary" className="capitalize">{credit.appeal?.status ? "Appeal " + credit.appeal.status : credit.status || "Unknown status"}</Badge>
                  <span className={cn("min-w-16 text-right font-bold", Number(credit.effectivePoints) < 0 ? "text-red-700" : Number(credit.effectivePoints) > 0 ? "text-green-700" : "text-muted-foreground")}>{Number(credit.effectivePoints) > 0 ? "+" : ""}{Number(credit.effectivePoints) || 0}</span>
                </summary>
                <div className="space-y-5 border-t p-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Detail label="Issued points" value={(credit.type === "negative" ? "−" : "+") + Math.abs(Number(credit.points) || 0)} />
                    <Detail label="Effective balance impact" value={credit.effectivePoints ?? 0} />
                    <Detail label="Issued by" value={credit.issuedByName || (credit.type === "positive" ? "Faculty submission" : credit.issuedBy || "Not recorded")} />
                    <Detail label="Issued on" value={formatTimestamp(credit.createdAt)} />
                    <Detail label="Academic year" value={credit.academicYear} />
                    <Detail label="Credit status" value={credit.status} />
                    <Detail label="Last updated" value={formatTimestamp(credit.updatedAt)} />
                    <Detail label="Appeal attempts" value={credit.appealCount ?? 0} />
                  </div>
                  <p className="rounded-md bg-muted/50 p-3"><span className="font-medium">Accounting:</span> {impactExplanation(credit)}</p>
                  <div><p className="font-medium">Credit notes</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{credit.notes || "No notes recorded."}</p></div>
                  {credit.proofUrl && <a className="inline-flex items-center text-primary underline" href={proofHref(credit.proofUrl)} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" />View credit proof</a>}
                  <div>
                    <p className="font-medium">Available activity history</p>
                    <ol className="mt-2 space-y-3 border-l-2 border-border pl-4">
                      <li><p className="font-medium">Credit {credit.type === "positive" && !credit.issuedBy ? "submitted" : "issued"}</p><p className="text-muted-foreground">{formatTimestamp(credit.createdAt)} by {credit.issuedByName || (credit.type === "positive" ? "faculty" : "unrecorded issuer")}</p></li>
                      {credit.appeal ? <>
                        <li><p className="font-medium">Faculty appealed</p><p className="text-muted-foreground">{formatTimestamp(credit.appeal.submittedAt || credit.appeal.createdAt)}</p><p className="mt-1 whitespace-pre-wrap">{credit.appeal.reason || "No reason recorded."}</p>{credit.appeal.proofUrl && <a className="text-primary underline" href={proofHref(credit.appeal.proofUrl)} target="_blank" rel="noopener noreferrer">View appeal proof</a>}</li>
                        {credit.appeal.status && credit.appeal.status !== "pending" && <li><p className="font-medium">Appeal {credit.appeal.status}</p><p className="text-muted-foreground">{formatTimestamp(credit.appeal.updatedAt)} by {credit.appeal.reviewedByName || credit.appeal.reviewedBy || "unrecorded reviewer"}</p>{credit.appeal.notes && <p className="mt-1 whitespace-pre-wrap">{credit.appeal.notes}</p>}</li>}
                      </> : <li className="text-muted-foreground">No appeal submitted.</li>}
                    </ol>
                  </div>
                  <p className="break-all text-xs text-muted-foreground">Credit ID: {credit._id}</p>
                </div>
              </details>)}
              {!ledger.credits.length && <p className="rounded-lg border p-8 text-center text-muted-foreground">No credit records match these filters.</p>}
            </section>
          </>}
        </div>
      </SheetContent>
    </Sheet>}
  </div>;
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return <div className="border bg-muted/20 p-3"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-medium break-words">{value === undefined || value === "" ? "N/A" : value}</p></div>;
}

function Metric({ label, value, positive = false, neutral = false }: { label: string; value: string | number; positive?: boolean; neutral?: boolean }) {
  return <Card className="rounded-none"><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className={cn("text-2xl font-bold mt-1", neutral ? "text-foreground" : positive ? "text-green-700" : "text-red-700")}>{value}</p></CardContent></Card>;
}
