# CreditWise — Faculty Credit System (Website)

**CreditWise** is the faculty performance and credit platform of the **E.G.S. Pillay Group of Institutions**.
Faculty submit "good works" and track their credits; Office Assistants (OA) record remarks and awards;
administrators review submissions, decide appeals, manage users and produce reports.

|                 |                                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Framework       | Next.js 15 (App Router), React 18, TypeScript                                      |
| UI              | Tailwind CSS, shadcn/ui (Radix), IBM Carbon-inspired tokens, Recharts              |
| Talks to        | The backend API (`../backend`), configured with `NEXT_PUBLIC_API_URL`              |
| Login           | Backend JWT + server session, optional MFA; Cloudflare Turnstile on the login form |
| Push            | Firebase Cloud Messaging (optional)                                                |
| Package manager | **pnpm only** (`corepack pnpm …`)                                                  |

> The website has no database of its own; every check that matters is enforced by the backend.

---

## 1. Run it locally (safe, no real data)

Requirements: Node.js 22+. For the full local stack also Java 17+ (used by the backend's test database).

```powershell
# terminal 1 - backend test server with fake data (see ../backend/README.md)
cd ../backend
corepack pnpm install
corepack pnpm test:db:install
corepack pnpm test:server          # http://127.0.0.1:5050

# terminal 2 - website
cd ../frontend
corepack pnpm install
```

Create `frontend/.env.local` (never commit it):

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:5050/api/v1
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5050
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

Then `corepack pnpm dev` and open <http://localhost:9002/u/portal/auth>.
Test accounts are listed in `../backend/README.md` (password `Test-Passw0rd-123!`).

> ⚠️ If `NEXT_PUBLIC_API_URL` is not set, API calls go to the **production** backend through the
> rewrite in `next.config.ts`. Always set it for local work.

## 2. Tests

| Command                                       | What it does                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `corepack pnpm test`                          | Component and page tests (fake backend via MSW)                                                                                                                          |
| `corepack pnpm test:coverage`                 | Same + coverage → `coverage/lcov-report/index.html`                                                                                                                      |
| `corepack pnpm test:e2e`                      | Browser journeys in Chrome, Firefox, Safari engine and 2 phone sizes. Starts the backend test server and the website automatically; blocks all non-local network traffic |
| `corepack pnpm test:e2e:ui`                   | Same, in a window where you can watch each step                                                                                                                          |
| `corepack pnpm test:a11y`                     | Accessibility scans (axe, WCAG 2.1 AA)                                                                                                                                   |
| `corepack pnpm test:e2e:install`              | One-time download of the test browsers                                                                                                                                   |
| `corepack pnpm lint` / `typecheck` / `format` | ESLint / TypeScript / Prettier                                                                                                                                           |

Tests named **`[BUG] …`** document known bugs and are expected to fail until fixed.
CI (`.github/workflows/ci.yml`) runs lint, type check, unit tests and a production build on every push.

## 3. Configuration

| Variable                                                   | Meaning                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`                                      | Backend base URL including `/api/v1` (required)                                      |
| `NEXT_PUBLIC_API_BASE_URL`                                 | Older fallback for the backend origin                                                |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`                | Captcha site key (public)                                                            |
| `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Push notifications (optional, public keys; restrict them to your domain in Firebase) |
| `NEXT_PUBLIC_ENFORCE_WHATSAPP_VERIFICATION`                | `true` to require WhatsApp verification after login                                  |
| `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Error tracking (off when unset)                                                      |
| `DATA_ACCESS_TOKEN`                                        | Server-only token (≥ 32 chars) for the admissions data viewer                        |
| `MAINTENANCE_MODE`                                         | `true` redirects every page to `/maintenance`                                        |

Everything starting with `NEXT_PUBLIC_` is visible to anyone in the browser — never put secrets there.

## 4. Project layout

| Path                               | Purpose                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/app/u/portal/auth`            | Login, MFA step, password reset, WhatsApp verification                                    |
| `src/app/u/portal/dashboard`       | Faculty pages (dashboard, good works, remarks, appeals, profile, settings, notifications) |
| `src/app/u/portal/dashboard/admin` | Admin pages (users, review, credits, appeals, reports, policies, ledger)                  |
| `src/app/u/portal/dashboard/oa`    | Office Assistant pages (issue remarks/awards, history)                                    |
| `src/app/verify/[token]`           | Public check of a signed export                                                           |
| `src/components`                   | Shared UI (header, sidebar, login screen, forms, dialogs)                                 |
| `src/lib/api.ts`                   | **Use this to call the backend** (token header, consistent 401/403/network handling)      |
| `src/lib/api-url.ts`               | Backend base URL                                                                          |
| `src/instrumentation*.ts`          | Sentry (no-op unless configured)                                                          |
| `tests/`                           | `unit/`, `pages/`, `e2e/` (Playwright), `utils/`                                          |

## 5. Deploy

Vercel builds from `main` with `pnpm-lock.yaml`. Production builds **fail on type or lint errors**
(by design). Set the variables in §3 in the Vercel project, and deploy backend and frontend changes
that belong together at the same time.

Audit reports are in `../docs/audit/` in the project folder.

---

© E.G.S. Pillay Group of Institutions. All rights reserved.
