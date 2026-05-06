# 🧭 Project PROJ-49: The Recovery Capital (ROSC) Matrix

**Status:** ✅ Shipped
**Primary Personas:** Walt (The Zen Master) · Lisa (The Service Superstar)
**Secondary Personas:** Maya (The Systematiser) · Ned (transition from Day 90 onward)
**Objective:** Build a clinically grounded, privacy-preserving monthly Recovery Capital assessment that scores the four SAMHSA-defined domains of recovery (Health, Home, Purpose, Community) using a hybrid approach — a short self-reported check-in augmented by AI analysis of the user's encrypted journal history — rendered as an animated radar chart that accumulates longitudinal snapshots over time.

---

## 1. Research Foundation — Recovery Capital & ROSC

*This feature is grounded in a specific body of clinical research. Read this section before writing any code.*

### 1.1 The Source Frameworks

**Recovery Capital (RC)** was defined by sociologists Robert Granfield and William Cloud (1999) as *"the breadth and depth of internal and external resources that can be drawn upon to initiate and sustain recovery."* Their groundbreaking interviews with individuals who achieved sobriety without formal treatment revealed that recovery hinges on internal and external resources, not just abstinence.

**Recovery-Oriented Systems of Care (ROSC)** is SAMHSA's systems-level framework for coordinating recovery support across the continuum. ROSC is grounded in SAMHSA's four dimensions of recovery — health, home, purpose, and community — which map directly to the recovery capital framework.

**The four domains — as defined by SAMHSA — are the canonical framework for this feature:**


- **Health:** Abstaining from illicit drugs and misuse of alcohol, and making informed, healthy choices that support physical and emotional well-being.
- **Home:** A stable and safe place to live.
- **Purpose:** Meaningful daily activities such as a job, school, volunteerism, family caretaking, or creative endeavors, as well as independence, income, and resources to participate in society.
- **Community:** Relationships and social networks that provide support, friendship, love, and hope.


### 1.2 The Clinical Measurement Tools

**BARC-10 (Brief Assessment of Recovery Capital):** A rigorously developed 10-item questionnaire delivering a strength-based assessment of resources used to initiate and sustain recovery. Each item is rated on a 6-point Likert scale from 1 ("Strongly Disagree") to 6 ("Strongly Agree"). Total scores range from 10-60, with higher scores indicating greater recovery capital. A cutoff score of 47 or above has been associated with a greater likelihood of maintaining remission for one year or more.

Reliability is high — internal consistency Cronbach's alpha = 0.85.

**What this means for MRT:** MRT will NOT administer the full BARC-10 as a clinical instrument (that would imply clinical capability and create FDA SaMD risk). Instead, the four domain structure and the strength-based framing of BARC-10 directly inform the design of the self-reported check-in questions and the AI scoring criteria. The resulting scores are explicitly framed as personal reflection scores, not clinical assessments.

### 1.3 Scoring Philosophy

Central to RC theory is the notion that more recovery capital and fewer recovery barriers lead to better recovery outcomes. This means:

- **Scores accumulate, not reset.** A single bad month does not erase prior growth — consistent with MRT's No-Guilt Engine.
- **All four domains matter together.** These pillars function together, so it is vital that individuals strive to have all four in their lives. The radar chart visualises this interdependence — a high Health score paired with a low Community score is a signal, not a success.
- **Setbacks are growth data.** Recovery is characterised by continual growth and improvement in one's health and wellness and managing setbacks. Because setbacks are a natural part of life, resilience becomes a key component of recovery.

### 1.4 What Each Domain Measures in MRT's Context

| Domain | SAMHSA Definition | MRT Signals Available |
|---|---|---|
| **Health** | Physical and emotional well-being, abstinence | Vitality logs (sleep/movement/nutrition/hydration/mindfulness), mood scores, sobriety streak, urge resistance events |
| **Home** | Stable, safe place to live | Self-reported (journal mentions of housing stability, financial stress/stability, routines) — no direct data signal in current schema |
| **Purpose** | Meaningful daily activities, employment, creative endeavours | Task completion rates, workbook completion %, daily pledge streak, journal themes around work/creativity/service |
| **Community** | Relationships and social networks providing support, friendship, hope | Meeting mentions in journal, sponsor contact logs, Service Module data (PROJ-05), journal community/connection themes |

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** High. The ROSC assessment reads the user's private, encrypted journal entries to inform the AI-generated domain scores. Journal content is the most sensitive data in the MRT system.
- [x] **Encryption Strategy:** The existing pattern from `useDeepPatternAnalysis` is the correct model. Journal entries are decrypted client-side in chunks using `src/lib/crypto.ts`, passed to Gemini in plaintext over HTTPS (never stored server-side in plaintext), and the AI's scoring rationale (`encryptedAIContext`) is re-encrypted client-side before being written to Firestore. The numeric scores themselves (`ROSCScore`) are stored **unencrypted** in the assessment document — they are metadata, not emotional content, and need to be readable for the radar chart without vault unlock.
- [x] **Key Rotation:** `encryptedAIContext` must be included in `executePinRotation`. When the user shreds their crypto keys, the detailed AI reasoning — which contains references to journal content — must be re-encrypted under the new key, or deleted. The `ROSCScore` numeric fields survive a key rotation (they are unencrypted metadata). Recommend: include `encryptedAIContext` in the PIN rotation sweep alongside `workbook_answers`.
- [x] **AI Sanitisation:** The Gemini prompt must never include raw emotional content beyond what is necessary to score the four domains. Specifically: journal content is summarised by domain relevance before injection. The prompt explicitly instructs Gemini to return domain scores and domain-specific evidence references only — not to reproduce journal content verbatim in its response.
- [x] **ZK Boundary:** The numeric `ROSCScore` (Health, Home, Purpose, Community, each 1-10) is stored **unencrypted** alongside the document ID and `createdAt`. The `encryptedAIContext` containing the AI's reasoning and journal references is encrypted. This boundary mirrors the existing `journals` collection pattern: `moodScore` and `tags` are plaintext, `content` is encrypted.
- [x] **Self-Reported Check-In:** The five self-reported questions (one per domain + one for resilience) are answered in the UI and their values injected directly into the Gemini prompt. They are NOT stored separately in Firestore — they feed the AI, and the AI's output (encrypted) is what persists. This avoids creating a second sensitive data store.
- [x] **Collection Path:** `users/{uid}/rosc_assessments/{assessmentId}` — stored as a subcollection under the user document, consistent with `workbook_answers`. Owner-gated by security rules. NOT under `vault/` — the scores are unencrypted metadata and do not belong in the vault subcollection.

---

## 3. Schema & Architecture 🗄️

### Firestore Collection

**`users/{uid}/rosc_assessments/{assessmentId}`**

```typescript
// src/lib/types/rosc.ts — NEW FILE

export interface ROSCDomainScore {
  score: number;            // 1–10, integer. AI-derived or blended with self-report.
  selfReportedScore: number; // 1–5, integer. User's own check-in answer for this domain.
  evidenceCount: number;    // Number of journal entries the AI cited as evidence.
}

export interface ROSCScore {
  health: ROSCDomainScore;
  home: ROSCDomainScore;
  purpose: ROSCDomainScore;
  community: ROSCDomainScore;
}

export interface ROSCAssessment {
  id?: string;
  uid: string;
  createdAt: Timestamp;
  periodStart: Timestamp;   // Start of the 30-day window assessed
  periodEnd: Timestamp;     // End of the 30-day window assessed
  scores: ROSCScore;        // UNENCRYPTED — readable without vault unlock
  totalScore: number;       // Sum of all four domain scores (4–40 scale)
  trajectory: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';
  journalEntriesAnalysed: number;  // How many entries fed the AI (transparency for Maya)
  encryptedAIContext: string;       // AES-GCM blob — AI reasoning + journal refs per domain
}
```

### Firestore Security Rules (add to firestore.rules)

```javascript
match /users/{uid}/rosc_assessments/{assessmentId} {
  allow read, write: if request.auth.uid == uid;
}
```

### New Files

```
src/lib/types/rosc.ts          ← Type definitions (above)
src/lib/rosc.ts                ← Firestore CRUD for assessments
src/hooks/useROSCAssessments.ts ← TanStack Query hook
src/lib/gemini.ts              ← Add generateROSCAnalysis() function
src/components/insights/
  ROSCRadarChart.tsx           ← Recharts radar chart
  ROSCCheckIn.tsx              ← 5-question self-report flow
  ROSCAssessmentCard.tsx       ← Single past assessment summary card
  ROSCHistoryPanel.tsx         ← Scrollable past assessments list
```

### AI Return Interface

```typescript
// Return type from generateROSCAnalysis() in gemini.ts
export interface ROSCAnalysisResult {
  scores: {
    health: { score: number; evidence: string[] };
    home: { score: number; evidence: string[] };
    purpose: { score: number; evidence: string[] };
    community: { score: number; evidence: string[] };
  };
  trajectory: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';
  narrative: string;           // 2-3 sentence overall summary — encrypted in storage
  strengths: string[];         // Top 2 domains with justification — encrypted
  growth_areas: string[];      // Domains scoring below 5 with compassionate suggestions — encrypted
}
```

---

## 4. Implementation Phases 🏗️

---

### Phase 1: The Self-Reported Check-In Flow

**Files:** `src/components/insights/ROSCCheckIn.tsx`

**Purpose:** Before the AI runs, the user completes a short, clinically-informed self-report. This serves two functions: (1) it provides data on domains the AI cannot evaluate from journals alone (particularly Home), and (2) it creates an intentional moment of reflection — itself a recovery practice.

**The Five Check-In Questions:**

These are based on the domain definitions from SAMHSA and informed by the BARC-10's strength-based framing. They use a 1-5 scale (not 1-6 like BARC-10, to match MRT's simpler UI conventions):

| Domain | Question | Scale Label Low | Scale Label High |
|---|---|---|---|
| Health | "This month, how well did you take care of your physical and emotional health?" | "Struggling" | "Thriving" |
| Home | "How stable and safe does your living situation feel right now?" | "Uncertain" | "Very stable" |
| Purpose | "How meaningful and engaging are your daily activities — work, creative pursuits, service, family?" | "Adrift" | "Fully engaged" |
| Community | "How connected do you feel to people who support and encourage your recovery?" | "Isolated" | "Deeply connected" |
| Resilience | "When this month got hard, how well did you bounce back?" | "It knocked me down" | "I found my footing" |

The Resilience question is a fifth signal used only in the AI prompt (not stored as a separate domain score) — it provides context for the trajectory calculation and the `encryptedAIContext` narrative.

**UI/UX:**
- Rendered as a full-screen guided flow — one question per screen, swipe or tap to advance
- Each question shows a 5-dot selector with haptic feedback on selection
- No back button mid-flow — this is an intentional, present-moment practice, not a form to edit
- Progress dots at the top (Question 1 of 5)
- Warm, amber-to-rose gradient background (Lisa's palette — the module is primarily hers)
- Takes approximately 60-90 seconds to complete
- "Start this month's check-in" CTA is shown once per calendar month — not on demand

**Somatic Check:** The questions must not induce shame. Language is entirely strength-based ("how well did you take care of" not "did you take care of"). The lowest options use neutral language ("Struggling", "Uncertain") not failure language ("Failed", "Neglected"). Consistent with the No-Guilt Engine.

**Edge Case:** User closes the app mid-check-in → check-in is not saved. No partial state persists. Next session, they see the CTA again. `localStorage` tracks `roseCheckInStarted_{month}` so the app knows not to show the CTA again if they have already started but not finished this month (shows "Continue your check-in" instead).

---

### Phase 2: The Gemini AI Extraction

**Files:** `src/lib/gemini.ts` — add `generateROSCAnalysis()`

**Purpose:** After the check-in, the client-side AI call runs with two inputs: the user's five self-report answers and a structured summary of the last 30 days of decrypted journal entries.

**Journal Decryption Pattern:**

Follow the existing pattern in `useDeepPatternAnalysis`. Fetch the last 30 journal entries (not 90 — we are assessing a specific month, not long-term patterns), decrypt client-side in chunks of 5 to prevent UI freezing, and format as a structured string per entry:

```typescript
// Journal entry format for the ROSC prompt:
`[${format(entry.createdAt, 'MMM dd')}] Mood: ${entry.moodScore}/10 | Tags: ${entry.tags.join(', ')} | Entry: ${decryptedContent}`
```

**The Gemini Prompt — Model: `gemini-3.1-pro-preview`**

The ROSC analysis requires high-context reasoning (reading 30 journal entries and cross-referencing against domain criteria). Use `gemini-3.1-pro-preview` via `generateWithCascade()` with the pro model as the primary.

```
You are an expert in Recovery Capital assessment, grounded in SAMHSA's four recovery dimensions.
Your role is to act as a wise and empathetic Recovery Coach — not a clinician — helping a user 
understand their holistic life in recovery this month.

IMPORTANT CONSTRAINTS:
- Do NOT reproduce any journal entry verbatim in your response
- Do NOT make clinical diagnoses or treatment recommendations
- Frame ALL findings with compassion — avoid language that implies failure
- Scores reflect evidence quality, not moral judgment
- If you see very few entries (fewer than 5), return trajectory: "Insufficient Data"

SELF-REPORTED CHECK-IN (user's own assessment, scale 1-5):
- Health: {healthSelfReport}/5
- Home: {homeSelfReport}/5
- Purpose: {purposeSelfReport}/5
- Community: {communitySelfReport}/5
- Resilience this month: {resilienceSelfReport}/5

JOURNAL HISTORY (last 30 days, {entryCount} entries):
{journalSummary}

SCORING INSTRUCTIONS:
Score each domain 1-10 by blending:
- The user's own self-report (weight: 40%)
- Evidence from journal entries (weight: 60%)

Domain criteria:
- HEALTH (1-10): Physical activity mentions, sleep quality, mood trend, substance-free references, 
  self-care practices, emotional regulation. Vitality logs as positive signals.
- HOME (1-10): Stability signals (routine, safe environment references), stress around housing 
  or finances as negative signals. Weight self-report heavily here — journal may not cover this.
- PURPOSE (1-10): Work/career mentions, creative pursuits, service work references, 
  goal completion, meaningful activity descriptions, school/volunteering.
- COMMUNITY (1-10): Meeting attendance references, sponsor contact, social connections, 
  helping others, feelings of belonging vs. isolation.

Return ONLY this JSON structure, no markdown:
{
  "scores": {
    "health": { "score": number (1-10), "evidence": ["brief reference 1", "brief reference 2"] },
    "home": { "score": number (1-10), "evidence": ["brief reference 1"] },
    "purpose": { "score": number (1-10), "evidence": ["brief reference 1", "brief reference 2"] },
    "community": { "score": number (1-10), "evidence": ["brief reference 1", "brief reference 2"] }
  },
  "trajectory": "Improving" | "Stable" | "Declining" | "Insufficient Data",
  "narrative": "2-3 sentence compassionate overview of this month's recovery capital",
  "strengths": ["Domain name: brief strength observation"],
  "growth_areas": ["Domain name: compassionate growth suggestion"]
}
```

**Post-processing:**
1. Parse JSON from AI response
2. Map `scores` + `journalEntriesAnalysed` to the `ROSCAssessment` schema
3. Encrypt the `narrative`, `strengths`, `growth_areas`, and `evidence` arrays into `encryptedAIContext` using `encryptData()` from `src/lib/crypto.ts`
4. The numeric scores in `scores.*score` remain plaintext — never encrypted
5. Write the complete `ROSCAssessment` document to Firestore

**Logic & State — `useROSCAssessments` hook:**
- `useQuery` for past assessments from `users/{uid}/rosc_assessments`, ordered by `createdAt` descending
- `staleTime`: 24 hours (assessments are monthly — they don't change)
- `gcTime`: 7 days (keep past assessments in cache for the history view)
- `useMutation` for creating a new assessment — optimistic update adds the pending assessment to the list with a loading state on the radar chart

**AI Usage Logging:** Log to `ai_logs` via `logAIUsage()` with context tag `'rosc_assessment'`. This enables the Admin Command Centre to monitor ROSC AI usage and cost.

**Rate Limiting:** ROSC assessment is a Premium feature. Add `lastROSCAssessment: Timestamp` to `usage_limits` in `UserProfile`. Enforce: one assessment per calendar month maximum. The check-in CTA is hidden if a completed assessment exists for the current month.

---

### Phase 3: The Radar Chart UI

**Files:** `src/components/insights/ROSCRadarChart.tsx`

**Component:** Uses `Recharts` (`RadarChart`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `Radar`, `ResponsiveContainer`). Recharts is already in the production dependency stack.

**Single Assessment View:**

```tsx
// Data shape for Recharts RadarChart
const chartData = [
  { domain: 'Health', score: assessment.scores.health.score, fullMark: 10 },
  { domain: 'Home', score: assessment.scores.home.score, fullMark: 10 },
  { domain: 'Purpose', score: assessment.scores.purpose.score, fullMark: 10 },
  { domain: 'Community', score: assessment.scores.community.score, fullMark: 10 },
];
```

**Design System — Insights Module:**
- Background: Fuchsia → Rose gradient (Insights module palette, per the MRT design system)
- Radar fill: `rgba(139, 92, 246, 0.25)` (purple, semi-transparent) with stroke `#8B5CF6`
- Polar grid: subtle white at 15% opacity
- Axis labels: white, 13px, each domain name shown clearly
- The chart renders the radar polygon with a CSS animation on mount — the polygon "draws in" from the centre over 600ms

**Longitudinal Overlay (Walt's feature):**
When two or more assessments exist, the chart renders both the current month and the previous month's scores as two overlapping radar polygons:
- Current: Fuchsia fill, solid stroke
- Previous: White fill at 10% opacity, dashed stroke
- A subtle legend below: "This month · Last month"

Walt's use case is exactly this — tracking the shape of his recovery capital changing over time, not just the absolute scores.

**Score Summary Row:**
Below the chart, four pill badges show each domain score:
```
Health: 7.8  |  Home: 8.1  |  Purpose: 6.4  |  Community: 9.2
```
Pill colour: green (≥7), amber (4-6), muted (1-3). Never red.

**Total Score Banner:**
`Total Recovery Capital: 31/40` — displayed large at the top of the assessment card. This is the sum of the four domain scores. A secondary label: `"Up from 28 last month"` or `"Similar to last month"` based on trajectory. Never displays a downward number in negative language — trajectory `Declining` shows `"Room to grow this month"` not `"Down from last month"`.

**Somatic Check:** The radar chart is not a report card. A low score in one domain is a signal for gentle attention, not a grade. The visual design reinforces this — the fuchsia fill looks the same whether scores are high or low. The compassionate language in the total score banner is non-negotiable.

**Reward:** The act of completing the check-in unlocks the chart (before that, a soft blurred placeholder is shown). This is an intentional design choice — the reward is the insight itself, earned through the reflection practice. Award 25 XP for completing a monthly check-in (treated as a High priority task completion equivalent).

---

### Phase 4: The Insights Panel Integration

**Files:** `src/components/insights/ROSCHistoryPanel.tsx` · Insights page

**Placement:** The ROSC Matrix appears as a new section in the Insights page, below the existing AI analysis tools. Access point:
- For Walt: prominently featured (aligns with his long-horizon data interest)
- For Lisa: accessible via a "Monthly Check-In" CTA in the Vitality section

**History Panel:**
- Scrollable horizontal list of past `ROSCAssessmentCard` components (one per month assessed)
- Each card shows: month name, total score, and a miniature sparkline of the four domain scores
- Tapping a card expands it to show the full radar chart and decrypted `encryptedAIContext` narrative

**Decryption on tap:** The `encryptedAIContext` is decrypted client-side only when the user taps to expand a past assessment. Not decrypted on list render — only on explicit user action. Requires vault to be unlocked (`isVaultUnlocked` check before decryption attempt).

**Vault locked state:** If vault is locked, the radar chart and score badges render normally (scores are unencrypted). The `encryptedAIContext` narrative and evidence panels show a blurred placeholder with "Unlock vault to read your recovery story." Consistent with the existing `VaultGate` pattern used throughout the app.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Past assessments render from TanStack cache (24h staleTime, 7d gcTime). The "Start check-in" CTA is disabled with "Connect to complete your check-in" message — the AI call and Firestore write require connectivity.
- [ ] `isVaultUnlocked` is false → Radar chart and scores visible. `encryptedAIContext` content hidden (blurred placeholder). Check-in CTA is hidden — the AI call requires decrypting journal entries, which requires the vault key.
- [ ] 320px screen (iPhone SE) → `ResponsiveContainer` with `width="100%"` handles the Recharts SVG scaling. `PolarAngleAxis` domain labels may truncate at 320px — use `tick={{ fontSize: 11 }}` and test explicitly. Score pill row wraps to 2×2 grid.
- [ ] 0 journal entries in the last 30 days → AI returns `trajectory: "Insufficient Data"`. Chart still renders using the self-report scores only (60% AI weight falls back to 100% self-report). A notice appears below the chart: "Your scores are based on your check-in only — add journal entries this month for a fuller picture."
- [ ] First assessment ever (no previous month to compare) → Longitudinal overlay not shown. No "Up from X last month" banner. Shows "Your first Recovery Capital snapshot" label instead.
- [ ] AI call fails → Mutation rolls back optimistically. User sees: "We couldn't complete your assessment right now. Your check-in answers are saved — try again." The five check-in answers are stored in `sessionStorage` temporarily so the user doesn't have to repeat the check-in.

---

## 5. QA & Verification 🧪

### Unit Tests (`src/lib/__tests__/rosc.test.ts` — new file)

- [ ] `createROSCAssessment()` writes a document with correct `uid`, `createdAt`, `periodStart`, `periodEnd`, `scores.*score` as unencrypted numbers, and `encryptedAIContext` as a non-empty string
- [ ] Raw Firestore document (read from emulator without decryption) shows `scores.health.score` as a readable number AND `encryptedAIContext` as an AES-GCM ciphertext blob — assert `typeof scores.health.score === 'number'` AND `encryptedAIContext` does NOT contain the word "evidence" in plaintext
- [ ] `totalScore` is correctly computed as the sum of all four domain scores
- [ ] `trajectory` field is one of the four valid values
- [ ] An assessment created today correctly sets `periodStart` to 30 days ago and `periodEnd` to today

### ZK Boundary Test (Critical)

```typescript
// Read the raw Firestore document from the emulator (bypasses all decryption):
const rawDoc = await adminDb
  .collection('users').doc(testUid)
  .collection('rosc_assessments').doc(assessmentId)
  .get();
const data = rawDoc.data();

// Numeric scores must be readable:
expect(typeof data?.scores.health.score).toBe('number');
expect(typeof data?.scores.community.score).toBe('number');

// AI context must be encrypted:
expect(data?.encryptedAIContext).toMatch(/^[0-9a-f]+:[0-9a-f]+$/); // IV:Ciphertext pattern
expect(data?.encryptedAIContext).not.toContain('journal');
expect(data?.encryptedAIContext).not.toContain('evidence');
```

### AI Prompt Tests

- [ ] Gemini prompt with 0 journal entries returns `trajectory: "Insufficient Data"` — not an error
- [ ] Gemini prompt with high community-related journal content (mentions of meetings, sponsor, service work) returns `community.score >= 7`
- [ ] Gemini prompt with all self-report scores at 1 and empty journal returns all domain scores ≤ 3
- [ ] AI response never reproduces journal entry verbatim — assert response does not contain any 10+ word substring from the seeded journal content

### The Subway Test (Offline Resilience)

- [ ] Past assessments load from TanStack cache when offline
- [ ] Radar chart renders correctly from cached data
- [ ] "Start check-in" CTA shows "Connect to complete" when offline — no crash, no blank state

### The "Lost PIN" Test (Crypto-Shredding)

- [ ] Confirm `encryptedAIContext` is re-encrypted during `executePinRotation` sweep (add `rosc_assessments` to the rotation collection list)
- [ ] After PIN rotation, confirm the new `encryptedAIContext` decrypts correctly with the new key
- [ ] The numeric `scores.*score` fields are unchanged after rotation (they are plaintext and not rotated)

### Persona-Specific QA

- [ ] **Walt Long-Horizon Test:** Create 3 assessments on different months. Confirm the radar chart renders two overlapping polygons (current + previous) on the third assessment's view. Confirm the sparkline in the history panel shows the trend across all three.
- [ ] **Lisa Burnout Test:** Seed journal entries with heavy service work mentions but minimal self-care. Confirm `health.score` and `home.score` are lower than `community.score` and `purpose.score`. Confirm the `growth_areas` array references health or home (compassionately).
- [ ] **Maya Transparency Test:** Confirm `journalEntriesAnalysed` count is visible in the expanded assessment view. Confirm the `evidence` references (from `encryptedAIContext`, decrypted on tap) cite the correct number of journal entries.
- [ ] **Vault Locked Test:** With vault locked, confirm radar chart renders with numeric scores. Confirm `encryptedAIContext` sections show blurred placeholder. Confirm "Start check-in" CTA is hidden (journal decryption unavailable).
- [ ] **Rate Limit Test:** Complete one assessment. Confirm "Start check-in" CTA disappears for the rest of the calendar month. Confirm it reappears on the 1st of the following month.
- [ ] **Insufficient Data Test:** Complete check-in with 0 journal entries in the last 30 days. Confirm chart renders using self-report scores only. Confirm the "based on your check-in only" notice appears.

### Regression Tests

- [ ] Existing Insights module tools (weekly analysis, monthly analysis, deep pattern) still render and function correctly
- [ ] `usage_limits` structure on `UserProfile` — adding `lastROSCAssessment` must not break the existing `lastWeeklyInsight`, `lastMonthlyInsight`, `lastDeepDive` checks in `useRateLimits`
- [ ] `executePinRotation` in `rotation.ts` — adding the `rosc_assessments` subcollection must not affect the existing rotation behaviour for `journals` and `workbook_answers`
- [ ] `npm run check` — zero TypeScript errors
- [ ] `npm run build` — clean build

---

## 6. Open Questions

*Resolve before Sprint begins.*

| # | Question | Options | Status |
|---|---|---|---|
| 1 | **Premium or free feature?** | (a) Premium only — consistent with other AI analysis tools · (b) Free tier gets scores, Premium gets AI narrative and evidence | ❓ Recommend option (b) — score-only access on free tier gives Walt and Maya a reason to upgrade, and scores alone (from self-report) are valuable without the AI. |
| 2 | **Check-in cadence enforcement** | (a) Once per calendar month — hard limit · (b) Once per 30 rolling days · (c) On-demand, no limit | ❓ Recommend option (a) — monthly cadence aligns with ROSC research methodology and prevents compulsive reassessment. |
| 3 | **Home domain data gap** | Home is the weakest AI-scored domain because MRT has no direct data signals for housing stability. Options: (a) Accept that Home will rely heavily on self-report · (b) Add a Home journal prompt to the daily anchor ("One word about your home environment today") | ❓ Recommend option (a) for v1. Option (b) is a meaningful enhancement but changes the Anchor feature scope. |
| 4 | **Recharts accessibility** | The radar chart SVG must be screen-reader accessible for Walt's tablet use case. Options: (a) Add `aria-label` to the chart container with a text summary · (b) Add a data table view alongside the chart | ❓ Recommend option (a) minimum, option (b) as stretch — Walt would appreciate the table view given his data-dense preferences. |
| 5 | **`executePinRotation` collection list** | Confirm with the engineer who owns `rotation.ts` that adding `rosc_assessments` to the rotation sweep is straightforward before designing around it | ❓ Needs technical confirmation. |

---

## 7. Out of Scope

- BARC-10 administration as a formal clinical instrument — MRT is a wellness app, not a clinical tool
- Modality-specific scoring (AA, RD, SMART users would have different community signals) — v1 uses a unified model
- Sharing the ROSC assessment externally (with a sponsor, clinician, or employer) — no export for v1
- Real-time community data integration (e.g., meeting attendance APIs) — signals come from journal mentions only
- A fifth pillar (Resilience as a standalone scored domain) — Resilience informs the AI prompt but is not scored separately in v1
- Push notification to prompt the monthly check-in — backlog (would require UX design for the right moment)

---

## 8. Definition of Done

- [ ] `src/lib/types/rosc.ts` defines `ROSCDomainScore`, `ROSCScore`, `ROSCAssessment`
- [ ] `users/{uid}/rosc_assessments` Firestore security rule added and deployed
- [ ] `lastROSCAssessment` added to `usage_limits` in `UserProfile` without breaking existing rate limit checks
- [ ] `rosc_assessments` added to `executePinRotation` sweep in `rotation.ts`
- [ ] `generateROSCAnalysis()` in `gemini.ts` — model `gemini-3.1-pro-preview`, AI usage logged, sanitisation constraints enforced
- [ ] ZK boundary confirmed: `scores.*score` readable in raw Firestore doc; `encryptedAIContext` is ciphertext
- [ ] `ROSCCheckIn.tsx` — 5 questions, strength-based language, no shame framing, 60-90 second flow
- [ ] `ROSCRadarChart.tsx` — Recharts radar, animated on mount, dual-overlay for longitudinal comparison
- [ ] Past assessments panel with expandable cards and on-tap decryption of `encryptedAIContext`
- [ ] Vault-locked state: scores visible, AI narrative blurred, check-in CTA hidden
- [ ] Offline state: cached assessments render, check-in CTA disabled with message
- [ ] Rate limit: one assessment per calendar month, CTA hidden after completion
- [ ] 0 journal entries handled gracefully: chart renders from self-report, notice displayed
- [ ] 25 XP awarded on check-in completion
- [ ] Walt longitudinal overlay renders when ≥2 assessments exist
- [ ] All persona-specific QA tests passing
- [ ] `npm run check` — zero TypeScript errors
- [ ] `npm run build` — clean build

---

*MRT · PROJ-49 Recovery Capital (ROSC) Matrix · v1.0 · May 2026 · Status: ⚪ Planned*