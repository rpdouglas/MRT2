# Games → Thought Challenge — `/games/thought-challenge`

**Source:** `src/components/games/thoughtChallenge/ThoughtChallenge.tsx` + shared `ScenarioMatchQuiz.tsx`, `src/lib/games/thoughtChallenge/thoughtChallengeData.ts`
**Personas:** Lisa (sponsor/service burnout) — `personaTarget: 'Lisa'`.
**Tier:** Free.
**Zero-knowledge status:** Writes 1–2 `game_progress/{id}` docs per playthrough (see below) — `encryptedStats`/optional `encryptedReflection` AES-GCM; `score`/`gameId`/`personaTarget`/`createdAt` plaintext.

## What it does

A CBT-style matching quiz for sponsor/service burnout: 15 scenarios, each a short "thought" the player matches to the cognitive distortion it exemplifies (reusing the same 12-distortion list PROJ-50's `CognitiveDistortionPicker.tsx` uses, extracted into a shared `src/lib/distortions.ts`). After the quiz, an optional free-text reflection box lets the player note something they want to reframe.

**Hidden from the Games Hub** (`active: false` in `GamesHub.tsx`'s `GAMES` array) but fully live and discoverable via **Tools Hub** (`/tools`) — `src/lib/toolsRegistry.ts` carries a `status: 'active'` entry pointing at this exact route. See `docs/screens/games/README.md` for the full detail on this dual-registration.

## How it works

- Uses the shared `ScenarioMatchQuiz` loop (light styling — no `theme` prop passed, unlike Trigger Match/Knowledge Quests) over `buildThoughtChallengeItems()` (15 items built from `THOUGHT_CHALLENGE_SCENARIOS`).
- `handleComplete(correct, total)` fires `recordProgress` immediately once the quiz ends — this is the first write.
- The result screen then offers an **optional** reflection textarea. If the player writes something and taps "Save reflection," `handleSaveReflection` calls `recordProgress` **a second time**, with the same `correct`/`total` stats plus the reflection text. Because `useGameProgress`'s mutation is an `addDoc` (append), not an update, **a single playthrough with a saved reflection produces two separate `game_progress` documents** for the same session — one without a reflection, one with. This is a genuine data-shape quirk worth knowing if you're reading `game_progress` history for this game: don't assume one doc per Thought Challenge session.
- Uses `GameShell` (light chrome) — one of only three games that do (with Craving Buster and Fast Lane).

## Data model

| Field on `game_progress/{id}` | Encrypted? | Value |
|---|---|---|
| `gameId` | ❌ Plaintext | `'thought-challenge'` |
| `personaTarget` | ❌ Plaintext | `'Lisa'` |
| `score` | ❌ Plaintext | Count correct (out of 15) |
| `encryptedStats` | ✅ AES-GCM | `{ correct, total }` |
| `encryptedReflection` | ✅ AES-GCM (optional) | Present only on the second doc, if the player saves a reflection |

## Gating & limits

None — free tier. `VaultGate`-protected on the `/games/thought-challenge` route; also reachable via Tools Hub's own gating (same route, same gate).

## Known gaps / debt

- **Two `game_progress` docs per playthrough when a reflection is saved** — see above. Not a bug per se (each write succeeded as designed), but any downstream code counting "games played" or "Thought Challenge sessions" from raw `game_progress` rows will double-count sessions where a reflection was saved.
- Hidden from `GamesHub` but live via Tools Hub — undocumented dual-registration, see the parent README.

## Related docs

- `docs/screens/games/README.md` — shared `ScenarioMatchQuiz` mechanic, `active: false`/Tools Hub cross-reachability.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 5 — origin, distortion-list reuse.
- `docs/screens/tools/README.md` — Tools Hub, the other place this game is discoverable.
