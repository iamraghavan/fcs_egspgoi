# UI/UX Audit — Phase 0 (CreditWise / Faculty Credit System, frontend)

**Date:** 2026-10-05 · **Branch inspected:** `audit-and-testing` (includes the security/quality fixes from the earlier audit)
**Method:** source inspection of every route and shared component, plus results from the existing automated tests
(axe accessibility scans, Playwright journeys in 5 browsers/devices, component tests). **No code was changed in this phase.**

---

## 1. Stack inventory

| Area              | What exists                                                                                                                                                     | Notes for the redesign                                                                                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | **Next.js 15.5 (App Router)**, React 18, TypeScript (0 type errors)                                                                                             | All pages are client components (`"use client"`) that fetch in `useEffect`                                                                                                                                                                                                                |
| Styling           | **Tailwind CSS 3** + CSS variables in `src/app/globals.css` (76 variables)                                                                                      | **Two token systems mixed**: IBM Carbon (`--cds-*`, 337 class uses) and shadcn (`--primary`, `--muted`…, 845 uses), plus **210 raw palette classes** (`text-blue-700`, `bg-green-50`…), **49 hard-coded hex values** (3 files) and **214 arbitrary values** (`text-[10px]`, `w-[220px]`…) |
| Dark mode         | `.dark` token block exists, Tailwind `darkMode: ['class']`                                                                                                      | **No way to switch it on** (no toggle, no `next-themes`); only 28 `dark:` classes, so it would look broken if enabled                                                                                                                                                                     |
| Component library | **shadcn/ui on Radix** in `src/components/ui` (button, input, select, dialog, sheet, table, tabs, toast, tooltip, skeleton, sidebar, command, calendar, chart…) | Good base. **Missing:** DataTable, StatusBadge, EmptyState, ErrorState, FormField, Stepper, Drawer pattern, KPI card, ProgressRing, Timeline, ConfirmDialog, FileUpload (one exists in `components/file-upload.tsx`)                                                                      |
| Other UI libs     | **MUI + Emotion** (3 files, phone input only), **GSAP** (6 files, entrance animations), **Recharts** (4 files), **Material Symbols** icon names (3 pages)       | MUI duplicates Radix; GSAP adds weight for small fades; **the Material Symbols font is never loaded**, so those icons render as words (e.g. "chevron_left") — visible bug                                                                                                                 |
| Icons             | **lucide-react** (main), plus the broken Material Symbols above                                                                                                 | Standardise on Lucide (as the brief prefers)                                                                                                                                                                                                                                              |
| Fonts             | `next/font`: **Inter**, IBM Plex Sans, IBM Plex Mono                                                                                                            | Inter already loaded; Plex can go                                                                                                                                                                                                                                                         |
| Routing           | App Router under `/u/portal/...`; **user id carried in the URL (`?uid=`)** on every page                                                                        | Role is not part of the route guard (bug F-01 from the audit)                                                                                                                                                                                                                             |
| State / data      | Local `useState` per page + `localStorage` token; **~95 direct `fetch` calls**; new shared client `src/lib/api.ts` used by 2 screens                            | No caching (TanStack Query not present), no optimistic updates                                                                                                                                                                                                                            |
| Forms             | react-hook-form + zod installed, **barely used** (most forms are hand-rolled state)                                                                             | —                                                                                                                                                                                                                                                                                         |
| Tests             | Jest + RTL + MSW (68 tests), Playwright E2E incl. axe (91 runs)                                                                                                 | Must stay green after each phase                                                                                                                                                                                                                                                          |
| Analytics         | **None** (Firebase Analytics imported but unused)                                                                                                               | `track()` wrapper to be added (Phase 8)                                                                                                                                                                                                                                                   |

### Folder structure (relevant parts)

```
src/
  app/
    layout.tsx                       root: fonts, AlertProvider, Toaster
    u/portal/auth/…                  login, MFA step, forgot/reset password, WhatsApp verify
    u/portal/dashboard/layout.tsx    app shell (SidebarProvider + DashboardClientWrapper)
    u/portal/dashboard/…             faculty pages
    u/portal/dashboard/admin/…       admin pages
    u/portal/dashboard/oa/…          office-assistant pages
    verify/[token]                   public export verification
    admissions/…                     unrelated BNYS admissions microsite
  components/        header, sidebar-nav, user-nav, global-search, forms, dialogs
  components/ui/     shadcn primitives (+ login-1.tsx, global-alert.tsx, help-section.tsx)
  hooks/ lib/ context/
```

---

## 2. Reality check: the brief vs. the product that exists

The brief describes a generic "credit claim" product. The real app differs in important ways. **Design must follow the real data and API** (hard rule 2); anything else goes to `docs/backend-requests.md`.

| Brief assumes                                                                                 | Reality today                                                                                                                                                                                                                                                      | Consequence for the redesign                                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles Faculty, Reviewer (HOD/IQAC/Dean), Institution Admin, Super Admin                       | Roles **faculty, oa (office assistant), admin, superadmin**. Reviewing is done by **admin**. No HOD/IQAC/Dean, no department scoping                                                                                                                               | Reviewer screens are built for **admin**; HOD/IQAC = backend request                                                                                           |
| "Credit claims" with statuses Draft → Submitted → Under Review → Returned → Approved/Rejected | Two kinds of credit: **positive ("Good Works")** `pending → approved / rejected` (faculty can edit/withdraw while pending), and **negative ("Remarks")** issued by OA/admin, which faculty can **appeal** (`appealed → accepted / rejected`, max 2, 14-day window) | Status badges map to real statuses (§6). **No Draft and no "Returned for changes"** → backend request; autosave drafts can only be **local (browser)** for now |
| Credit **target** per faculty, "earned / target" ring                                         | **No target concept**. There is a net balance (positive − negative) per academic year                                                                                                                                                                              | Ring shows balance vs a **configurable display target**? Not possible without an API → show **balance + year trend**; target = backend request                 |
| Admin configures credit rules per academic year                                               | **Credit Templates** (title + points + type) and **Credit Policies** (versioned rule engine; saving is currently broken, bug B-14). Academic year is free text on each credit                                                                                      | Rules UI = templates + policies; academic-year management = backend request                                                                                    |
| Accreditation reports (NAAC/NBA/NIRF/AICTE)                                                   | Reports exist: department/faculty/college, transactions or ranking, PDF/Excel/share link, **signed exports**                                                                                                                                                       | Redesign the existing report builder; framework/criteria mapping = backend request                                                                             |
| Multi-tenant: institutions, onboarding wizard, Super Admin console, tenant branding           | **Single institution group**. "College" is a text field on users; superadmin uses the admin UI                                                                                                                                                                     | Tenant console/wizard/branding = **backend requests** (large). Shell can show the institution name/logo from config                                            |
| SSO (Google/Microsoft)                                                                        | Email + password, optional MFA, Cloudflare captcha                                                                                                                                                                                                                 | SSO = backend request                                                                                                                                          |
| Evidence preview                                                                              | Proofs are links to files on jsDelivr (via short links); PDFs/images are reachable by URL                                                                                                                                                                          | Preview in drawer is feasible for images/PDF (iframe/img) — no backend change, but files are public (security finding SEC-14)                                  |

**Terminology decision needed:** users know "Good Works", "Remarks", "Appeals", "Credit Templates". The brief says "Claims". Recommendation: keep the existing words (familiar to staff), use "claim" only in helper text. See §8 Q1.

---

## 3. Global UX problems (all screens)

| #   | Problem                                                                                                                                                                                                           | Principle broken                           | Severity                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| G1  | Two design languages (IBM Carbon square corners `rounded-none` ×180, plus shadcn rounded) and **no single token source**; raw colours and 49 hex values                                                           | Consistency, Gestalt similarity            | High                            |
| G2  | **Text too small**: `text-[10px]` ×59, `text-[11px]` ×54 (body text below 12 px, uppercase micro-labels)                                                                                                          | Readability, WCAG 1.4.4                    | High                            |
| G3  | **Admin sidebar has 11 items** in one flat list (Users, Bulk Import, Credit Templates, Policies, Review Queue, Manage Remarks, Positive Credits, Review Appeals, Reports, Ledger, Dashboard)                      | Hick's law (max 7), no grouping            | High                            |
| G4  | No **dark mode** switch; `.dark` tokens partly defined                                                                                                                                                            | Brief requirement                          | Medium                          |
| G5  | **Broken icons**: Material Symbols names rendered as text on Good Works, Appeals, Users (pagination "chevron_left/right")                                                                                         | Visibility of system status                | High (visible bug)              |
| G6  | **States inconsistent**: 16 of 22 data screens have no skeleton (blank or "Loading..." text), empty states differ per page, errors shown as modal alerts that block the page; no retry buttons; no offline notice | Doherty threshold, error recovery          | High                            |
| G7  | Errors and confirmations mixed between a **blocking modal alert** (`showAlert`) and toasts                                                                                                                        | Consistency, user control                  | Medium                          |
| G8  | **No detail drawers**: viewing a record opens a modal over the table (22 dialogs on Good Works, 26 on Remarks…), which loses list context                                                                         | Freshdesk pattern, recognition over recall | Medium                          |
| G9  | **Tables**: no sticky headers, no column visibility/density, inconsistent pagination, filters always expanded; on phones tables scroll sideways inside cards                                                      | Progressive disclosure, responsive         | Medium                          |
| G10 | Top bar lacks **academic-year switcher**, **theme toggle**, institution identity; search exists (⌘K)                                                                                                              | Brief shell                                | Medium                          |
| G11 | **Role is not checked by the page shell** (faculty can open admin URLs and see the frame; the API refuses data)                                                                                                   | Error prevention                           | Medium (bug F-01)               |
| G12 | Heavy libraries for light jobs (MUI for one input, GSAP for fades)                                                                                                                                                | Performance                                | Low                             |
| G13 | Microcopy: generic "Submit", "Action Menu", uppercase labels, mixed date formats (`toLocaleDateString` default vs ISO)                                                                                            | Plain language, DD MMM YYYY rule           | Medium                          |
| G14 | `uid` in every URL makes links long and leaks ids (cosmetic + privacy)                                                                                                                                            | —                                          | Low (needs care: pages read it) |
| G15 | Accessibility after the earlier fixes: **0 critical** axe issues on 11 pages; remaining: 5 chart SVGs without text alternative, 2 low-contrast labels; focus ring not consistent on custom elements               | WCAG 2.2 AA                                | Medium                          |

---

## 4. Screen-by-screen findings

Legend for states: ✅ present · ⚠️ partial · ❌ missing.

### Authentication

| Screen                  | Route                                                   | Problems                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**               | `/u/portal/auth`                                        | Split layout with large campus photo (heavy, decorative); captcha appears only after typing both fields (surprise); "Remember this email" ok; MFA step reuses card but no back-to-password explanation; no institution identity beyond logo; caps-lock warning ✅; loading on button ✅. No SSO (backend) |
| Forgot / reset password | `/auth/forgot-password`, `/auth/reset-password/[token]` | No password rules shown before typing; success state is a toast only; no "back to sign in" emphasis                                                                                                                                                                                                       |
| Verify WhatsApp         | `/auth/verify-whatsapp`                                 | Uses **MUI** phone input (different look); OTP field not segmented; resend timer unclear                                                                                                                                                                                                                  |

### Faculty

| Screen               | Route                | Primary action today  | Problems                                                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**        | `/dashboard`         | (none above the fold) | No "+ New Good Work" CTA in the hero; KPI card uses faded white on blue (fixed contrast); no "Action needed" (remarks that can still be appealed, appeals with decisions); academic-year select unlabeled visually; recent activity is a table, not a timeline. States: skeleton ✅ empty ✅ error ⚠️ (modal) |
| **Good Works list**  | `/good-works`        | "Add" link            | Status tabs missing (filter select instead); row "View" opens a modal; **paging bug** (negatives filtered after paging, F-03); broken pagination icons (G5); edit allowed in modal. States: loading "Loading..." text ⚠️ empty ✅ error ⚠️                                                                    |
| **Submit Good Work** | `/good-works/submit` | Submit                | Single long form; category select drives points (good) but **no live "expected credits" summary**, no stepper, evidence upload limits not stated up front, no draft/autosave, no preview                                                                                                                      |
| **Negative Remarks** | `/remarks`           | Appeal                | Appeal eligibility shown, but deadline ("x days left") not prominent; appeal dialog is plain textarea; details modal titled "Remark Audit Audit" (typo)                                                                                                                                                       |
| **My Appeals**       | `/appeals`           | —                     | Duplicates information from Remarks; no timeline of appeal decision; filter row always open                                                                                                                                                                                                                   |
| Notifications        | `/notifications`     | Mark read             | Decent (keyboard-accessible cards ✅); no grouping by day; no link-through consistency                                                                                                                                                                                                                        |
| Professional Profile | `/profile`           | Save                  | Long form, no sections/progress; good validation server-side                                                                                                                                                                                                                                                  |
| Settings             | `/settings`          | —                     | Security settings (MFA, sessions, password) mixed in one long page; no tabs                                                                                                                                                                                                                                   |

### Office Assistant (OA)

| Screen                  | Route          | Problems                                                                                                                                                                                                       |
| ----------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue Remark**        | `/oa`          | Faculty search is a custom suggestion list (not a combobox: no keyboard navigation/aria); template select + manual title/points side by side causes confusion; success only via toast; no "issue another" flow |
| Issue Positive          | `/oa/positive` | Same pattern duplicated (two near-identical pages)                                                                                                                                                             |
| **Transaction History** | `/oa/history`  | Wide table with many filters always visible; edit/void/reopen behind modals; with no token the page shows a loader forever (F-04)                                                                              |

### Admin (also used by superadmin)

| Screen                            | Route                                       | Problems                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin Dashboard**               | `/admin`                                    | KPI + charts exist; charts lack text alternatives (5 SVGs); no "needs attention" (pending reviews, appeals near deadline); no quick actions                                                                |
| **Review Queue**                  | `/admin/review`                             | Table + side panel exists (closest to Freshdesk) ✅ but: no keyboard shortcuts, no evidence preview, approve/reject without required comment, no bulk approve, no aging/SLA indicator, filters always open |
| Review Appeals                    | `/admin/appeals`                            | Good accessible table (caption, labelled buttons) ✅; decision dialog separate from list; no queue navigation                                                                                              |
| Manage Remarks / Positive Credits | `/admin/remarks`, `/admin/positive-remarks` | Two very similar 500–600-line pages; heavy modal usage (19–23 dialogs)                                                                                                                                     |
| **Faculty Accounts**              | `/admin/users`                              | 862-line page; filters + create + edit + reset password in one screen; broken pagination icons (G5); create form in modal; no bulk actions                                                                 |
| Bulk Import                       | `/admin/users/bulk-add`                     | No step guidance (download template → fill → upload → validate → result); results table only after upload                                                                                                  |
| Credit Templates                  | `/admin/credits`                            | CRUD in modals; no grouping by type; points sign conventions unclear                                                                                                                                       |
| Credit Policies                   | `/admin/policies`                           | 37-line page; **creating a policy fails on the server** (bug B-14)                                                                                                                                         |
| **System Reports**                | `/admin/reports`                            | 850 lines; filters, preview table, charts, download and share in one view; downloads now use headers ✅; no saved report presets                                                                           |
| Faculty Ledger                    | `/admin/faculty-ledger`                     | Good data density; filters always open; export buttons not grouped                                                                                                                                         |
| Admin Settings                    | `/admin/settings`                           | Mirrors faculty settings; no institution/branding settings (no API)                                                                                                                                        |

### Public / other

| Screen               | Route                                | Problems                                                                                                                                              |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export verification  | `/verify/[token]`                    | Clear purpose; could show a stronger "Valid / Not valid" state badge                                                                                  |
| Help, Privacy, Terms | `/help`, `/privacy-policy`, `/terms` | Help topics are static long text; fine for now                                                                                                        |
| Admissions microsite | `/admissions/...`                    | Unrelated product inside this app (separate branding, Facebook Pixel, MUI). **Out of scope** for the redesign; recommend moving it to its own project |

---

## 5. Heuristic scorecard (Nielsen, 1 = poor, 5 = good)

| Heuristic                     | Score | Main reason                                                |
| ----------------------------- | ----- | ---------------------------------------------------------- |
| Visibility of system status   | 2     | Missing skeletons, "Loading..." text, modal alerts         |
| Match with real world         | 4     | Domain words familiar to staff                             |
| User control & freedom        | 2     | No undo; modals over lists; no drafts                      |
| Consistency & standards       | 2     | Two design systems, duplicated pages                       |
| Error prevention              | 3     | Some validation; reviewer actions without required comment |
| Recognition over recall       | 3     | Filters visible but crowded; no drawers                    |
| Flexibility & efficiency      | 2     | No keyboard shortcuts in review; no bulk actions           |
| Aesthetic & minimalist design | 2     | Dense micro-text, decorative imagery, flat 11-item menu    |
| Error recovery                | 2     | No retry; generic messages in places                       |
| Help & documentation          | 3     | Help centre exists; little inline help                     |

---

## 6. Status model to design for (real statuses)

| Domain object        | Real status                   | Proposed label               | Badge (icon + text + tokens)       |
| -------------------- | ----------------------------- | ---------------------------- | ---------------------------------- |
| Good Work (positive) | `pending`                     | Under review                 | amber (`--warning-*`) + clock icon |
|                      | `approved`                    | Approved                     | green + check                      |
|                      | `rejected`                    | Rejected                     | red + x                            |
|                      | `deleted`                     | Withdrawn / Voided           | slate + archive                    |
| Remark (negative)    | `pending` / `approved`        | Active                       | red-outline + alert                |
|                      | `appealed` (appeal `pending`) | Appeal under review          | violet + message                   |
|                      | appeal `accepted`             | Appeal accepted (removed)    | green + check                      |
|                      | appeal `rejected`             | Appeal rejected              | slate + x                          |
|                      | appeal `withdrawn`            | Appeal withdrawn             | slate                              |
| (future, backend)    | `draft`, `returned`           | Draft / Returned for changes | as in the brief                    |

---

## 7. Proposed approach and phase plan (adapted to this codebase)

Reuse the stack: **Tailwind + shadcn/Radix + Lucide + Recharts**. One token layer (the brief's palette) mapped onto the shadcn variable names, so existing components restyle automatically; Carbon `--cds-*` variables become aliases during migration, then are removed. No new heavy UI library.
Additions (small, justified): `next-themes` (theme toggle, ~2 KB) and `@tanstack/react-table` (headless DataTable; sorting, selection, column visibility — avoids hand-rolling) — both to be confirmed in Phase 3. Remove later: MUI + Emotion, GSAP, IBM Plex fonts, Material Symbols names.

| Phase | Scope here                                                                                                                                                                                                                                                             | Depends on backend?                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1     | Tokens (light/dark), Inter + tabular numbers, global styles, Lucide only; map shadcn/cds variables to tokens; theme toggle                                                                                                                                             | No                                 |
| 2     | Shell: navy grouped sidebar (≤ 7 groups per role, collapsible rail, remembered), 56 px top bar (title/breadcrumb, ⌘K palette, academic-year switcher (client-side filter value), notifications, help, theme, profile), mobile bottom-sheet nav, role-aware route guard | No                                 |
| 3     | Components: Button/IconButton/FormField/StatusBadge/Card/KPI/DataTable/Drawer/ConfirmDialog/EmptyState/ErrorState/Skeleton/Stepper/ProgressRing/Timeline/Toast; docs in `docs/design-system.md`; tests for Button, DataTable, StatusBadge, ClaimForm                   | No                                 |
| 4     | Faculty: dashboard (balance, action needed, CTA, timeline), Good Work stepper with live credits + local draft autosave, Good Works list with tabs + drawer, Remarks/Appeals merged view, first-run 3-step welcome (local flag)                                         | Drafts/targets/returned = requests |
| 5     | Admin review queue split view with evidence preview, J/K/A/X shortcuts, required comment on reject, bulk approve (loops existing endpoint), aging badge from `createdAt`                                                                                               | "Return for changes" = request     |
| 6     | Analytics + reports redesign on existing endpoints, chart text alternatives, CSV/PDF export toasts                                                                                                                                                                     | Accreditation frameworks = request |
| 7     | Admin settings tabs on existing endpoints (users, bulk import stepper, templates, policies, account). **Super Admin console and tenant onboarding wizard cannot be built without backend support** — UI shells only if you want them as prototypes                     | Mostly requests                    |
| 8     | a11y (axe + Lighthouse ≥ 95), performance (code-split, lazy charts, drop MUI/GSAP), `track()` analytics wrapper (tenant id = college until tenants exist)                                                                                                              | No                                 |

Backend-dependent items are listed in `docs/backend-requests.md`.

---

## 8. Decisions needed before Phase 1

1. **Terminology:** keep "Good Works / Remarks / Appeals / Credit Templates" (recommended) or rename to "Claims"?
2. **Scope for backend-dependent features** (drafts, returned status, HOD/IQAC reviewers, targets, academic-year config, accreditation mapping, multi-tenant console, SSO): skip them now and design only what the API supports (recommended), or build non-functional UI prototypes?
3. **Branch:** create `ui-redesign` from `audit-and-testing` (recommended, keeps the security fixes), or from `main`?
4. **Admissions microsite:** leave untouched (recommended) or move out?
5. **Visual direction:** the brief's Freshworks-style navy sidebar + rounded 6–8 px corners replaces today's IBM Carbon square look. Confirm this change of brand feel.
