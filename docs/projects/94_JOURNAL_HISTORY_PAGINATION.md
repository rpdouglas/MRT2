# 📁 Project 94: Journal History Read Pagination

**Status:** ⚪ Planned
**Primary Persona:** Walt (35+ years, most likely to have hundreds-to-thousands of journal entries)
**Objective:** Close the real half of `OBSERVABILITY_AUDIT.md`'s GAP-02 — replace `JournalHistory.tsx`'s unbounded Firestore read with cursor-based pagination, without breaking existing search/filter/share functionality, and without touching `fetchAllUserData` (which correctly needs a full fetch).

---

## 1. The Executive Summary
**User Story:** As a long-term user with hundreds of journal entries, I want opening my Journal History to stay fast and cheap to run, not read my entire lifetime of entries every time.
**Source:** `OBSERVABILITY_AUDIT.md` (2026-07-29) Phase 3, GAP-02 (partial), Quick Win #2 (partial).

**Scope correction — the source audit's fix target was half wrong:**
- `OBSERVABILITY_AUDIT.md` proposed `limit(50)` on **both** `fetchAllUserData` (`src/lib/db.ts`) and `JournalHistory.tsx`. I traced `fetchAllUserData`'s callers: `AppShell.tsx`'s background auto-backup and `DataExportPanel.tsx`'s user-triggered data export. **Both need every document, by design** — a backup or data-portability export that silently truncates to 50 items is a data-loss bug, not a fix. **No change to `fetchAllUserData` in this ticket.**
- `JournalHistory.tsx`'s query genuinely has no `limit()` and is hit on every routine page load — this is the real, valid part of the finding. Virtualization (already shipped in PROJ-92, `react-virtuoso`) only reduces DOM rendering cost; it does nothing for the underlying Firestore read volume, since every document is still fetched into memory before the virtualized list ever renders.
- This is real engineering, not a "2 day" quick win as the audit estimated — `JournalHistory.tsx` has existing search and filter behavior that currently assumes the full entry set is in memory. Pagination has to either extend cleanly to search (e.g., "load more" fetches the next page, search operates over what's loaded plus a server-side query fallback) or be scoped carefully around what breaks and what doesn't. This needs its own design pass, not a bolt-on `limit(50)`.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [ ] **Data Sensitivity:** Journal entries are ZK-encrypted content (`journals` collection, `IV:Ciphertext` per CLAUDE.md's boundary table). Pagination changes the query shape only — decryption still happens client-side at render time, unchanged.
* [ ] **Encryption Strategy:** No change — still uses `src/lib/crypto.ts`'s existing decrypt path per entry.
* [ ] **Key Rotation:** N/A — no schema change.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No new fields. No `src/lib/db.ts` interface changes (the document shape is unchanged — only the query's pagination behavior changes).

**Firestore indexes:** The existing composite index on `journals` (`uid` equality + `createdAt` orderBy, already referenced in `firestore.indexes.json` per CLAUDE.md) already supports `startAfter` cursor pagination — no new index required.

**Files impacted:**
* `src/components/journal/JournalHistory.tsx` — replace the single unbounded `getDocs(query(...))` with a paginated fetch (initial page + "load more" or infinite-scroll trigger, integrated with the existing `Virtuoso` list's `endReached` callback).
* Existing search/filter logic — needs explicit design: does search operate only over loaded pages (client-side, as now, but scoped to what's fetched), or does it need a server-side fallback query when the search term doesn't match anything in the currently-loaded set? **This is the one open design question for Phase 1 below, not assumed away.**

---

## 4. Implementation Phases 🏗️

### Phase 1: Design decision on search interaction
* Before writing code: decide whether search/filter stays scoped to loaded pages (simpler, matches most users' actual usage — searching recent entries) or needs a server-side fallback (more correct for Walt's use case of searching years back, more complex).
* Recommendation to validate at implementation time: start with pages-loaded-so-far search (simpler, lower risk), with an explicit "search older entries" affordance if the user's query comes up empty — avoids a silent gap where a real match exists but isn't found.

### Phase 2: Cursor pagination
* Fetch an initial page (e.g., 50 entries) ordered by `createdAt desc`.
* Wire `Virtuoso`'s `endReached` (already used for virtualization) to fetch the next page via `startAfter(lastVisibleDoc)`.
* Confirm TanStack Query's cache key includes pagination state correctly (likely `useInfiniteQuery` rather than the current single `useQuery`).

### Phase 3: Edge Cases
* [ ] Confirm Share (existing feature) still works correctly against a paginated entry, not just the initially-loaded page.
* [ ] Confirm the vault-lock/unlock flow (VaultGate) doesn't re-fetch from page 1 unnecessarily on every unlock.
* [ ] Confirm offline behavior — Firestore's `persistentLocalCache` still needs to serve a sensible experience when paginating offline (may only have what was previously fetched).

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** pagination fetch logic, `endReached` trigger.
* [ ] **Integration:** existing search/filter/share tests must still pass — extend them for the paginated case.
* [ ] **Regression:** full `npm run check`, plus the `subway.spec.ts` golden-path e2e test (offline resilience) since this touches core Journal data-fetching.
* [ ] **Manual:** verify with a seeded account of 100+ entries that scroll-triggered pagination feels smooth, not janky.
