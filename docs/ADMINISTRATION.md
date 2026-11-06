# User and application administration

The **Home → Dashboard** overview shows live account totals, the selected academic year's credit records and effective points, pending positive reviews, open appeals, monthly credit activity, submission decisions, college activity, and recent records. Account and registration figures cover all years; credit figures follow the academic year selector. Use **Refresh** to reload the latest figures. Queue and metric cards link to the corresponding management pages.

Open **Setup** in the admin sidebar to manage application-wide configuration. Personal profile, password, appearance, and security settings are in **My account**; the top bar also contains the profile menu and notifications.

- **Organization:** create institutions, add their colleges, and manage departments within each college. Names and IDs must be unique within their lists. Archived units remain visible in user filters but cannot receive new users or transfers. A populated unit cannot be removed or renamed until its users are transferred.
- **Academic years:** add consecutive years in `YYYY-YY` format, set start/end dates, choose the current year, and open or close years. Dates cannot overlap. Closing a year blocks new credit submissions and edits to existing credit submissions in that year; reports, review decisions, and appeals remain accessible. Existing `YYYY-YYYY` credit labels follow the same year status.
- **Administration:** configure the organization name shown in the workspace, the help email, minimum length for administrator-created/reset passwords, and transfer availability/reason requirements.
- **Change history:** see the most recent 100 settings saves. Save changes explicitly. A stale settings form returns a conflict; discard changes to reload before editing again.

Open **People → Faculty accounts** to filter by institution, college, department, role, status, or a name/email/faculty ID. Use **Add single user** for one account or **Bulk import** for a spreadsheet. Create users in an active college and department. Faculty requires a department. Edit profile/contact details, roles, activation status, and passwords using the edit action. Administrators cannot deactivate or change their own role; superadmin accounts are protected.

Use the arrow transfer action beside a user to select a destination institution, college, and department, supply a reason, and confirm. Transfers take effect immediately. They preserve the account ID, faculty ID, and all credit records; synchronize current employment; append previous employment and transfer history; and revoke previous login sessions. Reopen the action to see the user's transfer history. Reload if another administrator changed the user while the form was open.

Select accounts on the current page to activate/deactivate them or export their directory details to CSV. Bulk changes report individual failures and retain successful changes. Deactivation preserves records and revokes sessions. Role changes and password resets also revoke sessions.

The spreadsheet import link supports up to 1000 rows per upload. Columns are `name`, `email`, `password`, `role`, `college`, and `department`. Roles are `faculty`, `oa`, or `admin`. Use exact active college/department names from Application settings. The downloaded template uses an active placement from the managed directory. Results include successful and failed rows; invalid rows do not prevent other rows from importing. Distribute account credentials separately.

## Storage and permissions

Configuration is stored in the existing `DYNAMO_DB_POLICIES` table under the reserved `_id` `application-settings`; no new table is needed. The policy model excludes this configuration record from policy listings. The initial directory includes the existing college catalog and current user placements. The first save persists that directory. Settings saves use revision checks; transfers update placement and history together with a conditional write.

Administrators and superadmins have `settings.manage` and `user.transfer` permissions. Signed-in users can read directory/year configuration; settings audit metadata is restricted to administrators. These permissions grant application-wide administration. Institution filters organize the directory; they do not grant or restrict access to a particular institution.
