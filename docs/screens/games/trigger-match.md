# Games → Trigger Match — `/games/trigger-match`

**Source:** `src/components/games/triggerMatch/TriggerMatch.tsx` + shared `ScenarioMatchQuiz.tsx`, `src/lib/games/triggerMatch/triggerMatchData.ts`
**Personas:** Walt — `personaTarget: 'Walt'`.
**Tier:** Free.
**Zero-knowledge status:** Writes one `game_progress/{id}` doc on completion — `encryptedStats` (AES-GCM); `score`/`gameId`/`personaTarget`/`createdAt` plaintext.

## What it does

A pattern-recognition quiz: 15 situations, each matched to the H.A.L.T.-based trigger category it fits (Hungry, Angry, Lonely, Tired, plus Social and Environmental). Uses the same H.A.L.T. framework already established as a Recovery Jeopardy category.

## How it works

- Uses the shared `ScenarioMatchQuiz` loop with the dark theme prop (`{ mode: 'dark', accent: '#60A5FA' }`) — Walt's existing hub persona color.
- No reflection field (unlike Thought Challenge) and no reset/streak mechanic — a single pass, `recordProgress` fires once on `handleComplete`.
- **Deliberately static content, not personalized to the player's journal history.** `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 5 records this as an evaluated-and-declined idea: the original master spec wanted trigger scenarios "grounded in your own history," but reading a user's actual tags/mood data to generate quiz prompts was judged a disproportionate new personal-data surface for this phase. Worth knowing if a future ticket proposes personalizing this game — it was considered once already and treated as a separately-scoped feature, not an oversight.
- Shell: self-contained dark-immersive full-bleed screen (`GameSessionProvider` wrapped directly), same visual family as Goal Ladder/Recovery Jeopardy.

## Data model

| Field on `game_progress/{id}` | Encrypted? | Value |
|---|---|---|
| `gameId` | ❌ Plaintext | `'trigger-match'` |
| `personaTarget` | ❌ Plaintext | `'Walt'` |
| `score` | ❌ Plaintext | Count correct (out of 15) |
| `encryptedStats` | ✅ AES-GCM | `{ correct, total }` |

## Gating & limits

None — free tier, `VaultGate`-protected.

## Known gaps / debt

None specific to this game. See "Deliberately static content" above if extending it.

## Related docs

- `docs/screens/games/README.md` — shared `ScenarioMatchQuiz` mechanic.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 5 — origin, personalization decision.
