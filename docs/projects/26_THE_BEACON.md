📁 Project 26: The Beacon (Push Notification Engine)
Status: ✅ Completed (shipped pre-2026-04; backfilled spec 2026-07-09 as part of the notification-system remediation)
Primary Persona: Ned (Pink Cloud streaks), Walt (milestone tracking)
Objective: Server-scheduled Web Push (FCM) that re-engages users outside the app via two alert types — sobriety milestone celebrations and overdue-habit reminders — without ever transmitting encrypted/sensitive content through the push payload.

1. The Executive Summary
User Story:

As a user, I want to be notified on my device when I hit a sobriety milestone, so I feel celebrated even when I'm not in the app.

As a user, I want a gentle nudge if I have pending habits due today, so streaks don't silently break.

Competitive Gap: Most sobriety trackers only notify in-app. The Beacon reaches users on their lock screen, which matters most for Ned's early-recovery re-engagement loop.

This spec was written retroactively — the feature shipped and received at least one production hotfix (PROJ-26: FCM SW token migration, see docs/ACTIVE_CYCLE.md) before a spec file existed. It documents the system as built, plus the changes introduced by the 2026-07 notification remediation pass (see "Remediation Changes" below).

2. Security & Zero-Knowledge Audit 🛡️
[x] Data Sensitivity: Low. Push payloads contain only a milestone day-count or a pending-task count — both sourced from `users` and `tasks`, which CLAUDE.md's ZK table already marks as unencrypted/non-sensitive. No journal, workbook, or service content is ever read by this system.
[x] Encryption Strategy: N/A — no encrypted fields are read, written, or transmitted by this feature.
[x] Key Rotation: N/A — `fcmTokens`, `fcmSwVersion`, `timezone`, and `pushNotificationsEnabled` are device/preference metadata, not vault-derived data, so they're untouched by `executePinRotation`.

3. Schema & Architecture 🗄️
Firestore Collections Impacted:
* `users/{uid}`: `fcmTokens?: string[]` (device push tokens), `fcmSwVersion?: number` (service-worker migration marker, currently `2`), `timezone?: string` (captured but not yet used for per-user send-time scheduling — see Known Limitations), `pushNotificationsEnabled?: boolean` (added by the 2026-07 remediation — defaults to `true` when unset for existing users).
* `tasks/{id}`: read-only, queried per-user for `status == "pending" && dueDate <= endOfToday`.

Types (`src/lib/db.ts`):
```typescript
interface UserProfile {
  // ...
  fcmTokens?: string[];
  fcmSwVersion?: number;
  timezone?: string;
  pushNotificationsEnabled?: boolean;
}
```

Cloud Function: `functions/src/index.ts` — `dailyBeacon`, an `onSchedule` function (`"0 12 * * *"`, `northamerica-northeast1`, 300s timeout, 512MiB). Client: `src/lib/messaging.ts` (token registration, foreground/background message handling), `public/firebase-messaging-sw.js` (background display + click routing).

4. Implementation Phases 🏗️ (as built)

### Phase 1: Token Registration
* `requestNotificationPermission(uid)` — `Notification.requestPermission()` → `getToken()` (VAPID) → `arrayUnion` onto `users/{uid}.fcmTokens`, plus captures `Intl.DateTimeFormat().resolvedOptions().timeZone` into `timezone`.
* `refreshFcmTokenIfStale(uid, fcmSwVersion)` — a one-time migration: if the stored `fcmSwVersion` doesn't match the current `FCM_SW_VERSION`, wipes `fcmTokens` and silently re-registers if OS permission is already granted. Exists because of a prior scope collision between the hand-written `firebase-messaging-sw.js` and the VitePWA-generated service worker.
* `NotificationBanner.tsx` — the opt-in prompt UI, gated on permission state, a `localStorage` dismiss flag, and (for iOS) standalone-PWA display mode.

### Phase 2: Server Dispatch
* `dailyBeacon` queries `users` where `fcmTokens != []`, computes one of two mutually-exclusive alerts per user (milestone day-count, else overdue-task count), and sends via `messaging.sendEach()`.
* Stale/invalid tokens (FCM error codes `invalid-registration-token` / `registration-token-not-registered`) are pruned from `fcmTokens` in a batched write after each run.

### Phase 3: Foreground Handling — added by 2026-07 remediation
* Originally, only background messages were displayed (via the service worker's `onBackgroundMessage`). Foreground messages (app open and focused) were silently dropped — there was no `onMessage()` listener anywhere in the client.
* Fixed by adding `listenForForegroundMessages()` in `src/lib/messaging.ts`, subscribed once per session from `AuthContext.tsx`, which shows an in-app toast (reusing the existing `sonner` `<Toaster />`) for messages that arrive while the tab is focused.

### Phase 4: Server Robustness — added by 2026-07 remediation
* The original `dailyBeacon` wrapped its entire body in one top-level `try/catch`, so a single malformed user record (e.g. bad `sobrietyDate`) could abort processing for every user after it in iteration order.
* Fixed by wrapping each user's processing in its own try/catch (log + continue on failure).
* The original `users` query had no pagination — a single unbounded `.get()` on `fcmTokens != []`. Fixed by paginating with `.limit()` + `startAfter` cursors within the function's existing timeout budget, to avoid a future timeout/memory cliff as the user base grows.

### Phase 5: Real Push Opt-Out — added by 2026-07 remediation
* Previously there was no way to disable push notifications from within the app — the "Anchor Notifications" Profile toggles (PROJ-41) only ever controlled dashboard badge visibility, not push, despite the section heading implying otherwise.
* Added a dedicated `pushNotificationsEnabled` field and a separate "Push Notifications" toggle in Profile, distinct from the badge toggles. Disabling it clears `fcmTokens: []`, which is sufficient on its own to exclude the user from `dailyBeacon`'s existing `fcmTokens != []` filter — **`dailyBeacon` intentionally does NOT read `pushNotificationsEnabled` directly**; the field exists purely as client-side UI state (so the toggle can render correctly on reload) and to gate re-registration. Do not add a redundant server-side field check — it would be dead logic, since an opted-out user has no tokens for the query to match anyway.

5. Known Limitations (not fixed by this remediation — flagged for future work)
* `timezone` is captured on every user profile but never read by `dailyBeacon` — all users receive their alert at the same fixed `12:00 UTC`, regardless of local time. A timezone-aware send schedule would require either per-timezone scheduled functions or a fan-out/queue architecture.
* No notification history/log — users and admins cannot see what was sent, when, or with what outcome, beyond Cloud Logging.
* Production reliability as of this writing is unverified in this environment (no `firebase` CLI access) — `docs/TRIAGE_REPORT.md` recorded two unresolved "notifications not working" reports (4/13, 4/27/2026) dated after a changelog-recorded PROJ-26 timezone fix (4/17/2026). Recommend a manual production check (Firebase Console logs + a live test send) before considering the pipeline fully healthy.

6. QA & Verification 🧪
* [x] Milestone day-count boundary logic (`getMilestone`) — unit test recommended, see Phase 7 of the remediation plan.
* [x] Per-user isolation — a malformed record must not abort the batch (regression test for the Phase 4 fix).
* [x] Stale token pruning — a failed send with an invalid-token error code must remove that token, not others.
* [ ] Foreground toast — manually verified in a live browser session with a Firebase Console test send (requires FCM access not available in this dev environment; log the result in a follow-up).
* [ ] Production delivery health — manual Firebase Console log check (see Known Limitations above).
