"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://faculty-credit-system.vercel.app/api/v1";
type Policy = { policyId: string; version: number; revision: number; name: string; status: string; effectiveFrom: string; effectiveTo?: string; rules: { ruleId: string; name: string; creditType: string; calculation: { basePoints: number } }[] };

export default function CreditPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [name, setName] = useState(""); const [from, setFrom] = useState(""); const [ruleName, setRuleName] = useState(""); const [points, setPoints] = useState("1"); const [type, setType] = useState("positive");
  const [busy, setBusy] = useState(false); const { toast } = useToast();
  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = localStorage.getItem("token"); const response = await fetch(`${API}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
    const body = await response.json(); if (!response.ok) throw new Error(body.message || "Request failed"); return body;
  }, []);
  const load = useCallback(() => request("/policies").then(body => setPolicies(body.policies)).catch(error => toast({ title: "Policies unavailable", description: error.message, variant: "destructive" })), [request, toast]);
  useEffect(() => { load(); }, [load]);

  const create = async () => { setBusy(true); try {
    await request("/policies", { method: "POST", body: JSON.stringify({ name, effectiveFrom: new Date(from).toISOString(), effectiveTo: null, rules: [{ ruleId: `rule-${Date.now()}`, name: ruleName, creditType: type, eligibility: { all: [] }, requiredEvidence: [], calculation: { basePoints: Number(points), multiplierRules: [], perEventCap: null, periodCap: null, roundingScale: 2 }, approvalPath: [{ order: 1, role: "admin", action: "approve", whenPointsAbove: null }] }] }) });
    setName(""); setRuleName(""); await load(); toast({ title: "Draft policy created" });
  } catch (error) { toast({ title: "Could not create policy", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" }); } finally { setBusy(false); } };
  const action = async (policy: Policy, verb: "publish" | "retire") => { try { await request(`/policies/${policy.policyId}/versions/${policy.version}/${verb}`, { method: "POST" }); await load(); toast({ title: `Policy ${verb === "publish" ? "published" : "retired"}` }); } catch (error) { toast({ title: "Action failed", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" }); } };

  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Credit policy governance</h1><p className="text-sm text-muted-foreground">Versioned, effective-dated rules with auditable calculations.</p></div>
    <Card><CardHeader><CardTitle>New policy draft</CardTitle><CardDescription>Create the first rule; add richer conditions through the versioned policy API.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">
      <div><Label>Policy name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div><div><Label>Effective from</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div><div><Label>Rule name</Label><Input value={ruleName} onChange={e => setRuleName(e.target.value)} /></div><div><Label>Base points</Label><Input type="number" min="0" value={points} onChange={e => setPoints(e.target.value)} /></div><div><Label>Impact</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={type} onChange={e => setType(e.target.value)}><option value="positive">Positive</option><option value="negative">Negative</option></select></div><div className="flex items-end"><Button disabled={busy || !name || !from || !ruleName} onClick={create}>Create draft</Button></div>
    </CardContent></Card>
    <div className="grid gap-4">{policies.map(policy => <Card key={`${policy.policyId}-${policy.version}`}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{policy.name}</CardTitle><CardDescription>Version {policy.version} · {policy.status} · effective {new Date(policy.effectiveFrom).toLocaleDateString()}</CardDescription></div><div className="flex gap-2">{policy.status === "draft" && <Button size="sm" onClick={() => action(policy, "publish")}>Publish</Button>}{policy.status === "published" && <Button size="sm" variant="outline" onClick={() => action(policy, "retire")}>Retire</Button>}</div></div></CardHeader><CardContent>{policy.rules.map(rule => <div className="flex justify-between border-t py-3 text-sm" key={rule.ruleId}><span>{rule.name}</span><span className={rule.creditType === "negative" ? "text-destructive" : "text-emerald-600"}>{rule.creditType === "negative" ? "−" : "+"}{rule.calculation.basePoints}</span></div>)}</CardContent></Card>)}{!policies.length && <p className="text-sm text-muted-foreground">No policy versions have been created.</p>}</div>
  </div>;
}
