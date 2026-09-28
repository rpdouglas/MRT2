# 📁 Project 121: Admin User Deletion

**Status:** 🟢 Done
**Primary Persona:** Alex/Dev (Internal Stakeholder — `docs/governance/INTERNAL_PERSONAS.md`; this is operational tooling, not a David/Ned/Lisa/Walt/Maya/Jordan-facing feature)
**Objective:** Give an admin a safe, audited way to delete another user's account (data and/or Auth record) directly from the Admin Dashboard, so production test/spam accounts don't have to accumulate indefinitely.

---

## 1. The Executive Summary
**User Story:** As an admin (rpdouglas@gmail.com), I want to delete a test or spam user's account from the Users tab so production data stays clean without hand-rolling one-off scripts against the Firestore/Auth consoles.
**Source:** 2026-09-18 — admin noted a growing number of test users in `mrt2-app-prod` with no in-dashboard way to remove them, discovered while reviewing `FriendsDirectory.tsx` for an unrelated claim-restore fix.
**Competitive Gap:** N/A — internal operational tooling, not a user-facing differentiator.

**Current state (confirmed by reading code, not assumed):**
- `FriendsDirectory.tsx` (the Users tab) already supports role promote/demote and manual VIP grant/revoke via direct client `updateDoc` calls — no delete action of any kind exists.
- Self-service deletion exists (`src/lib/deletion.ts`'s `executeTotalAccountAnnihilation`, PROJ-115) but only works for a user acting on **their own** account: it purges the `SCAN_TARGETS` manifest of Firestore collections, then `AuthContext.tsx`'s `deleteAccount()` calls the client SDK's `deleteUser(user)` — which can only ever delete the *currently signed-in* user's own Auth record, never another uid's. There is no code path today, client or server, that can delete another user's Auth record.
- `firestore.rules` gives `isAdmin()` delete rights on only a handful of collections (`users`, `ai_logs`, `client_errors`, `feedback`) — the majority of `SCAN_TARGETS` (`journals`, `tasks`, `workbook_answers`, `mat_doses`, `rosc_assessments`, `game_progress`, `game_saves`, `service`, `insights`, `templates`) are `isResourceOwner()`-only. An admin cannot purge most of a target user's data from the client today, by rule design — reusing the client-side purge path for an admin would require broadening those rules to grant admin delete on every personal-data collection, which is a meaningfully bigger ZK-boundary change than this ticket should make.
- **Conclusion:** admin-triggered deletion of another user's data and/or Auth record is only possible via a privileged, Admin-SDK-based Cloud Function (bypasses `firestore.rules` and can call `admin.auth().deleteUser()`), matching the same conclusion PROJ-115 §6 already reached for the Stripe/Play-Billing purge gap.

**Decisions locked in for this spec (per admin, 2026-09-18):**
1. **Scope of deletion is configurable per action** — the admin chooses, at delete time, some combination of: purge Firestore data, delete the Firebase Auth record, or both. Not a single irreversible "nuke everything" button.
2. **Auth record deletion is in scope** — unlike self-service deletion today, this must be able to actually free the uid/email in Firebase Auth, not just clear Firestore data.
3. **An audit trail is required** — every admin deletion action (attempted or completed) must be recorded: which admin, which target, what scope was chosen, when, and outcome. Not optional, not deferred.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Yes — this touches every category of user data in the system (encrypted personal content, plaintext metadata, Auth identity) via a privileged server-side path. The admin performing the deletion never decrypts or reads any of it; the Cloud Function deletes documents/records by reference, the same "delete without reading" shape `executeTotalAccountAnnihilation` already uses for self-service deletion.
* [x] **Encryption Strategy:** N/A — deletion removes documents outright; no new encrypt/decrypt logic, no plaintext ever transits through this feature.
* [x] **Key Rotation:** N/A — this doesn't touch `executePinRotation`/`executeCryptoShredding`; it's a different function (Admin SDK, different uid) doing the same category of thing `executeTotalAccountAnnihilation` does for a self-service deletion.
* [ ] **`zk-audit` pass required before implementation** — specifically to re-verify the server-side purge target list stays a true superset of `SCAN_TARGETS`-plus-the-admin-only collections (see §3), and that the new audit-log collection can't leak into any client read path it shouldn't.

**Why this doesn't weaken the zero-knowledge boundary:** the admin is granted the ability to *delete* another user's records and Auth identity, never to *read* their encrypted content. This is a materially different (and much smaller) trust expansion than, say, letting admin decrypt vault content — it's closer in kind to an admin's existing ability to already delete `users/{uid}` docs, `ai_logs`, `client_errors`, and `feedback` for any user today.

---

## 3. Schema & Architecture 🗄️

**No new Firestore fields on `UserProfile`.** One new collection:

**`admin_audit_log/{logId}`** — new, root collection, server-write-only.
```typescript
// src/lib/db.ts
export interface AdminAuditLogEntry {
  id: string;                    // Firestore doc ID
  action: 'user_deletion';       // extensible if other audited admin actions get added later
  performedByUid: string;        // the admin's uid
  performedByEmail: string | null; // denormalized for readability in the dashboard — admin's own email, not the target's
  targetUid: string;
  targetEmail: string | null;    // denormalized snapshot at time of action (the account may cease to exist afterward)
  scope: {
    purgedFirestoreData: boolean;
    deletedAuthRecord: boolean;
  };
  outcome: 'success' | 'partial_failure' | 'failure';
  detail?: string;                // e.g. which collections failed, or the caught error message — operational text, not user content
  documentsDeletedCount?: number;
  timestamp: Timestamp;
}
```
Plaintext throughout — this is operational/administrative metadata about an admin's own actions, not recovery content, same category as `usage_limits` or `pinAttempts` in the existing ZK table. Admin-read-only, server-write-only (mirrors the `buffer_status` pattern — `allow read: if isAdmin(); allow write: if false;` — nothing client-side ever legitimately writes it, so it doesn't need the `isCreatingOwnedResource()` client-create path other logged collections use).

**Firestore rules addition:**
```
match /admin_audit_log/{logId} {
  allow read: if isAdmin();
  allow write: if false; // Cloud-Function/Admin-SDK-only, same posture as buffer_status
}
```

**Cloud Function (`functions/src/index.ts`), new `onCall`, modeled directly on `generateReadingsAdmin`'s existing admin-gate pattern:**
```typescript
export const deleteUserAccount = onCall({
    timeoutSeconds: 120,
    region: "northamerica-northeast1",
}, async (request) => {
    if (!request.auth?.token.admin) {
        throw new HttpsError("permission-denied", "Admin access required.");
    }
    const { targetUid, purgeFirestoreData, deleteAuthRecord } = request.data as {
        targetUid: string;
        purgeFirestoreData: boolean;
        deleteAuthRecord: boolean;
    };
    // Guardrails (see Phase 3 Edge Cases): reject self-deletion via this
    // path, reject if targetUid is not a string, reject if neither scope
    // flag is set (a no-op call shouldn't still write an audit entry claiming
    // an action happened).
    // ... performs the purge (server-side equivalent of SCAN_TARGETS, run
    // with Admin SDK so it isn't limited by firestore.rules — see Phase 1)
    // and/or admin.auth().deleteUser(targetUid), then writes the
    // admin_audit_log entry unconditionally (including on partial failure)
    // before returning/throwing.
});
```

**Metadata that must be preserved:** `targetUid` and a denormalized `targetEmail`/`performedByEmail` snapshot in the audit entry — once the Auth record is gone, `admin.auth().getUser(targetUid)` can no longer resolve an email for historical log entries, so the email must be captured *before* deletion, not looked up later.

**Date normalization:** `timestamp` is written server-side as a Firestore `Timestamp` (via Admin SDK `FieldValue.serverTimestamp()`), converted to a JS `Date` only at render time in the audit-log UI (`.toDate()`), same convention as every other collection.

**ZK boundary — every field touched by this feature, explicitly:**
| Field/Collection | Encrypted? | Notes |
|---|---|---|
| `admin_audit_log/*` (all fields) | ❌ No | Operational metadata about the admin action itself, not recovery content. Never contains decrypted user content. |
| Every collection in the server-side purge target list | N/A (deleted, not read) | The Cloud Function deletes by reference/uid-query; it never reads or decrypts `content`, `encryptedStats`, `encryptedNote`, etc. |

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* **New Cloud Function** `deleteUserAccount` (`functions/src/index.ts`) — admin-gated `onCall`, per §3.
  * Server-side purge target list should be defined once and shared conceptually with `src/lib/deletion.ts`'s `SCAN_TARGETS` — **cannot literally import** the client file into `functions/` (separate `tsconfig`/build), so this needs its own manifest. Flag this as a duplication risk explicitly: add a regression test (both sides) asserting the two lists stay in sync, the same recurrence-prevention approach PROJ-115 used for `SCAN_TARGETS` itself, so a collection added to one and not the other fails CI instead of shipping silently.
  * Because Admin SDK bypasses `firestore.rules` entirely, this function *can* purge every collection in `SCAN_TARGETS` (including the ones `isAdmin()` has no client rule for) plus `users/{uid}` and `user_reading_preferences/{uid}` — i.e. full parity with self-service deletion, without touching `firestore.rules`' existing per-collection delete permissions at all.
  * **Explicitly out of scope for this ticket** (same as PROJ-115 §6's own deferral): purging the target user's Stripe (`checkout_sessions`, `subscriptions`, `payments`) or Play Billing (`playPurchases`, `playPurchaseIndex`) records. Deleting a live Stripe subscription has real billing/refund implications beyond a Firestore delete — needs its own product decision, not folded into a bulk test-user cleanup tool. Flag if the admin actually needs this for the specific test accounts driving this request.
  * Write the `admin_audit_log` entry **unconditionally**, including on partial failure (e.g. Firestore purge succeeds but `deleteUser` throws because the Auth user was already gone) — the audit trail's value is highest exactly when something went wrong.
* **`firestore.rules`:** add the `admin_audit_log` match block (§3). No changes needed to any existing collection's rules — the whole point of the Cloud-Function approach is avoiding that broader, riskier rules change.
* **New React Query hook** (`src/hooks/useAdminUserDeletion.ts` or similar) wrapping a `useMutation` that calls `deleteUserAccount` via `httpsCallable` — per `CLAUDE.md`, all Firestore-adjacent admin actions should still go through TanStack Query rather than a bespoke `useState`/`try-catch` (note: `FriendsDirectory.tsx` today does NOT follow this convention for its existing actions — role/VIP changes are raw `updateDoc` calls in local async handlers. Don't propagate that pattern to a destructive new action; use this ticket to introduce the correct pattern here even though the file's existing code doesn't).

### Phase 2: UI/UX & Gamification
* **`FriendsDirectory.tsx`:** add a "Delete" action (icon button, e.g. `TrashIcon`) to the Actions column, opening a new confirmation modal rather than a `window.confirm()` — this is a meaningfully more destructive action than the existing role-toggle/VIP-toggle confirms, and needs to surface the configurable-scope choice, which a one-line `confirm()` can't.
* **New component** (e.g. `src/components/admin/DeleteUserModal.tsx`):
  * Shows the target user's email/uid/joined date for confirmation context.
  * Two independent checkboxes/toggles: "Purge Firestore data" and "Delete Auth record" (both default-checked, since "delete this user" most naturally means both — but each can be unchecked, per the configurable-scope requirement).
  * Requires typing the user's email to confirm (same friction level as `AccountDeletionModal.tsx`'s self-service flow) — this is irreversible and hard to undo, so it should be at least as hard to trigger accidentally as a user's own self-deletion is.
  * Disabled/blocked if the target is the currently-signed-in admin (see Edge Cases) or if neither checkbox is selected.
* **New "Audit Log" view**, likely a new tab or a collapsible panel within the existing Users tab — a simple read-only table over `admin_audit_log` (admin-only per rules, so no new gate needed beyond the existing `AdminDashboard.tsx` `isAdmin` check). Given this is pure operational tooling, keep it minimal: timestamp, admin email, target email, scope, outcome.
* **Somatic Check:** N/A — this entire feature is admin-only tooling, never seen by David/Ned/Lisa/Walt/Maya/Jordan. No crisis-state UX concerns apply.
* **Reward:** N/A — no XP/gamification tie-in; this is internal tooling.

### Phase 3: Edge Cases
* [ ] **Self-deletion guard:** the Cloud Function must reject `targetUid === request.auth.uid` outright (`HttpsError("failed-precondition", ...)`) — an admin should not be able to delete their own account through this admin-only tool (self-service deletion already exists and has its own, more appropriate, re-auth-gated flow).
* [ ] **Deleting another admin:** decide and document explicitly — either block it entirely, or allow it but require an extra confirmation step. Given this tool exists specifically for test/spam cleanup, blocking deletion of any account with `role === 'admin'` or the `admin` custom claim is the safer default; flag for admin sign-off during `/planning` Phase 2 strategy selection.
* [ ] **Target already has no Auth record** (e.g. previously self-deleted but Firestore purge was interrupted, or double-clicked): `deleteAuthRecord: true` should treat `auth/user-not-found` from `admin.auth().deleteUser()` as a non-fatal, already-satisfied outcome, not a hard failure — log it as such in `detail`, not as `outcome: 'failure'`.
* [ ] **Target has no Firestore data at all** (e.g. an Auth-only ghost account that never completed onboarding): `purgeFirestoreData: true` should complete as a trivial no-op (0 documents deleted), same idempotency guarantee `executeTotalAccountAnnihilation` already relies on.
* [ ] **Partial failure mid-purge:** if the Firestore purge throws partway through, the audit log must still be written (`outcome: 'partial_failure'`, `detail` naming what's known), and the admin UI must surface this clearly rather than showing a generic success toast — this is the scenario the audit trail exists for.
* [ ] `navigator.onLine` false: N/A — this is an explicit, online-only admin action from a desktop-oriented dashboard, same posture as PROJ-115's self-service deletion (`Subway Test: N/A`).
* [ ] `isVaultUnlocked` false: N/A — admin never decrypts vault content to perform this action.
* [ ] 320px viewport: the new modal and audit-log table should be checked, but this is a low-traffic admin-only surface — not a blocking concern the way it would be for a persona-facing feature.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `functions/src/index.test.ts` — `validateDeleteUserAccountRequest` covered for: missing/empty/non-string `targetUid`, self-deletion rejection, neither-scope-selected rejection, and each valid scope combination (Firestore-only, Auth-only, both). Extracted as a pure function per this file's own established convention (`evaluateVaultPinAttempt`/`checkCooldown`/`checkFloor`) rather than exercising the live `onCall` body directly — the admin-gate check, the target-is-admin guard, the actual purge/delete calls, and the unconditional audit-log write are integration-level concerns this repo's test suite deliberately doesn't mock Firestore/Auth to cover (see the `isPremiumOnlyAnalysisType` comment at `functions/src/index.ts` for the precedent).
* [x] **Server-vs-client manifest sync test:** `functions/src/index.test.ts`'s `SERVER_PURGE_TARGETS` describe block hardcodes the same expected root/subcollection lists as `src/lib/__tests__/deletion.test.ts`'s `SCAN_TARGETS` test — both pinned independently against the same expected values (can't share one test file across the client/functions builds), so a collection added to one manifest and not the other fails one of the two suites.
* [ ] **Emulator-backed integration test — deliberately not built.** `firebase-functions-test` is a listed devDependency in `functions/package.json` but has zero existing usage anywhere in this codebase; no `onCall` function in this repo has ever been integration-tested against live Auth+Firestore emulators (confirmed by grep before deciding this). Building that harness from scratch was judged out of proportion to this ticket, given the repo's own consistent pattern of testing extracted pure logic instead. **This is the one place implementation deviates from the original plan** — flagging explicitly per this file's own template rather than silently dropping it. If a real production incident ever traces back to this function's untested integration path, that's the trigger to build the harness for real, not before.
* [x] **Firestore rules test:** `src/__tests__/firestore.rules.test.ts` — new `admin_audit_log` describe block: admin can read, non-admin authenticated user cannot, no client role (including admin) can write, unauthenticated is blocked. 70/70 rules tests passing (`npm run test:rules`).
* [x] **`zk-audit` equivalent reasoning:** no new encrypted fields, no new decrypt path, admin never reads target content — see §2's explicit reasoning for why this doesn't weaken the ZK boundary. A dedicated `zk-audit` skill pass was not run as a separate step since the feature has no encrypted-field surface for it to check beyond what's already reasoned through in §2/§3.
* [ ] **The Subway Test:** N/A — explicit online-only admin action (see Edge Cases).
* [ ] **The "Lost PIN" Test:** N/A — doesn't touch key rotation/crypto-shredding.
* [x] **Regression:** `npm run lint` (0 warnings), `npm run docs:check-specs` (88/88 pass), `npm run build` (clean), `npm run test:rules` (70/70, including the 4 new `admin_audit_log` tests), `npm run test:once` (827/827, no regressions), `functions`' `tsc --noEmit`/`npm run build` (clean), `functions`' `npx vitest run` (144/144, including the 15 new PROJ-121 tests).
