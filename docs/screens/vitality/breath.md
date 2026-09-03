# Vitality → Breath — `/vitality` (tab: breath)

**Source:** `src/components/vitality/BreathTab.tsx` (UI) + `src/hooks/useBreathEngine.ts` (timer state machine) + `src/hooks/useWakeLock.ts` (screen wake lock) + `src/hooks/useVitalityEntries.ts` (shared save path) + `src/lib/haptics.ts` (`triggerHaptic`) + `src/lib/telemetry.ts` (`trackBreathworkCompleted`)
**Personas:** No dedicated persona targeting in code or `docs/PERSONAS.md` — labeled "Somatic Anchor" in the UI, thematically a grounding/regulation exercise (relevant to any persona managing anxiety or craving in the moment, David included), part of the Bio-Balance "Mindfulness" pillar. **Not** one of CLAUDE.md's explicitly never-gateable crisis-floor features (SOS, Urge Surfer, Craving Buster, sponsor/hotline contact, sobriety counter) — don't assume it carries the same design guarantees those do.
**Tier:** Free — no `<PremiumGate>`, no rate limit.
**Zero-knowledge status:** Writes `journals/{id}` via `saveVitalityEntry()` — `content` AES-GCM encrypted, `moodScore`/`tags`/`isEncrypted`/`sentiment` plaintext. See `docs/screens/vitality/README.md` for the full boundary detail.

## What it does

A guided breathing timer ("Somatic Anchor") with three selectable rhythms — a visual "organic halo" that expands/contracts with each phase, haptic pulses on phase changes, a running session clock, and a screen wake-lock so the phone doesn't dim mid-session. At the end of a session (minimum 5 seconds run), the user can log it with an optional reflection note.

## How it works

### Patterns
- Two presets in `useBreathEngine.ts`: `'4-7-8'` → `[4, 7, 8, 0]` seconds (Inhale/Hold/Exhale/Hold-empty), labeled "Relax (4-7-8)"; `'4-4-4-4'` → `[4, 4, 4, 4]`, labeled "Box Breathing (4-4-4-4)".
- `'custom'` uses a 4-tuple `customPattern` state (`[in, hold, out, holdEmpty]`), defaulting to `[5, 0, 5, 0]`, editable via four number inputs (each clamped to `Math.max(0, val)` in `handleCustomChange` — no upper bound). Persisted to `localStorage` under the key `mrt_custom_breath` and read back on mount (`JSON.parse`, silently falls back to the default on a parse error).
- The engine skips any phase whose duration is 0: `startEngine` finds the first non-zero index, and the interval's phase-advance logic (`while (patternRef.current[nextIdx] === 0) nextIdx = (nextIdx + 1) % 4;`) loops forward past zero-duration phases. With the default custom pattern `[5, 0, 5, 0]`, this means Hold and Hold-empty are silently skipped and the session is effectively Inhale 5s / Exhale 5s only.
- **Known edge case:** if a user sets all four custom values to 0 (permitted — `handleCustomChange`'s only floor is `Math.max(0, val)`, there's no "must have at least one non-zero phase" check), the phase-advance `while` loop inside the running interval has no non-zero index to land on and would loop indefinitely on every tick — a real hang risk, not exercised by any visible guard in this code.

### Timer mechanics
- `breathTime` (total elapsed seconds, shown as `MM:SS`) increments every tick of a `setInterval(..., 1000)`.
- Phase countdown (`phaseTimeLeft`) is tracked via a mutable `timeLeftRef`, updated directly inside the interval callback rather than through the phase's own `setState` cycle — this is deliberate, per the code comment, to keep the 1-second cadence accurate regardless of React's render-batching timing.
- `currentPhaseIndex` (0=Inhale, 1=Hold, 2=Exhale, 3=Hold-empty) is also a ref, not state, for the same reason.
- `applyPhase()` sets the visual `scale`/`duration` pair driving the CSS `transitionDuration` on the halo (`1.5` scale for Inhale/Hold, `0.8` for Exhale/Hold-empty) and fires a haptic pulse via `triggerHaptic()`: Inhale → `'inhale'` (`navigator.vibrate([40])`), Hold → `'hold'` (`[20, 50, 20]`), Exhale → `'exhale'` (`[40]`), **Hold-empty also fires `'hold'`** — there's no distinct haptic for the fourth phase, it reuses the Hold pulse.

### Wake lock
- `startEngine()` calls `requestWakeLock()` (`useWakeLock.ts` → `navigator.wakeLock.request('screen')`); `stopEngine()` calls `releaseWakeLock()`. Both are wrapped in try/catch with a `console.warn` on failure — unsupported browsers or a denied lock degrade silently, no user-facing error.
- The hook also releases the lock and clears the interval on unmount (`useEffect` cleanup calling `stopEngine()`), so navigating away mid-session doesn't leave the wake lock held or the interval running.

### Settings UI
- The pattern picker (`showSettings` toggle) is hidden entirely while `breathActive` is true — pattern/custom values can't be changed mid-session, only before starting or after stopping.

### Logging a session
- `handleLogBreath` computes `mins`/`secs` from `breathTime`, builds a `techniqueName` label (`'Relax (4-7-8)'` / `'Box Breathing (4-4-4-4)'` / `` `Custom (${customPattern.join('-')})` ``), fires `trackBreathworkCompleted(breathPattern, breathTime)` telemetry, then calls `engine.stopEngine()` — **the timer and wake lock are torn down synchronously, before the `await onLog(...)` call**, so the session is considered "over" locally regardless of whether the Firestore write that follows succeeds.
- `onLog('Mindfulness', 'Breathwork Session 🌬️', details, breathNote, ['Somatic', 'Breathing', 'Regulation', 'Meditation'])` — tags are a **fixed set**, not derived from the technique used; final tags on the doc are `['Vitality', 'Mindfulness', 'Somatic', 'Breathing', 'Regulation', 'Meditation']`. Both `Mindfulness` and `Meditation` land in that array, and `calculateBioBalance()` checks for either — redundant but harmless for the scoring logic.
- The "Log Session" button is `disabled` when `engine.breathTime < 5` (must run at least 5 seconds) or while `saving` is true.

## Data model

Writes to `journals/{id}` (shared collection, not a Vitality-specific one):

| Field | Encrypted? | Value for a Breath log |
|---|---|---|
| `content` | ✅ AES-GCM | `**Breathwork Session 🌬️**\n*Session Duration:* ${mins}m ${secs}s\n*Technique:* ${techniqueName}\n\n**Somatic Check-in:**\n${note or "No specific notes recorded."}` |
| `moodScore` | ❌ Plaintext | Inferred via `inferMoodFromRecentEntries()`, same as Move/Fuel — never asked of the user on this tab |
| `tags` | ❌ Plaintext | `['Vitality', 'Mindfulness', 'Somatic', 'Breathing', 'Regulation', 'Meditation']` (fixed, technique-independent) |
| `weather` | ❌ Plaintext | Always `null` |
| `sentiment` | ❌ Plaintext | Always `'Pending'` |
| `isEncrypted` | ❌ Plaintext | Always `true` |

`customPattern` itself (the user's custom in/hold/out/hold-empty seconds) lives only in `localStorage` (`mrt_custom_breath`) — it is never written to Firestore, so it doesn't sync across devices and isn't part of the zero-knowledge boundary at all (nothing sensitive in it).

## Gating & limits

None — free tier, no rate limit, no tier check anywhere in this component, `useBreathEngine.ts`, or the shared save path.

## Known gaps / debt

- **All-zero custom pattern risk:** nothing stops a user from setting all four custom phase durations to 0, which would make the interval's phase-skip `while` loop spin indefinitely once started (see "Patterns" above) — a plausible tab/browser hang, not just a UX rough edge.
- Hold-empty phase has no distinct haptic pulse — it silently reuses the Hold pulse pattern, which may or may not be intentional (no comment either way).
- `stopEngine()` runs before the save completes — if `saveVitalityEntry()`'s Firestore write or `encrypt()` call fails, the session state is already torn down (timer stopped, wake lock released) and the only feedback is `useVitalityEntries`' generic `alert("Failed to save entry.")`; there's no way to resume or retry logging the same completed session without re-running it.
- Session duration/technique is the only structured data captured — no phase-by-phase adherence, no interruption tracking, matches `docs/specs/06_VITALITY.md`'s description exactly (no drift found here).

## Related docs

- `docs/screens/vitality/README.md` — parent index, shared save path, Bio-Balance scoring.
- `docs/screens/vitality/move.md`, `fuel.md` — the other two tabs.
- `docs/specs/06_VITALITY.md` §3 (Breathwork Engine — mutable-ref timer, organic halo, haptic engine, wake-lock safeguard, custom pattern persistence) — confirmed accurate against current code.
