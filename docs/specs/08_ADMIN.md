# 📐 Feature Spec: Admin Dashboard

**Status:** Live (v1.7)
**Access:** Strict RBAC (Role-Based Access Control)
**Security Level:** High

## 1. Security Model (Split Authority)
The system uses a "Defense in Depth" approach:
1.  **UI Access:** Controlled by the `role` field on the `users/{uid}` document.
2.  **Database Access:** Controlled by `request.auth.token.admin` (Firebase Custom Claims).
* **Constraint:** Updating a user's role in the UI (`UserDirectory`) grants them *UI Access* immediately, but *Database Access* requires running the server-side script `scripts/set_admin_role.cjs`.

## 2. Sub-Modules

### A. Telemetry (Health)
* **Source:** `client_errors` collection.
* **Feature:** `ErrorLogViewer` visualizes crash reports and uses Gemini to suggest fixes.

### B. User Directory
* **Source:** `users` collection.
* **Feature:** Searchable list of all users. Allows toggling the `role` field.

### C. Feedback Inbox (New)
* **Source:** `feedback` collection.
* **Feature:** `FeedbackViewer` allows admins to read, filter, and resolve user reports.
* **Context:** Displays `buildHash` and `route` to help reproduce bugs.

### D. Maintenance Tools
* **Deduplicator:** Scans `journals` for duplicate content/timestamps and batch-deletes.
* **Schema Migration:** Updates legacy documents to match current type definitions.

## 3. Verification
* [ ] **RBAC:** Can a non-admin user access `/admin`? (Should redirect).
* [ ] **Telemetry:** Trigger a crash. Does it appear in the Health tab?
* [ ] **Inbox:** Submit feedback as a user. Does it appear in the Admin Inbox?
