# 📁 Project 115: Account Deletion Full-Purge Completion

**Status:** 🟢 Done (client-purgeable scope) — billing-records purge deliberately deferred, see §6
**Primary Persona:** All (Zero-Knowledge/compliance infrastructure — "Right to be Forgotten" completeness, not persona-specific UX)
**Objective:** Close a confirmed gap where `executeTotalAccountAnnihilation()` (`src/lib/deletion.ts`) doesn't actually purge every Firestore collection tied to a deleted user's uid — some data survives "delete my account" indefinitely.

---

## 1. The Executive Summary
**User Story:** As any MRT user who requests account deletion, I want every piece of my data actually gone, not just the collections whoever last touched deletion.ts happened to remember.
**Source:** Found 2026-09-03 during a `docs/marketing/` documentation pass (`docs/ACTIVE_CYCLE.md`), confirmed and expanded via direct code/rules reading during a `/planning` session 2026-09-05.
**Competitive Gap:** N/A — ZK/compliance integrity, not a feature.

**Confirmed by reading `firestore.rules` end-to-end against `deletion.ts`'s current scan list** (not assumed from the ticket description alone — several real gaps beyond what was originally reported were found this way):

| Collection | Shape | Outcome |
|---|---|---|
| `journals`, `tasks`, `insights`, `game_progress`, `game_saves` | root, `uid` field | ✅ Already purged |
| `users/{uid}/workbook_answers`, `users/{uid}/templates` | subcollection | ✅ Already purged |
| `users/{uid}/rosc_assessments` | subcollection | ✅ **Fixed** (originally reported) |
| `client_errors` | root, `uid` field | ✅ **Fixed** (originally reported) |
| `service` | root, `uid` field | ✅ **Fixed** (originally reported — PROJ-05 rules stub, no live writer yet, but the rule and CLAUDE.md's ZK table both already treat it as real) |
| `ai_logs`, `feedback` | root, `uid` field | ✅ **Fixed — and a more severe finding than "missing from the scan list."** Both were already in the scan, but had **no owner-delete permission in `firestore.rules` at all** (`ai_logs`: no delete rule whatsoever, default deny; `feedback`: admin-only). A real emulator test proved this had been silently breaking their deletion this whole time — `collectRefs`'s try/catch swallowed the resulting permission error. Fixed the rules (owner read+delete, matching the pattern every other user-data collection already uses) per explicit user direction ("users should be able to purge their own data"). |
| `mat_doses` | root, `uid` field | ✅ **Fixed — not in the original ticket description.** Found by diffing `firestore.rules`' full collection list against `deletion.ts`'s scan calls. |
| `user_reading_preferences/{userId}` | root, **doc ID is the uid itself**, not a `uid`-field query | ✅ **Fixed — not in the original ticket description.** Handled as a special case (direct `doc()` ref) since it doesn't fit the `where('uid','==',uid)` shape at all. |
| `users/{uid}/checkout_sessions`, `subscriptions`, `payments` (Stripe), `users/{uid}/playPurchases` + `playPurchaseIndex/{token}` (Play Billing) | subcollections / special-case root | ⏸️ **Deliberately deferred — see §6.** `firestore.rules` locks all of these against ANY client mutation (`allow write: if false` / `allow update, delete: if false`), by design, so a user can't tamper with or fake their own billing state. That's sound security, not a bug — purging them needs a privileged server-side Cloud Function, tracked as its own follow-up in `docs/ACTIVE_CYCLE.md`, not attempted from the client here. |

**Not in scope (confirmed non-user-data, shared/editorial, same posture as `CLAUDE.md`'s ZK table):** `daily_readings`, `crossword_puzzles`, `buffer_status`, `image_library`, `daily_images`.

**Independent finding, fixed alongside this ticket:** `firestore.rules`' `isAdmin()` helper — `request.auth.token.admin == true` — **throws** ("Property admin is undefined") rather than evaluating `false` for a non-admin's `list`/query request, because a regular user's token has no `admin` key at all and direct property access on an absent map key errors instead of short-circuiting. Found only because this ticket's emulator test was the first one in the repo to ever exercise a `list` query (not just single-doc `get`/`set`/`update`/`delete`) against an `isAdmin()`-gated collection as a non-admin. Fixed to `request.auth.token.get('admin', false) == true`, which never throws regardless of get/list context. This bug is independent of, but was masking part of, the `ai_logs`/`client_errors`/`feedback` finding above.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** All newly-covered targets are either encrypted personal content (`rosc_assessments.encryptedAIContext`, `service` sponsee notes once PROJ-05 ships) or plaintext-but-personal metadata (error telemetry, feedback, reading preferences). Right-to-be-forgotten completeness is the whole point of this ticket.
* [x] **Encryption Strategy:** N/A — deletion removes documents outright; no new encrypt/decrypt logic.
* [x] **Key Rotation:** N/A — `executeTotalAccountAnnihilation` doesn't touch key material; that's `executeCryptoShredding`'s job (separate function, separate flow — Lost-PIN, not account deletion). Not modified by this ticket.
* [x] **`zk-audit` pass completed** (2026-09-05) — found two real risks (concurrent batch commits could leave a partial-deletion race; no emulator-backed test existed to prove real deletion, only mocked call verification), both addressed: batches now commit sequentially with a deterministic failure boundary (see `deletion.ts`), and `deletion.rules.test.ts` is the new emulator-backed proof. The audit's own follow-up investigation (setting up that real test) is what surfaced the `ai_logs`/`client_errors`/`feedback` rules gap and the `isAdmin()` bug above — exactly the value of the emulator-backed test the audit called for.

---

## 3. Schema & Architecture 🗄️
No schema changes. `src/lib/deletion.ts`'s `SCAN_TARGETS` is now an exported, declarative manifest (Strategy C, see §4) instead of scattered function calls — see the file's own header comment for exactly what is and isn't covered and why.

`firestore.rules` changes: `isAdmin()` helper fixed (see §1); `ai_logs`/`client_errors`/`feedback` gained owner read+delete (read was necessary too, not just delete — a client can't delete-by-query without list permission on its own docs first, discovered by the same emulator test denying the list itself even after delete alone was fixed).

---

## 4. Strategy (see the `/planning` session for full 3-strategy scoring)
Implemented: **Strategy C — declarative collection manifest + a regression test asserting it stays a superset of every client-deletable, uid-owned collection in `firestore.rules`.** This is the second time this exact bug shape has shipped (PROJ-72 Phase 7's own test comment documents the first, for `game_progress`/`game_saves`) — a third recurrence is a "when," not an "if," without a structural fix, not just another one-off patch.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `src/lib/__tests__/deletion.test.ts` extended for every new target, plus a `SCAN_TARGETS`-vs-hardcoded-expected-list regression test (including an explicit assertion that the locked billing collections are *not* present).
* [x] **Emulator-backed integration test (new):** `src/lib/__tests__/deletion.rules.test.ts` — seeds a full account across every collection (including the locked billing ones) for two users, runs the real function against a live Firestore emulator with real rules enforced, and asserts every one of the deleting user's documents is gone, the other user's are untouched, and the locked billing documents survive for *both* users (proving they're deliberately skipped, not accidentally missed). 56/56 rules-suite tests passing.
* [x] **`zk-audit`:** Completed, see §2.
* [ ] **The Subway Test:** N/A — account deletion is already an online-only, explicit-confirmation flow.
* [ ] **The "Lost PIN" Test:** N/A — this ticket doesn't touch `executeCryptoShredding`/key rotation.
* [x] **Regression:** `npm run test:rules` (56/56) and root `npm run check` both clean.

---

## 6. Deferred: Stripe/Play-Billing Records Purge
`users/{uid}/checkout_sessions`, `subscriptions`, `payments` (Stripe Extension) and `users/{uid}/playPurchases` + `playPurchaseIndex/{token}` (PROJ-105 Play Billing) cannot be purged from the client — `firestore.rules` deliberately locks them against any client mutation, including by the resource owner, specifically so a user can't tamper with or fake their own billing/subscription state. Weakening those rules to make a client-side batch succeed would reopen exactly the risk they exist to prevent.

**User decision (2026-09-05):** scope this out of PROJ-115 rather than build the required Cloud Function under this ticket. Tracked as a new, separate backlog item in `docs/ACTIVE_CYCLE.md`'s "Queued" section — needs its own `/planning` pass to design a privileged, Admin-SDK-based purge (likely triggered from the same account-deletion flow, but server-side) before implementation starts.
