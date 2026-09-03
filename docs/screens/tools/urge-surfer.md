# Tools → Urge Surfer — `/tools/urge-surfer`

**Source:** `src/pages/UrgeSurfer.tsx`
**Personas:** David — "For immediate crisis de-escalation" (`docs/PERSONAS.md`). Also flagged in `docs/PERSONAS.md`'s risk register: MRT's grounding tools (Urge Surfer named explicitly) are designed for addiction-related urges/anxiety, **not** acute psychiatric emergencies — a real clinical-risk boundary to keep in mind for any copy changes here.
**Tier:** Free, unconditionally — no `<PremiumGate>`, no rate limit.
**Zero-knowledge status:** Writes `journals/{id}` via `addJournal()` directly (not through `SmartToolContainer` — this isn't a SMART Tool). Normally AES-GCM encrypted like a journal entry, **but has a documented plaintext fallback** — see below.

## What it does

A 5-minute, timer-driven 5-4-3-2-1 grounding exercise ("ride the wave") for an active craving — the app's most explicit standalone crisis tool. Not a worksheet: no fields to fill in until an optional post-session reflection.

## How it works

### Not vault-gated — confirmed in `src/App.tsx`

```
<Route path="/tools/urge-surfer" element={<PrivateRoute>
    <UrgeSurfer />
    </PrivateRoute>} />
```

`PrivateRoute` (auth-only) wraps it; `VaultGate` does not — unlike every one of the 9 SMART Tools below it in the route list, which are `<PrivateRoute><VaultGate><Tool /></VaultGate></PrivateRoute>`. This is a deliberate crisis-tool precedent: `App.tsx` cites it explicitly in a comment on the later Craving Buster game route ("No VaultGate — crisis-tool precedent, matches /tools/urge-surfer"). A user who is mid-crisis and has never unlocked their vault this session (or has a locked vault for any reason) can still start and finish the full exercise.

### Three states: `idle` → `surfing` → `completed`

- **Idle:** explanatory copy + "Begin Surfing" button.
- **Surfing:** a 300-second (`SURF_DURATION_SECONDS`) countdown ring, `setInterval`-driven. `useWakeLock()` requests a screen wake lock for the duration (released on completion or unmount) so the screen doesn't sleep mid-exercise. The 5-4-3-2-1 prompt cycles by remaining time (`getPhase()`): >240s "5 things you can see," >180s "4 things you can touch," >120s "3 things you can hear," >60s "2 things you can smell," else "1 thing you can taste." On reaching 0, fires `trackUrgeSurferCompleted(SURF_DURATION_SECONDS)` (telemetry) and flips to `completed`.
- **Completed:** an optional reflection textarea ("My craving intensity right now is...") and a "Log Victory & Save" button.

### The plaintext fallback — the one deliberate exception to "encryption is mandatory"

`handleSave()`:

```ts
if (isVaultUnlocked) {
    try {
        contentToSave = await encrypt(plainContent);
        isEncrypted = true;
    } catch (err) {
        console.warn("Failed to encrypt during crisis log", err);
        contentToSave = `[Saved unencrypted during crisis]\n${plainContent}`;
    }
} else {
    contentToSave = `[Saved unencrypted during crisis]\n${plainContent}`;
}
```

A code comment makes the intent explicit: *"Security Fallback: If David uses this during a crisis while locked, we save in plain text to prioritize his mental health recording over strict encryption."* This is the only place in the codebase (outside the documented PIN-hash carve-out) where a Firestore write deliberately skips encryption — every other write path (Journal, Vitality, all 9 SMART Tools) either encrypts or aborts the save entirely (`JournalEditor.tsx`'s "Security Error: Could not encrypt. Save aborted." alert). Content saved this way is prefixed `[Saved unencrypted during crisis]` so it's identifiable later. `isEncrypted: false` is stored on the doc in that case (vs. the normal `true`).

### Mood inference

`getSmartMood()` reads the same `['journals', uid]` TanStack Query cache pattern as Journal's Write tab (`inferMoodFromRecentEntries`), defaulting to 5 if there's no cached history — the user is never asked to self-report a mood score on this screen.

### Save

`tags: ['Urge Surfer', 'Crisis Avoided', 'Vitality']` — note this is **not** tagged `'SMART Tool'` or any `SmartToolType`, so it never appears in `useSmartToolCompletions`'s counts, never shows a completion badge on the Hub card, and has no `/tools/urge-surfer/history` route (Urge Surfer's Hub card has no History button — see `hub.md`). It reads as a Journal entry in the main Journal History timeline via its tags, same mechanism Vitality logs use. On success, navigates to `/dashboard`. On failure, a generic `alert("Failed to save log.")`.

## Data model

Writes to `journals/{id}` (shared collection):

| Field | Encrypted? | Notes |
|---|---|---|
| `content` | ⚠️ Usually AES-GCM, **plaintext fallback if vault is locked or `encrypt()` throws** | `**Urge Surfing Completed**\n\n*Reflection:*\n${reflection or default text}`; prefixed `[Saved unencrypted during crisis]` when unencrypted |
| `isEncrypted` | ❌ Plaintext | `true` only when the encrypt path actually succeeded |
| `moodScore` | ❌ Plaintext | Inferred, never asked |
| `tags` | ❌ Plaintext | `['Urge Surfer', 'Crisis Avoided', 'Vitality']` — not a SMART Tool tag |
| `weather` | ❌ Plaintext | Always `null` |
| `sentiment` | ❌ Plaintext | Always `'Pending'` |

## Gating & limits

None — no tier check, no rate limit, no vault gate. Consistent with CLAUDE.md's crisis-safety floor: "Never gate crisis/safety features... SOS, Urge Surfer, Craving Buster, sponsor/hotline contact, the sobriety counter, and core journaling/task tracking must stay free and frictionless."

## Known gaps / debt

- The plaintext-fallback save is a real, intentional zero-knowledge boundary exception — anyone reviewing "never persist plaintext sensitive content server-side" against CLAUDE.md's Encryption Boundary section should know this screen is the one place that isn't absolute, and why.
- No SMART Tool tag means no completion tracking or history for this tool — by design (it's not a worksheet), but worth knowing if a future feature wants "how many times has this user used Urge Surfer" (it would have to query on the `'Urge Surfer'` tag directly, not via `useSmartToolCompletions`).
- `docs/PERSONAS.md`'s risk register calls out the psychiatric-emergency-vs-addiction-urge distinction for this exact tool — relevant to any future copy/escalation-path changes (e.g. adding a "this isn't working, get real help" escape hatch).

## Related docs

- `docs/screens/tools/README.md` — parent index.
- `docs/screens/tools/hub.md` — how this tool's card differs from the 9 SMART Tools.
- `docs/PERSONAS.md` — David's crisis-first design floor; the psychiatric-emergency risk note.
- CLAUDE.md — "Never gate crisis/safety features" rule; Zero-Knowledge Encryption Boundary section.
