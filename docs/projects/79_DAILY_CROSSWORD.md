# 📁 Project 79: Daily Crossword

**Status:** ✅ Shipped
**Primary Persona:** All (`GamePersonaTarget: 'All'` — same value used for Knowledge Quests, PROJ-72 Phase 6, for non-persona-specific content)
**Objective:** Ship a single AI-authored, non-personalized daily crossword — the 8th Recovery Games entry — giving every user a shared, low-stakes, couple-minutes vocabulary/reflection touchpoint with zero runtime AI cost and zero shame mechanics.

---

## 1. The Executive Summary

**User Story:** As any MRT user, I want a short daily crossword themed around a recovery concept, so that I can spend a few low-pressure minutes reinforcing recovery vocabulary without a timer, score, or streak hanging over it.

**Competitive Gap:** None of "I Am Sober," "Reframe," or "Sober Grid" offer a reflective word-game touchpoint at all — this is new ground, not a parity play. Where it does compete is on MRT's standing differentiator: even a "just for fun" feature stays inside the anti-shame, zero-knowledge posture (no wrong-answer flags, no reveal penalty, no completion pressure) rather than bolting on generic word-game UX.

**Origin note:** This spec formalizes `docs/reports/SPEC-crossword-001 (1).md` (an informal draft written outside the normal process) and its accompanying UI reference mockup `docs/reports/DailyCrossword.jsx`. It supersedes an earlier, discarded design direction (reading-anchored, per-modality crossword with lazy per-(modality, date) generation) in favor of one shared daily puzzle. This is the **8th Recovery Games entry** — read alongside `docs/projects/72_RECOVERY_GAMES.md`, whose schema/hook conventions this spec reuses rather than reinvents.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** Two different data classes, handled differently:
  - **Puzzle content** (theme, clues, answers, insight card) is **not** user data — it's one shared editorial record per calendar date, identical for every user, authored server-side by a nightly batch job. No PII, no emotional disclosure.
  - **Per-user solve state** (which cells are filled, whether solved, hints/reveals used) **is** personal usage data, same sensitivity class as any other `game_progress` entry.
- [x] **Encryption Strategy:**
  - Puzzle content is **not encrypted** — it's public-to-all-authenticated-users editorial content, same posture as Knowledge Quests' static packs, just server-generated instead of author-written. See §3 for the proposed `crossword_puzzles/{date}` collection.
  - Per-user solve state reuses the **existing** `game_progress` collection and its `encryptedStats`/`encryptedReflection` fields (PROJ-72 §3) rather than a new collection — no new encryption surface to design or audit.
- [x] **Key Rotation:** No new collection requiring `executePinRotation` coverage — `game_progress` is already included (PROJ-72). **Resolved (Strategy C, /planning Phase 2):** solve-state persistence IS in scope for v1 — completion writes a normal `game_progress` doc (`gameId: 'daily-crossword'`) like every other game, unlike the reference mockup's local-only state. Explicitly excluded from XP instead (see Phase 2 below), not from persistence.
- [x] **Gemini call boundary — confirmed, not assumed.** Documented in `CLAUDE.md` under "Approved server-side-only Gemini call (PROJ-79)": the nightly `generateDailyCrossword` Cloud Function sends zero user data (theme pool + exclusion lists only) and is explicitly noted as *not* a carve-out of the six client-side flows, since it governs a different kind of call entirely.

---

## 3. Schema & Architecture 🗄️
*Define the exact Firestore paths and TypeScript interfaces.*

**Firestore Collections Impacted:**
* `crossword_puzzles/{date}` *(new)* — unencrypted, one document per calendar date (`YYYY-MM-DD` doc ID). Server-write-only (nightly Cloud Function via Admin SDK, same "server-write-only per `firestore.rules`" pattern already used for `pinAttempts`, PROJ-65); readable by any authenticated user. Holds theme, word/clue list, `insight_card`, and post-layout grid coordinates — see the draft JSON schema in the source spec (§4.6) for the exact shape to carry into `src/lib/db.ts`.
* `game_progress/{id}` *(existing, reused — no schema change)* — `gameId: 'daily-crossword'`, `personaTarget: 'All'`. Shipped: `encryptedStats` holds `{ solveDurationSeconds, hintCount, revealCount, theme }`; `score` is always `0` (this game explicitly has no score per §5.4 of the source spec) and excluded from XP (see §4).

**Types (`src/lib/db.ts`):**
```typescript
// Shipped shape — matches src/lib/db.ts and functions/src/index.ts exactly.
export interface CrosswordWordEntry {
  answer: string;
  clue: string;
  clueStyle: 'dictionary' | 'recovery' | 'reflective' | 'metaphor';
  hint: string | null;
  themed: boolean;
  // difficulty is generation-internal only — never rendered, per source spec §4.4/§7.
  difficulty: 'easy' | 'mid' | 'advanced';
}

export interface CrosswordPuzzleRecord {
  date: string; // calendar_date, doc ID, e.g. "2026-07-27"
  theme: string;
  themeIntro: string;
  generatorVersion: string;
  promptVersion: string;
  words: CrosswordWordEntry[];
  insightCard: { text: string; frameworkTags: string[] };
  // Attached by the deterministic layout library post-generation, not by the AI:
  grid: { rows: number; cols: number };
  // Per-word grid placement (number/row/col/direction) lives on each
  // CrosswordWordEntry itself (number/row/col/direction fields), not a
  // separate structure.
}
```

**Reuse (per CLAUDE.md "reuse existing hooks/utilities" — do not reinvent):**
* `IRecoveryGame` SDK shape (PROJ-72 §3) — **not adopted**, consistent with every other Recovery Game (the interface exists in `src/lib/games/types.ts` but remains unimplemented/aspirational across the board, not a Daily-Crossword-specific gap).
* `useGameProgress` hook — reused as-is for solve completion.
* `GamesHub` entry pattern for discoverability, consistent with the other 7 games.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* [x] Nightly Cloud Function — **deviation from source spec §4.1 (approved during `/planning` Phase 3):** ships as a **synchronous** two-stage `generateContent()` call (word selection → clue polish), not the Batch API the source spec proposed. Nothing else in this codebase uses the Batch API's async submit/poll semantics, and this is one small nightly call rather than a bulk multi-day job — reconsider only if real cost data later justifies the added infra. Word validation (§4.9) and the write to `crossword_puzzles/{date}` both shipped as specced.
* [x] Deterministic, non-AI grid-layout library integration (§4.5) — shipped using the `crossword-layout-generator` npm package.
* [x] Firestore security rules: `crossword_puzzles` read-any-authenticated / write-server-only (mirrors `daily_readings`).
* [x] `useDailyCrossword` TanStack Query hook (`src/hooks/useDailyCrossword.ts`) — wraps `getDoc` inside `useQuery`, no direct Firestore calls, per CLAUDE.md.
* [x] **Resolved (Strategy C):** solve-state persists via `game_progress`, same as every other game — see §2 above.

### Phase 2: UI/UX & Gamification
* [x] Built from `docs/reports/DailyCrossword.jsx` reference: clue strip, grid, hidden-input mobile keyboard trigger, reveal-letter + gentle-hint actions, solved-state Insight Card. **Deviation (approved):** kept the shared `GameShell`/`GameHeader` chrome instead of a bespoke Somatic Action gradient header, since no other Recovery Game customizes its header per-game — the somatic cyan/teal colors were applied to the grid's interactive cells instead, where they serve an actual functional (selection-feedback) purpose.
* [x] Components: crossword grid, clue strip, hint-tier controls, Insight Card, solved-state banner (celebration-pulse, `prefers-reduced-motion`-respecting per §5.3).
* [x] **Somatic Check:** no wrong-answer flagging mid-solve, no timer/streak/score anywhere in the UI, no "hint used" indicator — confirmed in `DailyCrossword.tsx`.
* [x] **Reward — resolved (Strategy C, approved):** persists to `game_progress` like every other game, but explicitly excluded from XP (`AchievementsTab.tsx` filters `gameId === 'daily-crossword'` out of `gameProgressCount`), matching the source spec's "vehicle, not the point" framing (§2) without introducing a second persistence pattern.
* [x] GamesHub entry (8th tile).

### Phase 3: Edge Cases
* [x] `navigator.onLine` false — today's puzzle is fetched once via `useQuery` (`staleTime`/`gcTime` set), then playable from cache; consistent with other games' offline behavior. **Not yet exercised by an automated Subway Test** — see §5.
* [x] **Resolved (approved):** `/games/daily-crossword` sits behind `VaultGate`, consistent with 6 of 7 existing games (only Craving Buster is SOS-reachable pre-unlock) — no crisis-tool justification for an exception here.
* [ ] 320px wide screen (iPhone SE) — **not manually/visually verified in a browser.** Flagged as an outstanding QA gap, not a launch blocker (same honesty standard as PROJ-07's "code-verified, not yet device-tested" note) — see §5.
* [x] What happens if `crossword_puzzles/{today}` doesn't exist yet — `DailyCrossword.tsx` shows an explicit "Today's Puzzle isn't ready yet" empty state rather than erroring. **Real-world gap found post-launch, not anticipated here:** the nightly job originally only ever generated *tomorrow's* doc, never backfilling *today's* — meaning today's puzzle could go permanently missing after a missed night or the very first deploy (exactly what happened on this feature's first production day). Fixed in `generateDailyCrossword` to check/generate both today and tomorrow each run.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `crosswordLogic.ts` (grid-build/word-placement, cell-selection and direction-toggle, solved-state detection — 16 tests), Cloud Function word-validation (`validateCrosswordCandidates`, `hasDuplicateClues`, `pickTheme` — 20 tests), `AchievementsTab`'s XP-exclusion filter (2 regression tests).
* [ ] **The Subway Test:** **not yet added to `e2e/golden-paths/subway.spec.ts`** — the existing Subway Test suite (PROJ-73) predates this feature and doesn't cover Daily Crossword. Outstanding gap, not a launch blocker (mirrors PROJ-07's "code-verified, not yet device-tested" precedent) — should be picked up alongside the next Recovery Games test-coverage pass.
* [ ] **The "Lost PIN" Test:** now applicable — solve-state does persist via `game_progress` (Strategy C) — but **not yet run** against this specific game. Same outstanding-gap status as the Subway Test above.
* [x] **Content-pipeline QC:** word-validation gate (crosswordese denylist, duplicate-clue detection, min-placed-word threshold) is wired directly into `generateCrosswordForDate` and unit-tested, not just documented intent. A human daily spot-check process (source spec §4.7) was not separately established — the automated validation gate is the only QC layer shipped for v1.

---

## 6. Open Questions — Resolved

1. **David-mode rendering — resolved:** no special-casing. GamesHub isn't David's crisis path (he reaches Craving Buster directly via the SOS button, not the hub), so Daily Crossword sitting in the hub alongside every other game is consistent with existing precedent.
2. **Backlog/history — resolved (deferred, not built):** only "today" is accessible in v1; no puzzle-archive UI. Out of scope for this pass, not a rejected idea — revisit as a future roadmap item if demand shows up.
3. **Difficulty label visibility — confirmed holds:** `difficulty` exists on `CrosswordWordEntry` (`src/lib/db.ts`) for generation purposes only; grepped `DailyCrossword.tsx` and confirmed it's never referenced client-side.
4. **Special theme editions — not built, still a valid future roadmap note.** The theme-pool architecture (`crosswordPrompts.ts`) already supports this with zero new code (tag a pool subset for a date range) whenever it's prioritized.
