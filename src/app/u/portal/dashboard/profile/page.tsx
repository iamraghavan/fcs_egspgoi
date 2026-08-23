"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://faculty-credit-system.vercel.app/api/v1";
type Form = { biography: string; expertise: string; researchInterests: string; orcid: string; linkedin: string; website: string };
const empty: Form = { biography: "", expertise: "", researchInterests: "", orcid: "", linkedin: "", website: "" };

export default function ProfessionalProfilePage() {
  const [form, setForm] = useState<Form>(empty);
  const [employment, setEmployment] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/users/me/professional-profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Unable to load profile")))
      .then(({ data }) => {
        const p = data.professional || {};
        setForm({ biography: p.biography || "", expertise: (p.expertise || []).join(", "), researchInterests: (p.researchInterests || []).join(", "), orcid: p.researchIds?.orcid || "", linkedin: p.professionalLinks?.linkedin || "", website: p.professionalLinks?.website || "" });
        setEmployment(data.employment?.current || {});
      }).catch(error => toast({ title: "Profile unavailable", description: error.message, variant: "destructive" }));
  }, [toast]);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/users/me/professional-profile`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ biography: form.biography, expertise: form.expertise.split(",").map(v => v.trim()).filter(Boolean), researchInterests: form.researchInterests.split(",").map(v => v.trim()).filter(Boolean), researchIds: { orcid: form.orcid || null }, professionalLinks: { linkedin: form.linkedin || null, website: form.website || null } }),
      });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Update failed");
      toast({ title: "Professional profile updated" });
    } catch (error) { toast({ title: "Update failed", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Professional profile</h1><p className="text-sm text-muted-foreground">Research identity, expertise and institutional employment record.</p></div>
    <Card><CardHeader><CardTitle>Employment</CardTitle><CardDescription>Institution-managed fields are read-only.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{["employeeId", "college", "department", "designation", "status"].map(key => <div key={key}><Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label><Input value={employment[key] || "Not recorded"} disabled /></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Professional details</CardTitle><CardDescription>Used in faculty reports and institutional integrations.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><Label>Biography</Label><textarea className="mt-2 min-h-28 w-full rounded-md border bg-background p-3 text-sm" value={form.biography} onChange={e => setForm({ ...form, biography: e.target.value })} /></div>
      {([['expertise','Expertise (comma separated)'],['researchInterests','Research interests'],['orcid','ORCID'],['linkedin','LinkedIn URL'],['website','Professional website']] as const).map(([key,label]) => <div key={key}><Label>{label}</Label><Input className="mt-2" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}
      <div className="md:col-span-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save professional profile"}</Button></div>
    </CardContent></Card>
  </div>;
}
