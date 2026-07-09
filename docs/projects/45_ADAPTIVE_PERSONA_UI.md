# 🧠 Project PROJ-45: Adaptive Persona UI Engine

**Status:** ⚪ Planned — PARKED (not in active sprint)
**Primary Persona:** All five — David (safety anchor), Ned, Lisa, Walt, Maya
**Objective:** Transform MRT's five user personas from a branding framework into a runtime application architecture, where the UI reshapes itself — layout, cognitive load, typography, interaction patterns, information density — based on which persona the user identifies with in a given session.

---

## 1. The Executive Summary

**User Story:**
- **As** David (acute crisis), I want the app to present a single large action with no distractions so that I can ground myself without navigating a dense interface.
- **As** Ned (Pink Cloud), I want streak counts, XP, and mission labels front and centre so that I feel immediate momentum and reward.
- **As** Lisa (service-oriented), I want a case-management grid of my sponsees so that I can act on the most urgent need in under 10 seconds.
- **As** Walt (reflective), I want a blank page and nothing else so that I can write without noise or gamification pressure.
- **As** Maya (analytical), I want every data control and workbook progress visible at once so that I do not have to navigate to find depth.

**The Core Insight:**
Right now, personas are branding architecture. They should become runtime architecture. Recovery is non-linear — the same person uses all five modes. The UI must reflect who the user is *right now*, not who they were at signup.

**Competitive Gap:**
No recovery app — not Reframe, I Am Sober, nor Loosid — has implemented persona-driven runtime layout adaptation. All use a single UI for all users. An adaptive engine is a genuine product differentiator and a natural extension of MRT's privacy-first, user-sovereign philosophy. This is an untapped market position.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [ ] **Data Sensitivity:** Mode-switch history is clinically significant data. The fact that a user has been in David mode for 4 consecutive sessions is a meaningful recovery signal. This data must be treated as sensitive.
- [ ] **Encryption Strategy:** The mode-switch session log (`personaModeHistory`) should be stored encrypted via `src/lib/crypto.ts`. The current persona preference (default mode) can be stored plaintext in `users/{uid}` as metadata.
- [ ] **Key Rotation:** The encrypted `personaModeHistory` field must be included in `executePinRotation` — it is sensitive enough to be crypto-shredded on PIN change.
- [ ] **Analytics Consent:** Mode-switch data is used for the Adaptive Welfare Check (Phase 4). This requires explicit opt-in consent during onboarding — separate from general analytics consent.
- [ ] **ZK Boundary Check:** The shared infrastructure (Vault backend, auth, push notifications) must remain identical across all persona modes. No persona mode may weaken or bypass the ZK boundary.

**ZK Assessment per persona mode:**

| Persona Mode | New Data Written | Encrypted? | Notes |
|---|---|---|---|
| David | `currentPersonaMode`, `personaModeHistory` | History: Yes. Current: No | Current mode is metadata, history is sensitive |
| Ned | Same as above | Same | |
| Lisa | Same as above | Same | Sponsee data remains in existing encrypted `service_friends` collection |
| Walt | Same as above | Same | Journal data remains in existing encrypted vault |
| Maya | Same as above | Same | Workbook data remains in existing encrypted collection |

---

## 3. Schema & Architecture 🗄️

*Define the exact Firestore paths and TypeScript interfaces.*

### Per-Persona UI Contract

| Persona | Emotional State | UI Mode | Density | Primary Action |
|---|---|---|---|---|
| 🌊 David | Acute Crisis | Grounding / single large action | Minimal | SOS Urge Surfer |
| ⚡ Ned | Pink Cloud / High Energy | Gamified dashboard | Medium | Daily streak & XP |
| 🌿 Lisa | Stable / Service-Oriented | Case management grid | Medium | Sponsee overview |
| 🌙 Walt | Zen / Reflective | Vault & journal | Minimal | Encrypted journal entry |
| 🧠 Maya | Analytical / Curriculum-Driven | Data-dense dashboard | High | Workbook progression |

### Three-Layer Architecture

**Layer 1 — Design Token Layer**
Each persona has a complete CSS design token set: colour palette, typography scale (font family, size, weight), spacing scale, and motion profile. Switching persona swaps the entire token set. No inline style overrides — token-only switching.

**Layer 2 — Layout Grammar Layer**
Each persona maps to a distinct React component tree with different layout logic. This is not a visual reskin — it is a different information architecture.

| Persona | Component Tree Depth | Notes |
|---|---|---|
| David | ~3 nodes | Breathing orb → SOS button → 988 footer |
| Ned | ~6 nodes | Streak hero → Mission list → Stats → Badges |
| Lisa | ~8 nodes | Sponsee grid → Individual card → Action row |
| Walt | ~4 nodes | Date header → Textarea → Sparkline → Export |
| Maya | ~12 nodes | Workbook matrix → Heatmap → AI terminal → Stats header |

**Layer 3 — Interaction Pattern Layer**
Cognitive load, touch target sizes, animation speed, and default information density are all controlled per persona.
- David mode: disables non-essential navigation entirely. No badges, no task lists, no notifications visible.
- Maya mode: exposes all controls. Dense layout. No hand-holding.

### Firestore Collections Impacted

**`users/{uid}`** — add the following fields (plaintext metadata):
```typescript
currentPersonaMode: PersonaMode;        // active mode this session
defaultPersonaMode: PersonaMode;        // persisted preference
personaModeUpdatedAt: Timestamp;
```

**`user_persona_history/{uid}`** — new encrypted collection:
```typescript
// Encrypted via src/lib/crypto.ts
interface PersonaModeHistoryDocument {
  uid: string;
  encryptedHistory: string;            // encrypted JSON array of PersonaSession[]
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PersonaSession {
  mode: PersonaMode;
  sessionStartedAt: string;            // ISO date — encrypted
  sessionEndedAt: string | null;       // ISO date — encrypted
}
```

### Types (`src/lib/db.ts`)

```typescript
type PersonaMode = 'david' | 'ned' | 'lisa' | 'walt' | 'maya';

interface PersonaModeState {
  currentMode: PersonaMode;
  defaultMode: PersonaMode;
  sessionHistory: PersonaSession[];    // decrypted at runtime, never in global state
}

interface PersonaSession {
  mode: PersonaMode;
  sessionStartedAt: string;
  sessionEndedAt: string | null;
}

// Design token contract per persona
interface PersonaTokenSet {
  mode: PersonaMode;
  colorPrimary: string;
  colorBackground: string;
  fontFamily: string;
  fontSizeBase: number;
  motionSpeed: 'slow' | 'normal' | 'fast' | 'none';
  density: 'minimal' | 'medium' | 'high';
  touchTargetMin: number;             // px — David: 56px minimum, Maya: 44px
}
```

### Shared Infrastructure (unchanged across all modes)

- Zero-Knowledge Vault backend — data layer is identical
- Authentication and session management
- Push notification system (content is persona-aware; infrastructure is shared)
- Analytics event schema — mode switches logged as first-class events

---

## 4. Implementation Phases 🏗️

> **This project is PARKED. These phases are proposed for when it enters active development. No code should be written until the Open Questions in Section 7 are resolved and Phase 0 design work is complete.**

---

### Phase 0: Foundation & Design System

**Objective:** Establish the token system and design language before any React work begins.

**Logic & State:**
- Define the `PersonaMode` type and `PersonaModeState` interface in `src/lib/db.ts`
- Create `usePersonaMode()` hook — reads/writes current mode, persists default preference to Firestore
- Define Firestore security rules for `user_persona_history`

**UI/UX:**
- Define complete design token schema per persona (colour, typography, spacing, motion)
- Create Figma component library with all 5 token sets
- Establish layout grammar rules — document the component tree depth and node structure for each persona
- Design the persona selector overlay — the daily mood check-in ritual

**Success Criteria:** A designer can create a new screen in any persona mode using tokens only. The persona selector feels like a check-in, not a settings screen.

**Somatic Check:** The selector must not trigger anxiety — offering "Who are you today?" is very different from asking someone in crisis to categorise themselves clinically.

**Edge Cases:**
- [ ] What if `isVaultUnlocked` is false when the user tries to switch modes? Mode switch is permitted; encrypted history is not written until vault is unlocked.
- [ ] What if the user has never selected a persona before? Default to David for safety (see Open Questions).

---

### Phase 1: David + Walt (v1)

**Objective:** Ship the two minimal-density modes first — lowest risk, highest clinical priority.

**Logic & State:**
- React Query hook: `usePersonaMode()` — session state + Firestore persistence
- React Query hook: `usePersonaHistory()` — encrypted read/write of session history
- Firebase security rules: `user_persona_history/{uid}` — owner-only read/write

**UI/UX — David Mode:**
- Full-screen breathing orb as default view (animated, calming — Tailwind CSS animation)
- Sober day counter at maximum legible size
- SOS Urge Surfer: single large button, always above the fold
- Voice-to-Vault: one tap to record, zero text input required
- 988 crisis line: permanently visible footer, never scrolls away
- Navigation: hidden by default. Single discreet icon to access other features.
- Typography: large serif, slow rhythm, generous line height
- No notifications, no badges, no task lists visible in this mode

**UI/UX — Walt Mode:**
- Default view: date header and open textarea only. Nothing else.
- Word count below textarea, unobtrusive
- Longitudinal sparkline: 14-day journal entry frequency, minimal
- Export controls: JSON and PDF — available but quiet
- Pattern analysis: surfaced as a text link, not a button
- No streak, no XP, no gamification of any kind
- Typography: classical serif (Garamond-adjacent), generous margins, light palette
- Zero-knowledge reminder: one quiet line confirming vault is encrypted

**Somatic Check:** David mode must not contain any element that increases cognitive load. Walt mode must not contain any element that implies urgency or competition.

**Reward:** Not applicable for David mode (crisis intervention). Walt mode: word count is the only "progress" signal.

**Success Criteria:** Internal user testing — David mode usable in under 3 taps from cold launch.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Both modes function offline. David mode's breathing orb is fully local. Walt mode writes journal to TanStack Query cache and syncs on reconnection.
- [ ] `isVaultUnlocked` is false → David mode still shows SOS and 988 footer (no vault access needed). Walt mode shows the journal textarea only after vault unlock — show a PIN prompt in place of the textarea.
- [ ] 320px screen (iPhone SE) → David mode: breathing orb scales to 80vw. SOS button occupies full width. Walt mode: full-width textarea, no sidebar elements.

---

### Phase 2: Ned + Lisa (v1)

**Objective:** Ship the medium-density service and achievement modes.

**Logic & State:**
- React Query hooks: `useStreakData()`, `useXPSystem()`, `useMissions()` — Ned
- React Query hooks: `useServiceFriends()` (existing from PROJ-05), `useVitalityData()` — Lisa
- Mode-switch transition animations (CSS transitions, 300ms, reduced-motion respects `prefers-reduced-motion`)

**UI/UX — Ned Mode:**
- Streak counter as hero element with flame animation
- XP system: each completed task awards points, displayed in real time
- Daily mission list: checkbox-based, gamified labels ("Mission" not "Task")
- Progress bar for daily goal completion
- Stats dashboard: this week / this month / personal best
- Celebration animations on milestone hits (Day 7, 30, 90, 1 year)
- Typography: condensed sans-serif, high contrast, high energy

**UI/UX — Lisa Mode:**
- Sponsee dashboard: card per sponsee with days sober, last contact, status (stable / at-risk / new)
- Task per sponsee: one actionable next step visible per card
- Vitality Module: Lisa's own wellbeing score surfaced prominently
- Quick contact: one-tap to send check-in message to sponsee (with consent)
- Reading Share Button: share daily reading directly to a sponsee
- Invite flow: streamlined sponsee onboarding
- Typography: warm serif (Palatino-adjacent), structured layout, planner aesthetic

**Somatic Check:** Ned mode — streak-break UI must never be punishing. Smart Reset logic silently moves missed tasks. No red states, no "failed" language. Lisa mode — amber tones throughout; no urgency that induces burnout.

**Reward:** Ned mode: XP on every task completion. Celebration animation on milestones. Lisa mode: reward is relational — "Sarah reached Day 30" is the celebration.

**Success Criteria:** Lisa's sponsee dashboard replaces current sponsee UX with no feature regression. Mode-switch transition feels responsive (<300ms perceived).

**Edge Cases:**
- [ ] `navigator.onLine` is false → Ned mode: streak data cached for 48h. Tasks write to cache, sync on reconnect. Lisa mode: sponsee list cached; contact actions queue and send on reconnect.
- [ ] `isVaultUnlocked` is false → Ned mode: streak and missions visible (not encrypted). XP system visible. Lisa mode: encrypted sponsee notes hidden; card metadata (days sober, last contact) visible as plaintext metadata.
- [ ] 320px screen → Ned mode: streak hero full-width. Mission list single column. Lisa mode: sponsee cards full-width, single column. No horizontal scroll.

---

### Phase 3: Maya (v1)

**Objective:** Ship the high-density analytical mode.

**Logic & State:**
- React Query hooks: `useWorkbookProgress()`, `useTriggerHeatmap()`, `useAIInsightEngine()`
- Analytics events for mode switches logged to Firestore (with consent)
- Maya mode is the first mode to actively query Gemini for pattern analysis

**UI/UX — Maya Mode:**
- Workbook matrix: all active workbooks with progress bars, module counts, completion status
- Trigger frequency heatmap: 14-day rolling view, severity vs. frequency axes
- AI Insight Engine: terminal-style interface for querying pattern data
- DENTS framework tracker
- Cost-Benefit Analysis tool (CBA): integrated in-mode, not buried in settings
- Session statistics in header bar: modules complete, AI insights generated, data points logged
- Typography: monospace throughout, dense information layout, dark terminal aesthetic

**Somatic Check:** Maya mode is the one mode where information density is intentional and desired. The somatic check is inverted: does the UI *under-serve* her analytical needs? Missing data or hidden controls would be the failure mode for Maya.

**Reward:** Workbook completion percentage and AI insight count are Maya's progress signals. No gamification — this is mastery-based reward.

**Success Criteria:** Maya mode workbook progression matches parity with non-adaptive workbook UX. All existing workbook features accessible within Maya mode without navigating to another section.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Workbook matrix shows cached data. AI Insight Engine shows "Analysis requires connection" text link. Heatmap shows cached 14-day window.
- [ ] `isVaultUnlocked` is false → Workbook content (encrypted answers) hidden. Workbook structure and progress percentage visible (plaintext metadata). Prompt PIN entry in-line.
- [ ] Gemini API rate limit hit → AI terminal shows queued state; retry automatically after 30s. Never crash the mode.
- [ ] 320px screen → Heatmap collapses to 7-day view. Matrix goes single column. Terminal becomes full-screen on tap.

---

### Phase 4: Adaptive Intelligence

**Objective:** Enable the app to respond to mode-switch patterns with clinical welfare checks.

**Logic & State:**
- Session mode history logging (encrypted, opt-in)
- Welfare check trigger logic: 4+ consecutive sessions in David mode → surface gentle check-in
- Persona usage analytics dashboard (admin-only, aggregate anonymised data)

**Welfare Check Design:**
> *"You've been using grounding mode for a few days. How are you doing?"*

This is a meaningful clinical touchpoint. It must be:
- Opt-in (consent captured at onboarding)
- Gentle — not alarming, not a diagnostic assessment
- Actionable — offer to connect with sponsor, or surface a crisis resource
- Reviewed by clinical advisors before rollout (see Phase 5)

**UI/UX:**
- Welfare check surfaces as a soft modal at session start (not mid-session)
- Two options: "I'm okay, continue" and "I could use support" (routes to sponsor call or 988)
- No forced response — dismiss is always available

**Success Criteria:** Welfare check prototype tested with clinical advisors and approved for rollout. Analytics pipeline confirmed with correct consent gating.

**Edge Cases:**
- [ ] User opts out of mode history → Welfare check never triggers. Mode preference still persists.
- [ ] User switches from David to Ned and back: does this reset the 4-session counter? Decision: yes — any non-David session resets the counter.

---

### Phase 5: v1.0 Release

**Objective:** Full QA, accessibility audit, and release readiness.

- Full QA across all 5 modes on iOS, Android, and desktop PWA
- Accessibility audit: WCAG AA compliance across all 5 token sets. David mode requires AAA contrast (crisis state, low screen brightness).
- App Store metadata updated to reflect the adaptive UI as a feature
- Investor demo materials prepared

**Success Criteria:** App Store rating maintains 4.5+. Day-7 retention improves versus single-UI baseline. Clinical advisor sign-off on welfare check feature.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:**
  - `usePersonaMode()` — read, write, persist to Firestore
  - `usePersonaHistory()` — encrypt before write, decrypt on read; raw Firestore document must contain only ciphertext
  - Token switching — assert correct CSS variables are applied per mode
  - David mode: SOS button visible within 3 taps from cold launch (automation)
  - Walt mode: no gamification elements render in the component tree (snapshot test)
  - Ned mode: streak counter updates in real time on task completion
  - Maya mode: workbook matrix shows correct completion % from encrypted workbook data

- [ ] **The Subway Test (Offline Resilience):**
  - All five modes must display usable UI when `navigator.onLine` is false
  - David mode: breathing orb and SOS must function with zero network
  - Walt mode: journal entry must write to TanStack cache and confirm with "saved locally" indicator
  - No mode may show a blank screen or unhandled error state offline

- [ ] **The "Lost PIN" Test (Crypto-Shredding):**
  - On PIN reset (crypto-shred), `personaModeHistory` encrypted collection must be confirmed deleted
  - Post-reset: mode preference (plaintext, in `users/{uid}`) persists — only the history is shredded
  - Verify via Firebase Emulator: document is absent after crypto-shred

- [ ] **The David Safety Test (Persona-Specific):**
  - In David mode, count the taps from cold launch to SOS button activation. Must be ≤ 3.
  - In David mode, confirm: no notification badges visible, no task list visible, no navigation bar visible, 988 footer always in DOM.
  - In David mode with vault locked: 988 footer still renders. SOS still renders. No PIN prompt blocks the crisis flow.

- [ ] **Accessibility Check:**
  - Colour contrast: David mode target AAA (7:1), all others AA (4.5:1)
  - Touch targets: David mode minimum 56px. All other modes minimum 44px.
  - `prefers-reduced-motion`: all animations (breathing orb, flame, celebrations) must pause or simplify

---

## 6. Open Questions

*These must be resolved before Phase 1 begins. Do not re-litigate them without updating this document.*

| # | Question | Options | Status |
|---|---|---|---|
| 1 | **Default mode for new users** | (a) Onboarding quiz routes them · (b) David is default for safety · (c) User chooses at first launch | ❓ Unresolved |
| 2 | **Mode-switch friction** | (a) Always one tap, no friction · (b) Minimal confirmation ("Switch to Ned mode?") | ❓ Unresolved |
| 3 | **Navigation consistency** | (a) Each mode determines its own navigation (current prototype) · (b) Shared nav bar across all modes | ❓ Unresolved |
| 4 | **Analytics consent model** | (a) Opt-in per feature at onboarding · (b) Part of general onboarding consent flow | ❓ Unresolved |
| 5 | **Crisis escalation from non-David modes** | (a) App suggests switching to David mode on high-severity trigger · (b) No paternalistic mode-switching — user controls | ❓ Unresolved |
| 6 | **Community feed (PROJ-04) behaviour per mode** | (a) Mode-specific views (list/card/hidden) · (b) Community feed is mode-agnostic | ❓ Unresolved |

---

## 7. Companion Artefacts

The following artefacts were created alongside this spec and must be stored in the same project folder:

| File | Description |
|---|---|
| `mrt_adaptive_ui.jsx` | React prototype demonstrating all 5 persona modes with distinct layouts, colour systems, and interaction patterns. Working proof of concept — not a production component. Start here when the project re-enters the sprint. |
| `mrt_brand_review.jsx` | Brand audit dashboard that surfaced the insight about personas as runtime architecture, built from MRT Brand Guidelines v3.0 review. |
| `MRT_Master_Marketing_Brand_Strategy_Guidelines_v3.0.pdf` | Defines the five personas, their emotional states, and their messaging contracts — the source of truth for the per-persona UI contracts in Section 3. |

> **Note for future sessions:** The adaptive UI prototype demonstrates the concept convincingly. When this project re-enters the sprint, review the prototype with the full team before redesigning from scratch. The five layout grammars (David: 3-node depth, Maya: 12-node depth) are the core architectural insight. Do not flatten them into a single component tree with conditional rendering — that defeats the purpose of the engine.

---

## 8. Feature Flag

This feature ships behind `FEATURE_ADAPTIVE_PERSONA_UI` in `src/lib/featureFlags.ts`.

The flag is `false` in production until Phase 5 QA is complete. It can be enabled per-user for internal testing by setting `featureFlags.adaptivePersonaUI: true` in the user's Firestore profile document.

---

*MRT · PROJ-45 Adaptive Persona UI Engine · v0.1 DRAFT · May 2026 · Status: PARKED*