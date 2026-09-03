# Vitality → Move — `/vitality` (tab: move)

**Source:** `src/components/vitality/MoveTab.tsx` (form) + `src/hooks/useVitalityEntries.ts` (shared save path)
**Personas:** No dedicated persona targeting in code or `docs/PERSONAS.md` — general activity-logging tool, part of the Bio-Balance "Movement" pillar. Default tab on `/vitality`.
**Tier:** Free — no `<PremiumGate>`, no rate limit.
**Zero-knowledge status:** Writes `journals/{id}` via `saveVitalityEntry()` — `content` AES-GCM encrypted, `moodScore`/`tags`/`isEncrypted`/`sentiment` plaintext. See `docs/screens/vitality/README.md` for the full boundary detail.

## What it does

A short form for logging a single physical-activity entry: what the activity was, how long, and how intense — plus an optional free-text "Body check-in" note. It's the default landing tab when `/vitality` is opened.

## How it works

- Local form state only: `moveActivity` (text, required), `moveDuration` (number input, required, no `min`/`max` set — a negative or absurd value is not rejected client-side), `moveIntensity` (one of `'Low' | 'Moderate' | 'High'`, three toggle buttons, defaults to `'Moderate'`), `moveNote` (optional textarea, placeholder "Body check-in...").
- `handleLogMovement` guards only on `if (!moveActivity) return` — the HTML5 `required` attributes on the activity/duration inputs are the only other validation; there is no numeric sanity check on `moveDuration` beyond the browser's native number-input behavior.
- Builds a markdown-ish details string: `` *Activity:* ${moveActivity}\n*Duration:* ${moveDuration} mins\n*Intensity:* ${moveIntensity} ``.
- Calls the shared `onLog('Movement', 'Movement Log 🏃', details, moveNote, [moveActivity])` — `onLog` is `saveVitalityEntry` from `useVitalityEntries()`, passed down from `Vitality.tsx`. The final tag array written to Firestore is `['Vitality', 'Movement', moveActivity]` (the hook prepends `Vitality` and the category).
- On success, `moveActivity`, `moveDuration`, and `moveNote` are reset to `''`. **`moveIntensity` is not reset** — it stays at whatever the user last picked (or `'Moderate'` on first mount), so a second log in the same session defaults to the previous intensity rather than `'Moderate'` again.
- Save button shows a spinning `ArrowPathIcon` while `saving` (the shared `isSaving` from `useJournalOperations`) is true, and is `disabled` during that window — no per-tab saving flag, so an in-flight save on any Vitality tab would disable this button too (all three tabs share the same `saving` prop from `Vitality.tsx`).
- All actual persistence, mood inference, encryption, and error handling happen in `useVitalityEntries.saveVitalityEntry()` — see the parent README for that shared path.

## Data model

Writes to `journals/{id}` (shared collection, not a Vitality-specific one):

| Field | Encrypted? | Value for a Move log |
|---|---|---|
| `content` | ✅ AES-GCM | `**Movement Log 🏃**\n*Activity:* …\n*Duration:* … mins\n*Intensity:* …\n\n**Somatic Check-in:**\n${note or "No specific notes recorded."}` |
| `moodScore` | ❌ Plaintext | Inferred via `inferMoodFromRecentEntries()` from the last 7 valid scores in the `['journals', uid]` cache — never asked of the user on this tab |
| `tags` | ❌ Plaintext | `['Vitality', 'Movement', moveActivity]` |
| `weather` | ❌ Plaintext | Always `null` — Vitality logs never fetch weather (unlike Journal's Write tab) |
| `sentiment` | ❌ Plaintext | Always `'Pending'` |
| `isEncrypted` | ❌ Plaintext | Always `true` |

## Gating & limits

None — free tier, no rate limit, no tier check anywhere in this component or its save path.

## Known gaps / debt

- `moveDuration` has no client-side min/max — a user (or a script) can submit a negative or nonsensical duration; it's stored verbatim in the encrypted content string, not as a typed/validated number.
- `moveIntensity` doesn't reset after a successful log, unlike the other two fields on this form — likely a minor oversight rather than an intentional "remember last intensity" feature (no comment or test documents it as deliberate).
- No confirmation that the Movement tag actually contributes to the Bio-Balance ring is shown on this tab itself — the user has to notice the header ring change; see `docs/screens/vitality/README.md` for how `calculateBioBalance()` reads today's `Movement`-tagged logs.

## Related docs

- `docs/screens/vitality/README.md` — parent index, shared save path, Bio-Balance scoring.
- `docs/screens/vitality/fuel.md`, `breath.md` — the other two tabs.
- `docs/specs/06_VITALITY.md` §2A, §3 (Movement & Fuel Loggers).
