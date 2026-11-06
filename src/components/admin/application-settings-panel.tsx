"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  settingsPayload,
  useApplicationSettings,
  type ApplicationSettings,
  type OrganizationUnit,
} from "@/lib/application-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save } from "lucide-react";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const newUnit = (): OrganizationUnit => ({ id: crypto.randomUUID(), name: "", code: "", active: true });

export type SetupSection = "organization" | "academic-years" | "administration" | "history";
export function ApplicationSettingsPanel({ section = "organization" }: { section?: SetupSection }) {
  const headings = {
    organization: "Institutions & departments",
    "academic-years": "Academic years",
    administration: "Application controls",
    history: "Change history",
  };
  const { settings, setSettings, loading, error } = useApplicationSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();
  const [institutionId, setInstitutionId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  if (loading && !settings) return <p role="status">Loading application settings…</p>;
  if (!settings)
    return (
      <p role="alert" className="text-destructive">
        {error || "Application settings unavailable"}
      </p>
    );
  const institution = settings.institutions.find((item) => item.id === institutionId) || settings.institutions[0];
  const colleges = settings.colleges.filter((item) => item.institutionId === institution.id);
  const college = colleges.find((item) => item.id === collegeId) || colleges[0];
  const change = (patch: Partial<ApplicationSettings>) => {
    setSettings({ ...settings, ...patch });
    setDirty(true);
    setMessage("");
  };
  const updateInstitution = (patch: Partial<OrganizationUnit>) =>
    change({
      institutions: settings.institutions.map((item) => (item.id === institution.id ? { ...item, ...patch } : item)),
    });
  const updateCollege = (patch: Partial<ApplicationSettings["colleges"][number]>) =>
    change({ colleges: settings.colleges.map((item) => (item.id === college?.id ? { ...item, ...patch } : item)) });
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const result = await apiFetch<{ data: ApplicationSettings }>("/settings", {
        method: "PUT",
        body: settingsPayload(settings),
      });
      setSettings(result.data);
      setDirty(false);
      window.dispatchEvent(new Event("application-settings-updated"));
      toast({
        title: "Application settings saved",
        description: "Organization, academic years, and administration rules updated.",
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application setup</p>
          <h1 className="text-3xl font-semibold tracking-tight">{headings[section]}</h1>
          <p className="text-sm text-muted-foreground">
            {
              {
                organization: "Manage institutions, their colleges, and each college's departments.",
                "academic-years": "Choose the current academic year and control when years are open.",
                administration: "Configure organization details and account rules across the application.",
                history: "Review saved application configuration changes.",
              }[section]
            }
          </p>
        </div>
        {section !== "history" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={saving || !dirty}
              onClick={() => {
                window.dispatchEvent(new Event("application-settings-updated"));
                setDirty(false);
                setMessage("");
              }}
            >
              Discard changes
            </Button>
            <Button onClick={save} disabled={saving || !dirty}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </div>
      {(message || error) && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
          {message || error}
        </p>
      )}
      {dirty && (
        <p role="status" className="text-sm text-muted-foreground">
          You have unsaved changes.
        </p>
      )}
      <fieldset disabled={saving} className="min-w-0">
        {section === "organization" && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Institutions</CardTitle>
                <CardDescription>
                  Colleges belong to an institution; departments belong to a college. Archive units to retain their
                  history. Transfer assigned users before removing or renaming a unit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <select
                    aria-label="Select institution"
                    className={selectClass}
                    value={institution.id}
                    onChange={(event) => {
                      setInstitutionId(event.target.value);
                      setCollegeId("");
                    }}
                  >
                    {settings.institutions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name || "New institution"}
                        {!item.active ? " (archived)" : ""}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const item = newUnit();
                      change({ institutions: [...settings.institutions, item] });
                      setInstitutionId(item.id);
                      setCollegeId("");
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Institution
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="institution-name">Institution name</Label>
                    <Input
                      id="institution-name"
                      value={institution.name}
                      onChange={(event) => updateInstitution({ name: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution-code">Institution code</Label>
                    <Input
                      id="institution-code"
                      maxLength={30}
                      value={institution.code}
                      onChange={(event) => updateInstitution({ code: event.target.value })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={institution.active}
                    onChange={(event) => {
                      const active = event.target.checked;
                      change({
                        institutions: settings.institutions.map((item) =>
                          item.id === institution.id ? { ...item, active } : item,
                        ),
                        colleges: settings.colleges.map((item) =>
                          item.institutionId === institution.id && !active ? { ...item, active: false } : item,
                        ),
                      });
                    }}
                  />
                  Active institution
                </label>
                <Button
                  variant="outline"
                  onClick={() =>
                    change({ institutions: settings.institutions.filter((item) => item.id !== institution.id) })
                  }
                  disabled={settings.institutions.length === 1 || colleges.length > 0}
                >
                  Remove empty institution
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Colleges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <select
                    aria-label="Select college"
                    className={selectClass}
                    value={college?.id || ""}
                    onChange={(event) => setCollegeId(event.target.value)}
                  >
                    {!colleges.length && <option value="">No colleges yet</option>}
                    {colleges.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name || "New college"}
                        {!item.active ? " (archived)" : ""}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    disabled={!institution.active}
                    onClick={() => {
                      const item = { ...newUnit(), institutionId: institution.id, departments: [] };
                      change({ colleges: [...settings.colleges, item] });
                      setCollegeId(item.id);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    College
                  </Button>
                </div>
                {college && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="college-name">College name</Label>
                        <Input
                          id="college-name"
                          value={college.name}
                          onChange={(event) => updateCollege({ name: event.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="college-code">College code</Label>
                        <Input
                          id="college-code"
                          maxLength={30}
                          value={college.code}
                          onChange={(event) => updateCollege({ code: event.target.value })}
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={college.active}
                        disabled={!institution.active}
                        onChange={(event) => updateCollege({ active: event.target.checked })}
                      />
                      Active college
                    </label>
                    <Button
                      variant="outline"
                      onClick={() => change({ colleges: settings.colleges.filter((item) => item.id !== college.id) })}
                    >
                      Remove college
                    </Button>
                    <div className="flex items-center justify-between border-t pt-4">
                      <h3 className="font-semibold">Departments ({college.departments.length})</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCollege({ departments: [...college.departments, newUnit()] })}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Department
                      </Button>
                    </div>
                    <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                      {college.departments.map((department, index) => (
                        <div
                          key={department.id}
                          className="grid grid-cols-1 items-center gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_100px_auto_auto]"
                        >
                          <Input
                            aria-label={`Department ${index + 1} name`}
                            placeholder="Department name"
                            value={department.name}
                            onChange={(event) =>
                              updateCollege({
                                departments: college.departments.map((item) =>
                                  item.id === department.id ? { ...item, name: event.target.value } : item,
                                ),
                              })
                            }
                          />
                          <Input
                            aria-label={`Department ${index + 1} code`}
                            placeholder="Code"
                            maxLength={30}
                            value={department.code}
                            onChange={(event) =>
                              updateCollege({
                                departments: college.departments.map((item) =>
                                  item.id === department.id ? { ...item, code: event.target.value } : item,
                                ),
                              })
                            }
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={department.active}
                              onChange={(event) =>
                                updateCollege({
                                  departments: college.departments.map((item) =>
                                    item.id === department.id ? { ...item, active: event.target.checked } : item,
                                  ),
                                })
                              }
                            />
                            Active
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateCollege({
                                departments: college.departments.filter((item) => item.id !== department.id),
                              })
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {section === "academic-years" && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Academic years</CardTitle>
                <CardDescription>
                  The current year becomes the default across the workspace. Closed years remain available for reports
                  and block new credit submissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label htmlFor="current-academic-year">Current academic year</Label>
                <select
                  id="current-academic-year"
                  className={selectClass}
                  value={settings.currentAcademicYear}
                  onChange={(event) => change({ currentAcademicYear: event.target.value })}
                >
                  {settings.academicYears
                    .filter((year) => year.status === "open")
                    .map((year) => (
                      <option key={year.id}>{year.id}</option>
                    ))}
                </select>
                {settings.academicYears.map((year, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4">
                    <div>
                      <Label htmlFor={`year-${index}`}>Year (YYYY-YY)</Label>
                      <Input
                        id={`year-${index}`}
                        value={year.id}
                        placeholder="2027-28"
                        onChange={(event) =>
                          change({
                            academicYears: settings.academicYears.map((item, i) =>
                              i === index ? { ...item, id: event.target.value } : item,
                            ),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`year-start-${index}`}>Start date</Label>
                      <Input
                        id={`year-start-${index}`}
                        type="date"
                        value={year.startDate}
                        onChange={(event) =>
                          change({
                            academicYears: settings.academicYears.map((item, i) =>
                              i === index ? { ...item, startDate: event.target.value } : item,
                            ),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`year-end-${index}`}>End date</Label>
                      <Input
                        id={`year-end-${index}`}
                        type="date"
                        value={year.endDate}
                        onChange={(event) =>
                          change({
                            academicYears: settings.academicYears.map((item, i) =>
                              i === index ? { ...item, endDate: event.target.value } : item,
                            ),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`year-status-${index}`}>Status</Label>
                      <select
                        id={`year-status-${index}`}
                        className={selectClass}
                        value={year.status}
                        onChange={(event) =>
                          change({
                            academicYears: settings.academicYears.map((item, i) =>
                              i === index ? { ...item, status: event.target.value as "open" | "closed" } : item,
                            ),
                          })
                        }
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const start =
                      Math.max(
                        ...settings.academicYears.map(
                          (year) => Number(year.id.slice(0, 4)) || new Date().getFullYear(),
                        ),
                      ) + 1;
                    change({
                      academicYears: [
                        ...settings.academicYears,
                        {
                          id: `${start}-${String(start + 1).slice(-2)}`,
                          startDate: `${start}-06-01`,
                          endDate: `${start + 1}-05-31`,
                          status: "open",
                        },
                      ],
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add next academic year
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {section === "administration" && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Administration rules</CardTitle>
                <CardDescription>These account controls are enforced by the server.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="organization-name">Organization display name</Label>
                  <Input
                    id="organization-name"
                    value={settings.organizationName}
                    onChange={(event) => change({ organizationName: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="support-email">Support email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(event) => change({ supportEmail: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="minimum-password">
                    Minimum password length for admin-created and reset passwords
                  </Label>
                  <Input
                    id="minimum-password"
                    type="number"
                    min={12}
                    max={128}
                    value={settings.passwordMinLength}
                    onChange={(event) => change({ passwordMinLength: Number(event.target.value) })}
                  />
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.transfersEnabled}
                    onChange={(event) => change({ transfersEnabled: event.target.checked })}
                  />
                  Allow department and college transfers
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.requireTransferReason}
                    onChange={(event) => change({ requireTransferReason: event.target.checked })}
                  />
                  Require a reason for every transfer
                </label>
              </CardContent>
            </Card>
          </div>
        )}
        {section === "history" && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Settings change history</CardTitle>
                <CardDescription>The most recent 100 saves, with administrator and changed sections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!settings.audit?.length && <p className="text-sm text-muted-foreground">No settings changes yet.</p>}
                {[...(settings.audit || [])].reverse().map((entry, i) => (
                  <div key={`${entry.at}-${i}`} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {entry.actor || entry.by} · {new Date(entry.at).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">{entry.fields.join(", ") || "Saved without changes"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </fieldset>
    </div>
  );
}
