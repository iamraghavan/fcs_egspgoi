"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Clock3,
  FileCheck2,
  Megaphone,
  RefreshCw,
  Send,
  ShieldAlert,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, describeApiError } from "@/lib/api";
import { chartTooltipStyle } from "@/lib/chart-theme";
import { useAcademicYear } from "@/components/shell/academic-year";
import { useToast } from "@/hooks/use-toast";

const D = "/u/portal/dashboard/admin";
const colors = {
  submitted: "hsl(var(--chart-1))",
  approved: "hsl(var(--success))",
  rejected: "hsl(var(--danger))",
  pending: "hsl(var(--warning))",
  records: "hsl(var(--chart-5))",
};
const formatNumber = new Intl.NumberFormat("en-IN");
const monthLabel = (value: string) =>
  new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });

type Overview = {
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeUsers: number;
    facultyUsers: number;
    colleges: number;
    totalRecords: number;
    pendingReview: number;
    openAppeals: number;
    netPoints: number;
    approvalRate: number;
  };
  status: { pending: number; approved: number; rejected: number };
  trends: { month: string; submitted: number; approved: number; rejected: number; negative: number }[];
  colleges: { name: string; users: number; records: number }[];
  userGrowth: { month: string; users: number }[];
  recent: {
    id: string;
    title: string;
    faculty: string;
    college: string;
    type: string;
    status: string;
    points: number;
    impact: number;
    createdAt: string;
  }[];
};

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { year, setYear, options } = useAcademicYear();
  const { toast } = useToast();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError("");
    apiFetch<Overview>(`/analytics/dashboard?academicYear=${encodeURIComponent(year)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(describeApiError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [year, refreshKey]);

  const status = useMemo(
    () => [
      { name: "Approved", value: data?.status.approved || 0, color: colors.approved },
      { name: "Pending", value: data?.status.pending || 0, color: colors.pending },
      { name: "Rejected", value: data?.status.rejected || 0, color: colors.rejected },
    ],
    [data],
  );
  const submissionCount = status.reduce((total, item) => total + item.value, 0);
  const summary = data?.summary;
  const metrics = summary
    ? [
        {
          label: "Faculty accounts",
          value: summary.facultyUsers,
          detail: `${formatNumber.format(summary.totalUsers)} users across all roles`,
          icon: Users,
          href: `${D}/users`,
          tone: "text-primary bg-primary/10",
        },
        {
          label: "Active users",
          value: summary.activeUsers,
          detail: `${summary.totalUsers ? Math.round((summary.activeUsers / summary.totalUsers) * 100) : 0}% of all accounts`,
          icon: UserRoundCheck,
          href: `${D}/users`,
          tone: "text-success-text bg-success-bg",
        },
        {
          label: "Credit records",
          value: summary.totalRecords,
          detail: `AY ${year} · positive and negative`,
          icon: BarChart3,
          href: `${D}/reports`,
          tone: "text-info-text bg-info-bg",
        },
        {
          label: "Awaiting review",
          value: summary.pendingReview,
          detail: "Positive submissions pending",
          icon: Clock3,
          href: `${D}/review`,
          tone: "text-warning-text bg-warning-bg",
        },
        {
          label: "Open appeals",
          value: summary.openAppeals,
          detail: "Decisions needed",
          icon: ShieldAlert,
          href: `${D}/appeals`,
          tone: "text-danger-text bg-danger-bg",
        },
        {
          label: "Net credit impact",
          value: summary.netPoints,
          detail: `Effective points · AY ${year}`,
          icon: TrendingUp,
          href: `${D}/reports`,
          tone: "text-violet-text bg-violet-bg",
        },
      ]
    : [];

  async function broadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    setBroadcasting(true);
    try {
      await apiFetch("/notifications/broadcast", {
        method: "POST",
        body: { title: announcementTitle.trim(), body: announcementBody.trim(), role: "faculty" },
      });
      toast({ title: "Announcement sent", description: "The faculty broadcast was submitted." });
      setAnnouncementTitle("");
      setAnnouncementBody("");
    } catch (cause) {
      toast({ title: "Could not send announcement", description: describeApiError(cause), variant: "destructive" });
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Administration</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live account, review, and credit activity for the selected academic year.
          </p>
          {data && (
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {new Date(data.generatedAt).toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger aria-label="Dashboard academic year" className="w-[180px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item} value={item}>
                  AY {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>
            Try again
          </Button>
        </div>
      )}
      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-36 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : data && summary ? (
        <>
          <section aria-label="Key statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <span className={`rounded-lg p-2 ${item.tone}`}>
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{formatNumber.format(item.value)}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{item.detail}</span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
            <Card className="min-w-0 rounded-xl shadow-sm">
              <CardHeader className="gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Credit activity
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Records created by month in AY {year}. Lines show current decisions.
                  </CardDescription>
                </div>
                <Link
                  href={`${D}/reports`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Full reports <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent>
                {data.trends.length ? (
                  <div
                    className="h-72 w-full"
                    role="img"
                    aria-label="Monthly credit submissions, approvals and negative remarks"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.trends} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dashboard-submissions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.submitted} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={colors.submitted} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={monthLabel}
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          labelFormatter={(label) => monthLabel(String(label))}
                        />
                        <Area
                          type="monotone"
                          name="Submissions"
                          dataKey="submitted"
                          stroke={colors.submitted}
                          fill="url(#dashboard-submissions)"
                          strokeWidth={2.5}
                        />
                        <Area
                          type="monotone"
                          name="Approved"
                          dataKey="approved"
                          stroke={colors.approved}
                          fill="transparent"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          name="Negative remarks"
                          dataKey="negative"
                          stroke={colors.rejected}
                          fill="transparent"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart>No credit activity is recorded for this academic year.</EmptyChart>
                )}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                  <span>
                    <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                    Submissions
                  </span>
                  <span>
                    <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-success" />
                    Approved
                  </span>
                  <span>
                    <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-danger" />
                    Negative remarks
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock3 className="h-5 w-5 text-warning" />
                  Needs attention
                </CardTitle>
                <CardDescription>Current work queues for AY {year}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href={`${D}/review`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/40"
                >
                  <span>
                    <span className="block text-sm font-medium">Review submissions</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Positive work awaiting a decision</span>
                  </span>
                  <strong className="text-2xl tabular-nums text-warning-text">
                    {formatNumber.format(summary.pendingReview)}
                  </strong>
                </Link>
                <Link
                  href={`${D}/appeals`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/40"
                >
                  <span>
                    <span className="block text-sm font-medium">Decide appeals</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Faculty appeals still open</span>
                  </span>
                  <strong className="text-2xl tabular-nums text-danger-text">
                    {formatNumber.format(summary.openAppeals)}
                  </strong>
                </Link>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Decision rate</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.approvalRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    Positive submissions approved among decided submissions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Submission decisions</CardTitle>
                <CardDescription>Positive submissions in AY {year}, grouped by current status.</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionCount ? (
                  <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_130px]">
                    <div
                      className="relative h-52 min-w-0"
                      role="img"
                      aria-label={`${submissionCount} submissions: ${status.map((item) => `${item.value} ${item.name.toLowerCase()}`).join(", ")}`}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={status.filter((item) => item.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={65}
                            outerRadius={88}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {status
                              .filter((item) => item.value > 0)
                              .map((item) => (
                                <Cell key={item.name} fill={item.color} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={chartTooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <strong className="text-2xl tabular-nums">{formatNumber.format(submissionCount)}</strong>
                        <span className="text-xs text-muted-foreground">submissions</span>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm">
                      {status.map((item) => (
                        <li key={item.name} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                            {item.name}
                          </span>
                          <strong className="tabular-nums">{formatNumber.format(item.value)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <EmptyChart>No positive submissions are recorded for this academic year.</EmptyChart>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  College activity
                </CardTitle>
                <CardDescription>
                  Credit records by college in AY {year}. Placements follow the record snapshot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.colleges.some((item) => item.records) ? (
                  <div className="h-64 w-full" role="img" aria-label="Credit records by college">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.colleges.filter((item) => item.records)}
                        layout="vertical"
                        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          fontSize={11}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={126}
                          axisLine={false}
                          tickLine={false}
                          fontSize={11}
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(name) =>
                            String(name).length > 19 ? `${String(name).slice(0, 18)}…` : String(name)
                          }
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar
                          name="Records"
                          dataKey="records"
                          fill={colors.records}
                          radius={[0, 4, 4, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart>No college credit records are available for this academic year.</EmptyChart>
                )}
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>{summary.colleges} colleges with user accounts</span>
                  <Link href={`${D}/users`} className="font-medium text-primary hover:underline">
                    Manage people
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Recent credit activity</CardTitle>
                  <CardDescription>Latest records in AY {year}.</CardDescription>
                </div>
                <Link href={`${D}/reports`} className="text-sm font-medium text-primary hover:underline">
                  View reports
                </Link>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.recent.length ? (
                  data.recent.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 border-b py-3 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.faculty}
                          {item.college ? ` · ${item.college}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold tabular-nums ${item.impact < 0 ? "text-danger-text" : ""}`}
                        >
                          {item.impact > 0 ? "+" : ""}
                          {formatNumber.format(item.impact)} effective
                        </p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {item.status} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "—"}
                        </p>
                        {item.impact !== item.points && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.type === "positive" ? "Requested" : "Issued"}{" "}
                            {formatNumber.format(Math.abs(item.points))} pts
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No credit activity is recorded for this year.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="space-y-5">
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">User registrations</CardTitle>
                  <CardDescription>Monthly account creation across all academic years.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.userGrowth.length ? (
                    <div className="h-40 w-full" role="img" aria-label="Monthly user registrations">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.userGrowth} margin={{ top: 4, right: 0, left: -26, bottom: 0 }}>
                          <XAxis
                            dataKey="month"
                            tickFormatter={monthLabel}
                            axisLine={false}
                            tickLine={false}
                            fontSize={10}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            fontSize={10}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            labelFormatter={(label) => monthLabel(String(label))}
                          />
                          <Bar
                            name="New users"
                            dataKey="users"
                            fill={colors.submitted}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyChart>No registration dates are available.</EmptyChart>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {[
                    { label: "Review submissions", href: `${D}/review`, icon: FileCheck2 },
                    { label: "Add a user", href: `${D}/users/new`, icon: Users },
                    { label: "Open reports", href: `${D}/reports`, icon: BarChart3 },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted/40"
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-primary" />
                Broadcast announcement
              </CardTitle>
              <CardDescription>Send an institution-wide update to faculty.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={broadcast}
                className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end"
              >
                <div className="space-y-2">
                  <label htmlFor="broadcast-title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="broadcast-title"
                    value={announcementTitle}
                    onChange={(event) => setAnnouncementTitle(event.target.value)}
                    maxLength={120}
                    placeholder="Announcement title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="broadcast-body" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="broadcast-body"
                    value={announcementBody}
                    onChange={(event) => setAnnouncementBody(event.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Write a clear update for faculty"
                    required
                  />
                </div>
                <Button type="submit" disabled={broadcasting}>
                  <Send className="mr-2 h-4 w-4" />
                  {broadcasting ? "Sending…" : "Send announcement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : !error ? (
        <EmptyChart>Dashboard data is unavailable. Refresh to try again.</EmptyChart>
      ) : null}
    </div>
  );
}
