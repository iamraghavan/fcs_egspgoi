/** Academic years run June → May and are written "2025-26" (same rule the pages already use). */
export function getCurrentAcademicYear(today = new Date()): string {
  const y = today.getFullYear();
  const start = today.getMonth() >= 5 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

/** The current academic year and the `count - 1` before it, newest first. */
export function academicYearOptions(count = 5, today = new Date()): string[] {
  const start = Number(getCurrentAcademicYear(today).slice(0, 4));
  return Array.from({ length: count }, (_, i) => `${start - i}-${String(start - i + 1).slice(-2)}`);
}

export const ALL_YEARS = "all";

export function isAcademicYear(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}
