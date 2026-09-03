# Games → Knowledge Quests — `/games/knowledge-quests`

**Source:** `src/components/games/knowledgeQuests/KnowledgeQuests.tsx` + shared `ScenarioMatchQuiz.tsx`, `src/lib/games/knowledgeQuests/packs/index.ts` (+ `stress.ts`, `habitLoops.ts`, `sleep.ts`)
**Personas:** Everyone — `personaTarget: 'All'` (the same value used for Daily Crossword; added to `GamePersonaTarget` because no existing persona value fit "content meant for everyone").
**Tier:** Free.
**Zero-knowledge status:** Writes one `game_progress/{id}` doc per pack played — `encryptedStats` (AES-GCM); `score`/`gameId`/`personaTarget`/`createdAt` plaintext.

## What it does

General psychoeducation, not persona-targeted: a pack picker, then the shared scenario-match quiz loop over one of 3 static content packs — **Stress & The Body**, **Habit Loops**, **Sleep & Recovery** (`KNOWLEDGE_QUEST_PACKS`, registered in `packs/index.ts`), each 10 questions.

## How it works

- `PackPicker` lists all registered packs with title, description, and question count (`pack.items.length`).
- Selecting a pack (`handleSelectPack`) starts the session and renders `ScenarioMatchQuiz` over that pack's `items` with the dark theme (`accent: '#F0ABFC'`, the "everyone" hub persona color).
- `handleComplete` fires `recordProgress` with `stats: { packId, correct, total }` — the pack ID is captured so history can distinguish which pack was played.
- "Try Another Pack" (`handlePlayAnother`) resets to the picker without leaving the route — no save-state, no resume: a pack is a single-sitting quiz, same as picking a fresh difficulty in Fast Lane's selector (but without Fast Lane's multi-week persistence).
- Adding a 4th pack is a new content file + one registry entry in `packs/index.ts` — no `GamesHub`/route changes needed, per `docs/projects/72_RECOVERY_GAMES.md`'s framing of this as the actual "decoupled" property that mattered.
- Shell: self-contained dark-immersive full-bleed screen, same family as Goal Ladder/Recovery Jeopardy/Trigger Match.

## Data model

| Field on `game_progress/{id}` | Encrypted? | Value |
|---|---|---|
| `gameId` | ❌ Plaintext | `'knowledge-quests'` |
| `personaTarget` | ❌ Plaintext | `'All'` |
| `score` | ❌ Plaintext | Count correct (out of 10) |
| `encryptedStats` | ✅ AES-GCM | `{ packId, correct, total }` |

One doc per pack completed — playing all 3 packs in one visit produces 3 separate `game_progress` docs.

## Gating & limits

None — free tier, `VaultGate`-protected.

## Known gaps / debt

None found.

## Related docs

- `docs/screens/games/README.md` — shared `ScenarioMatchQuiz` mechanic.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 6 — origin, pack-registry design.
