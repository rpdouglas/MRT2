# 📁 Project 119: Notification Category Preferences

**Status:** ⚪ Planned — not yet through `/planning`'s implementation approval (strategy drafted below); **blocked on `PROJ-118`'s Phase 1 device verification**, not on a code/config change — direct inspection (2026-09-07, `PROJ-118` §0) found Notification Delegation is already fully enabled and wired in the Bubblewrap scaffold (`/home/node/mrt-android`), so the blocker here is confirming it actually works correctly on-device, not waiting for it to be built
**Primary Persona:** Ned (control-seeking, wants to tune what nudges him) and Lisa (accountability-type alerts specifically); a general Settings-power-feature for all personas
**Objective:** Replace the single blanket `pushNotificationsEnabled` on/off switch with per-category control (Milestone / Habit Reminders / MAT Reminders / Recovery Reentry) — native Android notification channels where available (post-`PROJ-118`), a simple in-app toggle list everywhere else (iOS PWA, desktop, pre-delegation Android).

---

## 1. The Executive Summary

**User Story:**
- **As** Ned, I want to keep milestone celebrations on but turn off daily habit-reminder nudges once I've built the habit, without losing all notifications entirely, so that the app's alerts stay useful to me instead of becoming background noise I ignore or mute at the OS level entirely.

**Competitive Gap:** Matches table-stakes granular-notification-settings UX already common in "I Am Sober"/"Reframe"; MRT's current single-toggle model is behind, though not broken — this closes a real but low-urgency gap, not a differentiator.

**Origin:** Surfaced 2026-09-07 alongside `PROJ-118` during a `/planning` research pass on 2026 notification best practices — explicitly framed there as low/medium priority, opportunistic once `PROJ-118` lands, not urgent on its own.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** None. `notificationPreferences` is plaintext UI-preference metadata, same category as `anchorSettings`/`pushNotificationsEnabled` already on `users/{uid}` — not recovery content.
- [x] **Encryption Strategy:** N/A — no encrypted fields involved.
- [x] **Key Rotation:** N/A — not included in `executePinRotation`/`executeCryptoShredding`, same as `pushNotificationsEnabled` today.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `users/{uid}`: add `notificationPreferences` (new optional object field).

**Types (`src/lib/db.ts`):**
```typescript
export interface UserProfile {
  // ...existing fields
  notificationPreferences?: {
    milestones?: boolean;      // default true if unset
    habitReminders?: boolean;  // default true if unset
    matReminders?: boolean;    // default true if unset; only shown/relevant when matModeEnabled
    reentry?: boolean;         // default true if unset (PROJ-112's Beacon alert, once shipped)
  };
}
```
**`pushNotificationsEnabled` is unchanged and stays the master kill-switch** — off still clears `fcmTokens` entirely and excludes the user from `dailyBeacon`'s query, exactly as today. `notificationPreferences` only refines *which* categories still fire when the master switch is on. **Legacy accounts with no `notificationPreferences` object must default every category to `true`** — this must ship as a zero-behavior-change migration for existing users, not an implicit opt-out.

**Firestore rules:** No change needed — a plain object field under `users/{uid}`, owner-writable, not in the tier/role/pinAttempts lock list (`firestore.rules:109-120`).

**Cloud Functions (`functions/src/index.ts`):** `processUserBatch`'s existing alert-priority chain (`computeMilestoneAlert` → `computeHabitAlert` → `computeMatReminderAlert`, and per `PROJ-112`'s plan, → `computeReentryAlert`) needs a preference check gating each branch, e.g. `if (!alert && userData.notificationPreferences?.milestones !== false) { alert = computeMilestoneAlert(...); }` — note the `!== false` (not `=== true`) to preserve the legacy-default-on behavior above without a data migration.

**Android side (native, outside this repo, per `PROJ-118`'s established pattern):** map each category to its own native notification channel (e.g. `milestone_channel`, `habit_channel`, `mat_channel`, `reentry_channel`) in the delegation service config. Once created, a channel's importance/mute state becomes user-controlled directly from Android system settings — **this project does not attempt to read that native mute state back into the app.** The app's own `notificationPreferences` object remains the sole source of truth for what `dailyBeacon` computes server-side and for platforms without native channels (iOS PWA, desktop, pre-`PROJ-118` Android); a user who mutes a channel natively on Android simply stops seeing it, independent of and invisible to the app's own toggle state. Simpler, and consistent with how every other Android app's channel/app-toggle relationship already works — no sync mechanism needed.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
- Extend the existing `patchFields` mutation pattern (`useUserProfile.ts`) — no new hook needed, this is a dot-path update exactly like `anchorSettings`.
- Add the preference-check guards to `processUserBatch` in `functions/src/index.ts`.

### Phase 2: UI/UX
- New "Notifications" settings block in Profile → General (or its own deep-linkable route, matching the `PROJ-58` pattern already used for Security/Data tabs), listing each category as an independent toggle. Reuses `Profile.tsx`'s existing `handleTogglePushNotifications`-style autosave pattern (immediate apply + `AutosaveStatus` indicator, not a Save button) — new toggles are simpler than that one since they never touch `Notification.requestPermission()`/`fcmTokens`, only the preference object.
- MAT Reminders row only rendered when `matModeEnabled` is true — reuses the existing conditional-visibility pattern already established for that toggle.
- **Somatic Check:** This is a pure control-expansion feature (more choice, not more pressure) — no guilt-adjacent framing risk. No red/warning styling on any toggle.
- **Reward:** N/A — settings feature, not tied to XP/Leveling.

### Phase 3: Edge Cases
- [ ] `navigator.onLine` false → toggle changes queue via TanStack Query's existing offline mutation behavior, same as every other Profile field.
- [ ] `isVaultUnlocked` false → Profile already sits behind `VaultGate`; no change needed.
- [ ] 320px wide screen → reuse the existing single-column toggle-row layout already used for `pushNotificationsEnabled` and other Profile switches.
- [ ] A user with `pushNotificationsEnabled: false` (master off) toggling a category on → no-op until they re-enable the master switch; UI should make this dependency legible (e.g., disable/grey the category list when the master switch is off), not just silently ignore it.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:** `processUserBatch` — each alert type is correctly skipped when its category preference is `false`, and correctly still fires when the preference is `true` or unset (`!== false` legacy-default logic explicitly tested, not just the happy path).
- [ ] **Component Tests:** `Profile.test.tsx` extension — each new toggle round-trips through `patchFields`; the master-switch-off disabled-state interaction (edge case above).
- [ ] **The Subway Test:** N/A change — no new network dependency.
- [ ] **The "Lost PIN" Test:** N/A — no encrypted data involved.

---

*MRT · PROJ-119 Notification Category Preferences · v0.1 DRAFT · 2026-09-07 · Status: Planned, blocked on PROJ-118*
