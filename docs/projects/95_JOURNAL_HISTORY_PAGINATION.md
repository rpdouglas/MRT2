# 📁 Project 95: Journal Read-Cost Reduction (Dashboard Anchor Status + Journal History)

**Status:** ✅ Shipped
**Primary Persona:** Ned/David (Dashboard — `useAnchorStatus`, hit on every app open), Walt (35+ years, `JournalHistory.tsx` — most likely to have hundreds-to-thousands of entries)
**Objective:** Two independent read-cost fixes, found by tracing every consumer of the `journals` collection's unbounded query pattern — not just the one file the source audit named.

---

## 1. The Executive Summary
**User Story:** As any user, I want the Dashboard to load without re-reading my entire journal history every time; as a long-term user, I want Journal History to stay fast and cheap without losing search or AI pattern analysis over my older entries.
**Source:** `OBSERVABILITY_AUDIT.md` (2026-07-29) Phase 3, GAP-02 (partial), Quick Win #2 (partial).

**Scope correction — the source audit named one file; tracing every consumer found a more severe, separate issue in a different one:**
- The audit proposed `limit(50)` on **both** `fetchAllUserData` (`src/lib/db.ts`) and `JournalHistory.tsx`. `fetchAllUserData` is used by `AppShell.tsx`'s background auto-backup and `DataExportPanel.tsx`'s data export — **both need every document, by design**. A backup that silently truncates to 50 items is a data-loss bug, not a fix. **No change to `fetchAllUserData`.**
- Tracing every reader of the `journals` collection (not just the file the audit named) found the `journals` query cache is split across **two entirely separate, non-shared fetches** under different TanStack Query keys:
  - `['journals', uid, isVaultUnlocked]` — `JournalHistory.tsx`'s own fetch (decrypts content, used for the history view + AI Wizard).
  - `['journals', uid]` — shared by `useAnchorStatus.ts` (Dashboard), `JournalInsights.tsx`, and `AchievementsTab.tsx` (no decryption, metadata only).
- **`useAnchorStatus.ts` is the more severe, easier finding.** It's used on Dashboard — the single most-visited screen — and does the exact same unbounded `where(uid) + orderBy(createdAt)` full-history read as `JournalHistory.tsx`, but only ever checks `journals.some(entry => isToday(entry.createdAt) && ...)`. It fetches a user's **entire lifetime of journal entries just to check if any exist from today.** This is trivially fixable with a `where('createdAt', '>=', startOfToday)` range filter — no UI change, no cache-sharing complexity, low risk, high value.
- **`JournalInsights.tsx` and `AchievementsTab.tsx`** (sharing `useAnchorStatus`'s cache key) were checked too — confirmed they genuinely need full history (trend charts, lifetime achievement counts). Correctly out of scope.
- **`JournalHistory.tsx` itself needs a different fix than generic cursor pagination.** The UI is year→month collapsible accordions (only current year+month expanded by default), not a flat scrolling list — a `Virtuoso.endReached`-triggered infinite-scroll cursor doesn't match this shape at all. Worse: `allEntries` (the full fetch) is passed wholesale to `JournalAnalysisWizard` for AI pattern analysis, and is what the search bar filters over. A naive pagination would silently degrade AI analysis quality and make search miss older entries, with no obvious symptom to catch it.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [ ] **Data Sensitivity:** `useAnchorStatus`'s fix touches an unencrypted metadata read only (`createdAt`, `tags`) — no ZK boundary involved. `JournalHistory.tsx`'s fix still decrypts each fetched entry exactly as today; only fetch volume changes.
* [ ] **Encryption Strategy:** No change to `src/lib/crypto.ts`'s decrypt path for either fix.
* [ ] **Key Rotation:** N/A — no schema change.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No new fields. No `src/lib/db.ts` interface changes.

**Firestore indexes:** No new index needed for either fix — the existing `uid`(equality) + `createdAt`(orderBy) composite index on `journals` already covers a `uid`(equality) + `createdAt`(range) query shape.

**Files impacted:**
* `src/hooks/useAnchorStatus.ts` — added `where('createdAt', '>=', Timestamp.fromDate(startOfDay(new Date())))` to the existing query. Gave it its own distinct cache key (`['journals', uid, 'today']`) rather than reusing the shared `['journals', uid]` key — **critical catch made before writing any code**: TanStack Query caches by key, not by `queryFn` body, so narrowing this hook's fetch while keeping the shared key would have let whichever hook (this one, `JournalInsights.tsx`, or `AchievementsTab.tsx`) mounted first silently populate the shared cache with the wrong shape of data for the other two.
* `src/components/journal/JournalHistory.tsx` — restructured to two fetch modes instead of the originally-planned per-year incremental loading (see Phase 2 below for why the plan changed mid-implementation).
* `src/components/journal/JournalAnalysisWizard.tsx` — **no source change**; `JournalHistory.tsx` now triggers its own full-history fetch and waits for it to resolve before opening the Wizard, so the Wizard still receives a complete `entries` array exactly as it always assumed.
* `JournalHistory.tsx`'s search bar — added an explicit "search full history" affordance.
* `src/components/journal/JournalInsights.tsx`, `src/components/profile/AchievementsTab.tsx` — **no change**, confirmed to genuinely need full history.

---

## 4. Implementation Phases 🏗️

### Phase 1: `useAnchorStatus` date-range fix (low risk, shipped first)
* Added the `startOfToday` range filter and the distinct cache key described above.
* `hasCheckIn`'s logic (already filters by `isToday()` client-side) is unchanged — pure read-cost optimization, identical output.

### Phase 2: `JournalHistory.tsx` — plan changed mid-implementation
**The originally-planned "per-year incremental loading" design had a real flaw, found before writing the fetch code**: if a prior year isn't loaded yet, its year-header wouldn't be in `flatData` at all (headers are derived from `groupItemsByYearAndMonth(filteredEntries)`, which only contains loaded years). That means the user would have no way to *discover or expand into* a year that hasn't loaded — the exact mechanism meant to trigger loading it. Per-year incremental loading requires knowing which years have entries in advance, which isn't available without reading them (defeating the purpose).

**Shipped design instead: two fetch modes.**
* **Current-year mode (default):** fetches only the current calendar year via a `where(createdAt >= startOfYear) + where(createdAt <= endOfYear)` range query — matches what's expanded by default in the UI.
* **Full-history mode (opt-in):** the original unbounded query, unchanged — triggered by clicking "Load earlier entries" (shown whenever not in full-history mode), "search your full history instead" (shown when searching), or opening the AI Wizard.
* Extracted the per-entry decrypt/transform logic (previously inline in the single `queryFn`) into a shared `mapJournalSnapshot()` helper, used by both fetch modes to avoid duplicating it.
* The Wizard's "Analyze" button triggers full-history mode and derives its own open/pending state from whether that fetch has resolved (`isWizardOpen = wizardOpenRequested && fullHistoryRequested && !fullHistoryQuery.isLoading`) — computed directly during render, not synced via a `useEffect`, after ESLint's `react-hooks/set-state-in-effect` rule flagged the first version of this (calling `setState` synchronously inside an effect) as an anti-pattern.

### Phase 3: Edge Cases
* [x] Share still works correctly regardless of mode — it operates on whatever's in `allEntries`, unchanged by which fetch populated it.
* [x] Vault lock/unlock doesn't cause extra fetches — the query key includes `isVaultUnlocked` exactly as before, so re-locking/unlocking behaves identically to pre-change behavior.
* [x] Offline: current-year mode is fully functional offline via Firestore's `persistentLocalCache`; full-history mode falls back the same way full-history *always* did before this ticket (unchanged code path).
* [x] Year-badge counts are always the real count for whatever's actually loaded (current year alone, or everything in full-history mode) — never an ambiguous "not yet loaded" state, since two-mode design means every rendered year header reflects real fetched data.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `useAnchorStatus.test.tsx` (8 tests, updated for the new `Timestamp.fromDate` mock and cache key) and `JournalHistory.test.tsx` (8 tests, updated to seed the new year-scoped cache key) — all passing.
* [x] **Regression:** full `npm run check` clean (662/662 tests), plus the full golden-path e2e suite (11/11) against real Firebase emulators, including `vault.spec.ts` which exercises `JournalHistory.tsx` directly end-to-end (not just mocked).
* [x] **Build:** `npm run build` clean.
* [ ] **Manual:** not visually verified in a real browser with a multi-year seeded account — the emulator-backed `vault.spec.ts` test covers the real Firestore read path, but not a human eyeballing the "Load earlier entries"/"search full history" UI affordances.
