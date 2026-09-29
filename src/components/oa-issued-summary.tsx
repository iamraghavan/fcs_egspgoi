"use client";

import { API_V1 } from "@/lib/api-url";
import { useEffect, useState } from "react";

type Summary = { total: number; positive: number; negative: number; voided: number };

export function OAIssuedSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(`${API_V1}/admin/oa/credits/issued?limit=1`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message || "Unable to load your credits");
        if (mounted) {
          setSummary({ total: body.data?.totalAvailable ?? 0,
            positive: body.data?.aggregates?.byType?.positive ?? 0,
            negative: body.data?.aggregates?.byType?.negative ?? 0,
            voided: body.data?.aggregates?.byStatus?.deleted ?? 0 });
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      }
    };
    void load();
    window.addEventListener("oa-credit-issued", load);
    return () => { mounted = false; window.removeEventListener("oa-credit-issued", load); };
  }, []);

  if (error) return <p role="status" className="text-sm text-muted-foreground">Your issued-credit summary is temporarily unavailable. Your history remains accessible.</p>;
  const cells = [
    ["Your issued credits", summary?.total], ["Positive", summary?.positive],
    ["Negative", summary?.negative], ["Voided", summary?.voided],
  ] as const;
  return <section aria-label="Credits issued by your account" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {cells.map(([label, value]) => <div key={label} className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value ?? "…"}</p>
    </div>)}
  </section>;
}
