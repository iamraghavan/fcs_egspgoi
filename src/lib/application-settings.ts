"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type OrganizationUnit = { id: string; name: string; code: string; active: boolean };
export type ManagedCollege = OrganizationUnit & { institutionId: string; departments: OrganizationUnit[] };
export type AcademicYear = { id: string; startDate: string; endDate: string; status: "open" | "closed" };
export type ApplicationSettings = {
  revision: number;
  organizationName: string;
  supportEmail: string;
  passwordMinLength: number;
  transfersEnabled: boolean;
  requireTransferReason: boolean;
  institutions: OrganizationUnit[];
  colleges: ManagedCollege[];
  academicYears: AcademicYear[];
  currentAcademicYear: string;
  updatedAt?: string;
  audit?: { at: string; by: string; actor: string; fields: string[] }[];
};

const pendingReads = new Map<string, Promise<{ data: ApplicationSettings }>>();
function readSettings() {
  const token = localStorage.getItem("token") || "";
  let pending = pendingReads.get(token);
  if (!pending) {
    pending = apiFetch<{ data: ApplicationSettings }>("/settings").finally(() => pendingReads.delete(token));
    pendingReads.set(token, pending);
  }
  return pending;
}

export function settingsPayload(settings: ApplicationSettings) {
  const {
    revision,
    organizationName,
    supportEmail,
    passwordMinLength,
    transfersEnabled,
    requireTransferReason,
    institutions,
    colleges,
    academicYears,
    currentAcademicYear,
  } = settings;
  return {
    revision,
    organizationName,
    supportEmail,
    passwordMinLength,
    transfersEnabled,
    requireTransferReason,
    institutions,
    colleges,
    academicYears,
    currentAcademicYear,
  };
}

export function useApplicationSettings() {
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = () => {
      setLoading(true);
      readSettings()
        .then((result) => {
          if (active) {
            setSettings(result.data);
            setError("");
          }
        })
        .catch((err: Error) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load();
    window.addEventListener("application-settings-updated", load);
    return () => {
      active = false;
      window.removeEventListener("application-settings-updated", load);
    };
  }, []);
  return { settings, setSettings, loading, error };
}

export function managedColleges(
  settings: ApplicationSettings,
  activeOnly = false,
): Record<string, Record<string, string[]>> {
  return Object.fromEntries(
    settings.colleges
      .filter(
        (college) =>
          !activeOnly ||
          (college.active && settings.institutions.some((item) => item.id === college.institutionId && item.active)),
      )
      .map((college) => [
        college.name,
        { Departments: college.departments.filter((item) => !activeOnly || item.active).map((item) => item.name) },
      ]),
  );
}
