# 📁 Project 79: Daily Crossword

**Status:** ⚪ Planned
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
- [x] **Key Rotation:** No new collection requiring `executePinRotation` coverage — `game_progress` is already included (PROJ-72). **Open item to confirm during `/planning` Phase 3:** whether solve-state persistence is even in scope for v1, given the reference mockup (`DailyCrossword.jsx`) holds all state in local React state only with no Firestore read/write at all. If v1 ships local-only (no cross-device resume of an in-progress puzzle), this checkbox is moot for v1 and becomes a v2 item.
- [ ] **Gemini call boundary — needs explicit confirmation, not assumed:** the nightly generation batch job is a **server-side Cloud Function calling Gemini with zero user data** (theme pool + exclusion lists only — see §4.1 of the source spec). This is structurally different from CLAUDE.md's "Approved Gemini exception" list, which governs **client-side flows that decrypt and send user content**. Because no user content is ever involved, this call does **not** appear to need addition to that six-flow list — but CLAUDE.md is explicit that any new Gemini call site must be confirmed, not assumed, before shipping. Flag this for sign-off during `/planning` rather than silently treating it as exempt.

---

## 3. Schema & Architecture 🗄️
*Define the exact Firestore paths and TypeScript interfaces.*

**Firestore Collections Impacted:**
* `crossword_puzzles/{date}` *(new)* — unencrypted, one document per calendar date (`YYYY-MM-DD` doc ID). Server-write-only (nightly Cloud Function via Admin SDK, same "server-write-only per `firestore.rules`" pattern already used for `pinAttempts`, PROJ-65); readable by any authenticated user. Holds theme, word/clue list, `insight_card`, and post-layout grid coordinates — see the draft JSON schema in the source spec (§4.6) for the exact shape to carry into `src/lib/db.ts`.
* `game_progress/{id}` *(existing, reused — no schema change)* — `gameId: 'daily-crossword'`, `personaTarget: 'All'`. Whether this write happens at all for v1 is an open item (see ZK audit above); if it does, `encryptedStats` would hold solve time / hint-usage counts and `score` stays unused or fixed (this game explicitly has no score per §5.4 of the source spec).

**Types (`src/lib/db.ts`):**
```typescript
// Draft — refine during /planning Phase 3 against the source spec's §4.6 JSON schema.
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
  // Per-word grid placement (number/row/col/direction) — exact shape TBD against
  // whichever layout library is selected in /planning Phase 2 (Strategy comparison).
}
```

**Reuse (per CLAUDE.md "reuse existing hooks/utilities" — do not reinvent):**
* `IRecoveryGame` SDK shape (PROJ-72 §3) if this ships as a formal Recovery Game entry rather than a bespoke route — decide during `/planning`.
* `useGameProgress` hook, if per-user persistence is in scope for v1.
* `GamesHub` entry pattern for discoverability, consistent with the other 7 games.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* Nightly Cloud Function (Batch API, per source spec §4.1) — two-stage generation (word selection → clue polish), word validation (§4.9), writes `crossword_puzzles/{date}`.
* Deterministic, non-AI grid-layout library integration (§4.5 of source spec) — library selection is a `/planning` Strategy decision.
* Firestore security rules: `crossword_puzzles` read-any-authenticated / write-server-only.
* `useCrosswordPuzzle` (or similar) TanStack Query hook to fetch today's puzzle — **no direct Firestore calls**, per CLAUDE.md.
* Decide (open item above) whether solve-state persists via `game_progress` or stays local-only for v1.

### Phase 2: UI/UX & Gamification
* Build from `docs/reports/DailyCrossword.jsx` reference: header (Somatic Action gradient, cyan-500→teal-500), clue strip, grid, hidden-input mobile keyboard trigger, reveal-letter + gentle-hint actions, solved-state Insight Card.
* Components to create: crossword grid, clue strip, hint-tier controls, Insight Card, solved-state banner (celebration-pulse, `prefers-reduced-motion`-respecting per source spec §5.3).
* **Somatic Check:** No wrong-answer flagging mid-solve, no timer/streak/score anywhere in the UI, no "hint used" indicator — all explicit anti-shame requirements from the source spec (§5.4), consistent with every other Recovery Game.
* **Reward:** No XP/leveling tie-in specified in the source spec — confirm during `/planning` whether it stays fully outside the XP economy (matching its "not the point, the vehicle" framing in source spec §2) or gets a minimal XP hook like other games' `XP_VALUES.GAME_COMPLETION`.
* GamesHub entry (8th tile).

### Phase 3: Edge Cases
* [ ] `navigator.onLine` false — today's puzzle must be usable offline once fetched; confirm caching behavior (persistentLocalCache, same as other games) covers "solve on the subway."
* [ ] `isVaultUnlocked` false — puzzle content itself isn't sensitive, so (matching Craving Buster's precedent, PROJ-72 §2) the puzzle could plausibly be playable pre-unlock; decide explicitly in `/planning` rather than defaulting either way, since the answer changes whether this route sits behind `VaultGate`.
* [ ] 320px wide screen (iPhone SE) — reference mockup uses 56px touch targets in a fixed-width grid; confirm grid width scales down without horizontal scroll at the smallest supported viewport.
* [ ] What happens if `crossword_puzzles/{today}` doesn't exist yet (batch job failure/delay)? Source spec (§4.9) notes on-demand regeneration as a rare fallback — needs a concrete client-side empty/error state.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** grid-build/word-placement logic, cell-selection and direction-toggle logic, auto-advance/backspace behavior, solved-state detection — all portable near-directly from the reference mockup's pure logic (`buildGrid`, `wordAt`, `checkSolved`), word-validation checks (§4.9 of source spec: crosswordese denylist, duplicate-clue detection).
* [ ] **The Subway Test:** confirm today's already-fetched puzzle remains playable with `context.setOffline(true)`, consistent with PROJ-72's existing Subway Test pattern (`e2e/golden-paths/subway.spec.ts`).
* [ ] **The "Lost PIN" Test:** only applicable if per-user solve state ends up persisted via `game_progress` (open item, §3) — if v1 ships local-state-only, this is N/A for v1 and revisited if/when persistence is added.
* [ ] **Content-pipeline QC:** confirm the daily spot-check process (§4.7 of source spec) and word-validation gate (§4.9) are actually wired into the batch job, not just documented as intent.

---

## 6. Open Questions Carried Forward From Source Spec
*(Not resolved here — flagged so `/planning`'s Strategy comparison addresses them explicitly, per source spec §6.)*

1. **David-mode rendering:** does the crossword surface in Recovery Games while David-persona/crisis mode is active, or does it stay hidden in favor of Craving Buster?
2. **Backlog/history:** is only "today" ever accessible, or can past dates be browsed? Affects whether a puzzle-archive UI is in scope for v1.
3. **Difficulty label visibility:** stays internal-only/hidden per source spec §4.4 and §7 (anti-shame grounds) — confirm this holds, not a launch blocker either way.
4. **Special theme editions:** the theme-pool architecture supports zero-code seasonal/awareness-week theme sets by tagging a pool subset for a date range — worth a lightweight roadmap note, not built now.
