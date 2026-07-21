# 📐 Feature Spec: The CBT Engine (SMART Tools)

**Status:** Live (v1.16.0) — guided-flow architecture per PROJ-50
**Architecture:** Virtual Module (Abstracted Journal Interface) + Render Props, layered with an optional step-locked guided flow
**Primary Code:** `src/components/smart_tools/`, `src/components/tools/`

## 1. Overview
The CBT Engine digitizes evidence-based SMART Recovery worksheets into interactive, responsive React components. Six of the nine tools (ABCDE, CBA, DENTS, Thought Record, Five Questions, Morning Intent) are **guided, step-locked flows** — one question at a time, with contextual coaching, optional AI-assisted prompts, and in-line psychoeducation — rather than a single open-form page.

## 2. Technical Architecture

### A. The Virtual Module Storage Strategy
To avoid schema bloat, CBT tools do not have their own Firestore collections.
* They are saved directly to the `journals` collection.
* **The Payload:** The tool's state is wrapped in a metadata object, passed through `JSON.stringify()`, encrypted via AES-GCM, and stored in the `content` field.
* **Tags:** They are flagged with `['SMART Tool', toolType]` so the `JournalHistory` timeline can render them and the `JournalAnalysisWizard` can read them.
* **Shared parsing:** The envelope is parsed by one shared helper, `parseSmartToolPayload` (`src/lib/smartToolPayload.ts`), used by `useToolHistory`, the main `JournalHistory` timeline, and both AI analysis paths (`JournalAnalysisWizard`, `useDeepPatternAnalysis`) — so a decrypted entry is identified as a tool save (vs. freeform text) in exactly one place. Everywhere that renders the parsed `data` for a human reuses the same generic `PayloadSummaryList` (humanized field labels) `ToolHistory` already used, rather than a bespoke renderer per surface.
* **`DRAFT` tag (PROJ-50):** A partial, in-progress guided save carries an extra `'DRAFT'` tag. Only the tool's true completion gate (a dedicated summary phase's "Save to Journal", not just reaching the last guided step) drops it. See `docs/SCHEMA_ARCHITECTURE.md`.

### B. The `SmartToolContainer` (HOC / Render Prop)
A generic wrapper component (`SmartToolContainer<T>`) handles all complex logic, allowing the individual tools to remain pure UI layers.
* **Encryption Gate:** Enforces `isVaultUnlocked`.
* **Session Rehydration:** Accepts a `resumeSession` boolean. If true, it queries the DB on mount for the most recent entry tagged with that tool, decrypts the payload, and hydrates the UI.
* **Idempotent Saves:** Exposes a `save(data, extraTags?)` callback (and an optional default "Save to Journal" button, hideable via `hideDefaultSaveButton`). If the session was resumed, it triggers `updateJournal` to prevent DB bloat. Otherwise, it triggers `addJournal`.
* **`hideHeader`:** Lets a tool render its own page chrome (a `VibrantHeader`) instead of the container's default header bar — used by every guided-flow tool.

### C. `GuidedWorkflowEngine` (PROJ-50) — the step-locked layer
A generic, tool-agnostic step engine (`src/components/tools/GuidedWorkflowEngine.tsx`) that sits *above* `SmartToolContainer` for ABCDE, CBA, DENTS, Thought Record, Five Questions, and Morning Intent. It owns step navigation, `minLength` advancement gating, sessionStorage draft autosave/resume (`useGuidedDraft`, key `guidedDraft_${toolType}`), and the optional AI coaching prompt — never Firestore persistence directly (that's still `SmartToolContainer`'s job, via the `onSaveProgress`/`onComplete` callbacks).

Each `Step` declares:
* `inputType: 'textarea' | 'list' | 'emotion'` — the primary input widget (`ListInput`, `EmotionIntensitySelector`, or a plain textarea).
* `minLength` — characters (textarea) or items/emotions selected (list/emotion) required before "Next" enables.
* `aiPromptEnabled` — whether this step offers a debounced AI follow-up question via `generateCBTCoachingPrompt` (Premium only).
* `emotionSourceStepId` (optional) — for an `'emotion'` step that re-rates the emotions already recorded by an earlier step (Thought Record's Step 7 re-rating Step 3), seeded once from that step's values.
* `canAdvanceExtra` (optional) — an additional gate function evaluated alongside `minLength`, for steps whose completeness depends on a `renderExtra`-authored sibling value (Five Questions' Yes/No answer or star rating), not just the step's own textarea/list content.
* `renderExtra` (optional) — an escape hatch rendering an extra widget below the primary input, wired to `setStepValue(stepId, value)` so it can write to any key in the payload, not just the current step's own id (used by `CognitiveDistortionPicker`, `YesNoToggle`, `StarRating`).

Engine-level props of note: `suppressCompletionScreen` (a tool with its own custom summary phase skips the engine's generic "nice work" screen) and `forceFresh` (ToolsHub's "Start Fresh" entry point — clears any draft, skips the resume-prompt dialog, and starts at step 0 with empty data, ignoring `initialData`).

Three tools (CBA, DENTS, Five Questions) add their own **`intro` phase** before the guided steps, to capture a single value (the behavior / high-risk scenario / thought being examined) that the step questions then interpolate dynamically — e.g. DENTS's Scenario Mode: *"If `[scenario]` happens, how exactly will you Deny it?"* instead of a generic prompt.

## 3. Tool Implementations

**Guided, step-locked (via `GuidedWorkflowEngine`):**
* **ABC Coping Tool:** Guided A → B → C → D → E flow. Step D (Disputation) offers Socratic prompts, an optional (ephemeral, non-persisted) cognitive distortion picker, and an AI coaching prompt.
* **Cost Benefit Analysis (CBA):** `intro` (name the behavior) → guided quadrants (Advantages/Disadvantages of Doing/Stopping, in clinically-mandated order) → `summary` (the classic 2×2 grid, editable, plus a Premium AI reflection).
* **D.E.N.T.S. Strategy:** `intro` (Scenario Mode — name the specific high-risk situation) → guided D-E-N-T-S steps, each dynamically worded to reference that scenario → `summary` (all 5 answers, editable, in the original color-coded acronym cards).
* **Thought Record:** The classic 7-column CBT thought record — guided Situation → Automatic Thought → Emotions (before) → Evidence For → Evidence Against (+ optional persisted distortion picker) → Balanced Thought (+ AI prompt) → Emotions (after, re-rating the same emotions from Step 3) → `summary` ("The Shift" — a before/after emotion comparison).
* **Five Questions:** Byron Katie's "The Work" adapted for recovery. `intro` (name the thought) → guided Q1–Q5 (Q1/Q2 pair a Yes/No toggle with an explanation; Q5 pairs a turnaround statement with a 1-5 star rating and the flow's one AI coaching prompt) → `summary`.
* **Morning Intent (PROJ-72):** A forward-looking REBT flow — distinct from ABCDE's retrospective structure. Guided Terrain → Automatic Story → Reframe → Intention, anticipating the day's likely challenges before they arrive rather than examining a belief about something that already happened. No `intro` phase.

**Single-page, `SmartToolContainer`-only (not guided/step-locked):**
* **Personify & Disarm:** A "Rogue's Gallery" card grid leveraging Narrative Therapy to externalize the addictive voice.
* **Lifestyle Balance:** An interactive "Wheel of Life" radar chart (powered by `recharts`) mapping 6 core life categories, immediately highlighting holistic imbalances.

**Bypasses `SmartToolContainer` and Firestore entirely:**
* **The Resentment Burner:** An ephemeral journaling tool featuring a layer-based SVG combustion engine, to guarantee absolute zero-knowledge data destruction upon execution.

## 4. Routing & Discovery (Tools Hub, PROJ-50 §5, regrouped PROJ-71)

* **Tools Hub (`/tools`):** A centralized directory, grouped into four collapsible, moment-based sections (`right-now` / `before` / `after` / `big-picture`, defined in `toolsRegistry.ts`'s `phase` field and `PHASE_META`): **Right Now** (Urge Surfer, Resentment Burner — expanded by default so crisis tools are always visible with no interaction), **Before It Happens** (D.E.N.T.S., Cost Benefit Analysis, Morning Intent), **After a Hard Moment** (ABC Coping, Personify & Disarm, Thought Record, Five Questions), and **Big Picture** (Lifestyle Balance, SMART Goal) — the latter three collapsed by default, expandable via a tap on their header. The 9 real, journal-persisted tools each show three entry points on their card:
  * **Start Fresh** (`${path}?fresh=1`) — always available; forces the guided flow (or intro phase) to start blank, per §2.C's `forceFresh`.
  * **Resume** — shown only when a same-session `sessionStorage` draft (`hasGuidedDraft(toolType)`) or a cross-session Firestore `DRAFT` doc exists for a guided-flow tool; simply links to the tool's normal route, since `SmartToolContainer`'s existing `resumeSession` rehydration does the rest.
  * **History** — shown once a tool has at least one completion; links to `/tools/:toolType/history`.
  * Cards also show a time estimate, a subtle "Best for" persona indicator, and a completion-count badge, all backed by one shared query (`useSmartToolCompletions`).
  * Urge Surfer and Resentment Burner keep a plain simple card (no entry modes) — neither has steps, drafts, or (for Resentment Burner) any persistence. `SMART Goal` shows as a disabled "Coming Soon" card (no component exists yet).
* **Tool History (`/tools/:toolType/history`):** A new page (`useToolHistory`) listing every completed (non-`DRAFT`) entry for one tool, decrypted only when this view is opened, rendered via a generic `PayloadSummaryList` (humanized field labels) rather than a bespoke renderer per tool — so new tool types need no new history UI.
* Tool metadata (icon, title, path, "best for", time estimate, `toolType`) lives in one shared registry, `src/lib/toolsRegistry.ts`, imported by both the Tools Hub and the History page.
