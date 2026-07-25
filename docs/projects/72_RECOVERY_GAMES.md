# 📁 Project 72: Recovery Games

**Status:** ✅ Shipped (all 7 phases complete — Subway Test automated and passing, see §5)
**Primary Persona:** All (David, Ned, Lisa, Walt)
**Objective:** Layer a zero-knowledge, anti-shame set of persona-targeted mini-games and psychoeducation tools onto the existing gamification system, replacing the dead "Service — Coming Soon" Dashboard tile with a live entry point.

---

## 1. The Executive Summary

**User Story:** As any MRT user, I want short, low-stakes games and reflection tools that reinforce coping skills and recovery knowledge, so that I can build momentum without the shame mechanics ("streaks reset to zero," red badges) common in other recovery apps.

**Competitive Gap:** "I Am Sober," "Reframe," and "Sober Grid" all rely on visible streak counters and/or social feeds that can shame a user for a reset. MRT's zero-knowledge architecture lets Recovery Games go further than any competitor: game history is client-side encrypted (same as journals/workbooks) rather than just "private" behind a login — even MRT's own servers can't read it. Combined with the anti-shame mechanics below (silent rollover, no penalty screens), this is a genuine differentiator, not just a feature-parity play.

**Origin note:** This spec formalizes and corrects `docs/reports/2026-07_recovery_games_platform_spec.md`, an informal master plan written outside our normal process. Section 4 below documents where this spec deliberately deviates from that document and why.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** Yes. Game completion history, reflections routed from games (e.g., a CBT-style "Thought Challenge" game), and derived XP/streak state are personal recovery content — same sensitivity class as journal entries.
- [x] **Encryption Strategy:** Yes, via `src/lib/crypto.ts`'s existing `encryptData()`/`decryptData()`, same `IV:Ciphertext` (base64) format as every other encrypted collection. **This is the one deliberate deviation from the informal master plan**, which proposed a local-only Zustand store with zero Firestore sync. That approach breaks cross-device sync and reinstall persistence, and bypasses CLAUDE.md's "all Firestore ops go through TanStack Query" rule. Instead: a new `game_progress` collection (see §3) is written/read exclusively through a new `useGameProgress` TanStack Query hook, encrypted client-side before every write — the same zero-knowledge guarantee the master plan wanted, achieved the way the rest of the app achieves it (encrypt-then-sync), not by avoiding sync.
  - Ephemeral, non-persisted state (the game currently being played, mid-session score) lives in a scoped React Context (`GameSessionContext`, not Zustand — see the `/planning` Strategy A decision in Phase 1: no new state-management dependency) — nothing persisted outside the encrypted-write path.
  - Any content routed to Gemini (e.g., a CBT-style game reflection) must go through one of the six already-approved flows in CLAUDE.md's Gemini exception list, or be added there explicitly before shipping. Knowledge Quest content packs (`Stress.json`, `HabitLoops.json`, etc.) are static, author-written JSON — not AI-generated and not sent to Gemini.
- [x] **Key Rotation:** Yes. `game_progress` documents must be included in `executePinRotation` alongside journals/workbook_answers/service, and CLAUDE.md's encryption-boundary table gets a new row for this collection once implemented.
- [x] **Phase 4 addendum (`game_saves`):** Fast Lane's multi-week save state doesn't fit `game_progress`'s append-only completed-play shape — it's live, continuously-updated in-progress data. **Resolved:** a new `game_saves` collection, fully encrypted (no plaintext fields, unlike `game_progress`'s partial split), one doc per `(uid, gameId)` upserted via `setDoc`. Included in `executePinRotation`/`executeCryptoShredding` alongside every other encrypted collection, and added to CLAUDE.md's boundary table.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `game_progress/{id}` *(new)* — encrypted. **Resolved:** one document per completed play (not one per user/game aggregate) — each `recordProgress` call in `useGameProgress` adds a new root-collection doc with game id, persona target, score/stats payload, timestamp, and an optional reflection text.
* `game_saves/{id}` *(new, Phase 4)* — fully encrypted, one document per `(uid, gameId)` at a deterministic `${uid}_${gameId}` doc ID, upserted via `setDoc` through the new `useGameSave` hook. Distinct from `game_progress`: this is a resumable, continuously-updated save-slot for multi-session games (currently only Fast Lane), not an append-only event log. Cleared via `clearSave()` once the player actually wins (at which point a normal `game_progress` completion record is written instead).

**Types (`src/lib/db.ts` / new `src/lib/games/` module):**
```typescript
// As implemented in src/lib/games/types.ts. No `any` anywhere in this interface,
// unlike the master plan's stats:any / reflectionPayload:any / exportData():any.
export interface IRecoveryGame<TStats extends Record<string, unknown>, TReflection = never> {
  id: string;
  title: string;
  personaTarget: 'David' | 'Ned' | 'Lisa' | 'Walt';
  initialize: () => void;
  start: () => void;
  pause: () => void;
  complete: (score: number, stats: TStats) => void;
  recordReflection?: (reflectionPayload: TReflection) => void; // routes to Encrypted Journal / game_progress
  exportData: () => GameExportPayload; // formatted for the future 06_DATA_EXPORT.md, not `any`
  destroy: () => void;
}
```

**Reuse (do not reinvent — per CLAUDE.md "reuse existing hooks/utilities"):**
* `src/lib/gamification.ts`'s `XP_VALUES` extended with game-specific entries, rather than a parallel XP economy.
* `calculateLevel` / `getTitle` reused for leveling — games contribute XP into the existing curve, they don't define a new one.
* `calculateConsecutiveStreak` reused for any game-specific streak (e.g., daily Craving-Buster plays) instead of new streak logic.
* Whether games need a 5th bucket alongside `calculateUserLevel`'s wisdom/action/vitality/reflection split, or fold into an existing bucket, is an open design question for `/planning`.
* PROJ-31's crypto-chunking pipeline (`docs/projects/31_...` — see ROADMAP "Recently Shipped") should be reused for Phase 5's bulk game-history decrypt, not rebuilt.

---

## 4. Implementation Phases 🏗️

Mapped from the informal master plan's 5 phases / 10 sprints onto our template structure, adjusted per the ZK deviation in §2. Exact sub-sprint numbers (e.g. `Sprint X.0`–`X.9`) are assigned in `docs/ACTIVE_CYCLE.md` only once this project is picked up into an active cycle — the sequence below is the proposal for that assignment, not a live schedule.

### Phase 1: Logic & State — *Architecture & Foundation (sub-sprints .0–.1)*
* React Query hook: `useGameProgress` (read/write `game_progress`, encrypt/decrypt via `crypto.ts`).
* Firebase security rules for `game_progress` (uid-scoped, same pattern as `journals`/`workbook_answers`).
* `GameShell`/`GameHeader`/`GameFooter` scaffolding components; typed `IRecoveryGame` SDK (no `any`).
* `GameSessionContext` (React Context, not Zustand — Strategy A from the `/planning` pass) for session-only (non-persisted) game state.
* Security audit: confirm every `game_progress` write passes through `encryptData()` before hitting Firestore and all reads go through `useGameProgress` — not a "zero network calls" audit as the master plan framed it, since this feature does sync (encrypted) by design.

### Phase 2: UI/UX & Gamification — *Core CBT/REBT Loops (sub-sprints .2–.3)*, *Migration & Compliance (.4–.5)*, *Persona Expansion (.6–.7)*
* ✅ **Shipped:** Morning Intent CBT/REBT tool routed to the Encrypted Journal. Built as a new `GuidedWorkflowEngine`/`SmartToolContainer` SMART tool (`src/components/smart_tools/MorningIntentTool.tsx`, `toolType: 'MORNING_INTENT'`) — **not** on the `GameShell`/`IRecoveryGame` scaffolding, since it doesn't produce a score or persist to `game_progress`. Gets XP for free via the existing generic `'SMART Tool'`-tag path in `gamification.ts`.
* ✅ **Shipped:** Craving-Buster mini-game hooked into the existing 1-Tap SOS button (David) and GamesHub, at `/games/craving-buster`. The first concrete `IRecoveryGame` — a ~96s breathing-rhythm tap game, deliberately distinct from `UrgeSurfer`'s static 5-minute 5-4-3-2-1 checklist. **Deliberately not wrapped in `VaultGate`**, matching `UrgeSurfer`'s crisis-tool precedent — the game always completes locally; persisting the score via `useGameProgress` is a best-effort no-op if the vault happens to be locked.
* ✅ **Shipped (Phase 4):** "Fast Lane" ported from the legacy `RecoverySimulatorGame` — a multi-week weekly-turn economic life-sim (jobs/promotions, university courses, a shop of wellbeing items, apartment tiers, a loan/interest + stock-investing subsystem, weighted random events) racing the player against an AI rival ("Casey," renamed from the legacy's "John G") toward a wealth/wellbeing/education/career goal. Per standing user decision, **the competitive AI-rival framing is kept as designed** (head-to-head comparison bars throughout `PlayerStatus.tsx`) rather than softened to match the rest of Recovery Games' anti-shame stance. Turn-resolution logic (rival AI, end-of-week finance, all player actions) was extracted into pure, unit-tested functions (`src/lib/games/fastLane/turnEngine.ts`) — none of this was testable in the legacy `.jsx`, where it lived inside `setGameState` closures. Reachable at `/games/fast-lane`, `personaTarget: 'Walt'`, requires `VaultGate`.
  * **Deviation from the legacy source, called out per the PR template:** the legacy game hard-stopped with a blocking `alert()` when the AI rival won first ("💔 JOHN G WINS!"), forcing a "you lose" state. Reaching Casey's goals first is now a calm, non-blocking log note that lets the player keep playing toward their own goals — the comparison-bar mechanic and race dynamic are unchanged, only the forced-loss popup is removed, consistent with Recovery Games' anti-shame design everywhere else.
  * **Bug fix during the port:** the legacy win condition compared `currentJob.title` against a free-text goal string (e.g. `"Technical Role"`) that never matched any actual job title — making the career-goal check permanently unwinnable. Fixed by targeting a real job ID (`FastLaneGoals.careerJobId`) instead.
  * **Compliance scrub (Tradition 6):** the legacy's self-care action literally read "Attend 12-Step Meeting" — the only fellowship-specific reference found in the source data — renamed to "Attend a Support Meeting." Covered by a CI-enforced denylist guard test (`gameData.test.ts`), same pattern as Jeopardy's.
  * **Persistence:** Fast Lane is the first Recovery Game that doesn't fit a single-sitting session — see the new `game_saves` collection in §3.
* ✅ **Shipped:** "Recovery Jeopardy" ported from the legacy game with a **full trademark/compliance content scrub** (Tradition 6) — see `src/lib/games/jeopardy/jeopardyData.ts`. Of 24 categories, 7 were fully renamed and rewritten (dropping specific fellowship/program names — e.g. "Big Book Basics" → "Recovery Literature Basics", "Recovery Dharma" → "Mindfulness & Buddhist-Inspired Recovery", "SMART Recovery" → "Evidence-Based Recovery Tools", "The Traditions" → "Group Principles" — paraphrased away from verbatim Tradition text), and 5 Step-themed categories were paraphrased away from verbatim Step-text quotes. A CI-enforced compliance guard test (`jeopardyData.test.ts`) denylists fellowship names and quoted phrasing so this can't silently regress. **Kept as a genuinely multiplayer, local pass-the-device group activity** (unlike every other Recovery Game) per the `/planning` decision — reachable at `/games/recovery-jeopardy`, `personaTarget: 'Lisa'`, requires `VaultGate` (not a crisis/SOS flow).
* Coping Skills Challenge (David): delivered as Craving Buster above — same slot, more specific name.
* ✅ **Shipped (Phase 5):** Goal Ladder (Ned), Thought Challenge (Lisa), and Trigger Match (Walt) — the last three persona games. All three are new (not legacy ports), each a small self-contained static-content mini-game, shipped in one combined phase since none individually is as large as a single prior phase.
  * **Goal Ladder** (`/games/goal-ladder`): an 8-prompt tap-through session (`src/lib/games/goalLadder/goalLadderData.ts`). Directly satisfies DEVELOPER_GUIDE's "Day 90 Pink Cloud Crash" warning by having **no streak or reset mechanic inside the game itself** — there's no persistent state for a missed day to break, rather than a punitive mechanic being softened after the fact.
  * **Thought Challenge** (`/games/thought-challenge`): a CBT-style match game for sponsor/service burnout — 15 scenarios each tagged with a cognitive distortion, reusing the 12-distortion list already defined for PROJ-50's `CognitiveDistortionPicker.tsx` (extracted into a shared `src/lib/distortions.ts` rather than duplicated). Includes an optional free-text reframe saved via `recordProgress`'s existing `reflection` field.
  * **Trigger Match** (`/games/trigger-match`): a pattern-recognition quiz reusing the H.A.L.T. framework (Hungry/Angry/Lonely/Tired) already established as a Recovery Jeopardy category, plus Social/Environmental. **Deliberately static content, not personalized to the player's own journal history** — the master spec's "grounded in your own history" phrasing was evaluated and declined during Phase 5 planning: every game shipped so far uses static, author-written content, and reading a user's actual tags/mood data to generate quiz prompts would be a genuinely new personal-data surface disproportionate to a "remaining persona games" phase. Revisit as its own scoped feature if personalization is wanted later.
  * **Shared mechanic:** Thought Challenge and Trigger Match are the same "scenario → multiple-choice → reveal → next" loop over different content banks — extracted once into `src/components/games/ScenarioMatchQuiz.tsx` instead of being written twice.
* ✅ **Shipped (Phase 6):** Knowledge Quests — general psychoeducation content packs (`/games/knowledge-quests`, `personaTarget: 'All'`, a new value added to `GamePersonaTarget` in `src/lib/db.ts` since no persona-specific value fit content meant for everyone). Ships with 3 static, author-written packs — Stress & The Body, Habit Loops, Sleep & Recovery — registered in `src/lib/games/knowledgeQuests/packs/index.ts`; a future pack is one new file + one registry entry, no GamesHub/route changes needed, which is the actual "decoupled" property this item asked for. Reuses `ScenarioMatchQuiz.tsx` (Phase 5) for its third time, confirming the extraction was worth it — a pack-picker screen swaps in a pack's items, no new UI loop written. Covered by the same structural + fellowship-denylist guard test pattern as every other content-bearing game (`packs.test.ts`), applied here as standing practice rather than because a specific compliance risk was found in general psychoeducation content.
* ✅ **Shipped (Phase 7):** Data & Sharing — closes the spec. Research during this phase's planning found the premise was wrong: a general data-export/deletion engine already exists and is fully shipped (`src/components/profile/DataExportPanel.tsx`, `src/lib/exporter.ts`, `fetchAllUserData()` — documented "Live" in `docs/specs/09_PROFILE.md`, but `docs/projects/30_DATA_EXPORT.md` was stale, still marked `⚪ Planned`). Rather than building a new export system, this phase closed two real gaps found in the existing pipelines:
  * **Account deletion gap (privacy-critical):** `executeTotalAccountAnnihilation()` (`src/lib/deletion.ts`, the "Right to be Forgotten" flow) scanned `journals`/`tasks`/`insights`/`ai_logs`/`feedback`/`workbook_answers`/`templates` but not `game_progress` or `game_saves` — deleting an account left orphaned encrypted Recovery Games data behind. Fixed by adding both collections to the scan list. This wasn't a planned Recovery Games deliverable — it's a direct consequence of Phases 1-6 adding two new encrypted collections without updating this pipeline, found and fixed in the same PR.
  * **Export gap:** `FullUserData`/`fetchAllUserData()` (`src/lib/db.ts`) and `prepareDataForExport()`/`generatePDF()` (`src/lib/exporter.ts`) now include `game_progress`, decrypted via the same `processInChunks` chunked-decrypt pattern already used for journals/workbooks (batch size 20) — not PROJ-31's cursor-based Firestore pagination, which the master spec assumed but which was never actually applied to this pipeline for any collection.
  * **Milestone Image sharing:** `src/hooks/useShareImage.ts` extracted from `SobrietyHero.tsx`'s existing `toPng` + Web Share API + download-fallback pattern (this feature already existed for sobriety milestones — it just hadn't been applied to Recovery Games). Applied to Fast Lane's win screen and Recovery Jeopardy's final-winner reveal only — the two games with a genuine "milestone" moment; the other four are short single-sitting exercises without an equivalent beat.
* **Somatic Check** (per template): no red "failure" states, no penalty screens for a missed day, no "debt" framing.
* **Reward:** XP flows into the existing leveling system (§3), not a separate meter.

### Phase 3: Edge Cases — *Data Sovereignty & Sharing (sub-sprints .8–.9)*
* [ ] `navigator.onLine` false — games remain playable offline; `game_progress` writes queue via Firestore's offline persistence like every other collection.
* [ ] `isVaultUnlocked` false — games requiring history/reflection access are gated behind the vault gate like the rest of the app; games with no persisted state (pure mini-games) may still be playable pre-unlock if product decides that's desired (open question for `/planning`).
* [ ] 320px viewport (iPhone SE) — game UI must not overflow or require horizontal scroll.
* [x] Game history export and Milestone Image sharing — shipped in Phase 7 above, by extending the existing `docs/specs/09_PROFILE.md` export/deletion engine rather than a new `docs/specs/06_DATA_EXPORT.md` (that number was already taken by `06_VITALITY.md`, and a dedicated new spec file wasn't needed once the work turned out to be a small extension of an existing, already-documented pipeline).

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `useGameProgress`/`useGameSave` CRUD, XP-value extension math (reuse of `calculateLevel`), streak reuse for game-specific streaks, `IRecoveryGame` type-safety (no `any` anywhere in the SDK or its implementers), Fast Lane's `turnEngine.ts` (promotion thresholds, crisis-trigger math, rent/loan interest accrual, rival AI decision ordering, win-condition check), Thought Challenge/Trigger Match/Knowledge Quests content-bank structural guards (every scenario's tagged answer is a valid, unique option in its own choice set) — covers everything shipped through Phase 6. Only the data-export/data-sovereignty phase remains. Extend as future games/phases land.
* [x] **The Subway Test:** automated 2026-07-23 as `e2e/golden-paths/subway.spec.ts` (PROJ-73), closing the gap flagged since #114. Fast Lane is the target — the only Recovery Game with genuine multi-session state (`game_saves`) worth resuming. Proves, against real Firestore/Auth/Functions emulators with `context.setOffline(true)`: (1) an in-game action taken offline updates state immediately via `persistentLocalCache` rather than erroring, (2) exiting and re-entering the game while still offline — the close-tab-and-resume flow — reads the resumed state from the local cache alone, and (3) the offline-queued write reaches the server once back online, verified from a second, storage-isolated browser context that never wrote anything locally. One real constraint documented in the spec's comments: this runs against the Vite dev server, which has no service worker in dev mode, so the test warms both the GamesHub and FastLane lazy route chunks online first (browser ES-module cache, not HTTP cache) rather than asserting a full page reload works offline — a built-PWA-only guarantee this spec doesn't cover.
* [x] **The "Lost PIN" Test:** `game_progress` and `game_saves` inclusion in `executePinRotation`/`executeCryptoShredding` has explicit unit test coverage (`rotation.test.ts`).
* [x] **Trademark/Compliance Scrub:** Recovery Jeopardy's full 24-category dataset and Fast Lane's job/course/item/event/apartment/difficulty text are scrubbed of fellowship names, branded program names, and verbatim literature/Tradition/Step quotes — enforced going forward by automated denylist guard tests (`jeopardyData.test.ts`, `gameData.test.ts`), not one-time manual passes.
* [x] **Copy Review:** Shipped copy (Morning Intent, Craving Buster, GamesHub, SOS modal) avoids "AI Sponsor"/"AA"/"NA"; `VaultGate`/`isVaultUnlocked` untouched, confirming the master plan's "avoid the word Vault" note was correctly scoped to user-facing copy only, not code.

---

## 6. Explicitly Deferred (not decided in this spec)
* Exact `game_progress` document shape (one doc per game vs. per user).
* ~~Whether a multi-session game needs its own persistence pattern beyond `game_progress`.~~ **Resolved in Phase 4:** a new `game_saves` collection (one fully-encrypted doc per `(uid, gameId)`, upserted via `setDoc`), reserved for games whose state spans multiple sittings (currently only Fast Lane). Single-sitting games keep using `game_progress` exclusively.
* ~~Whether games get a 5th `calculateUserLevel` bucket or fold into an existing one.~~ **Resolved in Phase 2:** games fold into the existing `action` bucket (same category as task completion) via a new `gameProgressCount` parameter on `calculateUserLevel`, contributing `XP_VALUES.GAME_COMPLETION`. No 5th bucket.
* ~~Whether pure mini-games (no persisted state) are playable before vault unlock.~~ **Resolved narrowly for Craving Buster only** (not as a blanket policy): it skips `VaultGate` entirely, matching `UrgeSurfer`'s crisis-tool precedent. The game always completes locally; `game_progress` persistence is a best-effort no-op when the vault is locked. Future games should decide this individually based on whether they're crisis-reachable (skip gate) or not (require it, like `GamesHub` itself does).
* Full Rule-of-3 technical design — happens in a `/planning` pass after this spec is approved, per `docs/governance/DEVELOPER_GUIDE.md`'s Recursive Build Protocol.
