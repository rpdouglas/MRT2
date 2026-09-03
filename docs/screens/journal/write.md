# Journal → Write — `/journal?tab=write`

**Source:** `src/components/journal/JournalEditor.tsx` + `AudioRecorder.tsx`, `TemplatePickerSheet.tsx`
**Personas:** All — the default landing tab for `/journal`.
**Tier:** Mixed — free text/voice entry; custom templates are premium-gated (with a known enforcement gap).
**Zero-knowledge status:** Writes `journals/{id}` with `content` AES-GCM encrypted (`encrypt()` from `EncryptionContext`); `moodScore`, `tags`, `weather`, `isEncrypted` are plaintext fields on the same doc.

## What it does

The primary entry-composition surface. Free text, a template-driven guided form, or voice dictation — the user picks one input mode per entry. Also the edit surface: `Journal.tsx` routes a "History → Edit" action back here with the entry preloaded (`initialEntry` prop).

## How it works

### Mood & smart defaults
- A 1–10 mood slider defaults to the average of the last 7 entries with a valid `moodScore` (`getSmartMood()`), read straight out of the TanStack Query cache (`['journals', uid]`) rather than a fresh fetch — falls back to 5 if there's no cached history yet.
- Weather auto-fetches once on mount for new entries (`getCurrentWeather()`, best-effort — failures are swallowed with a console warning, no user-facing error) and is stored as a plain `{ temp, condition }` object.

### Three input modes (mutually exclusive within one entry)
1. **Free text** — a `textarea` styled as notebook paper.
2. **Template form** (`activeTemplate` state) — when a template has `prompts` (an array of questions) rather than flat `content`, the UI switches to one `textarea` per prompt. On save, the answers are concatenated into a single formatted string (`**Prompt**\nAnswer\n\n` per question) before encryption — the structured Q&A shape is not preserved as separate fields in Firestore, only as formatted plaintext-before-encryption.
   - Templates come from two sources: `DEFAULT_TEMPLATES` (`src/data/journalTemplates.ts`, built-in) and `getUserTemplates(uid)` (custom, `users/{uid}/templates/{id}`, unencrypted). `TemplatePickerSheet` lists both.
2. **Voice mode** (`isVoiceMode` state) — swaps the text area for `AudioRecorder`. See below.

Switching modes preserves nothing from the previous mode — selecting a template resets `newEntry` to `''`.

### Voice-to-Vault (`AudioRecorder.tsx`)
- Uses `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder` (no external recording library). A running `setInterval` timer shows elapsed `MM:SS`.
- On stop: the recorded blob (`audio/mp3` container) is base64-encoded (`blobToBase64`) and sent to `generateAudioAnalysis()` in `src/lib/gemini.ts` — one of the nine approved Gemini flows, and the one whose payload is raw audio rather than text.
- Result (`AudioAnalysisResult`) carries `transcription`, `mood_score`, and `tags`. `handleAudioComplete` in `JournalEditor` appends the transcription to whatever text already existed (not a replace), sets mood, and merges tags plus a fixed `"Voice Note"` tag.
- **Cost control:** per CLAUDE.md's known live gap, this call has **no tier check and no rate limit** in the client or the proxy — any authenticated user can call it as many times as they want. The error handler does special-case a `functions/resource-exhausted` response (surfacing "Available again in 24 hours" per PROJ-106), which implies *some* server-side cooldown exists for at least one caller, but it is not documented as enforced specifically for this flow — treat the uncapped-cost gap as live until CLAUDE.md is updated.
- Mic permission denial surfaces as an inline error ("Could not access microphone...") rather than a crash.

### Tags
- Free-form tag chips with autocomplete sourced from the user's last 50 journal entries' `tags` arrays (a live Firestore query, not cached alongside the main journal list).
- `#` prefix is stripped automatically; Enter commits a tag; Backspace on an empty input pops the last tag.

### Save
- `handleSave` requires either non-empty free text or at least one non-empty template answer.
- Encryption is mandatory: if `encrypt()` throws, the save is aborted with an alert ("Security Error: Could not encrypt. Save aborted.") — there is no silent plaintext fallback.
- Fires `posthog.capture('journal_entry_saved', ...)` with `is_edit`, `mood_score`, `tag_count`, `used_template`, `has_weather` — no entry content in the telemetry payload.
- On success, calls `onSaveComplete` (passed down from `Journal.tsx`), which clears the `template` URL param and switches to the History tab.

## Data model

| Field on `journals/{id}` | Encrypted? | Notes |
|---|---|---|
| `content` | ✅ AES-GCM | Free text, or the flattened template Q&A, or the voice transcription (possibly appended to existing text) |
| `moodScore` | ❌ Plaintext | 1–10 |
| `tags` | ❌ Plaintext | User + voice-note (`"Voice Note"`) + template default tags |
| `weather` | ❌ Plaintext | `{ temp, condition } \| null` |
| `isEncrypted` | ❌ Plaintext | Boolean flag on the doc itself |
| `sentiment` | ❌ Plaintext | Set to `'Pending'` on create — not actually computed by this screen |

## Gating & limits

- **Custom templates**: the "manage templates" gear icon navigates to `/premium` for free-tier users and `/templates` for premium. Per CLAUDE.md, this is UI-only — `/templates` and `TemplateEditor.tsx` have no server or route-level tier check, so a free user can reach template creation directly by URL.
- **Voice-to-Vault**: no tier check, no rate limit (live gap — see above).
- Built-in templates and free text entry: unrestricted.

## Known gaps / debt

- `AudioRecorder.tsx`'s Gemini call is a live uncapped cost exposure (CLAUDE.md).
- Custom-template gating is enforced at the button, not the route.

## Related docs

- `docs/screens/journal/README.md` — parent index.
- `docs/specs/01_JOURNAL.md` §2A ("Write — The Editor").
- `docs/projects/57_JOURNAL_TEMPLATE_MODALITIES.md` — template system history.
