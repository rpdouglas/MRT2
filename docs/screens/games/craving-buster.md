# Games → Craving Buster — `/games/craving-buster`

**Source:** `src/components/games/CravingBuster.tsx` + `src/lib/games/cravingBuster.ts` (pure scoring)
**Personas:** David (crisis, Day 1–30) — the one game explicitly reachable from the SOS flow.
**Tier:** Free.
**Zero-knowledge status:** Best-effort write to `game_progress/{id}` (`encryptedStats` AES-GCM; `score`/`gameId`/`personaTarget`/`createdAt` plaintext) — see below for why it's "best-effort."

## What it does

A short (~96 second), scored breathing-rhythm tap game: 8 cycles of 4s inhale / 4s hold / 4s exhale, tap the circle each time you breathe out. Deliberately distinct from `UrgeSurfer`'s static 5-minute 5-4-3-2-1 checklist — a different mechanic for the same crisis moment, not a duplicate.

**Not vault-gated.** Per an explicit comment in `src/App.tsx` ("No VaultGate — crisis-tool precedent, matches `/tools/urge-surfer`. Score persistence is a best-effort no-op if the vault happens to be locked.") and in the component itself, this is one of only two `/games/*` routes reachable without unlocking the vault (the other being the hub is gated but this specific game route is not). The game is also hidden from `GamesHub`'s own tile list (`active: false` in `GamesHub.tsx`) — its two real entry points are the **SOS modal** (`SOSModal.tsx`, `handleNavigation('/games/craving-buster')`) and a direct URL.

## How it works

- Timer-driven phase machine (`setInterval`, 1s tick) cycles `inhale → hold → exhale` per `CRAVING_BUSTER_PHASE_DURATIONS` (4s each), pausing correctly when `GameSessionContext`'s `phase === 'paused'`. `triggerHaptic(phase)` fires on each phase change.
- A tap only counts during the `exhale` phase, once per cycle (`tappedThisCycleRef`) — `canTap` is only `true` during exhale.
- Requests a Screen Wake Lock (`useWakeLock`) for the duration of the session so the screen doesn't sleep mid-breathing-exercise; released on finish or unmount.
- On completion: `calculateCravingBusterStats(tapsHit, cycleCount)` (`src/lib/games/cravingBuster.ts`) computes `rhythmAccuracy = round(hit/total * 100)`. `completeSession(stats.rhythmAccuracy)` sets the in-session score.
- **The vault check:** `recordProgress()` is only called `if (isVaultUnlocked)` (from `EncryptionContext`) — if the vault is locked, the game still completes and shows its result screen normally, it just never attempts the encrypted write. When it does fire, the promise's rejection is swallowed (`.catch(() => {})`) — "the game itself already completed for the user" per the inline comment, so a Firestore failure never surfaces to the player.

## Data model

| Field on `game_progress/{id}` | Encrypted? | Value |
|---|---|---|
| `gameId` | ❌ Plaintext | `'craving-buster'` |
| `personaTarget` | ❌ Plaintext | `'David'` |
| `score` | ❌ Plaintext | `rhythmAccuracy` (0–100) |
| `encryptedStats` | ✅ AES-GCM | `{ tapsHit, tapsTotal, rhythmAccuracy }` |
| `reflection` | — | Not used by this game |

## Gating & limits

None — free, and deliberately **not** behind `VaultGate` (crisis-tool precedent). If the vault happens to be locked, the score simply isn't persisted; nothing in the UI blocks or warns about this.

## Known gaps / debt

- If a user plays this while the vault is locked, the completed session leaves no `game_progress` record and no XP — there's no user-facing indication that this happened (by design, so as not to interrupt a crisis flow with a technical message).
- Hidden from `GamesHub` (`active: false`) but not from the SOS modal — see the parent README.

## Related docs

- `docs/screens/games/README.md` — VaultGate matrix, `active: false` behavior.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 2 — origin, `UrgeSurfer` distinction.
- `src/pages/UrgeSurfer.tsx` — the other crisis-path breathing tool this is deliberately distinct from; not yet drafted under `docs/screens/tools/`.
