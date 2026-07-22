# 📁 Project 76: Gamification Dashboard Relocation

**Status:** 🟢 Done
**Primary Persona:** David
**Objective:** Relocate the Rank/Level/XP display and every bento tile's stat numbers (Journal streak, Habit Fire, Vitality Rhythm, Workbook Wisdom) off the Dashboard into a new "Achievements" tab on Profile, without deleting any gamification logic — it comes back to the Dashboard later, not away for good.

---

## 1. The Executive Summary
**User Story:** As David (high anxiety, acute crisis, Day 1-30, max 3 taps per flow), I want the Dashboard to show only my core recovery snapshot — not rank/level/XP bars or streak counters — so that the page feels calm and uncluttered rather than gamified and busy.
**Competitive Gap:** N/A — this is a UX simplification, not a new competitive feature. It reduces cognitive load relative to apps that always foreground streaks/XP (e.g. "I Am Sober").

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** No. This is a pure relocation of existing plaintext, non-sensitive stat displays (`tasks`, `journals` metadata counts, `game_progress` plaintext fields per CLAUDE.md's ZK table). No new data is read, written, or displayed that wasn't already read by the Dashboard.
* [x] **Encryption Strategy:** N/A — no new Firestore reads/writes. `AchievementsTab` reuses the existing `useGameProgress()` hook (which already decrypts `encryptedStats`/`encryptedReflection` client-side, unchanged) and the same plaintext `journals`/`tasks`/`workbook_answers`/`rosc_assessments` queries that used to live in `Dashboard.tsx` — moved, not duplicated in addition.
* [x] **Key Rotation:** N/A — no new fields, no new collections. `executePinRotation`/`executeCryptoShredding` scope is unchanged.

---

## 3. Schema & Architecture 🗄️
**Firestore Collections Impacted:** None. No schema changes.

**Types (`src/lib/db.ts`):** No changes.

**Architecture:** `src/lib/gamification.ts` (XP economy, level/archetype calculation) is untouched — same functions (`calculateUserLevel`, `calculateJournalStats`, `calculateTaskStats`), just called from a different component. `useGameProgress()` is untouched.

---

## 4. Implementation Phases 🏗️

### Phase 1: `SobrietyHero.tsx` decoupling
Split the "Metrics Row" (Total Days + Financial Savings) out from under the `levelData && archetype` gate so it renders on the Dashboard independent of gamification data. The Rank/Level/XP block remains inside that gate — it simply stops receiving `levelData`/`archetype` from the Dashboard going forward.

### Phase 2: `Dashboard.tsx` cleanup
* Drop `calculateUserLevel`/`calculateJournalStats`/`calculateTaskStats`/`calculateVitalityStats`/`calculateWorkbookStats` usage entirely, along with the `journals`, `tasks`, `workbook_answers`, and `rosc_assessments` queries and the `useGameProgress()` call — the Dashboard no longer needs any of this data.
* Stop passing `levelData`/`archetype` to `<SobrietyHero>`.
* All six bento tiles (renamed **My Journal**, **My Tasks**, **My Vitality**, **My Workbooks**, **My Games**, **My Tools**) simplified to plain entry tiles (icon + title + one-line caption) — no stat numbers on any of them, matching the style originally used only by Games/Tools.

### Phase 2: UI/UX & Gamification
* New component: `src/components/profile/AchievementsTab.tsx` — Rank/Level/XP progress card, Journal Streak/consistency card, Habit Fire/completion-rate card, Vitality Rhythm/logs card, Workbook Wisdom/progress card.
* New Profile tab: "Achievements" (`/profile/achievements`), 4th tab alongside General/Security/Data, following the exact routed-tab pattern from Project 58 Phase 4.
* **Somatic Check:** Moving gamification off the Dashboard *reduces* stress surface for David; the Achievements tab is opt-in (user has to navigate to Profile), so it never interrupts a crisis-mode visit.
* **Reward:** The XP/Leveling system is fully preserved — just relocated, so Ned (who wants streaks/gamification) can still find it under Profile → Achievements.

### Phase 3: Edge Cases
* [x] Offline: `AchievementsTab` uses the same TanStack Query hooks (with existing offline/cache behavior) as `Dashboard.tsx` did — no new offline handling needed.
* [x] `isVaultUnlocked` false: Profile page already sits behind `VaultGate`, same as Dashboard — no change needed.
* [x] 320px wide screen: Achievements cards use the same single-column stacked card layout as the other Profile tabs (General/Security/Data), which are already mobile-verified.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `Dashboard.test.tsx` updated to drop level/streak/fire assertions; `Profile.test.tsx` covers the new tab; new `AchievementsTab.test.tsx` covers rank/level rendering and the empty-state (no journals/tasks yet).
* [x] **The Subway Test:** N/A change — no new network dependency introduced.
* [x] **The "Lost PIN" Test:** N/A — no schema/encryption change, crypto-shredding scope unchanged.
