"use client";

import { useState } from "react";
import { ArrowRightLeft, History } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ApplicationSettings } from "@/lib/application-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Transfer = {
  id: string;
  at: string;
  actor: string;
  reason: string;
  from: { college: string; department: string };
  to: { college: string; department: string };
};
type TransferUser = {
  _id: string;
  name: string;
  role: string;
  college: string;
  department?: string;
  facultyID?: string;
  updatedAt?: string;
  transferHistory?: Transfer[];
};
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function UserTransfer({
  user,
  settings,
  onTransferred,
}: {
  user: TransferUser;
  settings: ApplicationSettings | null;
  onTransferred: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(user);
  const [institutionId, setInstitutionId] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const colleges = settings?.colleges.filter((item) => item.institutionId === institutionId && item.active) || [];
  const departments = colleges.find((item) => item.name === college)?.departments.filter((item) => item.active) || [];
  const show = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    setReason("");
    setCollege("");
    setDepartment("");
    setInstitutionId("");
    try {
      const result = await apiFetch<{ data: TransferUser }>(`/users/${user._id}`);
      setCurrent(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user");
    } finally {
      setLoading(false);
    }
  };
  const transfer = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/users/${user._id}/transfer`, {
        method: "POST",
        body: { college, department, reason, expectedUpdatedAt: current.updatedAt },
      });
      setOpen(false);
      onTransferred();
      toast({
        title: "User transferred",
        description: "Placement and employment history updated. Previous sessions revoked.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to transfer user");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={`Transfer ${user.name} or view transfer history`}
        disabled={user.role === "superadmin" || !settings}
        onClick={show}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Transfer user</DialogTitle>
            <DialogDescription>
              Move {user.name} between departments, colleges, or institutions. Their user ID, faculty ID, credits, and
              previous records are preserved.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <p role="status">Loading current placement…</p>
          ) : (
            <>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">
                  {current.name} · {current.facultyID}
                </p>
                <p>
                  {current.college} / {current.department || "No department"}
                </p>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {!settings?.transfersEnabled && (
                <p className="text-sm text-muted-foreground">Transfers are disabled in Application settings.</p>
              )}
              <form onSubmit={transfer} className="space-y-4">
                <fieldset disabled={saving || !settings?.transfersEnabled} className="space-y-4">
                  <div>
                    <Label htmlFor={`transfer-institution-${user._id}`}>Destination institution</Label>
                    <select
                      id={`transfer-institution-${user._id}`}
                      className={selectClass}
                      required
                      value={institutionId}
                      onChange={(event) => {
                        setInstitutionId(event.target.value);
                        setCollege("");
                        setDepartment("");
                      }}
                    >
                      <option value="">Choose institution</option>
                      {settings?.institutions
                        .filter((item) => item.active)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`transfer-college-${user._id}`}>Destination college</Label>
                    <select
                      id={`transfer-college-${user._id}`}
                      className={selectClass}
                      required
                      value={college}
                      onChange={(event) => {
                        setCollege(event.target.value);
                        setDepartment("");
                      }}
                    >
                      <option value="">Choose college</option>
                      {colleges.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`transfer-department-${user._id}`}>Destination department</Label>
                    <select
                      id={`transfer-department-${user._id}`}
                      className={selectClass}
                      required={current.role === "faculty"}
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                    >
                      <option value="">Choose department</option>
                      {departments.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`transfer-reason-${user._id}`}>
                      Transfer reason {settings?.requireTransferReason ? "(required)" : "(optional)"}
                    </Label>
                    <textarea
                      id={`transfer-reason-${user._id}`}
                      className="min-h-20 w-full rounded-md border bg-background p-3 text-sm"
                      maxLength={1000}
                      required={settings?.requireTransferReason}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The transfer takes effect immediately. The user must sign in again.
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      saving || !college || (current.college === college && (current.department || "") === department)
                    }
                  >
                    {saving ? "Transferring…" : "Confirm transfer"}
                  </Button>
                </fieldset>
              </form>
              <div className="space-y-3 border-t pt-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <History className="h-4 w-4" />
                  Transfer history
                </h3>
                {!current.transferHistory?.length && (
                  <p className="text-sm text-muted-foreground">No recorded transfers.</p>
                )}
                {[...(current.transferHistory || [])].reverse().map((item) => (
                  <div key={item.id} className="space-y-1 rounded-md border p-3 text-sm">
                    <p>
                      {item.from.college} / {item.from.department || "—"}
                    </p>
                    <p className="font-medium">
                      → {item.to.college} / {item.to.department || "—"}
                    </p>
                    <p>{item.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.at).toLocaleString()} · {item.actor}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
