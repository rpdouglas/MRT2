# 📁 Project 118: TWA Notification Delegation

**Status:** ⚪ Planned — scope narrowed to verification-only after direct inspection (see §0); not yet through `/planning`'s implementation approval
**Primary Persona:** All (trust/product-identity), secondarily David (a notification attributed to "Chrome" instead of the app itself is a small but real trust wobble at exactly the moments — milestones, habit reminders — this app wants to feel personal, not generic)
**Objective:** Confirm, on a real device, that the Android build's already-enabled Trusted Web Activity Notification Delegation actually shows notifications under "My Recovery Toolkit" (not Chrome) before the Play Store production release.

---

## 0. Correction (2026-09-07) — the original premise was wrong

The v0.1 draft below assumed delegation was **very likely never enabled**, based on `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` never mentioning it and Bubblewrap's documented default of `enableNotifications: false` — but explicitly noted this wasn't confirmed because "`~/mrt-android` isn't reachable from this environment."

That assumption was wrong. `~/mrt-android` **is** reachable — it lives at `/home/node/mrt-android` in the same Codespace/devcontainer this repo runs in, just not tracked in git (hence "outside this repo," which was misread as "outside the filesystem"). Direct inspection (2026-09-07) found delegation is **already fully enabled and wired**:
- `twa-manifest.json`: `"enableNotifications": true`
- `app/build.gradle`: `resValue "bool", "enableNotification", twaManifest.enableNotifications.toString()` — correctly reads the flag through to the native build
- Generated `AndroidManifest.xml`: `POST_NOTIFICATIONS` permission declared, a `.DelegationService` bound to the `TRUSTED_WEB_ACTIVITY_SERVICE` intent-filter with a custom small-icon resource, and `NotificationPermissionRequestActivity` present — the complete delegation wiring, not just an inert flag.
- Current scaffold state: `appVersionName 1.9.12` / `appVersionCode 7`, signed release artifacts (`app-release-bundle.aab`, `app-release-signed.apk`) already present, dated 2026-09-05 — newer than the `1.9.11` / release 6 build documented in `ROADMAP.md`/`ACTIVE_CYCLE.md` as the one uploaded to Internal Testing. Not yet clear whether *this* 1.9.12 build has been through the same device-verification pass release 6 got — that's the one genuinely open question left (§4 Phase 1).

**Scope is now much smaller than originally planned:** no config change, no `bubblewrap update`, no rebuild. This spec reduces to a single verification pass (original Phase 4) plus a documentation fix (already applied to `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` directly as part of this correction, not deferred to this spec's implementation).

---

## 1. The Executive Summary

**User Story:**
- **As** any user on the Android TWA build, I want a milestone or reminder notification to visibly come from "My Recovery Toolkit" — with the app's own icon, and manageable from Android's own Settings → Apps → My Recovery Toolkit → Notifications — so that the app feels like a real, trustworthy app rather than a browser tab, and I can control its notifications the same way I control every other app's.

**Competitive Gap:** N/A — this is parity work, not a differentiator. "I Am Sober," "Reframe," and "Sober Grid" are all native or Capacitor-wrapped apps where this is simply how notifications work; MRT's TWA architecture is the one path where it could plausibly not be automatic, though direct inspection now shows it already is configured correctly here.

**Origin:** Surfaced 2026-09-07 during a `/planning` research pass on 2026 TWA notification best practices (session context, not a user bug report). Original hypothesis (delegation never enabled) was disproven by direct inspection — see §0.

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

**This project has zero footprint in `src/`, and now zero remaining footprint in the Bubblewrap scaffold too** — `twa-manifest.json`/`build.gradle`/`AndroidManifest.xml` already have everything needed (§0). The only remaining work is verification, not configuration.

**Architecture:** `functions/src/index.ts`'s `dailyBeacon`/`processUserBatch`/`computeMilestoneAlert`/`computeHabitAlert`/`computeMatReminderAlert` and `src/lib/messaging.ts`'s `requestNotificationPermission`/`public/firebase-messaging-sw.js` are all expected to keep working **unchanged** — delegation changes how the *native shell* displays a notification the web app already triggered via standard FCM web push; it does not change the web-side permission API surface or the send path. This assumption must be verified for real on-device (Phase 4), not just assumed from documentation.

---

## 4. Implementation Phases 🏗️

### Phase 1: Device verification (the only remaining work)
- [ ] Install the existing `/home/node/mrt-android/app-release-signed.apk` (or the `.aab` via Internal Testing) on a real Android 13+ device — matches this repo's existing device-verification precedent for TWA work (`docs/RUNBOOK.md`/`ACTIVE_CYCLE.md` device-verified language, not a simulator claim). No rebuild needed unless this step finds a real problem.
- [ ] Trigger a real test notification (a manual FCM console send, or a real `dailyBeacon` milestone/habit alert) and confirm: (a) it shows under Android Settings → Apps → **My Recovery Toolkit** → Notifications, not under Chrome's site-notification settings; (b) the notification tray shows the app's own name/icon, not "Chrome"; (c) tapping it still opens the app to the correct `click_action` URL (unchanged behavior from today).
- [ ] Confirm the existing web-side permission flow (`NotificationBanner.tsx` → `requestNotificationPermission()`) still completes successfully inside the TWA shell with delegation active — this is the one behavior that can't be confirmed from static inspection and must be observed directly.
- [ ] Re-run the existing golden-path Playwright suite (`e2e/golden-paths/`) if this build hasn't already been through it for other reasons (e.g. as part of whatever the 2026-09-05 Phase 3.5 hardening pass already verified) — expected to be entirely unaffected (no ZK/data path touched), but confirm rather than assume.

### Phase 2: If Phase 1 finds a real problem
Only reached if verification surfaces something wrong (e.g. delegation silently not taking effect at runtime despite correct static config — possible if an `androidbrowserhelper` version quirk or an asset-link verification gap prevents the OS from trusting the delegation, though nothing found during static inspection suggests this). In that case, fall back to the original diagnostic path: re-check `bubblewrap doctor`/build output, and re-verify against `android-browser-helper`'s own `twa-notification-delegation` demo as the reference implementation. Not expected to be needed based on what's been directly confirmed so far.

### Phase 3: Documentation
Already done as part of this correction — `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` now documents both the `/home/node/mrt-android` location (reachable from this dev environment, not an external unreachable machine) and the confirmed-enabled delegation state, so this doesn't get re-investigated as an open gap again.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:** None applicable — no `src/` or `functions/` code changes anticipated. (If Phase 2's fallback path is ever reached and requires a client-side change, that would be new scope requiring its own test contract.)
- [ ] **The Subway Test:** N/A — no new network dependency, no offline-behavior change.
- [ ] **The "Lost PIN" Test:** N/A — no schema/encryption change.
- [ ] **Device verification** (the actual QA gate for this spec): see Phase 1 checklist above — this project's real correctness bar is a physical Android 13+ device, not Vitest.

---

*MRT · PROJ-118 TWA Notification Delegation · v0.2 · 2026-09-07 · Status: Planned, scope narrowed to verification-only*
