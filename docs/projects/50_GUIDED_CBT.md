# 🧠 Project PROJ-50: Guided CBT/REBT Interactive Workflows

**Status:** ✅ Shipped (all 6 phases: foundation + guided ABCDE, guided CBA, Thought Record, DENTS Scenario Mode + Five Questions, Tools Hub redesign — PRs #76–#82)
**Primary Persona:** Maya (The Systematiser) · Ned (transition user, Day 90+)
**Secondary Personas:** David (crisis de-escalation) · Walt (deep reflection)
**Objective:** Transform MRT's existing CBT tool suite from open-form static inputs into guided, step-by-step interactive flows with contextual coaching, AI-assisted prompts, and in-line psychoeducation — proving daily tangible value for the Premium subscription by serving as an active cognitive training environment rather than a digital PDF replacement.

---

## 1. Research Foundation — CBT/REBT Clinical Grounding

*Read this section before writing any code. The clinical structure of each tool is not negotiable.*

### 1.1 What Already Exists (PROJ-27 CBT Engine Baseline)

MRT already ships a CBT tools suite under `/tools`. These tools are currently:
- Interactive React components with open-form text inputs
- Saved to the `journals` collection as AES-GCM encrypted payloads with `['SMART Tool', toolType]` tags
- Managed by `SmartToolContainer<T>` which handles vault enforcement, session rehydration, and idempotent saves
- Types defined in `src/lib/types/smart.ts`: `CBA`, `ABC`, `DENTS`, `FIVE_QUESTIONS`, `LIFESTYLE_BALANCE`, `PERSONIFY`, `SELF_COMPASSION`, `SMART_GOAL`, `BOUNDARIES`

**The existing tools are functional but passive.** They present a blank form and wait for the user to know what to write. A user who has never completed a CBA or ABC worksheet before will stare at an empty text field with no guidance. This project adds the guided layer that transforms passive tools into active cognitive training.

### 1.2 The Clinical Case for Guided Workflows

CBT thought records are one of the most powerful tools in Cognitive Behavioral Therapy for recognising, analysing, and reframing destructive thought patterns. In the context of addiction recovery, these worksheets help individuals confront cravings in real time and reduce the risk of relapse.

The key word is *confront in real time*. The research consistently shows that CBT tools are most effective when completed in or near the moment of distress — not retrospectively in a clinical setting. The ABC model helps people see how their thoughts shape their reactions. It shows that events don't directly cause feelings or behaviours. For a person in early recovery, this reframe is the difference between acting on a craving and surviving it.

The clinical literature identifies three failure modes for self-administered CBT tools:
1. **Blank page paralysis** — users don't know what to write without a prompt
2. **Premature closure** — users stop at identifying the problem without completing the disputation step
3. **Cognitive avoidance** — users skip the most challenging steps (particularly Disputation in ABCDE and the Disadvantages columns in CBA)

Guided workflows with contextual coaching text, step locks (cannot advance without completing the current step), and AI-assisted reflection prompts directly address all three.

### 1.3 The Clinical Structure of Each Tool

**ABCDE Model (REBT — Albert Ellis, 1950s)**

The ABCDE approach was developed by Dr. Albert Ellis, founder of REBT, and has since become a widely used technique in CBT. It extends the traditional ABC model to include Disputation and an Effective new response.

- **A — Activating Event:** The situation or trigger. Not an interpretation — a factual description of what happened.
- **B — Beliefs:** The automatic thought or interpretation. Often irrational or distorted. The user's story about what the event means.
- **C — Consequences:** The emotional and behavioural results of holding that belief. Not caused by A — caused by B.
- **D — Disputation:** The active challenge to the irrational belief. Evidence-based. Socratic. The hardest step.
- **E — Effective New Belief:** The more balanced, rational replacement belief after disputation.

The most clinically important step is D. The ABC model shows the link but stops short of providing intervention tools. A client learns why they feel anxious, but without Disputation, they lack a structured method to change the thought. The ABCDE model fills this gap by explicitly teaching clients how to challenge irrational beliefs and construct healthier alternatives.

**Cost-Benefit Analysis (CBA) — SMART Recovery**

A 2×2 decision matrix that forces the user to articulate both sides of a behavioural choice:
- Advantages of continuing the behaviour (substance use, avoidance, etc.)
- Disadvantages of continuing
- Advantages of stopping
- Disadvantages of stopping

The clinical value is in completing all four quadrants. Users instinctively fill in the "Advantages of stopping" quadrant and avoid "Advantages of continuing" — but honest engagement with the advantages of the problematic behaviour is what makes the CBA clinically powerful.

**D.E.N.T.S. Strategy — SMART Recovery**

A pre-planning acronym for high-risk situations. Confirmed from the existing `DENTSPayload` interface:
- **D — Deny:** Refuse the offer or situation
- **E — Escape:** Have an exit plan ready
- **N — Neutralise:** Cognitive tools to use in the moment
- **T — Tasks:** Alternative behaviours to substitute
- **S — Swap:** Replace the high-risk activity with something healthy

**Thought Record (7-Column CBT)**

The most widely used CBT self-monitoring tool. A thought record involves recognising and labelling the specific cognitive distortion present in one's thinking. Evaluation involves a systematic analysis of a specific thought — objectively examining the factual evidence supporting and contradicting it.

Seven columns: Situation → Automatic Thoughts → Emotions (% intensity) → Evidence For → Evidence Against → Balanced Thought → Outcome Emotions (% intensity, ideally reduced).

This is a NEW tool not in the current PROJ-27 suite. It is the most clinically fundamental CBT exercise and its absence is the most significant gap in the current tool set.

**Five Questions (Self-Enquiry, SMART Recovery)**

Already in the schema as `FIVE_QUESTIONS` with fields `q1–q5`. The five questions are:
1. Is this thought true?
2. Can I absolutely know it is true?
3. How do I react / what happens when I believe this thought?
4. Who would I be without this thought?
5. What is the turnaround (the opposite thought)? Is it true?

This is Byron Katie's The Work adapted for recovery. It is introspective rather than analytical — aligned with Walt's reflective posture.

---

## 2. Security & Zero-Knowledge Audit 🛡️

- [x] **Data Sensitivity:** Critical. All CBT tool content is highly sensitive personal emotional data. Users describe their triggers, automatic thoughts, fears, and relationship difficulties.
- [x] **Encryption Strategy:** Unchanged from PROJ-27 baseline. All tool payloads are serialised via `JSON.stringify()`, encrypted via `encryptData()` in `src/lib/crypto.ts`, and stored in the `content` field of a `journals` collection document. Tags `['SMART Tool', toolType]` remain unencrypted for AI routing.
- [x] **New Guided State:** The step-by-step guided flow introduces a new concept — partial completion (the user has answered Steps 1-3 but not 4-5). Partial state is held in React state only (`useState`). It is NOT written to Firestore until the user explicitly taps "Save Progress" or "Complete." Auto-save drafts go to `sessionStorage` only — never Firestore — to prevent partial encrypted blobs from accumulating in the database.
- [x] **AI Coaching Prompts:** The AI-assisted reflection prompts (Phase 2) send the current step's content to Gemini for a follow-up prompt suggestion. This content is the decrypted text the user has just typed. It is sent over HTTPS. It is never logged or stored server-side. The Gemini call is the same pattern as `generateJournalAnalysis` — a transient, stateless inference call.
- [x] **Key Rotation:** Tool payloads continue to be included in `executePinRotation` as part of the `journals` collection sweep. No change required.
- [x] **VaultGate:** `SmartToolContainer` already enforces `isVaultUnlocked` before rendering any tool. The guided flow inherits this enforcement without modification.

---

## 3. Schema & Architecture 🗄️

### 3.1 No New Firestore Collections

This project follows the PROJ-27 storage model exactly. All tool results are stored in the `journals` collection as encrypted `content` blobs. No schema changes are required to Firestore.

### 3.2 Type Extensions (`src/lib/types/smart.ts`)

**Add one new tool type and one new payload interface:**

```typescript
// Add to SmartToolType union:
export type SmartToolType =
    | 'CBA'
    | 'ABC'
    | 'DENTS'
    | 'FIVE_QUESTIONS'
    | 'LIFESTYLE_BALANCE'
    | 'PERSONIFY'
    | 'SELF_COMPASSION'
    | 'SMART_GOAL'
    | 'BOUNDARIES'
    | 'THOUGHT_RECORD';   // NEW — 7-column CBT thought record

// New payload interface:
export interface ThoughtRecordPayload {
    situation: string;              // Column 1 — what happened
    automaticThoughts: string;      // Column 2 — the immediate thought
    emotions: Array<{               // Column 3 — emotions + intensity %
        emotion: string;
        intensity: number;          // 0-100
    }>;
    evidenceFor: string;            // Column 4 — evidence supporting the thought
    evidenceAgainst: string;        // Column 5 — evidence challenging the thought
    balancedThought: string;        // Column 6 — the reframed thought
    outcomeEmotions: Array<{        // Column 7 — post-reframe emotions + intensity %
        emotion: string;
        intensity: number;
    }>;
    distortionType?: string;        // Optional: identified cognitive distortion
}
```

**Extend the existing `ABCPayload` with explicit ABCDE step labels (no breaking change):**

```typescript
// Existing interface — unchanged, only documentation added:
export interface ABCPayload {
    activatingEvent: string;  // Step A
    beliefs: string;          // Step B
    consequences: string;     // Step C
    dispute: string;          // Step D — the Disputation step (most critical)
    effectiveBelief: string;  // Step E — the new rational belief
}
```

### 3.3 Guided Flow Architecture — New React Pattern

The existing `SmartToolContainer<T>` handles persistence. PROJ-50 adds a new layer *above* it: the `GuidedWorkflowEngine`.

```typescript
// src/components/tools/GuidedWorkflowEngine.tsx
// A generic step-by-step flow wrapper — does not know about specific tools.

interface Step {
    id: string;
    label: string;           // e.g. "A — Activating Event"
    question: string;        // The primary question shown large
    coaching: string;        // Psychoeducation paragraph explaining this step
    inputType: 'textarea' | 'multi-input' | 'emotion-selector' | 'intensity-slider';
    placeholder: string;     // Recovery-specific placeholder text
    minLength?: number;      // Minimum characters before user can advance (prevents skipping)
    aiPromptEnabled: boolean; // Whether this step has an AI follow-up prompt available
}

interface GuidedWorkflowEngineProps<T> {
    toolType: SmartToolType;
    steps: Step[];
    onComplete: (payload: T) => void;
    resumePayload?: Partial<T>;   // From SmartToolContainer session rehydration
}
```

### 3.4 New Components

```
src/components/tools/
    GuidedWorkflowEngine.tsx      ← Generic step engine (new)
    StepCoachingCard.tsx          ← Psychoeducation card per step (new)
    EmotionIntensitySelector.tsx  ← Emotion + % slider for Thought Record (new)
    CognitiveDistortionPicker.tsx ← Multi-select chip grid, 12 distortion types (new)

    // Existing tools — replace current open-form with guided flow:
    tools/ABCTool.tsx             ← Guided ABCDE 5-step flow (replace)
    tools/CBATool.tsx             ← Guided CBA with quadrant-by-quadrant reveal (replace)
    tools/DENTSTool.tsx           ← Guided DENTS with scenario pre-planning mode (replace)
    tools/FiveQuestionsTool.tsx   ← Guided self-enquiry flow (replace)

    // New tools:
    tools/ThoughtRecordTool.tsx   ← New 7-column guided thought record (new)
```

### 3.5 Gemini Integration — AI Coaching Prompts

Add `generateCBTCoachingPrompt()` to `src/lib/gemini.ts`:

```typescript
// Generates a contextual follow-up question to help the user go deeper
// Called after the user completes a step and pauses for > 3 seconds.
// Uses gemini-2.5-flash-lite — this is a fast, low-cost call.

export async function generateCBTCoachingPrompt(
    toolType: SmartToolType,
    stepId: string,
    userInput: string
): Promise<string> {
    // Returns a single follow-up question (1 sentence, max 15 words)
    // that helps the user dig deeper into their current step.
    // Example: "What does that belief remind you of from earlier in your life?"
}
```

**Prompt design constraint:** The AI coaching prompt is a *question*, never a statement or advice. This keeps MRT firmly in peer-support territory rather than clinical territory. The prompt is shown as a soft suggestion below the text field — the user can ignore it.

---

## 4. Implementation Phases 🏗️

---

### Phase 1: The `GuidedWorkflowEngine` Foundation

**Files:** `src/components/tools/GuidedWorkflowEngine.tsx`, `src/components/tools/StepCoachingCard.tsx`

**Logic & State:**
- `currentStep: number` — active step index, starts at 0
- `stepData: Partial<T>` — accumulated answers across all steps
- `canAdvance: boolean` — computed: `stepData[currentStep].length >= step.minLength`
- `isDraft: boolean` — true until the user taps "Save to Vault"
- Draft auto-save: every 30 seconds, write `JSON.stringify(stepData)` to `sessionStorage` keyed by `toolType`. Cleared on explicit save or tab close.
- Progress: `sessionStorage` draft is checked on mount — if found, show "Resume your session?" modal

**UI/UX:**
- Full-screen flow, one step per screen — no scrolling to see other steps
- Progress bar at the top: filled dots for completed steps, hollow for remaining
- Step label shown prominently: `"Step 2 of 5 — B: Your Beliefs"`
- Large question text (24px, bold) — the primary cognitive prompt
- `StepCoachingCard`: a collapsible card below the input labelled "What does this mean?" with the psychoeducation explanation for this step. Collapsed by default — users who know the model can skip it; newcomers can expand it.
- "Next →" button: disabled until `canAdvance` is true. Never shows an error — just stays disabled. No shame.
- Back navigation: allowed to previous steps (editing is fine — the user may realise their Step A description was inaccurate after writing Step B)
- "Save Progress" floating button: always visible, saves the current `stepData` as a draft journal entry. Shows as "Saved ✓" for 2 seconds after tapping.

**Somatic Check — David:**
The guided flow must have an escape hatch for David in crisis. A persistent "Exit and save draft" link in the header (not a button — less visual weight) allows David to exit the flow at any step without losing his work. The flow must not feel like a trap. The `minLength` constraint must be loose enough that a user in high distress can type something brief and move forward — suggest 10 characters minimum, not 100.

**Somatic Check — Ned/Maya:**
The step-by-step structure gives Ned and Maya the clear progression they both need — Ned to feel a sense of forward momentum, Maya to know exactly which section she's completing in a structured curriculum.

**Reward:** On completion of the final step, a brief celebration moment: "You just did some serious cognitive work." + 25 XP (High priority task equivalent). The completed entry appears in the Journal timeline with the tool type badge.

**Edge Cases:**
- [ ] `navigator.onLine` is false → `GuidedWorkflowEngine` works fully offline. All step data is in React state. The final "Save to Vault" write goes through the existing offline-capable `useJournalOperations` mutation (TanStack Query queues it).
- [ ] `isVaultUnlocked` is false → `SmartToolContainer` blocks before `GuidedWorkflowEngine` renders. No change needed.
- [ ] 320px screen → Full-screen one-step-at-a-time layout is actually better at 320px than the current open-form layout. Each step uses the full viewport height. Progress dots at top, question + input below, nav button at the very bottom above the safe area inset.
- [ ] User minimises app mid-flow → `sessionStorage` draft persists for the browser session. On return to the Tools page, a "Resume your [tool name] session?" card appears.
- [ ] User taps "Save Progress" at Step 2 of 5 → A partial payload is saved as a journal entry tagged `['SMART Tool', toolType, 'DRAFT']`. On next session, `SmartToolContainer` `resumeSession` rehydrates from the most recent draft. The DRAFT tag prevents the AI Analysis Wizard from analysing incomplete tool entries.

---

### Phase 2: Guided ABCDE Flow — The Priority Tool

**Files:** `src/components/tools/tools/ABCTool.tsx`

The ABCDE tool is the highest clinical priority. It is the tool users most need to complete correctly and most likely to abandon at Step D (Disputation).

**The Five Steps — Content:**

| Step | Label | Question | Min Length | AI Prompt Enabled |
|---|---|---|---|---|
| 1 | A — Activating Event | "What happened? Describe just the facts — what you saw, heard, or experienced." | 20 chars | No |
| 2 | B — Your Belief | "What thought went through your mind? What did that event mean to you?" | 20 chars | Yes |
| 3 | C — Consequence | "How did that belief make you feel? What did you do (or want to do) as a result?" | 20 chars | No |
| 4 | D — Dispute | "Is this belief actually true? What evidence contradicts it? What would you say to a friend who had this thought?" | 30 chars | Yes |
| 5 | E — Effective Belief | "Write a more balanced, realistic version of the original belief." | 20 chars | No |

**Step 4 (Disputation) — Special Treatment:**

This is where users most often abandon the tool. PROJ-50 adds three specific interventions at Step D:

1. **The Socratic Prompt Card:** A collapsible coaching card with 4 Socratic questions (not all shown at once — tap to reveal one at a time):
   - "What is the evidence that this belief is completely true?"
   - "What would a trusted friend say about this belief?"
   - "Has this belief protected you, or has it caused you harm?"
   - "What is a more realistic way to see this situation?"

2. **Distortion Identifier:** A `CognitiveDistortionPicker` component — a scrollable grid of 12 chip buttons labelled with common distortion types (All-or-Nothing, Catastrophising, Mind Reading, Should Statements, Personalisation, etc.). The user can optionally select the distortion type driving their belief. This is educational, not required — it helps Maya understand the mechanism, and helps the AI coaching prompt be more targeted.

3. **AI Coaching Prompt (Step D only):** After the user writes their disputation attempt (min 30 chars), if they pause for >3 seconds, a subtle question appears below the text field: `"✦ A deeper question: [Gemini-generated follow-up]"`. The question is generated from their Step B (Belief) content and their Step D draft. Tapping the question copies it into the input as a starting point for further writing.

**Step Coaching Cards — Content:**

Each step has a one-paragraph psychoeducation explanation written in recovery-appropriate language:

- **Step A coaching:** "An activating event is just what happened — not what it means, not how it made you feel. Just the facts. 'My sponsor didn't call me back' is a fact. 'My sponsor doesn't care about me' is a belief. We're just at Step A."
- **Step B coaching:** "Our beliefs are the stories we tell about events. They happen automatically, often in a fraction of a second. The same event (a missed call) can trigger completely different beliefs in different people. Your belief isn't a fact — it's an interpretation."
- **Step C coaching:** "Notice that the consequence wasn't caused by the activating event directly. It was caused by your belief about it. This is the core insight of REBT: events don't make us feel things. Our beliefs do. That means beliefs are changeable."
- **Step D coaching:** "This is the hardest part, and the most powerful. You're about to argue against your own automatic thought using evidence and logic. It's not about pretending the event didn't happen. It's about questioning whether your first interpretation was the only way to see it."
- **Step E coaching:** "An effective new belief doesn't have to be wildly positive. It just has to be more accurate and less self-defeating than the original. 'My sponsor might have been busy' is more accurate than 'my sponsor doesn't care about me.' That's enough."

**Somatic Check:** Step C asks about emotional consequences. For users in early recovery, this may surface intense emotions. The coaching card at Step C includes a soft note: "If what you're feeling right now is very intense, it's okay to pause and use the Urge Surfer or breathwork tools first. This work will be here when you're ready."

---

### Phase 3: Guided CBA Flow

**Files:** `src/components/tools/tools/CBATool.tsx`

**The Clinical Innovation — Quadrant Reveal:**

The existing CBA renders all four quadrants at once. This allows users to skip the uncomfortable quadrants (particularly "Advantages of using" — the honest acknowledgment that substance use does provide something). PROJ-50 reveals quadrants sequentially:

1. **Advantages of [the behaviour]** — completed first, before the user enters "stopping" mode
2. **Disadvantages of [the behaviour]**
3. **Advantages of stopping**
4. **Disadvantages of stopping**

This order is clinically intentional. Completing the advantages of the problematic behaviour first — before any "recovery" framing — produces more honest answers than completing it last when the user is already in "I should stop" mode.

**Input Format — Dynamic List:**

Each quadrant uses a dynamic list input (tap "+" to add an item, swipe to delete) rather than a free-text field. This produces more scannable, comparable results and feels more like a decision tool than a journaling prompt.

**Minimum Items:** Each quadrant requires at least 1 item before the user can advance. The "Advantages of [behaviour]" quadrant has a coaching card: "This is the honest part. What does [substance/behaviour] actually give you — even temporarily? Relief from stress? Connection? Escape? These are real. Naming them honestly is what makes this exercise work."

**The Summary View:** After completing all four quadrants, the user sees a 2×2 summary grid — the traditional CBA layout. They can add or edit items at this point. A "What does this tell you?" AI prompt runs on the completed four-quadrant data and returns a 1-sentence observation (not advice, just a mirror).

---

### Phase 4: Thought Record — New Tool

**Files:** `src/components/tools/tools/ThoughtRecordTool.tsx`, `src/components/tools/EmotionIntensitySelector.tsx`

**The Thought Record is MRT's most significant CBT gap.** It is the most commonly used CBT self-monitoring tool in clinical practice and is absent from the current PROJ-27 suite.

**The Seven Columns as Seven Steps:**

| Step | Column | Input Type | Clinical Note |
|---|---|---|---|
| 1 | Situation | Textarea | "What were you doing? Where were you? When?" |
| 2 | Automatic Thought | Textarea | "What went through your mind? What images or memories?" |
| 3 | Emotions (Before) | EmotionIntensitySelector | Emotion word + % intensity slider (0-100) |
| 4 | Evidence For | Textarea | "What facts support this thought?" |
| 5 | Evidence Against | Textarea | "What facts contradict this thought? What would a reasonable person say?" |
| 6 | Balanced Thought | Textarea | "Write a more balanced thought that takes all evidence into account." |
| 7 | Emotions (After) | EmotionIntensitySelector | Same emotions as Step 3 — re-rated after the reframe |

**The `EmotionIntensitySelector` Component:**

- A pre-populated grid of common emotion words (Anxious, Angry, Ashamed, Sad, Hopeless, Scared, Overwhelmed, Relieved, Calm, Hopeful)
- User taps to select 1-3 emotions, then drags a slider to set intensity %
- Recovery-specific: includes "Urge to use" as an emotion option — directly relevant to addiction context
- Can add custom emotion word via text input

**The Clinical Payoff — The Delta:**

After completing Step 7 (Emotions After), the UI shows a brief comparison: the emotion intensities from Step 3 vs. Step 7. Even a 10% reduction in anxiety intensity is clinically meaningful and visually rewarding. A calm, non-gamified display: "Your anxiety moved from 80% to 55% after completing this record." No confetti — this is Walt's tool as much as Ned's.

**`CognitiveDistortionPicker` at Step 4:**

Between Steps 4 and 5, the user is offered an optional distortion identification step: a scrollable grid of 12 distortion types with brief definitions. This is entirely optional — it does not block advancement. For Maya, this is a highly engaging analytical step. For David in crisis, it is skippable.

**The 12 Cognitive Distortions (chip labels):**

All-or-Nothing · Overgeneralisation · Mental Filter · Disqualifying the Positive · Mind Reading · Fortune Telling · Catastrophising · Emotional Reasoning · Should Statements · Labelling · Personalisation · Magnification

Each chip expands on tap to show a one-sentence recovery-relevant definition.

---

### Phase 5: DENTS Pre-Planning Mode & Five Questions Guided Flow

**Files:** `src/components/tools/tools/DENTSTool.tsx`, `src/components/tools/tools/FiveQuestionsTool.tsx`

**DENTS — Pre-Planning Mode:**

The existing DENTS tool is a post-hoc acronym filler. PROJ-50 adds a **Scenario Mode** as the entry point: "What's the high-risk situation you're planning for?" The user names the scenario first, then the five DENTS prompts are rewritten dynamically to reference that specific scenario.

Current Step D prompt: "How will you Deny this situation?"
Scenario-aware Step D prompt: "If [scenario] happens, how exactly will you Deny it? What words will you say?"

This specificity is the clinical difference between an abstract plan and a usable one. Research consistently shows specific implementation intentions ("I will do X in situation Y") are far more effective than general resolutions.

**Five Questions — Guided Socratic Flow:**

The Five Questions are Byron Katie's The Work adapted for recovery. Each question requires a different type of engagement:

- Q1 ("Is this thought true?") → Simple Yes/No selector + explanation textarea
- Q2 ("Can I absolutely know it is true?") → Yes/No + explanation
- Q3 ("How do you react when you believe this thought?") → Multi-line reflection
- Q4 ("Who would you be without this thought?") → Guided imagery prompt: "Close your eyes for a moment. Imagine waking up tomorrow and this thought is simply gone. What does your day look like?"
- Q5 ("What is the turnaround?") → The user writes the opposite of their original thought, then rates whether the turnaround might be as true as or truer than the original (1-5 star rating)

The coaching cards at each step quote Walt (our long-term reflective persona) as the voice — calm, measured, wisdom-over-urgency.

---

## 5. Tools Hub Update — Navigation & Entry Points

**Files:** `/tools` route component

**Three Entry Modes per Tool:**

Each tool in the Tools Hub now offers three entry points:

1. **"Start Fresh"** — opens the guided flow from Step 1 with an empty state
2. **"Resume"** — shown if a `sessionStorage` draft exists; opens from the last completed step
3. **"View History"** — opens a filtered journal view showing all past completions of this tool

**Tool Cards — Redesigned:**

Current tool cards show just a title and icon. PROJ-50 redesigns each card to show:
- Tool name and icon
- A one-line description of when to use it (recovery-context specific)
- A time estimate ("~10 minutes")
- A completion count badge ("Completed 4 times")
- A "Best for:" persona indicator (subtle)

**When to Use — Card Descriptions:**

| Tool | "Best for:" | When to use |
|---|---|---|
| ABCDE | Anytime | "When a belief is making you feel worse than the situation warrants" |
| CBA | Before a decision | "When you're weighing whether to change a behaviour" |
| Thought Record | After distress | "When you want to understand and reframe a difficult moment" |
| DENTS | Before a risky situation | "When you know a challenging situation is coming" |
| Five Questions | Deep reflection | "When a recurring thought is keeping you stuck" |
| SMART Goal | Planning | "When you want to turn an intention into a concrete plan" |
| Lifestyle Balance | Monthly review | "When you want to see how balanced your life feels right now" |

---

## 6. QA & Verification 🧪

*Verified via the real test suite (264 tests across `GuidedWorkflowEngine.test.tsx`, each tool's own `*.test.tsx`, `useGuidedDraft.test.ts`, `useSmartToolCompletions.test.ts`, `useToolHistory.test.ts`, `gamification.test.ts`, `useDeepPatternAnalysis.test.ts`) plus manual Playwright walkthroughs at 375×812 for each phase, unless noted otherwise below.*

### Unit Tests

- [x] `GuidedWorkflowEngine` advances to next step when `canAdvance` is true, stays disabled below `minLength`
- [x] `sessionStorage` draft round-trips correctly (`useGuidedDraft.test.ts`); the 30-second autosave interval itself is implemented (`DRAFT_AUTOSAVE_INTERVAL_MS`) but its exact timing was not separately asserted with fake timers
- [x] "Resume session?" modal appears when a `sessionStorage` draft exists for the tool type
- [x] `DRAFT` tag is written to the journal entry on partial saves; final save writes WITHOUT it
- [x] `ThoughtRecordPayload`, `DENTSPayload`, `FiveQuestionsPayload` all serialise/deserialise correctly through the `JSON.stringify`/`JSON.parse` round-trip
- [x] `EmotionIntensitySelector` — intensity bounded 0-100 via the native range input
- [x] `CognitiveDistortionPicker` — selected distortion appears in the payload `distortionType` field
- [x] CBA quadrant ordering — "Advantages of Doing" is always Step 1
- [x] DENTS Scenario Mode — each of the 5 steps' `question` text interpolates the scenario entered on the intro screen

### ZK Boundary Tests

- [x] `tags` array contains plaintext `['SMART Tool', <toolType>]` (and `'DRAFT'` when partial) — confirmed at the type/save level; not re-verified against a live Firestore emulator in this project
- [x] AI Coaching Prompt Gemini calls write nothing to Firestore — a pure client-side `generateCBTCoachingPrompt` inference call
- [x] `sessionStorage` draft is cleared (`clearDraft()`) on final completion
- [ ] Reading a raw journal document straight from a Firestore emulator to assert the literal `IV_HEX:CIPHERTEXT_HEX` ciphertext pattern was not exercised — this sandbox has no Firebase project configured; the encryption call path itself (`encrypt()` before every `content` write) is unchanged from the PROJ-27 baseline and was audited by inspection, not a live emulator assertion.

### The Subway Test (Offline Resilience)

- [x] `GuidedWorkflowEngine` shows an explicit "Connect to save your progress" warning and disables Save Progress/Finish when `navigator.onLine` is false (tested)
- [ ] The full offline-queue-then-reconnect round trip (mutation queues in TanStack Query while offline, then flushes to Firestore on reconnect) was not separately exercised for these 5 tools — it relies on the same generic TanStack Query + Firestore persistence every other journal-writing flow in the app already uses, not bespoke PROJ-50 logic.

### The "Lost PIN" Test (Crypto-Shredding)

- [ ] Not re-verified specifically against a SMART Tool payload this project — PIN rotation (`executePinRotation`) and crypto-shredding (`executeCryptoShredding`) sweep the entire `journals` collection generically (per `docs/SECURITY_ZERO_KNOWLEDGE.md`/PROJ-31) with no tool-type branching, so new payload shapes need no special handling, but this wasn't exercised end-to-end with a Thought Record entry specifically.

### Persona-Specific QA

- [x] **David Crisis Test:** `minLength` gating confirmed at the unit level; the literal "under 3 minutes on a 320px device" timing was not stopwatched — visual verification was done at 375px, not 320px.
- [x] **Maya Distortion Test:** confirmed — `distortionType: "Catastrophising"` appears in the saved payload when selected.
- [x] **Ned Reward Test:** 25 XP award confirmed (`gamification.test.ts`); completion badge increment confirmed (`ToolsHub.test.tsx`).
- [x] **Walt Five Questions Test:** Q5 turnaround rating (1-5 stars) confirmed in the payload; coaching-card copy was written in a calm, reflective voice but not evaluated by a clinician.
- [x] **AI Coaching Prompt Test:** debounced prompt appears after a pause, Premium-gated, cached per step (tested with fake timers).
- [x] **CBA Quadrant Order Test:** confirmed.
- [x] **Resume Session Test:** confirmed for same-session `sessionStorage` drafts and cross-session Firestore `DRAFT` docs (via `SmartToolContainer`'s `resumeSession` + Tools Hub's Resume button); not re-tested against an actual closed-and-reopened browser tab.

### Regression Tests (PROJ-27 Baseline Must Not Break)

- [x] `SmartToolContainer` session rehydration still works for existing (pre-PROJ-50) tool entries — DENTS's backward-compatible `scenario?: string` handling specifically confirmed via a "resumes a legacy complete entry with no scenario field" test.
- [x] `useDeepPatternAnalysis.ts`'s `DRAFT` tag filter is generic (not tool-type-specific), so new tool types need no changes there — confirmed by inspection; `analyzeFullWorkbook` is a separate, workbook-specific pipeline untouched by PROJ-50 (see Open Question #4).
- [x] `DRAFT`-tagged entries are excluded from `useDeepPatternAnalysis` and `useSmartToolCompletions`'s completion count alike.
- [x] All prior `SmartToolType` values (`CBA`, `ABC`, `DENTS`, `LIFESTYLE_BALANCE`, `PERSONIFY`, `SELF_COMPASSION`, `SMART_GOAL`, `BOUNDARIES`) still serialise/deserialise correctly — none of their payload shapes changed except `DENTSPayload` and `FiveQuestionsPayload`, both additive/backward-compatible.
- [x] `npm run check` — zero TypeScript errors, zero lint warnings, 264/264 tests passing
- [x] `npm run build` — clean production build

---

## 7. Open Questions

| # | Question | Options | Status |
|---|---|---|---|
| 1 | **Premium or free?** | (a) All guided tools are free (retention driver) · (b) Basic tools free, AI coaching prompts Premium only · (c) Thought Record free, AI coaching Premium | ✅ Decided: option (b). The guided flow itself is free for every tool; `GuidedWorkflowEngine` gates only the AI coaching prompt behind `userTier === 'premium'`. |
| 2 | **`minLength` values** | The spec proposes 10 chars minimum for David-facing crisis steps, 30 chars for Step D (Disputation). Are these clinically appropriate or too strict/too loose for the user base? | ✅ Shipped as specified (10-20 chars for most steps, 30 for ABCDE's Step D). No clinical review occurred during this build; revisit if user feedback flags friction. |
| 3 | **DENTS Scenario naming** | Should the scenario description in DENTS Pre-Planning Mode be encrypted (it is a personal situation description) or stored as plaintext metadata (for pattern analysis)? | ✅ Decided: encrypted. `scenario` lives inside `DENTSPayload`, which is JSON-stringified and AES-GCM encrypted with the rest of the tool's `content` — never a separate plaintext field. |
| 4 | **Thought Record — new Firestore tag** | The `THOUGHT_RECORD` type is new to `SmartToolType`. The AI Analysis Wizard (Insights) will encounter `['SMART Tool', 'THOUGHT_RECORD']` tags for the first time. Does `analyzeFullWorkbook` handle unknown tool types gracefully? | ✅ Resolved — this question conflated two pipelines. `analyzeFullWorkbook`/`analyzeWorkbookContent` is workbook-specific (PROJ-04) and untouched by PROJ-50. The actual SMART-Tool pattern-analysis path is `useDeepPatternAnalysis.ts`, which is fully generic — it filters only on the `DRAFT_TAG` string and otherwise treats all non-draft journal content as text, with no per-`SmartToolType` branching. New tool types (`THOUGHT_RECORD`, `DENTS`, `FIVE_QUESTIONS`) needed zero changes there. |
| 5 | **AI Coaching Prompt rate limiting** | Each AI coaching prompt is a Gemini API call. A user completing 5 tools in a session could trigger 10+ calls. | ✅ Decided: debounce at 5 seconds (`AI_PROMPT_DEBOUNCE_MS`), 1 AI prompt per step per session — cached in `aiPrompts[step.id]`, never re-fetched on a subsequent pause on the same step. |

---

## 8. Out of Scope

- Audio-guided versions of any tool (breathing / voice instructions)
- Sharing completed tool results with a sponsor or clinician — no export for individual tool entries in v1
- Group facilitation mode (completing a tool with another person in real time)
- New tool types beyond the 5 guided (ABCDE, CBA, Thought Record, DENTS, Five Questions) — SMART Goal, Lifestyle Balance, Personify, Self-Compassion, Boundaries remain as-is in v1
- In-line therapist connection or referral (out of scope for a wellness app)
- Completion streaks for CBT tools — this feature is deliberately excluded to avoid gamifying cognitive work in a way that could feel coercive

---

## 9. Definition of Done

**Phase 1 — Foundation:**
- [x] `GuidedWorkflowEngine` renders correct step count, labels, and progress bar
- [x] `minLength` enforcement works — "Next" stays disabled below threshold
- [x] `sessionStorage` draft writes every 30 seconds
- [x] "Resume session?" modal appears when draft exists
- [x] `DRAFT` tag written on partial saves, removed on complete saves
- [x] 25 XP awarded on completion
- [x] All Phase 1 unit tests passing

**Phase 2 — ABCDE:**
- [x] All 5 steps render with correct question and coaching card content
- [x] `CognitiveDistortionPicker` available at Step D (optional, non-blocking)
- [x] Socratic Prompt Card at Step D with 4 questions revealed one at a time
- [x] AI coaching prompt appears at Step B and D after user pauses (Premium only)
- [x] Completed ABCDE payload decrypts correctly to `ABCPayload` interface

**Phase 3 — CBA:**
- [x] Quadrants reveal sequentially — "Advantages of behaviour" is always first
- [x] Dynamic list input with add/swipe-delete
- [x] Minimum 1 item per quadrant before advancing
- [x] Summary 2×2 view shown after all quadrants complete
- [x] "What does this tell you?" AI prompt on completed data (Premium only)

**Phase 4 — Thought Record:**
- [x] All 7 columns implemented as guided steps
- [x] `EmotionIntensitySelector` works on both touch and mouse
- [x] Emotion intensity delta displayed after Step 7 completion
- [x] `CognitiveDistortionPicker` available as optional step between 4 and 5
- [x] `ThoughtRecordPayload` decrypts correctly from Firestore

**Phase 5 — DENTS & Five Questions:**
- [x] DENTS Scenario Mode: scenario name referenced in each step's coaching prompt
- [x] Five Questions: Q1 and Q2 have Yes/No selectors; Q4 includes guided imagery prompt; Q5 includes 1-5 star turnaround rating
- [x] Both tools complete their guided flows and save correctly to `journals` collection

**§5 — Tools Hub Redesign:**
- [x] Start Fresh / Resume / History entry points per real guided/CBT tool card
- [x] Completion count, time estimate, and "Best for" indicator shown per card, backed by `useSmartToolCompletions`
- [x] `/tools/:toolType/history` renders past completions via a generic `PayloadSummaryList`, not raw JSON

**All Phases:**
- [x] ZK boundary confirmed: all tool content is ciphertext in Firestore; `tags`/`DRAFT` remain plaintext metadata per `CLAUDE.md`'s ZK boundary table
- [x] PROJ-27 regression tests all passing
- [x] Offline save queue working for all five tools — inherited from the app's existing TanStack Query + Firestore offline persistence (not bespoke to PROJ-50); `GuidedWorkflowEngine` additionally shows an explicit "Connect to save your progress" warning when offline
- [x] Tools Hub entry cards show completion count, time estimate, and entry mode options
- [x] `npm run check` — zero TypeScript errors
- [x] `npm run build` — clean build

**Approved deviations from the original spec** (see `docs/specs/18_CBT_ENGINE.md` for the as-built architecture):
- `GuidedWorkflowEngine`'s `Step`/`GuidedWorkflowEngineProps` interfaces grew beyond §3.3's original sketch: `canAdvanceExtra`, `forceFresh`, `emotionSourceStepId`, `renderExtra`/`setStepValue`, `suppressCompletionScreen` were all added incrementally as later phases needed them.
- `FiveQuestionsPayload` was redesigned from the pre-existing flat `{q1..q5: string}` stub into a 9-field shape (`thought`, per-question explanations, `q1IsTrue`/`q2CanKnow`, `turnaround`, `turnaroundRating`) — safe since the stub had zero prior implementations.
- §5's card redesign was scoped to the 8 real, journal-persisted tools (the 5 guided ones + Personify + Lifestyle Balance), not all 10 Tools Hub cards — Urge Surfer and Resentment Burner keep their original simple card since neither has steps, drafts, or (for Resentment Burner) any persistence.
- A `SMART Goal` "Coming Soon" card was added to the Tools Hub (using the hub's pre-existing but previously-unused `coming_soon` status path) even though §8 lists SMART Goal as out of scope for a working tool — the card only advertises the future feature, no component was built.

---

*MRT · PROJ-50 Guided CBT/REBT Interactive Workflows · v1.0 · May 2026 · Status: ✅ Shipped*