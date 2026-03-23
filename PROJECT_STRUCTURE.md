# 📂 CreditWise: Project & File Structure

This document provides a comprehensive overview of the **CreditWise** codebase, organizing logic by responsibility and adhering to the **IBM Carbon Design System** and **Next.js 15 App Router** patterns.

---

## 🏗️ High-Level Directory Map

| Directory | Description |
|:---|:---|
| `src/app` | **Next.js App Router**: Contains all routes, layouts, and API endpoints. |
| `src/components` | **UI Library**: Reusable React components (ShadCN primitives + custom modules). |
| `src/ai` | **GenAI Core**: Firebase Genkit configuration and AI flow definitions. |
| `src/hooks` | **Custom Hooks**: Reusable business logic (Auth, MFA, Notifications, Remote Config). |
| `src/lib` | **Shared Utilities**: Firebase initialization, shared constants, and helper functions. |
| `src/context` | **State Management**: React Context providers for global alerts and session states. |
| `src/email-templates` | **Communication**: HTML/Handlebars templates for system notifications. |

---

## 🚦 Routing Structure (`src/app`)

The application uses a nested routing strategy to separate public marketing, authentication, and secure portals.

### 🔐 Auth & Identity
- `/u/portal/auth`: Main entry point for Faculty/Admin/OA login.
- `/u/portal/auth/forgot-password`: Password recovery workflows.
- `/u/portal/auth/verify-whatsapp`: Post-login security verification flow.

### 📊 Secure Dashboards
- `/u/portal/dashboard`: **Faculty Portal** (Overview, Good Works, Remarks, Appeals).
- `/u/portal/dashboard/admin`: **Administrator Portal** (User mgmt, Bulk Import, Review, Reports).
- `/u/portal/dashboard/oa`: **Office Assistant Portal** (Optimized data entry for remark issuance).

### 🛠️ Utilities & Support
- `/maintenance`: Institutional "System Upgrade" landing page.
- `/u/portal/help`: Complete documentation and help guide center.
- `/u/portal/privacy-policy`: Institutional legal compliance.

---

## 🧩 Component Architecture (`src/components`)

Components are divided into "Primitives" and "Modules":

- **`src/components/ui`**: Atomic primitives following the IBM Carbon vibe (Button, Input, Card, Table).
- **Modules**:
  - `Header.tsx` & `SidebarNav.tsx`: Navigation shell components.
  - `AchievementForm.tsx`: The primary "Good Works" submission interface.
  - `MfaSettings.tsx` & `SessionManager.tsx`: Complex security management modules.
  - `GlobalSearch.tsx`: ⌘K command palette interface.

---

## ⚡ Key Technical Patterns

### 1. IBM Carbon Design Tokens
Styles are derived from `src/app/globals.css` using CSS variables (`--cds-spacing-*`, `--cds-interactive-*`). These are mapped to Tailwind classes in `tailwind.config.ts`.

### 2. Firebase Integration
- **Auth**: Client-side logic handled via `fetch` to backend APIs.
- **Messaging**: `src/hooks/use-push-notifications.ts` manages service workers and FCM tokens.
- **Remote Config**: `src/hooks/use-remote-config.ts` fetches live toggles (e.g., appeal windows).

### 3. State Flow
- **URL-Driven State**: Frequent use of `?uid=` and `?token=` for session persistence across dynamic routes.
- **Alert Context**: `src/context/alert-context.tsx` provides a standard way to trigger institutional-style error/info modals.

---

## 🛠️ Root Configuration Files

- `next.config.ts`: Configures API rewrites and remote image patterns.
- `tailwind.config.ts`: Customizes theme to match **IBM Carbon** colors and 8px grid.
- `apphosting.yaml`: Defines Firebase App Hosting runtime specifications.
- `vercel.json`: Manages deployment headers and cdn path logic.

---
© 2025 E.G.S. Pillay Group of Institutions.