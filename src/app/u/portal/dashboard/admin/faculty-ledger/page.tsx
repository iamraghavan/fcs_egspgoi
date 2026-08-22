"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Search, UserRoundSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Faculty = {
  _id: string; facultyID?: string; prefix?: string; name: string; email?: string;
  college?: string; department?: string; designation?: string; roleCategory?: string;
};
type Credit = {
  _id: string; type: "positive" | "negative"; title: string; points: number;
  status: string; academicYear?: string; createdAt: string; notes?: string; proofUrl?: string;
  appeal?: { status?: string; reason?: string };
};
type Ledger = {
  faculty: Faculty & { phone?: string; whatsappNumber?: string; isActive: boolean; currentCredit: number; joinedAt?: string };
  summary: { totalRecords: number; positiveRecords: number; negativeRecords: number; positivePoints: number; negativePoints: number; effectiveNet: number };
  credits: Credit[];
};

export default function FacultyLedgerPage() {
  const { showAlert } = useAlert();
  const [users, setUsers] = useState<Faculty[]>([]);
  const [query, setQuery] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const token = () => localStorage.getItem("token");
  const params = useCallback((includeFormat?: string) => {
    const value = new URLSearchParams({ type, status });
    if (startDate) value.set("startDate", startDate);
    if (endDate) value.set("endDate", endDate);
    if (includeFormat) value.set("format", includeFormat);
    return value.toString();
  }, [type, status, startDate, endDate]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users?role=faculty`, { headers: { Authorization: `Bearer ${token()}` } });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message || "Unable to load faculty users");
        setUsers((body.items || body.data || []).filter((user: Faculty & { role?: string }) => user.role === "faculty"));
      } catch (error: any) { showAlert("Faculty Load Error", error.message); }
    };
    loadUsers();
  }, [showAlert]);

  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return users.filter(user => [user.name, user.facultyID, user.email, user.department, user.designation]
      .some(field => String(field || "").toLowerCase().includes(value))).slice(0, 8);
  }, [query, users]);

  const loadLedger = useCallback(async () => {
    if (!facultyId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/faculty/${facultyId}/credit-ledger?${params()}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to load faculty ledger");
      setLedger(body.data);
    } catch (error: any) { showAlert("Ledger Error", error.message); }
    finally { setLoading(false); }
  }, [facultyId, params, showAlert]);

  useEffect(() => { loadLedger(); }, [loadLedger]);

  const exportLedger = async (format: "pdf" | "excel") => {
    if (!facultyId) return;
    setExporting(format);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/faculty/${facultyId}/credit-ledger/export?${params(format)}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Export failed");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `Faculty_Credit_Ledger.${format === "excel" ? "xlsx" : "pdf"}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = filename; anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: any) { showAlert("Export Error", error.message); }
    finally { setExporting(null); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><UserRoundSearch className="h-6 w-6" />Faculty Credit Ledger</h1>
          <p className="text-sm text-cds-text-05 mt-1">Inspect and export an individual faculty member&apos;s positive and negative credit history.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!ledger || !!exporting} onClick={() => exportLedger("pdf")}><FileText className="h-4 w-4 mr-2" />{exporting === "pdf" ? "Preparing..." : "Export PDF"}</Button>
          <Button disabled={!ledger || !!exporting} onClick={() => exportLedger("excel")}><FileSpreadsheet className="h-4 w-4 mr-2" />{exporting === "excel" ? "Preparing..." : "Export Excel"}</Button>
        </div>
      </header>

      <Card className="rounded-none"><CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="relative md:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search faculty name, ID, email..." value={query} onChange={e => { setQuery(e.target.value); setFacultyId(""); setLedger(null); }} />
          {query && !facultyId && <div className="absolute z-30 top-11 w-full bg-background border shadow-xl max-h-72 overflow-auto">{suggestions.map(user => <button key={user._id} className="block w-full text-left p-3 border-b hover:bg-muted" onClick={() => { setFacultyId(user._id); setQuery(`${user.name} (${user.facultyID || "N/A"})`); }}><span className="font-semibold block">{user.name}</span><span className="text-xs text-muted-foreground">{user.facultyID} · {user.department} · {user.designation}</span></button>)}{suggestions.length === 0 && <p className="p-3 text-sm text-muted-foreground">No matching faculty found.</p>}</div>}
        </div>
        <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All credits</SelectItem><SelectItem value="positive">Positive only</SelectItem><SelectItem value="negative">Negative only</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="appealed">Appealed</SelectItem><SelectItem value="deleted">Deleted</SelectItem></SelectContent></Select>
        <Input type="date" aria-label="Start date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input type="date" aria-label="End date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </CardContent></Card>

      {loading && <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-80" /></div>}
      {!loading && !facultyId && <div className="py-24 text-center border border-dashed"><UserRoundSearch className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="font-semibold">Select a faculty member to view the ledger</p></div>}
      {!loading && ledger && <>
        <Card className="rounded-none"><CardHeader><CardTitle>{ledger.faculty.prefix} {ledger.faculty.name} <Badge variant="outline">{ledger.faculty.facultyID || "No Faculty ID"}</Badge></CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Info label="Email" value={ledger.faculty.email} /><Info label="College" value={ledger.faculty.college} /><Info label="Department" value={ledger.faculty.department} /><Info label="Designation" value={ledger.faculty.designation} /><Info label="Professional Category" value={ledger.faculty.roleCategory} /><Info label="Phone" value={ledger.faculty.phone || ledger.faculty.whatsappNumber} /><Info label="Account" value={ledger.faculty.isActive ? "Active" : "Inactive"} /><Info label="Stored Balance" value={String(ledger.faculty.currentCredit)} />
        </CardContent></Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Records" value={ledger.summary.totalRecords} /><Metric label="Positive points" value={`+${ledger.summary.positivePoints}`} positive /><Metric label="Negative points" value={`-${ledger.summary.negativePoints}`} /><Metric label="Effective net" value={ledger.summary.effectiveNet > 0 ? `+${ledger.summary.effectiveNet}` : ledger.summary.effectiveNet} positive={ledger.summary.effectiveNet >= 0} /></div>
        <Card className="rounded-none overflow-hidden"><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Activity</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Academic year</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Points</th><th className="p-3 text-left">Evidence</th></tr></thead><tbody>{ledger.credits.map(credit => <tr key={credit._id} className="border-t"><td className="p-3 whitespace-nowrap">{new Date(credit.createdAt).toLocaleDateString("en-IN")}</td><td className="p-3"><p className="font-medium">{credit.title}</p>{credit.notes && <p className="text-xs text-muted-foreground max-w-md">{credit.notes}</p>}</td><td className="p-3"><Badge variant="outline" className={credit.type === "positive" ? "text-green-700" : "text-red-700"}>{credit.type}</Badge></td><td className="p-3">{credit.academicYear || "N/A"}</td><td className="p-3 capitalize">{credit.status}</td><td className={cn("p-3 text-right font-bold", credit.type === "positive" ? "text-green-700" : "text-red-700")}>{credit.type === "positive" ? "+" : "-"}{Math.abs(Number(credit.points) || 0)}</td><td className="p-3">{credit.proofUrl ? <a className="text-primary underline" href={credit.proofUrl} target="_blank" rel="noreferrer">View proof</a> : "—"}</td></tr>)}{ledger.credits.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No credits match the selected range and filters.</td></tr>}</tbody></table></CardContent></Card>
      </>}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="font-medium mt-1">{value || "N/A"}</p></div>; }
function Metric({ label, value, positive = false }: { label: string; value: string | number; positive?: boolean }) { return <Card className="rounded-none"><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className={cn("text-2xl font-bold mt-1", positive ? "text-green-700" : "text-red-700")}>{value}</p></CardContent></Card>; }
