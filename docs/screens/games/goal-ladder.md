# Games → Goal Ladder — `/games/goal-ladder`

**Source:** `src/components/games/goalLadder/GoalLadder.tsx` + `LadderProgress.tsx`, `src/lib/games/goalLadder/goalLadderData.ts`
**Personas:** Ned (Pink Cloud, Day 30–90) — `personaTarget: 'Ned'`.
**Tier:** Free.
**Zero-knowledge status:** Writes one `game_progress/{id}` doc on completion — `encryptedStats` (AES-GCM) holds rung counts; `score`/`gameId`/`personaTarget`/`createdAt` plaintext.

## What it does

A short, self-contained tap-through session: 8 fixed momentum-building prompts (`GOAL_LADDER_RUNGS`, e.g. "Notice one small win from today," "Name a boundary you kept, even a small one"), one visual "rung" climbed per prompt acknowledged.

## How it works

- `handleClimb` increments `rung`/`score` by one each tap; on reaching `GOAL_LADDER_RUNGS.length` (8), it completes the session and calls `recordProgress`.
- **No streak, no reset mechanic anywhere in the game** — there is no persistent state to break. This directly satisfies the "Day 90 Pink Cloud Crash" warning from Ned's persona notes in CLAUDE.md/`docs/PERSONAS.md`: the anti-punitive design here comes from having *nothing* for a missed day to punish, not from a softened penalty.
- `LadderProgress` renders the current rung visually against the total.
- Shell: self-contained dark-immersive full-bleed screen (`GameSessionProvider` wrapped directly, not `GameShell`) with a teal (`#2DD4BF`) accent — Ned's persona color on the hub.

## Data model

| Field on `game_progress/{id}` | Encrypted? | Value |
|---|---|---|
| `gameId` | ❌ Plaintext | `'goal-ladder'` |
| `personaTarget` | ❌ Plaintext | `'Ned'` |
| `score` | ❌ Plaintext | Rungs climbed (8 on completion) |
| `encryptedStats` | ✅ AES-GCM | `{ rungsClimbed, totalRungs }` |

## Gating & limits

None — free tier, `VaultGate`-protected.

## Known gaps / debt

None found — this is one of the simplest games in the set, with no persisted mid-session state and no save/resume surface to leave in a bad state.

## Related docs

- `docs/screens/games/README.md` — shared mechanics.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 5 — origin, Pink Cloud Crash rationale.
