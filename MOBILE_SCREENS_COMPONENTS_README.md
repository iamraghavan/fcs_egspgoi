# CreditWise mobile screens and components

This is the **screen inventory for the proposed Android and iOS app**. It maps each role to the screens it uses and names the components needed on each screen. It is a design and implementation handoff, not a claim that these mobile screens already exist. The source product is the current [website](README.md); the architecture and Claude design prompt are in [MOBILE_APP_README.md](MOBILE_APP_README.md).

## Read this first

| Symbol     | Meaning                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| **MVP**    | Build for the first mobile release.                                                   |
| **Later**  | Design now, implement after the core workflows are proven.                            |
| **Shared** | Same screen pattern for several roles; content and actions follow server permissions. |

**Role rules:** Faculty sees only their own credits, submissions, appeals, and profile. OA sees the faculty directory and only credits issued by that OA; OA may edit or void only their own issued credits. Admin can review institutional records and manage users. Superadmin uses admin screens with any extra controls granted by the server. The app must handle 401/403 responses even when a button was visible.

**Accounting rules:** An issued negative credit deducts immediately. An accepted appeal makes its _effective_ deduction zero while preserving the issued record. Positive credit contributes after approval. Voided records stay in the audit trail and have zero balance effect. Display original points and effective balance impact separately.

## Role navigation map

The tab names below are proposed for mobile. They are intentionally shorter than the website sidebar. Details open in a stack; forms and filters open as full screens or bottom sheets. “More” contains profile, settings, notifications, and help.

| Role                 | Main tabs                                      | What opens from a tab                                                                               |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Faculty              | **Home · Credits · Submit · Appeals · More**   | Credit detail, good-work history, negative-credit detail, appeal form, notification detail.         |
| OA                   | **Home · Issue · My credits · Faculty · More** | Faculty picker/detail, issue confirmation, issued-credit detail, edit/void, activity timeline.      |
| Admin and superadmin | **Home · Review · People · Ledger · More**     | Appeal review, good-work review, account detail, credit detail, ranking, reports, policy/templates. |

Use a bottom tab bar on phones and a navigation rail on tablets. Show a title and back action on every pushed detail screen. Keep only one primary action per screen.

## 1. Shared screens

| ID / screen                                   | Used by                 | Components inside the screen                                                                                                        | Main behavior                                                                                                   |
| --------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **S01 Welcome / Sign in** · MVP               | All roles               | `BrandHeader`, `EmailField`, `PasswordField` with show/hide, `PrimaryButton`, `ForgotPasswordLink`, `InlineError`, `LoadingOverlay` | Sign in; route using the server-returned role. Never show a role picker that grants access.                     |
| **S02 MFA / verification** · MVP              | All roles when required | `CodeInput`, `AuthenticatorHint`, `ResendTimer` where applicable, `VerifyButton`, `RecoveryAction`, `InlineError`                   | Complete the existing MFA or WhatsApp verification flow. Handle expired codes and retry limits.                 |
| **S03 Forgot / reset password** · MVP         | All roles               | `EmailField`, `InstructionBlock`, `PasswordStrengthHint`, `ConfirmPasswordField`, `SuccessState`                                    | Recover access with neutral success wording; deep-link back to sign in.                                         |
| **S04 Notifications inbox** · MVP             | All roles               | `AppHeader`, `UnreadCounter`, `NotificationCard`, `DateGroup`, `EmptyState`, `RefreshControl`                                       | Open the authorized destination; clear badge after read. Push preview contains no sensitive faculty details.    |
| **S05 Notification detail** · MVP             | All roles               | `EventHeader`, `MessageBody`, `TimestampLabel`, `ContextLink`, `ReadState`                                                          | Explain the event and link to the related credit, appeal, or submission if permitted.                           |
| **S06 My profile** · MVP                      | All roles               | `ProfileHeader`, `IdentityCard`, `CollegeDepartmentRow`, `ContactFields`, `EditProfileButton`                                       | Show name, role, faculty/employee ID if present, institution details, and editable self fields.                 |
| **S07 Settings & security** · MVP             | All roles               | `SettingsGroup`, `MfaToggle`, `SessionList`, `ThemePicker`, `NotificationPreference`, `SignOutButton`                               | Manage own account and sessions. Sensitive actions ask for confirmation; sign out clears local sensitive cache. |
| **S08 Help / support** · MVP                  | All roles               | `SearchField`, `HelpTopicList`, `ContactCard`, `AppVersionRow`                                                                      | Role-aware help for credits, appeals, account access, and evidence uploads.                                     |
| **S09 Session expired / access denied** · MVP | All roles               | `StateIllustration`, `PlainLanguageMessage`, `RetryButton` or `SignInButton`                                                        | Separate expired login from insufficient permission; never reveal restricted record contents.                   |

## 2. Faculty screens

| ID / screen                               | Components inside the screen                                                                                                                                                   | Main behavior                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **F01 Home** · MVP                        | `GreetingHeader`, `AcademicYearPicker`, `BalanceHero` (net), `PositiveNegativePair`, `PendingSubmissionTile`, `ActiveAppealTile`, `RecentActivityList`, `QuickAction`          | First glance at standing. Each number opens the related filtered list. Never combine positive and negative totals into one unlabeled score. |
| **F02 My credits** · MVP                  | `SegmentedControl` (all/positive/negative), `SearchField`, `FilterChips`, `SortSheet`, `CreditCardList`, `PaginationFooter`                                                    | Search and filter own records by year, status and date; sort newest/oldest and points high/low.                                             |
| **F03 Credit detail** · MVP               | `SignedPointsHeader`, `StatusBadge`, `OriginalVsEffectiveImpact`, `IssuedAtRow`, `IssuerRow` if authorized, `TemplateDetails`, `NotesBlock`, `EvidenceViewer`, `EventTimeline` | Show the exact event and its balance effect. On an appealed negative credit, show appeal outcome and eligibility/action.                    |
| **F04 Good works history** · MVP          | `SearchField`, `StatusTabs`, `GoodWorkCard`, `FilterSheet`, `EmptyState`                                                                                                       | Track submitted positive-credit claims with pending, approved, rejected, and voided states.                                                 |
| **F05 Submit good work** · MVP            | `CategoryPicker`, `TitleField`, `DescriptionField`, `AcademicYearPicker`, `EvidencePicker`, `DraftIndicator`, `ReviewButton`                                                   | Validate inputs, retain a local draft until server receipt, and prevent duplicate tap submissions.                                          |
| **F06 Submission review / receipt** · MVP | `SubmissionSummary`, `EvidencePreview`, `EditLink`, `SubmitButton`, `ReceiptCard`                                                                                              | Confirm exact details before send; show server ID and status after success.                                                                 |
| **F07 My remarks** · MVP                  | `NegativeCreditCardList`, `StatusFilter`, `IssuedDateRange`, `AppealEligibilityBadge`                                                                                          | See each deduction, issue timestamp, source and appeal availability.                                                                        |
| **F08 My appeals** · MVP                  | `AppealStatusTabs`, `AppealCard`, `DecisionSummary`, `DateRangeFilter`, `EmptyState`                                                                                           | Track pending, accepted, rejected and withdrawn appeals without hiding the original deduction.                                              |
| **F09 Create / edit appeal** · MVP        | `NegativeCreditSummary`, `AppealDeadlineNotice`, `ReasonField`, `EvidencePicker`, `ReviewConfirmation`, `SubmitButton`                                                         | Appeal only an eligible own negative credit; show a confirmation receipt and preserve drafts on network failure.                            |
| **F10 Professional profile** · Later      | `EmploymentSummary`, `QualificationSections`, `EditableFieldGroup`, `SaveBar`                                                                                                  | Extend the shared profile for professional details already exposed by the website. Verify editable fields before implementation.            |

## 3. Office Assistant (OA) screens

| ID / screen                                | Components inside the screen                                                                                                                                                                      | Main behavior                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **O01 Home** · MVP                         | `GreetingHeader`, `MyIssuedSummary` (positive, negative, voided), `IssueShortcut`, `RecentOwnCredits`, `PendingOwnAppeals`                                                                        | Personal work summary. Every credit count and card is scoped to the signed-in OA on the server.                         |
| **O02 Issue credit** · MVP                 | `FacultyPicker`, `CreditTypeToggle`, `CreditTemplatePicker`, `ReadonlyTemplatePoints`, `ManualPositivePoints` where allowed, `AcademicYearPicker`, `NotesField`, `EvidencePicker`, `ReviewButton` | Issue a positive or negative credit. Template title and points come from the server, not client input.                  |
| **O03 Issue confirmation / receipt** · MVP | `FacultyIdentityCard`, `SignedAmountSummary`, `TemplateSummary`, `EvidencePreview`, `ConfirmButton`, `ReceiptCard`                                                                                | Show faculty name, ID, college and exact signed points before a single submit. Receipt links to the issued credit.      |
| **O04 My credits** · MVP                   | `OwnIssuedCount`, `SearchField`, `TypeStatusFilters`, `DateRangeFilter`, `PointsSort`, `CreditCardList`, `EmptyState`                                                                             | List **only** credits issued by this OA. Never fetch all OA credits and filter them locally.                            |
| **O05 My issued credit detail** · MVP      | `CreditDetail` shared pattern, `FacultyIdentityCard`, `IssuedByMeLabel`, `OriginalVsEffectiveImpact`, `EvidenceViewer`, `EventTimeline`, `EditAction`, `VoidAction`                               | Show source, issue time, edits, appeals and balance effect. Hide actions on voided or otherwise ineligible records.     |
| **O06 Edit my credit** · MVP               | `OriginalValuesPanel`, `AllowedFieldsForm`, `ChangeReasonField`, `ChangePreview`, `SaveButton`, `ConflictState`                                                                                   | Only the issuing OA may edit. Explain template-controlled points; show before/after values and handle concurrent edits. |
| **O07 Void my credit** · MVP               | `CreditSummary`, `ReasonField`, `BalanceImpactPreview`, `ConsequenceText`, `ConfirmVoidButton`                                                                                                    | Void with a reason after deliberate confirmation. The record and audit timeline remain; the balance is recalculated.    |
| **O08 Faculty directory / picker** · MVP   | `SearchField`, `CollegeFilter`, `DepartmentFilter`, `FacultyListItem` (name, ID, college, department), `NoMatchState`                                                                             | Read active faculty for issuing a credit; OA cannot manage accounts or browse other OA users.                           |
| **O09 Faculty context** · Later            | `FacultyIdentityCard`, `DepartmentBadge`, `IssueShortcut`                                                                                                                                         | Minimal context for choosing the right person. Do not expose the full admin ledger to OA.                               |

## 4. Administrator and superadmin screens

The admin app can reuse the faculty/credit detail components, but its lists and actions have broader scope. Superadmin gets the same screen map and any additional action that the backend explicitly grants. Do not assume every admin can use every endpoint if permission overrides deny it.

| ID / screen                            | Components inside the screen                                                                                                                                           | Main behavior                                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01 Home** · MVP                     | `InstitutionHeader`, `AcademicYearPicker`, `OverviewMetricGrid`, `ReviewQueuePreview`, `AppealCountTile`, `RecentActivityList`                                         | Summarize institution work and link to the corresponding queues.                                                                                                 |
| **A02 Review hub** · MVP               | `SegmentedControl` (good works/appeals), `QueueCount`, `SearchField`, `FilterSheet`, `ReviewCardList`                                                                  | Prioritize items by date/status/college, with visible filter chips and result counts.                                                                            |
| **A03 Good-work review detail** · MVP  | `FacultyIdentityCard`, `SubmissionSummary`, `EvidenceViewer`, `Timeline`, `DecisionControls`, `ReviewNotes`, `DecisionConfirmation`                                    | Approve or reject eligible submissions and display the resulting credit impact.                                                                                  |
| **A04 Appeal review detail** · MVP     | `NegativeCreditSnapshot`, `IssuedAtRow`, `IssuerRow`, `AppealReasonBlock`, `EvidenceViewer`, `EventTimeline`, `DecisionControls`, `DecisionConfirmation`               | Accept/reject an appeal. Show original deduction, current impact and predicted impact after decision; preserve the decision event.                               |
| **A05 People directory** · MVP         | `SearchField`, `RoleFilter`, `StatusFilter`, `CollegeDepartmentFilters`, `UserListItem`, `CreateUserAction`, `PaginationFooter`                                        | Search all authorized accounts; distinguish same-name faculty with ID and institution context.                                                                   |
| **A06 User detail / management** · MVP | `IdentityCard`, `RoleBadge`, `AccountStatusBadge`, `ContactAndEmployment`, `PermissionSummary`, `ActivitySummary`, `ActionMenu`                                        | Edit permitted fields, deactivate an account, reset password. Show confirmation and success state; no physical deletion. Reactivation needs a verified API path. |
| **A07 Create / edit user** · MVP       | `RolePicker`, `IdentityFields`, `CollegeDepartmentPicker`, `FacultyIdField`, `ValidationMessages`, `SaveBar`                                                           | Validate role-specific required fields and return to the saved user detail.                                                                                      |
| **A08 Faculty ledger directory** · MVP | `SearchField`, `CollegeDepartmentFilters`, `RankingSort`, `FacultyLedgerRow`, `ResultCount`                                                                            | Find faculty and compare positive, negative, net and record status breakdown. Rank within each college when college grouping is selected.                        |
| **A09 Faculty ledger detail** · MVP    | `FacultyHeader`, `BalanceHero`, `PositiveNegativePair`, `YearSwitcher`, `RecordBreakdown`, `CreditTimeline`, `IssuerRow`, `AppealSummary`, `ExportAction` if supported | Show who issued each credit, when, what happened afterward, and how it affects the balance. Full-screen on phone; three-quarter-width panel on tablet.           |
| **A10 Credit record detail** · MVP     | `CreditDetail` shared pattern, `FacultyIdentityCard`, `SourceTemplateBlock`, `EvidenceViewer`, `EventTimeline`, `AdminActionMenu`                                      | See all authorized events. Use “Void” wording and preserve the record; show edit/review controls only when API and policy allow.                                 |
| **A11 Issue credit** · MVP             | `FacultyPicker`, `CreditTypeToggle`, `CreditTemplatePicker`, `NotesField`, `EvidencePicker`, `ConfirmationSummary`                                                     | Admin issues using the same validated workflow as OA, with institution scope.                                                                                    |
| **A12 Reports summary** · Later        | `ReportPresetCards`, `AcademicYearPicker`, `CollegeDepartmentFilters`, `ChartOrTableToggle`, `ExportStatus`                                                            | Start with read-only dashboards and lightweight views; retain complex report building/export on web until API/mobile validation.                                 |
| **A13 Credit templates** · Later       | `TemplateList`, `TypeFilter`, `TemplateEditor`, `PointsPreview`, `ArchiveConfirmation`                                                                                 | Manage allowed titles and points. Changes affect future issuance; existing credit records retain their issued values.                                            |
| **A14 Credit policies** · Later        | `PolicyList`, `VersionBadge`, `EffectiveDate`, `PolicyDetail`, `PublishConfirmation`                                                                                   | Read and manage policy versions only when backend actions and audit are confirmed.                                                                               |
| **A15 Bulk import** · Web-first        | `ImportHelpCard`, `OpenWebAction`                                                                                                                                      | Keep spreadsheet import on the website for the first mobile release; provide an accessible handoff if admins need it.                                            |

## Shared component contract

Each component below should have loading, empty, error, disabled and accessibility states where applicable. The API client provides data; UI components never calculate official credit balances themselves.

| Component                              | Required props/content                                                               | Used in                       |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------- |
| `AppHeader` / `TabBar`                 | Title, back destination, optional action, unread count, safe-area inset              | Every screen                  |
| `IdentityCard` / `FacultyIdentityCard` | Name, ID, role, college, department, avatar fallback                                 | S06, O02–O09, A03–A11         |
| `BalanceHero` / `PositiveNegativePair` | Net, positive, negative, academic year, last updated                                 | F01, A09                      |
| `SignedPointsHeader`                   | `+`/`−`, absolute amount, credit type text, status                                   | F03, O05, A10                 |
| `OriginalVsEffectiveImpact`            | Issued points, effective points, reason for difference                               | F03, O05, A04, A09, A10       |
| `StatusBadge`                          | Explicit status text plus icon; color is supplementary                               | All record cards/details      |
| `CreditCard` / `CreditTimeline`        | ID, title, type, points, status, issue time, issuer, action eligibility              | F02/F03, O04/O05, A08–A10     |
| `EventTimeline`                        | Ordered event type, actor, timestamp, reason, before/after                           | F03/F08, O05, A04/A09/A10     |
| `FilterSheet` / `SortSheet`            | Available filters, current values, Apply/Reset, result count                         | F02/F04/F07, O04, A02/A05/A08 |
| `EvidencePicker` / `EvidenceViewer`    | File type/size, upload progress, retry, accessible preview                           | F05/F09, O02, A03/A04/A11     |
| `DecisionConfirmation`                 | Record identity, old/new impact, decision, notes, irreversible consequence           | A03/A04, O07                  |
| `AsyncState`                           | Loading skeleton, no results, offline retry, permission denied, expired session      | All list and detail screens   |
| `SafeDateTime`                         | Parsed API timestamp, local readable date/time, timezone on decisions, fallback text | Every record/event screen     |

### Component and interaction requirements

- **Search:** Debounce text input, fetch server-filtered results, cancel stale requests, and preserve filters when returning from detail.
- **List:** Load paginated results and refresh without duplicating cards; show a clear end-of-list state.
- **Forms:** Persist an unsent draft only on-device, show field errors beside inputs, and disable submit while a request is in flight.
- **Network loss:** Allow read-only cached views with a “May be outdated” label; do not silently queue credit issuance, appeal decisions or voids. Those need server idempotency before retry automation.
- **Audit actions:** Always show actor, event time, reason, original value and resulting value when the backend returns them. Do not use “Delete” for credit voids.
- **Accessibility:** Screen-reader labels describe signed values (“five negative points”), status and action consequence. Maintain large tap targets and support dynamic text size.

## End-to-end navigation examples

```text
Faculty: Home → Negative credits → Credit detail → Appeal form → Review → Appeal receipt → My appeals
OA: Issue → Faculty picker → Negative template → Confirm issue → Receipt → My credits → Credit detail → Edit/Void
Admin: Review → Appeals queue → Appeal review detail → Accept/Reject → Confirm → Updated ledger
Admin: People → Search account → User detail → Edit/Deactivate/Reset password → Confirmation
Admin: Ledger → College ranking → Faculty ledger → Credit event → Appeal/audit timeline
```

## Handoff checklist for Claude and implementation

For each screen ID above, produce a phone frame with default, loading, empty, error and action states; list exact components; show role and permissions; supply realistic **synthetic** data; describe navigation; and show a tablet adaptation for A08/A09. Do not use real faculty records or credentials in design files. Keep the [design tokens and Claude prompt](MOBILE_APP_README.md#design-language-for-claude) as the visual source, and keep the backend as the authority for role access and balance calculations.
