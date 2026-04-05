# CreditWise: Faculty Performance Management System

**CreditWise** is a robust, institutional-grade performance tracking and credit management platform specifically designed for the **E.G.S. Pillay Group of Institutions**. It empowers faculty members to track their achievements and career growth while providing administrators with high-fidelity oversight and reporting tools.

## 🚀 Project Overview

The system facilitates a transparent, merit-based environment where faculty can submit "Good Works" for points and administrators can issue official remarks. It leverages a modern, responsive interface built on the **IBM Carbon Design System** to ensure maximum productivity and accessibility.

### Key Functional Areas:
- **Faculty Portal**: Achievement submission, credit tracking, real-time analytics, and automated appeal filing.
- **Admin Dashboard**: Bulk user management, credit category configuration, submission review, and institutional reporting.
- **OA (Office Assistant) Workflow**: Optimized data entry for recording remarks and awarding achievement credits as directed.
- **Security & Communications**: Multi-factor authentication (MFA), secure session management, and cross-channel notifications (Push, WhatsApp, Email).

---

## 🛠️ Tech Stack

### Frontend & UI
- **Next.js 15 (App Router)**: High-performance React framework with server-side rendering.
- **TypeScript**: Static typing for robust, error-free development.
- **Tailwind CSS**: Utility-first styling for rapid layout development.
- **IBM Carbon Design System**: Institutional "Productive UI" design language and tokens.
- **ShadCN UI**: Accessible, high-quality component primitives.
- **GSAP**: Precision motion and interface transitions.
- **Recharts**: Responsive data visualization for performance trends.

### Backend & AI
- **Firebase**:
  - **Authentication**: Secure identity management with MFA support.
  - **Remote Config**: Real-time feature toggles and system announcements.
  - **Cloud Messaging (FCM)**: Institutional push notifications.
  - **Analytics & Performance**: Real-time monitoring of user experience.
- **Genkit**: AI-powered helpers for achievement rationale and reporting (Ready for integration).

---

## 📐 Design Philosophy: IBM Carbon

CreditWise strictly adheres to the **IBM Carbon Design System** principles:
- **Clarity**: Every pixel serves a purpose. High-contrast data entry and simplified workflows.
- **Responsiveness**: A true 16-column flexible grid that adapts from mobile (4 columns) to 4K displays.
- **Productivity**: Focused on "Productive UI" traits—sharp edges, precise spacing, and minimal distraction.
- **Institutional Branding**: Integration of EGS Pillay's identity within a professional design framework.

---

## 🔐 Security Features
- **Multi-Factor Authentication**: Support for both Email OTP and TOTP Authenticator Apps.
- **Session Control**: Active session monitoring with the ability to remotely revoke device access.
- **WhatsApp Verification**: Secure number linking via OTP for instant institutional updates.
- **Data Integrity**: Immutable snapshotting of faculty profiles for all historical credit records.

---

## 🚦 Getting Started

### Development
```bash
npm run dev
```
Access the development server at `http://localhost:9002`.

### Production Build
```bash
npm run build
npm start
```

---

© 2025 E.G.S. Pillay Group of Institutions. All rights reserved.