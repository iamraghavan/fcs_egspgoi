import type { CSSProperties } from "react";

/** Shared Recharts tooltip look, read from design tokens (works in light and dark). */
export const chartTooltipStyle: CSSProperties = {
  backgroundColor: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius-control)",
  boxShadow: "var(--shadow-md)",
  fontSize: "var(--font-size-caption)",
};
