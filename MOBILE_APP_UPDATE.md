# Mobile app update handoff

**Updated:** 6 November 2026
**Audience:** Mobile app development agent
**Status:** Implementation brief based on the current frontend and backend code in this workspace.

This document describes the mobile work needed to match the current application. Read it with [MOBILE_APP_README.md](MOBILE_APP_README.md) and [MOBILE_SCREENS_COMPONENTS_README.md](MOBILE_SCREENS_COMPONENTS_README.md). Where an older brief disagrees with this document or the current API, follow the current API. There is no mobile app source in this workspace, so this is a handoff, not a claim that mobile features have been implemented.

## Delivery goal

Build a native mobile experience for faculty, office administrators (OA), and application administrators. Preserve the existing credit, review, appeal, and policy workflows, then add the newer account, notification, administration, and academic year behavior below. Use the backend REST API as the source of truth for data, permissions, status, and official credit balances.

| Priority | Deliverable                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Login with MFA, session handling, role navigation, profile and security settings, notifications, academic year selection, faculty/OA core workflows. |
| P1       | Admin dashboard, people directory, single user creation, edit, transfer, deactivation, password reset, and application Setup.                        |
| P2       | Bulk import on a suitable tablet workflow, richer charts, reports and exports, policy administration, broadcast notifications.                       |

## Changes since the older mobile brief

| Area                 | Current behavior to implement                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation           | Web moved its sections into a sidebar and top bar. On phones, use native bottom navigation for the few primary destinations and an account menu or More screen for secondary destinations. On tablets, a navigation rail is appropriate. Do not recreate web tabs inside each screen.         |
| Account versus Setup | **My Account** is personal: profile, password, appearance/preferences, security/MFA, sessions, help, and sign out. **Setup** is application wide and restricted to administrators with `settings.manage`.                                                                                     |
| Directory            | Institutions contain colleges; colleges contain departments. New user placement and transfer must use active entries from `GET /settings`. EGS Pillay Engineering College includes **Artificial Intelligence and Machine Learning** and **Science & Humanities**. Never hardcode these lists. |
| Academic years       | Settings define the current and available years. The mobile selected year controls year-scoped records and analytics via the `academicYear` query parameter. Writes to closed or unconfigured years fail with HTTP 409.                                                                       |
| People               | Admins can create one user, edit, deactivate, reset password, and transfer between colleges/departments. Transfer preserves the user's identity and historical credits, updates employment history, and revokes existing sessions. OA can view an active faculty directory only.              |
| Initial passwords    | The single-user form automatically suggests and fills a cryptographically generated password, allows show/hide, regeneration, editing, and copying, then displays the initial password once after account creation so the admin can share it securely.                                        |
| Dashboard            | Admin dashboard now provides live summary counts, status breakdown, trends, college activity, user growth, and recent items. Some counts are all-time; credit metrics follow the selected academic year.                                                                                      |
| Notifications        | In-app inbox and unread count are available. Native devices can register an FCM token. Notification destinations require safe in-app mapping.                                                                                                                                                 |
| MFA                  | Email code and authenticator app enrollment are verified two-step flows. Login can return an MFA ticket instead of a session token.                                                                                                                                                           |

## Role navigation

Use the effective permissions returned by the server to hide unavailable actions. The backend must still authorize every request. A `superadmin` can use the admin presentation while retaining its actual server role.

| Role    | Primary destinations                                 | Secondary destinations                 |
| ------- | ---------------------------------------------------- | -------------------------------------- |
| Faculty | Home, Good Works, Remarks & Appeals, Notifications   | My Account, professional profile, help |
| OA      | Issue, Issued History, Faculty People, Notifications | My Account, help                       |
| Admin   | Home, Review, Credits, People, Reports               | Setup, Notifications, My Account, help |

The current web navigation is defined in `frontend/src/components/shell/nav-config.ts`. Adapt its information architecture to mobile screen space; do not assume the web route paths are native deep links.

## API connection and session contract

- API base is **the deployed backend origin plus `/api/v1`**. Keep it environment configurable. The local web preview used `127.0.0.1:9001` and `localhost:9002`; these are not production mobile endpoints and will not work on most physical devices. Obtain the intended mobile staging and production API origins from deployment configuration.
- Send `Authorization: Bearer <token>` on protected requests. The backend validates both the JWT and its server session. Store tokens only in OS-backed secure storage; keep the MFA ticket transient.
- Successful ordinary login returns `token`, `sessionId` and `data`. MFA login returns `mfaRequired: true`, `mfaType` and `mfaTicket` **without** an authenticated session. Verify the code before entering the app.
- `GET /auth/refresh` with the current bearer token returns a new token for the same session. `POST /auth/logout` revokes the current session. Clear local credentials after logout, password reset, account deactivation, or a revoked-session 401.
- Treat 401 as unauthenticated; 403 as authenticated but forbidden; 409 as a conflict requiring the user to review or refresh; 429 as rate limited; 503 as a temporarily unavailable service. Never turn a 403 into a silent logout.
- Password reset email currently links to the web reset flow. Either open the web flow securely or implement a mobile app link and coordinate its URL with the backend before claiming native reset support.
- Do not copy the web Turnstile widget or depend on browser cookies. The current mobile-relevant login API accepts email and password, then an MFA ticket and code when required.

### Login and MFA example

```json
POST /api/v1/auth/login
{"email":"person@example.org","password":"<entered password>"}

// Without MFA:
{"success":true,"mfaRequired":false,"token":"<jwt>","sessionId":"<id>","data":{"id":"<user id>","name":"<name>","role":"faculty","permissions":[],"token":"<jwt>","sessionId":"<id>","sessionExpiresAt":"<timestamp>"}}

// With MFA:
{"success":true,"mfaRequired":true,"mfaType":"email","userId":"<user id>","mfaTicket":"<short-lived ticket>"}

POST /api/v1/auth/verify-mfa
{"mfaTicket":"<ticket>","code":"123456","type":"email"}
```

The successful MFA verification response has the same session fields as ordinary login. The MFA ticket is not a bearer token. Email codes are six digits. Wrong or expired codes, ticket expiry, and rate limits need distinct user-facing states without revealing internal details.

## Current API map

All paths below are relative to `/api/v1`. Multipart fields are shown as names, not JSON. Confirm request and response types against the controllers before implementation if the backend changes.

### Account and security

| Method/path                                                                   | Access      | Request and behavior                                                               |
| ----------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `POST /auth/login`                                                            | Public      | JSON `{email,password}`; may require MFA.                                          |
| `POST /auth/verify-mfa`                                                       | MFA ticket  | JSON `{mfaTicket,code,type}` where type is `email` or `app`.                       |
| `GET /auth/profile`                                                           | Signed in   | Returns `{success,user,sessions}`. Use for the account header and session summary. |
| `GET /auth/sessions`                                                          | Signed in   | Returns `{success,sessions}`.                                                      |
| `DELETE /auth/sessions/:id`                                                   | Signed in   | Revoke a selected session.                                                         |
| `DELETE /auth/sessions/others`                                                | Signed in   | Revoke all other sessions.                                                         |
| `GET /auth/refresh` / `POST /auth/logout`                                     | Signed in   | Refresh current token / revoke current session.                                    |
| `POST /auth/forgot-password`                                                  | Public      | JSON `{email}`; generic response for known and unknown accounts.                   |
| `POST /auth/reset-password/:token`                                            | Reset token | JSON `{password}`; revokes existing sessions.                                      |
| `GET /users/me`                                                               | Signed in   | Returns `{success,data:<sanitized user>}`.                                         |
| `PUT /users/me`                                                               | Signed in   | Multipart profile update: name, prefix, phone, optional image.                     |
| `PUT /users/me/password`                                                      | Signed in   | JSON `{currentPassword,newPassword}`.                                              |
| `GET /users/me/professional-profile` / `PATCH /users/me/professional-profile` | Signed in   | Read/update permitted professional profile fields.                                 |
| `POST /users/me/mfa/setup`                                                    | Signed in   | JSON `{type:"email"                                                                | "app"}`. Email sends a code; app returns authenticator enrollment details. |
| `POST /users/me/mfa/enable`                                                   | Signed in   | JSON `{type,token}`; verify the code to activate MFA.                              |
| `POST /users/me/mfa/disable`                                                  | Signed in   | JSON `{token,currentPassword}`.                                                    |

Use the verified `/users/me/mfa/setup` and `/enable` path. Do not use legacy MFA toggle endpoints for a native enrollment flow. App enrollment secrets and recovery material must not enter logs or analytics. Email delivery failure is a retryable service error; show a clear message and preserve the user's current MFA state. The backend has a five-minute email setup window, a ten-minute authenticator setup window, and limits repeated failed attempts.

### Application Setup and academic years

| Method/path     | Access            | Request and behavior                                                                                                                                           |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /settings` | Signed in         | Returns `{success:true,data:<ApplicationSettings>}`. Non-admin responses omit the audit trail.                                                                 |
| `PUT /settings` | `settings.manage` | Send the complete settings object, including its current `revision`. HTTP 409 means it changed elsewhere; reload and let the admin review before saving again. |

```ts
type ApplicationSettings = {
  revision: number;
  organizationName: string;
  supportEmail: string;
  passwordMinLength: number; // backend permits 12..128
  transfersEnabled: boolean;
  requireTransferReason: boolean;
  institutions: Array<{ id: string; name: string; code: string; active: boolean }>;
  colleges: Array<{
    id: string;
    institutionId: string;
    name: string;
    code: string;
    active: boolean;
    departments: Array<{ id: string; name: string; code: string; active: boolean }>;
  }>;
  academicYears: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: "open" | "closed";
  }>;
  currentAcademicYear: string;
  updatedAt?: string;
  audit?: Array<{ at: string; by: string; actor: string; fields: string[] }>;
};
```

Admin Setup should expose organization details, institution/college/department management, academic years, transfer/password controls, and change history. Show active units as choices for new placements. Preserve stable IDs; do not rename or remove a unit with assigned users as a shortcut. Academic years normally span June through May with IDs such as `2026-27`; older records may use `2026-2027` and are normalized server-side. A closed year remains readable but blocks year-scoped writes.

Selected academic year is a mobile app preference, initialized from `currentAcademicYear`. Send it as `?academicYear=<id>` on year-scoped endpoints; the web-only `?ay=` route parameter is not the API name. Clearly label screens that show all years. Refresh year-scoped data when selection changes.

### People management

| Method/path                           | Access    | Request and behavior                                                                                                                                                                  |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /users`                          | Admin, OA | Query: `page`, `limit`, `q`, `role`, `isActive`, `college`, `department`, `institutionId`. Response `{success,total,page,limit,items}`. OA receives an active faculty directory only. |
| `POST /users`                         | Admin     | Multipart: `name,email,password,role,college,department,designation,phone`. Roles: `faculty`, `oa`, `admin`. Faculty require an active department. Password length follows settings.  |
| `GET /users/:id`                      | Admin     | Get one user. A missing user returns 404; show a proper not-found state.                                                                                                              |
| `PUT /users/:id`                      | Admin     | Multipart editable identity/contact/status/role fields. **Do not change college or department here.**                                                                                 |
| `POST /users/:id/transfer`            | Admin     | JSON `{college,department,reason,expectedUpdatedAt}`. Use the current user's `updatedAt` for optimistic concurrency.                                                                  |
| `POST /users/:id/reset-password`      | Admin     | JSON `{password}`; revokes the user's sessions.                                                                                                                                       |
| `DELETE /users/:id`                   | Admin     | Deactivates the user and revokes sessions; it does not erase historical records.                                                                                                      |
| `GET /users/:id/professional-profile` | Admin     | Read professional profile.                                                                                                                                                            |
| `PUT /users/:id/employment`           | Admin     | Employment details; placement changes must use transfer.                                                                                                                              |
| `POST /auth/users/bulk-upload`        | Admin     | Multipart `file`, up to 10 MB and 1,000 rows. Response includes `processed`, `summary` and row `results`.                                                                             |

Implement a real single-user form in addition to bulk import. Build institution → college → department pickers from active settings. Support names, email, password, role, designation, and phone. Validate locally for usability, then present server validation and duplicate-email 409 clearly. Do not embed a known password or silently reuse one.

For the **initial password**, auto-fill a fresh suggestion when the settings and form load. Generate it with the operating system's cryptographic random source, at least the configured `passwordMinLength` and at most 128 characters, with uppercase, lowercase, a digit, and a symbol. Provide show/hide, generate another, manual edit, and copy actions. The current backend acceptance rule is **length only** (configured minimum of 12–128 characters, maximum 128); its regex-like client validation must match that rule. Uppercase/lowercase/digit/symbol are a **strength recommendation**, not an extra rejection rule. Never use `Math.random`, a fixed initial password, or an API call to generate one. After successful creation, show the password once in a confirmation view so the admin can copy it before leaving; do not put it in logs, analytics, notifications, or the user record response.

For transfer, show origin and destination, require a reason when `requireTransferReason` is true, send `expectedUpdatedAt`, and display the resulting placement and history after success. A stale 409 requires reload and review. If `transfersEnabled` is false, hide the action and honor the server response. The transfer updates employment/transfer history, retains prior credits, and revokes the user's sessions, so tell the admin the user will need to sign in again. Do not represent transfers as creating a second account.

Bulk upload needs a row-level success/failure review. It may remain web-first on phones; if offered on mobile, support native document selection and multipart upload. The accepted column names are `name,email,password,role,college,department`, with destination names matching current settings.

### Notifications

| Method/path                       | Access                   | Request and behavior                                                                                                       |
| --------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `GET /notifications?limit=6`      | Signed in                | Returns `{success,items,unreadCount}`; items include `_id,title,message,read,createdAt,url?`. Server maximum limit is 200. |
| `PATCH /notifications/:id/read`   | Signed in                | Mark one owned notification read.                                                                                          |
| `PATCH /notifications/read-all`   | Signed in                | Mark all owned notifications read.                                                                                         |
| `PUT /notifications/device-token` | Signed in                | JSON `{fcmToken}`; register or update the native FCM token.                                                                |
| `POST /notifications/broadcast`   | `notification.broadcast` | Admin broadcast workflow.                                                                                                  |

Show an unread badge and a full inbox. Refresh on app foreground and after reading; the web polls every 60 seconds, which can be used as a foreground fallback on mobile. Register the native FCM token after sign-in and when it rotates. `/notifications/subscribe` accepts a **web push** subscription and is not the native endpoint. No dedicated native token removal route is documented; coordinate logout/device cleanup with backend rather than inventing one. Treat notification URLs as untrusted input and map only known application destinations.

### Admin dashboard and core workflows

| Method/path                                                                                           | Access        | Request and behavior                                                                                                                      |
| ----------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /analytics/dashboard?academicYear=<id>`                                                          | Admin         | Returns summary, status, trends, colleges, userGrowth, recent, generatedAt, and academicYear.                                             |
| `GET /analytics/academic-years`, `/analytics/credit-trends`, `/analytics/users`, `/analytics/credits` | Admin         | Supporting analytics endpoints.                                                                                                           |
| `GET /admin/oa/credits/issued`                                                                        | OA            | Own issued credits; edit/void routes are under the same prefix.                                                                           |
| `GET /admin/faculty/:facultyId/credit-ledger`                                                         | Admin         | Faculty ledger; server also provides export.                                                                                              |
| `GET /admin/faculty-ledger/ranking`                                                                   | Admin         | Ranking; server also provides export.                                                                                                     |
| `/credits`, `/admin`, `/policies`, `/reports`                                                         | By permission | Existing good work, issue/review, appeal, policy and report routes. Follow their current route/controller definitions for exact payloads. |

```ts
type AdminDashboard = {
  success: true;
  academicYear: string | null;
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeUsers: number;
    facultyUsers: number;
    colleges: number;
    totalRecords: number;
    pendingReview: number;
    openAppeals: number;
    netPoints: number;
    approvalRate: number;
  };
  status: { pending: number; approved: number; rejected: number };
  trends: Array<{ month: string; submitted: number; approved: number; rejected: number; negative: number }>;
  colleges: Array<{ name: string; users: number; records: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  recent: Array<{
    id: string;
    title: string;
    faculty: string;
    college: string;
    type: string;
    status: string;
    points: number;
    impact: number;
    createdAt: string;
  }>;
};
```

Present summary cards, review and appeal queues, status distribution, monthly trends, college activity, and recent records. Keep charts readable on phones and accessible in text. User counts and growth are all-time; credit counts, trends, and recent records use the selected academic year. Use the server's `impact` and official ledger values for balances; do not calculate them independently from raw point fields.

## Mobile implementation requirements

1. Build role and permission-aware navigation, with route guards and a visible forbidden state. Permissions are application wide; an institution filter is **not** a tenant security boundary.
2. Keep the selected academic year, directory data, and current account in a shared state layer. Invalidate affected caches after setup edits, user mutations, notification reads, MFA changes, and year selection.
3. Use OS-backed secure storage for the session token. Keep passwords, MFA codes, setup secrets, and FCM credentials out of analytics, crash reports, and debug logs. Never package backend AWS, SMTP, or database credentials in the app.
4. Upload images and proof files as multipart with server-supported size/type rules. Credit proof uploads are capped at 10 MB by the backend. Show progress, retry, and validation errors.
5. Use server dates/statuses and localize display times. Do not infer that a calendar year equals an academic year.
6. Make settings writes explicit: fetch revision, edit a copy, submit the full object, and recover from 409 without discarding the admin's edits.
7. Preserve offline draft input where practical, but require a successful server response before showing a credit, transfer, or settings change as saved.

## Acceptance checks

- Faculty, OA, admin, and superadmin accounts land on the appropriate navigation; forbidden API actions remain unavailable even through a deep link.
- Login works both with and without MFA. MFA setup requires code verification; expired code, retry limit, email delivery failure, logout, and revoked sessions have usable states.
- Profile, password, session list/revoke, notification inbox/read, and FCM registration work with the current API.
- Academic year selection changes scoped records and dashboard metrics; a closed year is clearly read-only and write conflicts are explained.
- Admin can create a single faculty user in an active department with an automatically filled, viewable, regenerable initial password; a manual password that meets the configured length is accepted. The password remains available only in the one-time success view. Admin can also search/filter users, edit permitted fields, transfer to another active placement, review history, reset password, and deactivate. The transferred account keeps its prior credits and requires a fresh sign-in.
- OA sees only the active faculty directory and its own issued credit history. Faculty sees only authorized personal records.
- Admin dashboard renders all response sections and handles empty data, slow loading, 403, 409, and 503 without a generic “Requested resource not found” for ordinary failures.
- Settings edits detect a stale revision; directory updates become visible in placement pickers without an app release.
- Run backend contract checks against a safe test environment and mobile end-to-end tests for the flows above. Do not test destructive admin operations against live production accounts.

## Integration decisions to confirm before release

- The production and staging backend API origins, TLS configuration, and mobile app link domains.
- Whether password reset and notification destinations should open native screens or the existing web pages.
- FCM token replacement/removal behavior when a user signs out or changes accounts on the same device.
- Which P2 administration functions need phone UI versus tablet/web access.

## Source files to inspect

- Web UX: `frontend/src/components/shell/nav-config.ts`, `frontend/src/components/shell/academic-year.tsx`, `frontend/src/components/shell/notification-menu.tsx`, `frontend/src/components/settings/account-settings-page.tsx`, `frontend/src/components/admin/application-settings-panel.tsx`, `frontend/docs/ADMINISTRATION.md`.
- API client/types: `frontend/src/lib/api.ts`, `frontend/src/lib/application-settings.ts`, `frontend/src/hooks/use-mfa-settings.ts`.
- Backend routes: `backend/Routes/authRoutes.js`, `backend/Routes/userRoutes.js`, `backend/Routes/applicationSettingsRoutes.js`, `backend/Routes/notificationRoutes.js`, `backend/Routes/analyticsRoutes.js`, `backend/Routes/adminRoutes.js`, `backend/Routes/creditRoutes.js`.
- Backend behavior: `backend/Controllers/Auth/AuthenticationController.js`, `backend/Controllers/Admin/UserManagementController.js`, `backend/Controllers/Admin/ApplicationSettingsController.js`, `backend/Controllers/Admin/DashboardController.js`, `backend/domain/applicationSettings.js`, `backend/config/permissions.js`, `backend/Middleware/academicYearMiddleware.js`.
