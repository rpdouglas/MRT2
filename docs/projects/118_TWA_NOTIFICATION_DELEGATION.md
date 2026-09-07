# 📁 Project 118: TWA Notification Delegation

**Status:** ⚪ Planned — not yet through `/planning`'s implementation approval (strategy drafted below)
**Primary Persona:** All (trust/product-identity), secondarily David (a notification attributed to "Chrome" instead of the app itself is a small but real trust wobble at exactly the moments — milestones, habit reminders — this app wants to feel personal, not generic)
**Objective:** Enable Trusted Web Activity Notification Delegation on the Android build so push notifications are attributed to and controlled through "My Recovery Toolkit" itself (name, icon, Android system notification settings), not Chrome — and confirm this for real on a device before the Play Store production release.

---

## 1. The Executive Summary

**User Story:**
- **As** any user on the Android TWA build, I want a milestone or reminder notification to visibly come from "My Recovery Toolkit" — with the app's own icon, and manageable from Android's own Settings → Apps → My Recovery Toolkit → Notifications — so that the app feels like a real, trustworthy app rather than a browser tab, and I can control its notifications the same way I control every other app's.

**Competitive Gap:** N/A — this is parity work, not a differentiator. "I Am Sober," "Reframe," and "Sober Grid" are all native or Capacitor-wrapped apps where this is simply how notifications work; MRT's TWA architecture is the one path where it isn't automatic, and it's worth closing before a wider Play Store audience sees it.

**Origin:** Surfaced 2026-09-07 during a `/planning` research pass on 2026 TWA notification best practices (session context, not a user bug report). Bubblewrap's own `enableNotifications` field in `twa-manifest.json` defaults to `false`; a direct search of this repo's `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` and `docs/projects/07_PLAY_STORE_TWA.md` found zero mention of "notification" or "delegation" anywhere in the documented TWA build process (`~/mrt-android`, outside this repo) — so it was very likely never explicitly enabled when the current Internal Testing build (release 6, v1.9.11) was generated. Not confirmed by direct inspection of the actual `~/mrt-android` scaffold (that machine/directory isn't reachable from this environment) — Phase 1 below starts with confirming the current state before changing anything.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** None. This is a display/attribution-layer change to how already-approved, already-non-sensitive `dailyBeacon` notification copy (milestone/habit/MAT text — see `CLAUDE.md`'s Notification & Attention Architecture, `computeMatReminderAlert`'s fixed-generic-copy invariant) is rendered by the OS. No new data is read, sent, or displayed that wasn't already being sent.
- [x] **Encryption Strategy:** N/A — no Firestore reads/writes at all. This is Android/Bubblewrap native configuration, entirely outside `src/`.
- [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:** None.

**Types (`src/lib/db.ts`):** No changes.

**This project has zero footprint in `src/`.** Every change happens in the Bubblewrap-generated Android project (`~/mrt-android/twa-manifest.json` and its generated `AndroidManifest.xml`/`build.gradle`), which per `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md`'s own stated convention lives outside this repo and isn't governed by the spec-file rule for *app* code — this spec exists because it's a real, scoped decision with security/UX implications worth planning deliberately, not because the code itself lives here.

**Architecture:** `functions/src/index.ts`'s `dailyBeacon`/`processUserBatch`/`computeMilestoneAlert`/`computeHabitAlert`/`computeMatReminderAlert` and `src/lib/messaging.ts`'s `requestNotificationPermission`/`public/firebase-messaging-sw.js` are all expected to keep working **unchanged** — delegation changes how the *native shell* displays a notification the web app already triggered via standard FCM web push; it does not change the web-side permission API surface or the send path. This assumption must be verified for real on-device (Phase 4), not just assumed from documentation.

---

## 4. Implementation Phases 🏗️

### Phase 1: Confirm current state
Before changing anything: inspect the existing `~/mrt-android/twa-manifest.json` (or regenerate via `bubblewrap init` against the same manifest URL if that scaffold is gone) and confirm whether `enableNotifications` is currently `true` or `false`/absent. If it's already `true`, this spec reduces to Phase 4 (verification) only.

### Phase 2: Enable delegation
- Set `"enableNotifications": true` in `twa-manifest.json`.
- Run `bubblewrap update` to regenerate `AndroidManifest.xml`/`build.gradle` from the updated manifest.
- **Re-apply the Phase 3.5 manual overrides** documented in `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` immediately after — `bubblewrap update` is already documented to silently revert the `androidbrowserhelper` version bump and the R8/proguard config, and to delete `app/proguard-rules.pro` entirely. This is a known, already-hit gotcha in this exact workflow, not a hypothetical.
- Confirm the generated manifest includes whatever permission/service wiring the installed `androidbrowserhelper` version's notification-delegation demo requires (`android-browser-helper`'s own `twa-notification-delegation` demo is the reference; exact permission strings weren't independently re-verified against MRT's specific `androidbrowserhelper` version during this planning pass — confirm against the generated manifest output directly at implementation time, not by assuming a specific string from documentation).
- Bump `appVersionCode`/version name per the guide's existing convention (every rebuild does this already).

### Phase 3: Rebuild and re-sign
Standard `bubblewrap build` against the existing keystore (Google Secret Manager, per `PROJ-67`) — no new signing key, no change to `assetlinks.json`'s Digital Asset Links (delegation doesn't require additional domain verification beyond what TWA launch already needs).

### Phase 4: Device verification (this also closes the original audit's separate "verify system settings" recommendation — not a distinct ticket)
- [ ] Install the rebuilt release on a real Android 13+ device (matches this repo's existing device-verification precedent for TWA work — `docs/RUNBOOK.md`/`ACTIVE_CYCLE.md` device-verified language, not a simulator claim).
- [ ] Trigger a real test notification (a manual FCM console send, or a real `dailyBeacon` milestone/habit alert) and confirm: (a) it shows under Android Settings → Apps → **My Recovery Toolkit** → Notifications, not under Chrome's site-notification settings; (b) the notification tray shows the app's own name/icon, not "Chrome"; (c) tapping it still opens the app to the correct `click_action` URL (unchanged behavior from today).
- [ ] Confirm the existing web-side permission flow (`NotificationBanner.tsx` → `requestNotificationPermission()`) still completes successfully inside the TWA shell post-delegation — this is the one behavior this spec explicitly cannot assume from documentation and must observe directly.
- [ ] Re-run the existing golden-path Playwright suite (`e2e/golden-paths/`) — expected to be entirely unaffected (no ZK/data path touched), but confirm rather than assume, since this ships in the same release as everything else queued for that build.

### Phase 5: Documentation
Update `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` Phase 2's init-prompt list to include the notification-delegation flag/prompt, and Phase 3.5's override checklist if the delegation setup adds any further Bubblewrap-`update`-revertible manual edits discovered during Phase 2 — keeping that guide the living source of truth, matching its own existing style and the reasoning already documented there for every other override.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:** None applicable — no `src/` or `functions/` code changes. (If Phase 2 surfaces an unexpected need to branch client-side logic on delegation state, that would be new scope requiring its own test contract — not currently anticipated.)
- [ ] **The Subway Test:** N/A change — no new network dependency, no offline-behavior change.
- [ ] **The "Lost PIN" Test:** N/A — no schema/encryption change.
- [ ] **Device verification** (the actual QA gate for this spec): see Phase 4 checklist above — this project's real correctness bar is a physical Android 13+ device, not Vitest.

---

*MRT · PROJ-118 TWA Notification Delegation · v0.1 DRAFT · 2026-09-07 · Status: Planned*
