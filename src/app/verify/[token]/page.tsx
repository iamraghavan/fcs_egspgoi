"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, FileCheck2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VerifiedDocument = {
  documentId: string;
  issuedAt: string;
  documentType: string;
  subject: { facultyId?: string; facultyName?: string; scope?: string; scopeId?: string | null } | null;
  totals: Record<string, string | number> | null;
  contentHash: string;
  algorithm: string;
};

export default function VerifyExportPage() {
  const { token } = useParams<{ token: string }>();
  const [document, setDocument] = useState<VerifiedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetch(`/api/v1/exports/verify/${encodeURIComponent(token)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.valid) throw new Error("This document signature is invalid or cannot be verified.");
        setDocument(body.document);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message || "Verification failed.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  return (
    <main className="min-h-screen bg-muted px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className={error ? "bg-danger text-destructive-foreground" : "bg-nav-bg text-nav-text-active"}>
            <div className="flex items-center gap-3">
              {error ? <ShieldAlert className="h-8 w-8" /> : <FileCheck2 className="h-8 w-8" />}
              <div>
                <CardTitle>FCS Document Verification</CardTitle>
                <p className="mt-1 text-sm text-white/80">E.G.S. Pillay Group of Institutions</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && <p className="text-muted-foreground">Checking the cryptographic signature…</p>}
            {error && (
              <div role="alert">
                <h2 className="font-semibold text-danger-text">Document not verified</h2>
                <p className="mt-2 text-sm text-foreground">{error}</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Do not rely on this document. Contact an authorized FCS administrator.
                </p>
              </div>
            )}
            {document && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success-bg p-4">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success-text" />
                  <div>
                    <h2 className="font-semibold text-success-text">Valid FCS signature</h2>
                    <p className="text-sm text-success-text">
                      The signed metadata and content fingerprint have not been altered.
                    </p>
                  </div>
                </div>

                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Detail label="Document ID" value={document.documentId} />
                  <Detail label="Document type" value={document.documentType.replaceAll("_", " ")} />
                  <Detail label="Issued at" value={new Date(document.issuedAt).toLocaleString("en-IN")} />
                  <Detail label="Signature" value={document.algorithm} />
                  {document.subject?.facultyName && <Detail label="Faculty" value={document.subject.facultyName} />}
                  {document.subject?.facultyId && <Detail label="Faculty ID" value={document.subject.facultyId} />}
                  {document.subject?.scope && (
                    <Detail
                      label="Report scope"
                      value={`${document.subject.scope}${document.subject.scopeId ? ` — ${document.subject.scopeId}` : ""}`}
                    />
                  )}
                </dl>

                {document.totals && (
                  <section>
                    <h3 className="mb-2 font-semibold text-foreground">Signed totals</h3>
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Object.entries(document.totals).map(([label, value]) => (
                        <div key={label} className="rounded-md bg-muted p-3 text-center">
                          <dt className="text-xs capitalize text-muted-foreground">{label}</dt>
                          <dd className="font-semibold text-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                <section>
                  <h3 className="mb-1 font-semibold text-foreground">Content fingerprint (SHA-256)</h3>
                  <code className="block break-all rounded bg-foreground p-3 text-xs text-background">
                    {document.contentHash}
                  </code>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The fingerprint validates the canonical export data. Private rows and evidence are intentionally not
                    displayed publicly.
                  </p>
                </section>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}
