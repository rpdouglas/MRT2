# Vitality → Fuel — `/vitality` (tab: fuel)

**Source:** `src/components/vitality/FuelTab.tsx` (form) + `src/hooks/useVitalityEntries.ts` (shared save path)
**Personas:** No dedicated persona targeting in code or `docs/PERSONAS.md` — general nutrition/hydration logging, part of the Bio-Balance "Nutrition" pillar.
**Tier:** Free — no `<PremiumGate>`, no rate limit.
**Zero-knowledge status:** Writes `journals/{id}` via `saveVitalityEntry()` — `content` AES-GCM encrypted, `moodScore`/`tags`/`isEncrypted`/`sentiment` plaintext. See `docs/screens/vitality/README.md` for the full boundary detail.

## What it does

A short form for logging a meal/eating moment: meal type, the type of hunger driving it (mindful-eating framing, not calorie tracking), and a running hydration tap-counter for the session — plus an optional "Mindful eating check..." note.

## How it works

- Local form state: `mealType` (select: Breakfast/Lunch/Dinner/Snack, defaults `'Lunch'`), `hungerType` (select: Physical/Emotional/Boredom/Habit, defaults `'Physical'`), `waterCount` (number, starts at 0), `nutriNote` (optional textarea).
- **Hydration counter:** `+`/`-` buttons directly mutate `waterCount` (no debounce, no gesture library — plain `onClick` handlers). The `-` button is clamped at 0 (`Math.max(0, waterCount - 1)`); the `+` button has no upper bound.
- **Unlike Move and Breath, this form has no guard clause at all** — `handleLogNutrition` only calls `e.preventDefault()` before building the details string and submitting. Because both selects always carry a value (defaults, no blank option) and there's no `required` field, the button always successfully logs an entry even if the user changes nothing and taps water zero times — there's no way to accidentally fail validation on this tab.
- Details string: `` *Meal:* ${mealType}\n*Hunger Type:* ${hungerType}\n*Hydration at log:* ${waterCount} glasses ``. The water count is a **snapshot at the moment of logging**, not a running daily total — it's embedded as plain text in that one entry's content, not aggregated anywhere.
- Calls `onLog('Nutrition', 'Fuel Log 🍎', details, nutriNote, [mealType])` → final tags on the Firestore doc: `['Vitality', 'Nutrition', mealType]`.
- On success, **only `nutriNote` is reset to `''`.** `mealType`, `hungerType`, and — notably — `waterCount` are left exactly as they were. This is a real difference from `MoveTab.tsx`, which resets its equivalent fields after a successful log.
- Because `Vitality.tsx` conditionally unmounts inactive tabs (`{activeTab === 'fuel' && <FuelTab .../>}`), `waterCount` (and every other piece of this tab's local state) is lost the moment the user switches to another Vitality tab — there is no persistence of the hydration count across a tab switch or a page reload, even within the same day.

## Data model

Writes to `journals/{id}` (shared collection, not a Vitality-specific one):

| Field | Encrypted? | Value for a Fuel log |
|---|---|---|
| `content` | ✅ AES-GCM | `**Fuel Log 🍎**\n*Meal:* …\n*Hunger Type:* …\n*Hydration at log:* … glasses\n\n**Somatic Check-in:**\n${note or "No specific notes recorded."}` |
| `moodScore` | ❌ Plaintext | Inferred via `inferMoodFromRecentEntries()`, same as Move — never asked of the user on this tab |
| `tags` | ❌ Plaintext | `['Vitality', 'Nutrition', mealType]` |
| `weather` | ❌ Plaintext | Always `null` |
| `sentiment` | ❌ Plaintext | Always `'Pending'` |
| `isEncrypted` | ❌ Plaintext | Always `true` |

## Gating & limits

None — free tier, no rate limit, no tier check anywhere in this component or its save path.

## Known gaps / debt

- **Hydration count is not persisted or aggregated anywhere.** It exists only as local component state, embedded as a text snapshot into whichever single journal entry happens to be logged at that moment. A user who taps `+` five times across the day but only logs a meal once will have four of those taps go completely unrecorded — there's no daily-total hydration field on any collection, and no read surface (Dashboard, Insights) appears to reconstruct one from these text snapshots.
- Form fields (`mealType`, `hungerType`, `waterCount`) don't reset after a successful log, unlike `MoveTab.tsx` — inconsistent behavior between the two loggers that share the same visual pattern and save path.
- No validation prevents logging the same defaults (`Lunch` / `Physical` / 0 glasses) repeatedly with zero changed input.

## Related docs

- `docs/screens/vitality/README.md` — parent index, shared save path, Bio-Balance scoring.
- `docs/screens/vitality/move.md`, `breath.md` — the other two tabs.
- `docs/specs/06_VITALITY.md` §2A, §3 (Movement & Fuel Loggers, "rapid-tap Hydration counter").
