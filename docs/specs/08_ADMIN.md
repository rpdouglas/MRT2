# 📐 Feature Spec: Admin Dashboard

**Status:** Live (v1.2)
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

### C. Maintenance Tools
* **Deduplicator:** Scans `journals` for duplicate content/timestamps (common import bug) and batch-deletes.
* **Schema Migration:** Updates legacy `insights` docs (e.g., mapping `actionableSteps` -> `suggested_actions`).

## 3. Verification
* [ ] **RBAC:** Can a non-admin user access `/admin`? (Should redirect).
* [ ] **Telemetry:** Trigger a crash. Does it appear in the Health tab?
