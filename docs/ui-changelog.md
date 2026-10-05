# UI Changelog (redesign, branch `ui-redesign`)

UI layer only. No API, schema, auth or business-logic changes. Admissions microsite unchanged.

## Phase 1 — Foundation (tokens, type, theme, icons)

- **One token source:** `scripts/tokens/tokens.config.mjs` → `src/styles/tokens.css` (light + dark), with a WCAG
  contrast check at build time. Tokens are mapped onto the shadcn variable names, so existing components restyled
  automatically. See `docs/design-tokens.md`.
- **Inter** is the only UI font. IBM Plex is loaded only inside admissions. Tabular numbers in tables and KPIs.
- **Theme:** light / dark / match system (next-themes), remembered on the device and kept after sign-out.
- **Icons:** the Material Symbols icon names, which showed as raw words because the font was never loaded, are
  replaced with Lucide icons. Icon-only buttons now have accessible names.
- **Codemod** (`scripts/codemods/phase1-tokens.mjs`):
  - raw Tailwind palette colours → semantic tokens;
  - text below 12 px → 12 px caption;
  - all-caps styling removed (kept for monospace IDs);
  - hex colours → tokens (charts use a shared tooltip style).

## Phase 2 — App shell (Zoho-style interaction model) + Carbon removal

- **IBM Carbon look removed everywhere (outside admissions):**
  - `cds-*` classes and variables are gone;
  - square corners (`rounded-none`) are gone;
  - underline inputs → bordered 6 px fields;
  - chart axis text raised to 12 px.

  Codemod: `scripts/codemods/phase2-remove-carbon.mjs`.

- **Three-level navigation:**
  - **Primary rail** (88 px, navy, ≤ 7 items per role):
    - icon + label, with the active module in an accent-coloured pill and tooltips;
    - Create "+", Appearance and the account menu at the bottom.
  - **Secondary panel** (240 px): module pages in labelled groups.
    - The academic-year switcher sits on top.
    - It is collapsible and remembered; it starts collapsed below 1280 px.
  - **Top bar** (56 px):
    - breadcrumb (module › page);
    - ⌘K / Ctrl+K command palette, covering pages, create actions and the existing record search;
    - notifications with unread count (faculty and OA);
    - Help and the institution name.
  - **Phones** (< 768 px): one bottom sheet holds all navigation, Create, Appearance and the year switcher. The account menu moves to the top bar.
- **Academic-year switcher:**
  - one value for the whole workspace, stored in `?ay=` (shareable) and on the device;
  - wired into faculty Home, Good Works ("All years" supported there) and admin Home.
- **Appearance menu:**
  - mode, plus 6 accent themes: Blue, Indigo, Teal, Purple, Rose, Orange;
  - only primary colours change, never status colours;
  - remembered, with no colour flash on load;
  - every accent × mode passes WCAG AA (`docs/contrast-accents.md`).
- **Quick Create (+):** role-aware shortcuts to the existing create pages.
- **Role guard (G11):** opening another role's page sends you to your own Home with a message. This fixes the two
  known bugs "faculty can open admin/OA page URLs".
- **Skip to content** link, and `aria-current` on the active rail, panel and breadcrumb items.
- Page titles come from the navigation ("Submit Good Work · Name · CreditWise").
- Removed: old header, sidebar, user menu, theme toggle and global search components. They are replaced by `src/components/shell/*`.

### Fixed during Phase 2

- **Borders showed in the text colour since Phase 1.**
  - Cause: the token build wrote `--border: var(--border)`, a self-reference that browsers treat as invalid, so every border fell back to the text colour (heavy dark outlines in light mode, light ones in dark).
  - Fix: the generator now skips identity aliases.
- **Admissions had picked up the new input style and the 14 px base text.** It now has the legacy underline fields and 16 px base text again. A pixel comparison against the original screenshot differs by 0.18%, which is the dev-only "N" badge moving corners and logo anti-aliasing.

### Not in Phase 2 (by plan or because the API does not support it yet)

See `docs/ui-audit.md` §9.3 (conflicts C1–C13) and `docs/backend-requests.md`.

- Status sub-views and panel counts arrive with the view system (Phase 4).
- Drawer forms for Quick Create come in Phase 3.
- The OA Home page comes in Phase 7.
- "Appeal a remark" in Quick Create always shows. Hiding it when nothing is appealable would need an "appealable
  count" from the API, or a remarks fetch in the shell. Revisit in Phase 4.
