"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Account = {
  _id: string;
  name: string;
  email: string;
  role: string;
  college: string;
  department?: string;
  isActive: boolean;
  facultyID?: string;
};

export function UserBulkActions({ users, onComplete }: { users: Account[]; onComplete: () => void }) {
  const [action, setAction] = useState<"activate" | "deactivate" | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);
  const run = async () => {
    setBusy(true);
    setResult("");
    setProgress(0);
    const failures: string[] = [];
    let done = 0;
    for (const user of users) {
      try {
        const body = new FormData();
        body.append("isActive", String(action === "activate"));
        await apiFetch(`/users/${user._id}`, { method: "PUT", body });
        done++;
      } catch (error) {
        failures.push(`${user.name}: ${error instanceof Error ? error.message : "Failed"}`);
      }
      setProgress(done + failures.length);
    }
    setResult(
      `${done} account(s) updated.${failures.length ? ` ${failures.length} failed: ${failures.join("; ")}` : ""}`,
    );
    setBusy(false);
    setAction(null);
    onComplete();
  };
  const exportUsers = () => {
    // Quote fields and neutralize spreadsheet formulas in user-entered values.
    const cell = (value: unknown) =>
      `"${String(value ?? "")
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replace(/"/g, '""')}"`;
    const lines = [
      ["Faculty ID", "Name", "Email", "Role", "College", "Department", "Status"],
      ...users.map((user) => [
        user.facultyID,
        user.name,
        user.email,
        user.role,
        user.college,
        user.department,
        user.isActive ? "Active" : "Inactive",
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", lines.map((row) => row.map(cell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "selected-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm text-muted-foreground">{users.length} selected on this page</span>
        <Button size="sm" variant="outline" disabled={!users.length || busy} onClick={() => setAction("activate")}>
          Activate selected
        </Button>
        <Button size="sm" variant="outline" disabled={!users.length || busy} onClick={() => setAction("deactivate")}>
          Deactivate selected
        </Button>
        <Button size="sm" variant="outline" disabled={!users.length || busy} onClick={exportUsers}>
          Export selected CSV
        </Button>
      </div>
      {result && (
        <p role="status" className="text-sm">
          {result}
        </p>
      )}
      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !busy) setAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "activate" ? "Activate" : "Deactivate"} {users.length} accounts?
            </DialogTitle>
            <DialogDescription>
              {action === "deactivate"
                ? "Selected accounts will lose access and their sessions will be revoked. Their records are retained."
                : "Selected accounts will regain access. Their current roles and placement are retained."}{" "}
              Your own account and protected accounts cannot be deactivated.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={run} disabled={busy}>
            {busy ? `Processing ${progress}/${users.length}…` : "Confirm account changes"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
