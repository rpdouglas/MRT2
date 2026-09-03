# Games — `/games`

**Parent page:** `src/pages/GamesHub.tsx` — a static list of 8 game tiles (`GAMES` array), each linking to its own top-level route under `/games/*`. Unlike Journal/Vitality, there's no tabbed sub-shell here: every game is a fully separate lazy-loaded route (`src/App.tsx`), not a tab within one page.

This screen has enough distinct sub-experiences (8 mechanically unrelated games) to warrant its own folder — each file below is independently readable.

| Sub-screen | File | Route | Component(s) |
|---|---|---|---|
| Hub | [`hub.md`](./hub.md) | `/games` | `GamesHub.tsx` |
| Craving Buster | [`craving-buster.md`](./craving-buster.md) | `/games/craving-buster` | `CravingBuster.tsx` |
| Recovery Jeopardy | [`recovery-jeopardy.md`](./recovery-jeopardy.md) | `/games/recovery-jeopardy` | `jeopardy/RecoveryJeopardy.tsx` + `PlayerSetup`, `JeopardyBoard`, `Scoreboard`, `QuestionModal`, `FinalJeopardy` |
| Fast Lane | [`fast-lane.md`](./fast-lane.md) | `/games/fast-lane` | `fastLane/FastLane.tsx` + `PlayerStatus`, `LocationBoard`, `GameLog` |
| Goal Ladder | [`goal-ladder.md`](./goal-ladder.md) | `/games/goal-ladder` | `goalLadder/GoalLadder.tsx` + `LadderProgress` |
| Thought Challenge | [`thought-challenge.md`](./thought-challenge.md) | `/games/thought-challenge` | `thoughtChallenge/ThoughtChallenge.tsx` |
| Trigger Match | [`trigger-match.md`](./trigger-match.md) | `/games/trigger-match` | `triggerMatch/TriggerMatch.tsx` |
| Knowledge Quests | [`knowledge-quests.md`](./knowledge-quests.md) | `/games/knowledge-quests` | `knowledgeQuests/KnowledgeQuests.tsx` |
| Daily Crossword | [`daily-crossword.md`](./daily-crossword.md) | `/games/daily-crossword` | `crossword/DailyCrossword.tsx` |

**Personas:** All six — this is the one feature area in the app with a game explicitly targeted at each: David (Craving Buster), Ned (Goal Ladder), Lisa (Recovery Jeopardy, Thought Challenge), Walt (Fast Lane, Trigger Match), everyone (Knowledge Quests, Daily Crossword). Jordan has no dedicated game. `personaTarget` (see Data model below) is a plain metadata label written with each completion record — it drives nothing in the UI (no persona-based filtering, no gating); GamesHub's per-row icon tint (`PERSONA_COLORS`) is the only place persona shows up visually, and it's cosmetic.

**Tier:** Free, unrestricted, all 8 games. No `<PremiumGate>`, no `useRateLimits` call, and no client-side Gemini call anywhere in `GamesHub.tsx`, any `src/components/games/**` file, `useGameProgress.ts`, or `useGameSave.ts` (confirmed by grep). Recovery Games is the one AI-adjacent-sounding feature area in the app that touches Gemini **only** server-side, and only for one game (Daily Crossword's nightly generation — see that file).

**Zero-knowledge status:** Two Recovery-Games-specific collections, both per CLAUDE.md's boundary table:

| Collection | Encrypted? | Shape |
|---|---|---|
| `game_progress/{id}` | ✅ Partial | Append-only completed-play log. One doc per `recordProgress()` call (root collection, `where('uid', '==', uid)`). `encryptedStats` (AES-GCM, `JSON.stringify(stats)`) and optional `encryptedReflection` are ciphertext; `uid`, `gameId`, `personaTarget`, `score`, `createdAt`, `isEncrypted` stay plaintext so XP/streak math never needs a decrypt (same precedent as `rosc_assessments`). |
| `game_saves/{id}` | ✅ Fully | Resumable, continuously-updated save-slot — currently used only by Fast Lane. One doc per `(uid, gameId)`, doc ID `${uid}_${gameId}`, upserted via `setDoc`. The **whole** state blob (`encryptedState`) is ciphertext — no plaintext fields, since this is live in-progress data, not a completed-event record with fields needed for streak/XP math. Cleared (`deleteDoc`) once the player actually wins; a normal `game_progress` record is written at that point instead. |

A third collection, `crossword_puzzles/{date}`, is **not** encrypted — it's shared, server-generated editorial content (theme/clues/grid), identical for every user on a given date, with no user data in it at all. See `daily-crossword.md`.

Both `game_progress` and `game_saves` are included in `executePinRotation`/`executeCryptoShredding` (PIN rotation and crypto-shredding on account deletion) per CLAUDE.md.

## Shared mechanics (read once, applies to every game below)

### Session state — `GameSessionContext`
`src/contexts/GameSessionContext.tsx` provides ephemeral, **never-persisted** state for whichever game is currently active: `activeGameId`, `phase` (`'idle' | 'playing' | 'paused' | 'complete'`), and a running `score`. It's scoped to the games subtree (wraps each game individually, not mounted at the app root) so most users, who never open a game, don't carry an extra context layer. Every game either wraps itself in `GameShell` (which provides it) or wraps itself directly in `GameSessionProvider`.

### Two shell styles
There are two distinct visual/structural shells in play, not one:
- **`GameShell.tsx`** (+ `GameHeader.tsx`, `GameFooter.tsx`) — light-chrome, indigo/violet header, slate footer with Exit/Pause/Resume. Used by **Craving Buster, Fast Lane, Thought Challenge**.
- **Self-contained dark-immersive shell** — each game hand-rolls its own full-bleed `linear-gradient(160deg,#2E1A47_0%,#1B0F2E_100%)` page with its own Exit/Pause/Resume footer bar, wrapping `GameSessionProvider` directly instead of `GameShell`. Used by **Recovery Jeopardy, Goal Ladder, Trigger Match, Knowledge Quests, Daily Crossword** (PROJ-86/87/88 restyle passes). Daily Crossword additionally never calls `useGameSession` at all (no `startSession`/`setScore`) since it's deliberately scoreless — its shell is a plain Exit link, no session plumbing.

`docs/projects/79_DAILY_CROSSWORD.md` §4 Phase 2 still describes Daily Crossword as using "the shared `GameShell`/`GameHeader` chrome" — that's now stale; the code comment at the top of `DailyCrossword.tsx` documents the later PROJ-88 switch to the self-contained shell. Follow the code.

### Shared quiz loop — `ScenarioMatchQuiz.tsx`
The "scenario → multiple-choice → reveal explanation → next" loop is written once and reused by three games with different static content banks: **Thought Challenge**, **Trigger Match**, **Knowledge Quests**. Options are shuffled once per session (not per render). An optional `theme={{ mode: 'dark', accent }}` prop (PROJ-87) lets Trigger Match/Knowledge Quests render the dark-immersive palette without touching Thought Challenge, which stays on the original light styling by omitting the prop.

### `game_progress` vs `game_saves` — which games use which
Every game except Fast Lane is a **single-sitting** session: it plays through once and writes exactly one `game_progress` doc via `recordProgress()` on completion (Thought Challenge can write a second one if the optional reflection is saved after the fact — see that file). **Fast Lane** is the one multi-week, multi-session game: its in-progress state autosaves continuously to `game_saves` via `useGameSave`, and only writes a `game_progress` doc once the player actually reaches their goals (at which point the save is cleared).

### XP
Recovery Games completions feed the existing gamification system (`src/lib/gamification.ts`), not a parallel one — `GAME_COMPLETION = 20` XP per `game_progress` doc, folded into the `action` XP bucket (same bucket as task completion). One deliberate exception: **Daily Crossword completions are filtered out** of the XP-eligible count in `AchievementsTab.tsx` (`gameHistory.filter((g) => g.gameId !== 'daily-crossword')`) — the puzzle is still persisted to `game_progress` like every other game (with `score: 0`, always), just excluded from the XP tally, per the "vehicle, not the point" framing in `docs/projects/79_DAILY_CROSSWORD.md`.

### VaultGate — the one exception
Per `src/App.tsx`, **every** `/games/*` route is wrapped in `VaultGate` **except `/games/craving-buster`**, which has an explicit comment: "No VaultGate — crisis-tool precedent, matches `/tools/urge-surfer`. Score persistence is a best-effort no-op if the vault happens to be locked." `/games` (the hub itself) is also gated. See `craving-buster.md` for how the component itself handles a locked vault (`isVaultUnlocked` check before calling `recordProgress`).

### `active: false` — hidden from the hub, not from the app
`GamesHub.tsx`'s `GAMES` array carries an `active: boolean` flag per entry; the hub only renders `GAMES.filter((g) => g.active)`. Two entries currently have `active: false`: **Craving Buster** and **Thought Challenge**. This was verified against the rendering code, not assumed — `active: false` means the tile is **fully omitted** from the hub's list, not shown with a "Coming Soon" badge (there is no such badge anywhere in `GamesHub.tsx`). The code comment in `GamesHub.tsx` frames this as deliberate: "their routes/components are untouched, they're just filtered out of what renders here. Flip `active` back to `true` to bring either one back." Both remain fully reachable:
- **Craving Buster** — via the SOS modal (`SOSModal.tsx`) and by direct URL. Its route has no gate.
- **Thought Challenge** — via **Tools Hub** (`/tools`): `src/lib/toolsRegistry.ts` has a `status: 'active'` entry (`id: 'thought-challenge'`, path `/games/thought-challenge`) that `ToolsHub.tsx` renders normally (`status` there only toggles a "coming soon" badge, it doesn't hide a tool). So Thought Challenge is invisible on `/games` but fully live and discoverable from `/tools`. This dual-registration (present in `toolsRegistry.ts`, `active: false` in `GamesHub.tsx`) isn't documented anywhere in `docs/projects/72_RECOVERY_GAMES.md` — treat it as a real, current piece of routing behavior, not a bug to "fix" by assuming one registry is stale.

## Related docs

- `docs/specs/07_GAMIFICATION.md` — XP economy (§1 matches code: 20 XP per game completion, `action` bucket). Doesn't mention the Daily Crossword XP exclusion.
- `docs/projects/72_RECOVERY_GAMES.md` — the founding spec for 7 of the 8 games (all but Daily Crossword), phases 1–7, ZK/schema decisions. Broadly accurate against code; doesn't mention the later `active: false` hub changes for Craving Buster/Thought Challenge.
- `docs/projects/79_DAILY_CROSSWORD.md` — the 8th game's spec. Accurate on schema/ZK; stale on the GameShell-vs-dark-shell point noted above.
- `docs/screens/tools/README.md` — Tools Hub, which also links to Thought Challenge (see the `active: false` note above).
