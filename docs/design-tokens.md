# Design Tokens — how to use them

**One source of truth:** `scripts/tokens/tokens.config.mjs`.
After editing it, run `node scripts/tokens/build-tokens.mjs`. This:

1. writes `src/styles/tokens.css` (light values on `:root`, dark values on `.dark`, plus radius, shadow, type, spacing and motion scales);
2. checks every text/background pair in both themes against WCAG AA and writes `docs/contrast-report.json`. A failing pair is printed as `FAIL`.

`node scripts/tokens/build-tokens.mjs --check` only checks; it writes nothing (useful in CI).

Never hard-code a hex value or a raw Tailwind palette class (`bg-green-100`, `text-red-700`) in components.
Use the classes below. They switch automatically between light and dark.

## Colour classes

| Use for                     | Class                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Page background             | `bg-background`                                                                                            |
| Cards, panels, popovers     | `bg-card` / `bg-surface`, `bg-popover`                                                                     |
| Subtle areas, table headers | `bg-muted` / `bg-surface-2`                                                                                |
| Main text / secondary text  | `text-foreground`, `text-foreground-2`, `text-muted-foreground`                                            |
| Primary action / link       | `bg-primary text-primary-foreground`, hover `bg-primary-hover`; links `text-link`                          |
| Primary tints               | `bg-primary-50`, `bg-primary-100`, `border-primary-200`, `text-primary-700`                                |
| Borders                     | `border` (default colour), `border-border-strong`, inputs `border-input`                                   |
| Status (badge/alert)        | `bg-success-bg text-success-text`, same for `warning`, `danger`, `info`, `violet`                          |
| Status (solid dot/bar/icon) | `bg-success`, `text-success` (and `warning` / `danger` / `info` / `violet`)                                |
| Credits / achievements      | `text-credit-text` (text), `bg-credit-400` / `bg-credit-500` (fills)                                       |
| Destructive button          | `bg-destructive text-destructive-foreground`                                                               |
| Charts                      | `hsl(var(--chart-1))` … `hsl(var(--chart-7))`; tooltip style: `chartTooltipStyle` from `@/lib/chart-theme` |
| Sidebar (Phase 2)           | `bg-nav-bg`, `hover:bg-nav-hover`, `bg-nav-active`, `text-nav-text`, `text-nav-text-active`                |

Opacity modifiers work on all of them (`bg-primary/10`, `border-danger/40`).
In inline styles and SVG, use `hsl(var(--token))`. In SVG prefer classes (`fill-primary`, `stroke-foreground`),
because `var()` does not work in SVG presentation attributes.

## Type, spacing, shape

| Token                           | Class                                                               | Value                                      |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Caption (smallest text allowed) | `text-caption` (= `text-xs`)                                        | 12 / 16 px                                 |
| Body                            | `text-body` (= `text-sm`)                                           | 14 / 20 px                                 |
| Body large                      | `text-body-lg`                                                      | 16 / 24 px                                 |
| Small title                     | `text-title-sm`                                                     | 18 / 24 px                                 |
| Section title                   | `text-section`                                                      | 20 / 28 px                                 |
| Page title                      | `text-page`                                                         | 24 / 30 px                                 |
| KPI number                      | `text-kpi`                                                          | 30 / 36 px                                 |
| Numbers in tables/KPIs          | `tabular-nums` (automatic inside `<table>` and on `[data-numeric]`) |                                            |
| Spacing (8-pt grid)             | `1 2 3 4 6 8 12 16` → 4 8 12 16 24 32 48 64 px                      | `p-4`, `gap-6`, …                          |
| Radius: inputs/buttons          | `rounded-md`                                                        | 6 px                                       |
| Radius: cards                   | `rounded-lg`                                                        | 8 px                                       |
| Radius: modals/drawers          | `rounded-xl`                                                        | 12 px                                      |
| Pills / avatars                 | `rounded-full`                                                      | 999 px                                     |
| Elevation                       | `shadow-sm`, `shadow-md`, `shadow-lg`                               | token shadows                              |
| Motion                          | `duration-fast` / `duration-base` / `duration-slow`                 | 150 / 200 / 250 ms (0 with reduced motion) |

Rules: no text below 12 px. No all-caps, except sidebar group labels (Phase 2) and monospace identifiers such as faculty IDs.

## Theme

`next-themes` sets the `dark` class on `<html>`. The choice (`light` / `dark` / `system`) is stored in
`localStorage.theme`, survives sign-out, and is changed from the header's theme menu.

## Temporary aliases (to be removed)

`--cds-*` variables and `cds-*` Tailwind classes are the old IBM Carbon names. They now point at the
tokens above, so old screens already follow the new palette and dark mode. Each screen drops them when it
is migrated (Phases 3–7).

## Admissions microsite

`src/app/admissions/*` is out of scope and keeps its previous look. Its layout adds the `.legacy-theme`
class (to its wrapper and to `<html>` while open). That class re-declares the old values: square corners,
IBM Plex, always light. See `src/app/globals.css`.
