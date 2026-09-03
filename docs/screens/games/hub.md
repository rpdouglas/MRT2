# Games → Hub — `/games`

**Source:** `src/pages/GamesHub.tsx`
**Personas:** All — the shared entry point for every persona-targeted game.
**Tier:** Free.
**Zero-knowledge status:** Writes nothing itself. Reads `game_saves` (Fast Lane only, via `useGameSave('fast-lane')`) to compute a "Continue" chip — the encrypted save state is decrypted client-side purely to read `player.week` for display.

## What it does

A flat, single-card list of game tiles, each linking to its own top-level route. Reached via `VaultGate` from the app's own nav (not itself a crisis-path entry — David reaches Craving Buster directly through the SOS modal, not through this hub).

## How it works

- `GAMES: GameEntry[]` is a static array of 8 entries (`id`, `title`, `desc`, `persona`, `icon`, optional `daily`, `active`). `ACTIVE_GAMES = GAMES.filter((g) => g.active)` is what actually renders — **`craving-buster` and `thought-challenge` currently have `active: false` and are entirely absent from this list**, not shown with a "Coming Soon" badge. See `docs/screens/games/README.md`'s "`active: false`" section for how both remain reachable elsewhere.
- Each visible tile (`GameRow`) shows an icon tinted by `PERSONA_COLORS[game.persona]` (a 6-value palette: walt/ned/lisa/david/groups/everyone — cosmetic only, drives no gating), the title, an optional `DAILY` badge (Daily Crossword only), and an optional pill `chip`.
- The only dynamic chip: Fast Lane shows `Continue · Week N` when a `game_saves` doc exists for it (`fastLaneSave.player.week`); otherwise no chip, and the tile behaves like every other fresh-start game.
- Footer copy: "No timer, no streak, no score kept." — applies to the hub's own framing, not literally every game underneath it (Fast Lane, Recovery Jeopardy, Craving Buster, Goal Ladder, Thought Challenge, Trigger Match, and Knowledge Quests all keep an in-session score; only Daily Crossword is genuinely scoreless).

## Data model

None written by this screen. Reads (not writes):
| Source | Encrypted? | Used for |
|---|---|---|
| `game_saves/{uid}_fast-lane` | ✅ Fully (via `useGameSave`) | `player.week` → the "Continue · Week N" chip |

## Gating & limits

None — free, unrestricted. `/games` itself sits behind `VaultGate` (per `src/App.tsx`), same as 7 of the 8 individual game routes.

## Known gaps / debt

- `active: false` hides Craving Buster and Thought Challenge from this list while leaving both fully routable — see the parent README for the two different ways each remains reachable (SOS modal vs. Tools Hub). Not documented in `docs/projects/72_RECOVERY_GAMES.md`.
- The hub's "No timer, no streak, no score kept" line is only fully true for Daily Crossword; every other listed game keeps an in-session score via `GameSessionContext`.

## Related docs

- `docs/screens/games/README.md` — shared mechanics, VaultGate matrix, XP.
- `docs/projects/72_RECOVERY_GAMES.md` §4 — game-by-game shipping history.
