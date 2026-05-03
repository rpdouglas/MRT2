# 📖 Feature Spec — Daily Readings Engine
**ID:** PROJ-40  
**Epic:** Education & Daily Program  
**Priority:** P1 — High  
**Target Personas:** David (primary), Ned, Walt, Lisa  
**Status:** Ready for Planning

---

## 1. Problem Statement

MRT users have no in-app daily reading or meditation content. Recovery programs universally rely on daily readings as a cornerstone practice — they provide structure, reflection, and continuity between meetings and sessions. Without this, MRT loses a core daily engagement touchpoint and users must leave the app to find content elsewhere.

## 2. Success Metrics

- Daily reading opened by ≥ 40% of DAU within 30 days of launch
- ≥ 60% of users who open a reading complete it (scroll to bottom)
- Reading feature contributes to ≥ 15% improvement in D7 retention
- Content buffer never falls below 30 days per modality (operational health metric)
- Zero copyright-related complaints or legal notices

---

## 3. User Stories

**Story 1 — Daily touchpoint**  
As David (Day 3, high anxiety), I want a short daily reading when I open the app so I have something to focus on that isn't the overwhelming feeling of early sobriety.  
*Acceptance:* Reading is visible on Dashboard within 1 tap. Length ≤ 300 words. Includes one reflection question.

**Story 2 — Modality choice**  
As Ned (30 days, motivated), I want my daily reading to match my recovery path (AA, NA, CA, Recovery Dharma, SMART, Secular) so it feels relevant to my actual programme.  
*Acceptance:* User selects 1 or more modalities in Profile/Settings. Reading rotates through selected modalities day by day.

**Story 3 — Depth for long-termers**  
As Walt (2+ years, analytical), I want to see the theme and tradition behind today's reading so I can go deeper if I choose.  
*Acceptance:* Each reading includes a theme tag, tradition label, and optional "Go Deeper" link to the source tradition's website.

**Story 4 — Sponsor sharing**  
As Lisa (sponsor), I want to share today's reading with a sponsee so I can use it as a conversation starter.  
*Acceptance:* Share button generates a clean text export of the reading (no MRT branding that would violate AA anonymity tradition). Text only — no screenshots with user data.

---

## 4. Modalities & Content Sources

### Legal Framework — Critical

<table>
<tr><th>Modality</th><th>Fellowships Covered</th><th>Content Source</th><th>Legal Status</th><th>Attribution Required</th></tr>
<tr><td>12-Step (AA)</td><td>AA</td><td>AI-generated, inspired by public domain Big Book (Ed. 1 & 2, 1939/1955)</td><td>✅ Clean</td><td>No — original content</td></tr>
<tr><td>12-Step (NA)</td><td>NA</td><td>AI-generated, grounded in NA principles</td><td>✅ Clean</td><td>No — original content</td></tr>
<tr><td>12-Step (CA)</td><td>CA</td><td>AI-generated, grounded in CA/12-Step principles</td><td>✅ Clean</td><td>No — original content</td></tr>
<tr><td>Recovery Dharma</td><td>Recovery Dharma</td><td>Direct excerpts + AI-generated, from RD book (CC BY-SA 4.0)</td><td>✅ Clean</td><td>Yes — CC BY-SA 4.0 credit</td></tr>
<tr><td>SMART Recovery</td><td>SMART</td><td>AI-generated, grounded in CBT/REBT principles</td><td>✅ Clean</td><td>No — original content</td></tr>
<tr><td>Secular / Stoic</td><td>None specific</td><td>Public domain texts (Marcus Aurelius, Epictetus) + AI-generated</td><td>✅ Clean</td><td>No — public domain</td></tr>
<tr><td>Mindfulness / Buddhist</td><td>None specific</td><td>Public domain Pali Canon (Dhammapada, Sutta Nipata) + AI-generated</td><td>✅ Clean</td><td>No — public domain</td></tr>
</table>

**Hard rules:**
- NEVER reproduce text from: AA *Daily Reflections*, AA *Twelve Steps & Twelve Traditions* (3rd/4th ed.), AA Big Book (3rd/4th ed.), NA *Just for Today*, CA *Hope Faith & Courage*. All are actively copyrighted by their respective World Services organisations with no app licensing available.
- NEVER use the trademarked names AA, NA, CA, or their logos in any generated content or UI labels. Use "12-Step (AA-inspired)", "12-Step (NA-inspired)", "12-Step (CA-inspired)" in UI.
- Recovery Dharma content: always include attribution line — *"Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org"*
- WFS (Women for Sobriety) — excluded from initial launch pending licence verification. Contact info@womenforsobriety.org before adding.

---

## 5. Content Structure

Each daily reading is a structured document:

```typescript
interface DailyReading {
  id: string;                    // e.g. "aa-2026-06-01"
  modality: ReadingModality;     // enum — see below
  date: string;                  // ISO date "YYYY-MM-DD"
  theme: string;                 // e.g. "Surrender", "Gratitude", "Service"
  title: string;                 // e.g. "One Day at a Time"
  body: string;                  // 200–300 words, plain text
  reflection: string;            // One open question for journaling
  affirmation: string;           // One short closing affirmation (1 sentence)
  attribution?: string;          // Required for Recovery Dharma readings
  goDeeper?: {                   // Optional — link to source tradition
    label: string;
    url: string;
  };
  generatedAt: Timestamp;        // When Gemini generated this
  bufferBatch: number;           // Which 90-day batch this belongs to
}

type ReadingModality =
  | 'twelve-step-aa'
  | 'twelve-step-na'
  | 'twelve-step-ca'
  | 'recovery-dharma'
  | 'smart-recovery'
  | 'secular-stoic'
  | 'mindfulness-buddhist';
```

### Content Quality Standards
- **Length:** 200–300 words for body. Short enough for David in crisis, substantial enough for Walt.
- **Tone:** Warm, non-preachy, non-clinical. First-person plural ("we", "us") where appropriate to tradition.
- **No triggers:** Never describe using in vivid detail. Focus on recovery, not the substance.
- **No shame:** Consistent with MRT's No-Guilt Engine. Recovery-affirming language only.
- **Reflection question:** Open-ended. Designed to be journaled. Links naturally to MRT journal feature.
- **Persona check:** Every reading must work for David at Day 3 — if it would increase anxiety or shame, revise the prompt.

---

## 6. Architecture

### Firestore Schema

```
daily_readings/
  {modality}/
    {YYYY-MM-DD}/
      reading: DailyReading    ← NOT encrypted (shared, non-personal content)

user_reading_preferences/
  {uid}/
    selectedModalities: ReadingModality[]
    lastReadDate: string        ← ISO date
    readingHistory: string[]    ← array of reading IDs read

buffer_status/
  {modality}/
    lastGeneratedDate: string   ← furthest date in buffer
    totalBuffered: number
    lastBatchGeneratedAt: Timestamp
    nextBatchDue: string        ← alert threshold
```

**Encryption:** None — readings are shared non-personal content, same as `tasks` and `insights`. No ZK boundary applies here.

### Cloud Functions — The Reading Beacon

Extends the existing Beacon Cloud Function (`functions/`) with two new scheduled jobs:

**Job 1: `checkBufferHealth`** — runs daily at 00:01 UTC
- Queries `buffer_status` for each modality
- If `totalBuffered` < 30 days for any modality → triggers `generateReadingBatch`
- Sends alert to admin if buffer falls below 14 days (critical threshold)

**Job 2: `generateReadingBatch`** — triggered by `checkBufferHealth` or manually
- Generates 90 days of readings per modality in a single Gemini call batch
- Writes to `daily_readings/{modality}/{date}` documents
- Updates `buffer_status` document
- Uses Gemini 2.5 Flash (cost-optimised — readings are not AI analysis, they're content generation)
- Rate: 7 modalities × 90 days = 630 readings per batch
- Estimated cost: ~$0.80 per full batch at Flash pricing (well within budget)

### Gemini Prompt Architecture

Each modality has a base system prompt in `functions/src/prompts/readings/`:

```
functions/src/prompts/readings/
  twelve-step-aa.ts
  twelve-step-na.ts
  twelve-step-ca.ts
  recovery-dharma.ts
  smart-recovery.ts
  secular-stoic.ts
  mindfulness-buddhist.ts
```

Each prompt file exports:
```typescript
export interface ReadingPrompt {
  systemPrompt: string;    // Modality identity, tone, rules
  themeBank: string[];     // 90+ themes to rotate through
  buildUserPrompt: (theme: string, date: string) => string;
}
```

The `twelve-step-ca.ts` system prompt example:
```
You are writing a daily recovery reading for someone in a CA (Cocaine Anonymous) inspired 
12-Step programme. The reading should be grounded in the 12-Step principles of powerlessness, 
Higher Power, inventory, making amends, and service — applied specifically to stimulant and 
cocaine addiction recovery.

RULES:
- Do NOT reproduce any text from Cocaine Anonymous World Services publications
- Do NOT use the trademarked name "Cocaine Anonymous" or "CA" in the reading body
- Write in warm, first-person plural ("we", "us", "our")
- 200-300 words for body
- End with one open reflection question and one short affirmation
- Tone: hopeful, non-preachy, grounded in lived recovery experience
- Never describe using in vivid detail
- No shame, no guilt language — recovery-affirming only

Today's theme: {theme}
Today's date: {date}
```

### React Components

```
src/components/readings/
  DailyReadingCard.tsx      ← Main card shown on Dashboard
  ReadingModal.tsx          ← Full reading in bottom sheet / modal
  ReadingShareButton.tsx    ← Text-only share (no PII)
  ModalitySelector.tsx      ← Multi-select in Settings/Profile

src/hooks/
  useDailyReading.ts        ← TanStack Query hook, today's reading by modality
  useReadingPreferences.ts  ← User's selected modalities, read history
```

### TanStack Query Hook

```typescript
// src/hooks/useDailyReading.ts
export function useDailyReading(modality: ReadingModality) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['daily-reading', modality, today],
    queryFn: () => fetchDailyReading(modality, today),
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours — reading doesn't change during the day
    gcTime: 48 * 60 * 60 * 1000,      // Keep in cache for 48h for offline
  });
}
```

**Offline behaviour:** Readings cached for 48 hours. If user opens app offline and cache is warm, they see yesterday's reading with a "Showing last available reading" notice. If cache is cold and offline, show a static fallback message (not an error state — no guilt).

---

## 7. Dashboard Integration

Reading card sits below the SobrietyHero, above the Bento Grid. It is:
- Collapsed by default (title + theme tag + "Read today's reflection →")
- Tap to expand inline or open ReadingModal
- Dismissible per day (stores `lastReadDate` in `user_reading_preferences`)
- Visually: Dashboard module colours (Sky Blue → Blue gradient, Hope & Clarity vibe)
- Never shown in the SOS modal flow — David in crisis needs grounding tools, not reading content

---

## 8. Settings / Profile

New section: **Daily Reading** in Profile/Settings tab
- Multi-select: which modalities to include (default: all 7 if no prior selection)
- Single modality: shows that modality's reading every day
- Multiple modalities: rotates day by day (Mon = AA, Tue = RD, Wed = SMART, etc.) — order user-defined
- Toggle: "Show reading on Dashboard" (default: on)

---

## 9. Zero-Knowledge Assessment

**ZK boundary: does NOT apply.**

Daily readings are:
- Shared, non-personal content (same for all users)
- Not user-generated
- Not sensitive
- Stored in their own Firestore collections separate from journals, workbooks, service notes

No encryption. No `encryptData()` call. No VaultGate dependency. The reading feature works whether the user's vault is locked or not — this is intentional. David in crisis should see today's reading even if he hasn't entered his PIN yet.

---

## 10. Test Contract

**Unit tests (`src/__tests__/readings/`):**
- `useDailyReading` returns correct reading for today's date
- `useDailyReading` falls back to cached reading when offline
- `useReadingPreferences` correctly rotates modalities by day of week
- Reading card renders without error when `goDeeper` is undefined (optional field)
- Share button generates text-only output with no UID or personal data

**Integration tests:**
- Firestore write/read round-trip: generated reading writes correctly and is readable by the hook
- `buffer_status` document updates correctly after batch generation
- `checkBufferHealth` function triggers `generateReadingBatch` when buffer < 30 days

**Cloud Function tests (`functions/src/__tests__/`):**
- Gemini prompt for each modality returns a reading that passes content validation (length, fields present, no copyright trigger words)
- Batch generation writes exactly 90 documents per modality
- `buffer_status` reflects correct `lastGeneratedDate` after batch

**Content validation (automated check in generation pipeline):**
```typescript
const COPYRIGHT_TRIGGERS = [
  'Daily Reflections', 'Just for Today', 'Hope Faith and Courage',
  'Cocaine Anonymous World Services', 'NA World Services',
  'AA World Services', 'AAWS'
];
// Any generated reading containing these strings is rejected and re-generated
```

**Manual / persona tests:**
- David test: can a user in acute crisis access today's reading in ≤ 2 taps from the Dashboard?
- Offline test: reading is visible after airplane mode + app restart (TanStack cache warm)
- Share test: shared text contains no UID, no username, no journal content
- Vault-locked test: reading is visible before PIN entry (no VaultGate dependency confirmed)

---

## 11. Rollback Assessment

**Can this be reverted with `git revert`?** YES — partially.

- Frontend components: full git revert possible
- Cloud Function jobs: git revert removes the jobs, buffer stops refreshing
- Firestore data: `daily_readings/` and `buffer_status/` collections persist after code revert but cause no harm — orphan data, not user data. Can be manually deleted if needed.
- `user_reading_preferences/{uid}` documents: persist after revert. No harm — just unused preference data.

**No feature flag needed** — the Dashboard card is a new addition, not a change to existing components. Reverting the component removes it cleanly.

---

## 12. Out of Scope (Initial Launch)

- Women for Sobriety — pending licence verification
- Audio readings
- User-uploaded or community-written readings
- Offline pre-download of full buffer (48h cache is sufficient for v1)
- Push notification: "Your daily reading is ready" — backlog, not v1
- Reading streaks / gamification — backlog, add after engagement data confirms value
- Search or browse historical readings — backlog

---

## 13. Definition of Done

- [ ] All 7 modalities generating clean content with zero copyright trigger words
- [ ] 90-day buffer pre-generated per modality before launch
- [ ] `checkBufferHealth` cron running and verified in staging
- [ ] Reading card visible on Dashboard, collapsed by default
- [ ] ModalitySelector working in Settings
- [ ] Offline fallback tested on real device (not emulator)
- [ ] Vault-locked state confirmed: reading visible before PIN entry
- [ ] Share button tested: zero personal data in output
- [ ] `npm run check` passes with zero errors
- [ ] `npm run build` clean
- [ ] All test contract items passing
- [ ] Recovery Dharma attribution present on all RD readings
- [ ] No trademarked fellowship names in any UI label or generated content