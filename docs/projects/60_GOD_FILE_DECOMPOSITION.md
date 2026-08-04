# 📁 Project 60: God File Decomposition — Vitality & Data Management

**Status:** ✅ Shipped
**Primary Persona:** David (Vitality — crisis-adjacent breathwork tool) / Walt (Data Management — exports, deletion)
**Objective:** Split `Vitality.tsx` and `DataManagement.tsx` along their genuinely independent concerns, isolating the single highest-risk operation in the app (account deletion) from lower-risk export/import code so future changes to one can't accidentally touch the other.

**Source:** `docs/reports/archive/2026-07_codebase_deep_review.md` §2 (both files flagged as the clearest wins among the top-10 largest files).

---

## 1. The Executive Summary
**User Story:** As Walt, I want export/import changes to carry zero risk of touching account-deletion logic, and as David, I want the breathwork timer to keep working identically through a refactor that doesn't touch UI behavior — just where the code lives.
**Competitive Gap:** N/A — internal maintainability, not a user-facing feature. The payoff is reduced blast radius: today, any change to CSV export in `DataManagement.tsx` sits in the same 463-line file as irreversible account deletion.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Yes. `DataManagement.tsx` handles the export path (`exporter.ts`, calls `decrypt()`) and account deletion (`deletion.ts`). `Vitality.tsx` handles journal/mood entries (ZK-encrypted content) via the raw Firestore calls flagged in PROJ-59.
* [x] **Encryption Strategy:** No new encryption logic. Purely a file-split — every existing `encryptData()`/`decryptData()` call site must land in the new file unchanged, not re-derived from memory (per `CLAUDE.md`'s "targeted patching only" rule).
* [ ] **Key Rotation:** No new fields; unaffected.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. Purely a component/file split.

**`Vitality.tsx` (497 lines) → split candidates:**
* Breathwork timer state machine
* Bio-balance scoring logic
* Mood inference
* Firestore I/O (this piece is also in scope for PROJ-59 — migrate onto `useJournalOperations` *as part of* this split, not before, so the file is only restructured once)

**`DataManagement.tsx` (463 lines) → split candidates:**
* Export (calls `exporter.ts` → `decrypt()`)
* Import (calls `importer.ts`)
* Account deletion (calls `deletion.ts`) — **isolate this into its own component/module first**; it's the single highest-risk, least-reversible operation in the app and currently shares a blast radius with the other two.
* The two raw `getDoc`/`setDoc` calls for `lastExportAt` (flagged in PROJ-59 §1) migrate onto `useQuery`/`useMutation` as part of this same split.

---

## 4. Implementation Phases 🏗️

### Phase 1: `DataManagement.tsx` — isolate deletion first
* Extract account deletion into its own component/module, untouched behaviorally. This is the highest-priority half of this spec per the review ("any future change to export/import carries unnecessary risk of touching deletion logic").
* Then split export and import into separate modules, migrating the `lastExportAt` raw calls onto TanStack Query in the same pass.

### Phase 2: `Vitality.tsx` — separate concerns
* Extract the breathwork timer state machine and bio-balance/mood-inference scoring into standalone modules/hooks.
* Migrate the raw `onSnapshot`/`addDoc` calls onto `useJournalOperations` in the same pass (this is also listed as a standalone quick-win chore in `ACTIVE_CYCLE.md` for the duplicate-path deletion specifically — the *remaining* structural split happens here).

### Phase 3: UI/UX regression pass
* **Somatic Check:** Vitality's breathwork timer is used in moments of acute stress — any refactor must be verified pixel-for-pixel/behavior-for-behavior identical for David. No new loading states, no layout shift.
* **Reward:** Confirm gamification/XP hooks tied to Vitality entries still fire correctly post-split.

### Phase 4: Post-implementation fixes (found during manual verification)
Two gaps surfaced only once a real user exercised the split in a live session — not caught by lint/typecheck/unit tests, since both are about runtime wiring rather than logic:
* **Missing `VaultGate` on `/vitality`:** The route was never wrapped in `<VaultGate>` in `src/App.tsx`, unlike `/journal`, `/workbooks`, `/tools/cba`, `/tools/abc`. This was silently harmless before the Phase 2 ZK fix (the old raw `addDoc()` never called `encrypt()`, so it never needed the vault unlocked) but became a hard "Vault is locked. Key not found." failure once `useVitalityEntries.ts` correctly started encrypting. Fixed by wrapping `<Vitality />` in `<VaultGate>`, matching the existing pattern.
* **No save confirmation:** Saving a Vitality entry gave no user-facing feedback. Fixed with a one-line `toast.success('Vitality entry logged.')` in `useVitalityEntries.ts`, alongside the existing `triggerHaptic('hold')` call — reuses the `sonner` `<Toaster/>` already mounted globally in `App.tsx` (see `WorkbookDetail.tsx` for the existing pattern).

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `src/lib/__tests__/vitalityScoring.test.ts` (bio-balance scoring, mood inference) and `src/hooks/__tests__/useVitalityEntries.test.ts` (ZK-encryption regression guard) added. Full suite: 61 files / 425 tests passing.
* [x] **The Subway Test:** Both migrated write paths (`useVitalityEntries` → `useJournalOperations`, `DataExportPanel`'s `lastExportAt` → `useUserProfile.patchFields`) inherit TanStack Query's existing offline mutation queuing/retry — no new offline logic introduced, same reasoning PROJ-59 used for its equivalent migrations.
* [x] **The "Lost PIN" Test:** N/A — no crypto/rotation logic touched.
* [x] **Manual regression:** Full click-through completed — Movement/Fuel/Breath tabs in `Vitality.tsx` and Export/Import/Delete-modal-open-and-cancel in `DataManagement.tsx` all confirmed working post-split.
