# CreditWise mobile app: product and design brief

**Status:** proposal and Claude-ready design brief. No mobile app has been implemented by this document.

For the full role-by-role screen list and the components on each screen, see [MOBILE_SCREENS_COMPONENTS_README.md](MOBILE_SCREENS_COMPONENTS_README.md).

CreditWise serves faculty, Office Assistants (OA), administrators, and superadmins at E.G.S. Pillay Group of Institutions. Build one Android and iOS app that shows each person only the tasks and data allowed by the existing backend. Keep the current Next.js website for desktop-heavy work and use the same backend and credit-accounting rules. The mobile app should feel like a purpose-built product, not a web page inside a phone.

## Recommendation

Use **Expo + React Native + TypeScript + Expo Router** for one native codebase. This fits the existing React/TypeScript team and supports role-specific tab navigation and native device features. Use the backend at `../backend` as the sole source of truth. Share API contracts, validation rules, and _design token values_ where practical; do not copy browser-only Tailwind or shadcn components into React Native. Prototype the highest-value flows before building the full screen inventory.

The app must never connect directly to DynamoDB or include AWS keys. Store the mobile session in OS-backed secure storage, refresh and revoke through the existing authentication API, and enforce authorization on the server for every request. Treat client-side role navigation as presentation only.

## Roles, navigation, and screen inventory

All roles get the same sign-in, password recovery, optional MFA, notifications, profile, and settings experiences. After authentication, the server role determines the home tabs. A superadmin can use admin screens; backend permissions still decide which actions appear.

| Role               | Bottom tabs                          | Core screens and primary actions                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Faculty            | Home, Credits, Submit, Appeals, More | Balance summary; positive, negative, and net totals; academic-year filter; credit timeline and detail; submit good work with evidence; appeal an issued negative credit; appeal timeline; notifications; profile.                                          |
| OA                 | Home, Issue, My credits, More        | Own-issued totals and recent activity; select faculty; issue positive or negative credit from a template; add notes and evidence; search/filter only credits issued by this OA; edit own credit; void own credit with a reason; view its activity history. |
| Admin / superadmin | Home, Queue, People, Ledger, More    | Review faculty submissions and appeals; manage users and account status; search faculty; inspect credit ledger, source, issuer, appeal, and balance impact; issue credits; reports, ranking, policies, and settings.                                       |

On phones, use a compact bottom tab bar and push detail screens onto a stack. On tablets, use a navigation rail and two-pane list/detail layouts. Replace desktop tables with searchable cards and detail screens. Keep sorting and filtering in a modal or bottom sheet with active-filter chips above the list. Do not hide consequential actions behind a swipe-only gesture.

### Priority screen designs

1. **Sign-in and session:** branded welcome, email/password, MFA step, recovery, session-expired state, and account-disabled state. Do not expose whether an email exists in recovery feedback.
2. **Faculty Home:** one clear net score, separate positive and negative amounts, current academic year, pending submissions, active appeals, and latest credit activity. Tap a metric to open its filtered list.
3. **Faculty Credit detail:** signed points, status, issued date/time, issuing role/person when authorized, source/template, notes, proof, academic year, and an event timeline. An accepted appeal shows zero _effective_ negative impact while retaining the original issued amount.
4. **Submit good work:** faculty selects category, adds title and description, attaches camera/gallery/file evidence, reviews the submission, and receives a receipt. Preserve a draft locally until successfully submitted.
5. **Negative credit appeal:** show the issued deduction and timestamp, evidence, appeal eligibility, reason and attachment form, then a pending/accepted/rejected timeline. Never show `Invalid Date`; use a safe fallback such as “Date unavailable.”
6. **OA issue credit:** faculty search with college/department context, positive/negative selector, template picker, read-only template points, notes, optional proof, and a final confirmation that names the faculty and signed amount. Manual positive awards require explicit points and a reason where supported by the API.
7. **OA My credits:** default to credits issued by the signed-in OA; search, status/type/date filters and high-to-low/low-to-high sorting; card expands to show details and audit events. Edit and Void actions require a reason where applicable. Voiding removes balance impact and preserves the record.
8. **Admin Queue:** segmented submissions/appeals, counts by status, assignee/college/date filters, and a full-screen review sheet with original record, evidence, history, decision controls, and a required confirmation for consequential decisions.
9. **Admin People:** searchable directory with role, college, department and status filters; user detail and safe account actions: create, edit, deactivate/reactivate if the API supports it, and reset password. Make the current status and consequence of each action explicit.
10. **Admin Ledger and ranking:** searchable faculty list; ranking within each college; separate positive/negative/net numbers; total records with status breakdown. Faculty ledger opens as a full-height detail screen on phone and a three-quarter-width side panel on tablet. Each event shows type, points, issuer, date/time, appeal outcome, balance effect and audit history.

## Reusable mobile components

| Component                   | Design and behavior                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `AppHeader`                 | Screen title, back, optional search/filter action, notifications count. Respect safe areas.                                       |
| `BalanceHero`               | Net score as the primary number; positive and negative totals remain independently visible. Never use color as the only sign cue. |
| `CreditCard`                | Signed amount, title, faculty, status, issuer, and local date/time. Tap opens `CreditDetail`; action menu is permission-aware.    |
| `StatusBadge`               | Text and icon for pending, approved, rejected, appealed, accepted, and voided. Accessible labels include status words.            |
| `EventTimeline`             | Issued, edited, appealed, decided, or voided events with actor, timestamp, reason, and before/after values when available.        |
| `FacultyPicker`             | Server-backed search; name, faculty ID, college, and department distinguish similar names.                                        |
| `FilterSheet`               | Type, status, college, department, academic year and date range, plus reset/apply; list announces result count.                   |
| `EvidencePicker`            | Camera, gallery and file options; file name, size, upload progress, retry and remove before submission.                           |
| `DecisionSheet`             | Original facts above decision controls; review notes; confirmation step; success receipt.                                         |
| `EmptyState` / `ErrorState` | Specific explanation and one recovery action; handle no access, no data, offline and expired session separately.                  |
| `SkeletonList`              | Stable loading shape with no layout jump.                                                                                         |

Use a **single canonical credit detail component** across roles and vary the available actions by server permissions. Reuse one timeline model for appeals and edits. All list screens need cursor or page pagination and pull-to-refresh; never load all production records into memory.

## Design language for Claude

Use the current web token source at [`src/styles/tokens.css`](src/styles/tokens.css) as the brand reference. The mobile visual direction is calm, credible, and academic: navy `#0F2A44` for structure, blue `#2563EB` for primary actions, white `#FFFFFF` surfaces, light canvas `#F8FAFC`, text `#0F172A`, amber `#F59E0B` for credit emphasis, green `#16A34A` for success, and red `#DC2626` for deduction or destructive actions. Build light and dark semantic tokens, not hard-coded colors in each screen. Use an 8-point spacing rhythm, clear typography, restrained elevation and rounded controls. Adapt to platform conventions rather than copying the website's sidebar.

Use positive/negative signs **and** words; red/green alone cannot carry meaning. Prefer 16-point body text on phones, flexible text scaling, visible focus/pressed states, and touch targets at least 44×44 pt on iOS and 48×48 dp on Android. Test VoiceOver and TalkBack. Format API timestamps with a shared safe formatter, show local time and timezone where a decision depends on time, and keep the raw timestamp in the record detail for audit.

### Paste this brief into Claude for visual design

```text
Act as a senior mobile product designer. Design a native Android and iOS app named CreditWise for E.G.S. Pillay Group of Institutions. Use the product requirements and role matrix in MOBILE_APP_README.md as the source of truth. Produce a coherent design system and high-fidelity phone screens for Faculty, Office Assistant (OA), and Admin/Superadmin. Start with: sign-in/MFA, Faculty Home, faculty credit detail and appeal, OA Issue Credit, OA My Credits and edit/void, Admin Queue and appeal review, Admin People, and Admin Faculty Ledger. Also show a tablet adaptation for Admin Ledger.

Visual direction: trustworthy academic operations, crisp modern native UI, navy #0F2A44, blue #2563EB, light canvas #F8FAFC, amber credit accent #F59E0B. Include light and dark modes, 8-point spacing, accessible type, 44pt iOS and 48dp Android touch targets, proper safe areas, and screen-reader labels. Use platform-native tab/stack patterns. On phones convert tables to cards and full-screen details; on tablets use a three-quarter-width ledger panel. Make status and signed points readable without depending on color.

For every screen provide: purpose, layout, component names, content hierarchy, sample realistic data, loading/empty/error/offline states, primary and secondary actions, permission rules, and a tap-through flow. Show appeal accounting correctly: a negative credit deducts when issued; an accepted appeal makes its effective deduction zero while the original record and timestamp remain visible. OA sees and modifies only credits issued by that OA. Void means audit-preserving balance reversal, never physical deletion. Do not invent backend capabilities; label any proposed feature as requiring an API change.

Deliver: role navigation map, component inventory with states, token sheet, screen specifications, and an implementation handoff. Do not include real faculty data, credentials, or production screenshots.
```

## Mobile architecture and API handoff

Suggested project structure: `mobile/app` for Expo Router screens, `mobile/src/features/{auth,credits,appeals,users,ledger}` for role features, `mobile/src/components` for reusable UI, and `mobile/src/api` for one typed API client. Generate types from a reviewed API contract rather than copying ad hoc web types. Keep role permission checks in one client helper, but trust backend 401/403 responses and clear cached sensitive data on logout or role change.

| Flow                        | Existing backend starting point                                                          | Mobile-specific work to verify                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Login, MFA, session         | `/api/v1/auth/login`, `/verify-mfa`, `/refresh`, `/logout`, `/profile`                   | Confirm refresh semantics and mobile deep-link handling for recovery. Store tokens in secure storage; do not log them. |
| Faculty credits and appeals | `/api/v1/credits/credits/faculty/:facultyId`, `/credits/:creditId/appeal`                | Confirm response shapes, eligibility rules, proof uploads, and server-side pagination.                                 |
| OA own credits              | `/api/v1/admin/oa/credits/issued` and `/api/v1/admin/oa/credits/issued/:id`              | Confirm owner-scoped counts, filters, and audit event shape. Never fetch a global OA feed and filter on device.        |
| Issue credit                | `/api/v1/admin/credits/positive`, `/api/v1/admin/credits/negative`                       | Confirm template validation, file upload, duplicate-submit protection and receipt.                                     |
| Admin users                 | `/api/v1/users` and `/api/v1/users/:id`                                                  | Confirm pagination, role/status filtering, reactivation support, and reset-password flow.                              |
| Ledger/ranking              | `/api/v1/admin/faculty/:facultyId/credit-ledger`, `/api/v1/admin/faculty-ledger/ranking` | Confirm server sorting/filtering and limit the payload for mobile networks.                                            |

These are **integration starting points**, not a verified complete mobile contract. Before implementation, audit all request/response shapes, authorization, error codes, upload limits, and date fields with a local test backend. Add idempotency keys for credit issue and appeal decisions before enabling retries after a lost connection. Use push only for useful events such as credit issued, appeal decided, and submission reviewed; deep-link to an authorized screen and never place sensitive details in a lock-screen preview.

## Delivery plan and acceptance

1. **Design prototype:** create the core screens above in Claude, test them with one faculty, one OA and one admin on a phone, revise labels and navigation, and freeze component/token contracts.
2. **Foundation:** set up Expo app, typed API client, secure session, role routing, light/dark tokens, accessibility primitives and safe date formatting. Use only the local fake-data backend during development.
3. **Faculty release:** dashboard, credits, good-work submission, appeals, notifications and profile.
4. **OA release:** own-issued dashboard, faculty picker, issue, edit, void and history.
5. **Admin release:** review queue, users, ledger, ranking and reports; retain large exports and complex policy editing on the website until mobile flows are validated.
6. **Pilot and rollout:** internal Android/iOS builds, test with realistic data volumes, review backend audit events, then staged release. Keep the web app available throughout.

Accept the mobile app only when: every role is denied unauthorized API calls; OA cannot read or modify another OA's credit; an issued negative credit deducts immediately; an accepted appeal makes its effective deduction zero; voided records remain visible in audit history; duplicate taps do not create duplicate credits; all critical flows work with slow or interrupted networks; screens pass VoiceOver/TalkBack and dynamic type checks; and no real production data is used in design files or test fixtures.

## References

- [Expo Router authentication and protected routes](https://docs.expo.dev/router/advanced/authentication/)
- [Expo SecureStore](https://docs.expo.dev/develop/user-interface/store-data/)
- [Expo notifications](https://docs.expo.dev/guides/using-push-notifications-services/)
- [React Native accessibility](https://reactnative.dev/docs/accessibility)
- [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android adaptive app quality](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
