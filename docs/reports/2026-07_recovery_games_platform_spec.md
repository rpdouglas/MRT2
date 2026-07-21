# My Recovery Toolkit (MRT) - Recovery Games Platform v1.0

## Master Build & Architecture Specification

## 1. Project Governance & Strategic Vision

The Core Philosophy: "Vibrant Momentum." Recovery is not a punishment; it is a return to life. The Recovery Games platform reinforces coping skills, recovery knowledge, and emotional awareness through entirely local, zero-knowledge, and anti-shame mechanics.

**Strict Governance Rules:**

* **12-Step Compliance (Tradition 6):** Absolute non-affiliation. Do not use trademarked names (AA, NA, CA), specific fellowship logos, or direct literature quotes. Use neutral terminology: "Support Groups," "Recovery Literature," "12-Step Fellowships," and "Peer Principles."
* **Legal & Health Posture:** MRT is a peer-support and educational workspace, strictly not a clinical diagnostic tool or medical device.
* **The "Blue Ocean" Moat:** MRT is the "Ultimate Private Workspace." There are zero live multiplayer features, no public leaderboards, and no social feeds.

## 2. Technical Architecture & System Constraints

This build is configured for a Windows/WSL2 Ubuntu local environment.

* **Core Stack:** React, Vite, TypeScript, Tailwind CSS.
* **State Management:** Zustand (`useGameStore`, `useAchievementStore`). Zustand must operate entirely locally.
* **Backend / DB:** Firebase is used only for authentication and static hosting. Absolutely no game state, streak data, or XP is synced to Firebase.
* **Encryption Standard:** True client-side AES-GCM encryption. The database only sees encrypted blobs.
* **Data Sovereignty:** All gameplay history, CBT/REBT reflections, and XP must be saved directly to the user's Encrypted Journal.

## 3. Persona-Driven UI/UX (Tailwind Theming)

The UI must dynamically shift based on the active persona/emotional state. Never use black-and-white, shadowy, or clinical imagery.

| Persona | Emotional State | Feature Focus | Tailwind Palette |
|---|---|---|---|
| David (Day 1) | Crushing shame, isolation, paralysis. | Grounding, safety, Craving Busters, Encrypted Journal. | Sky Blue: Open horizons, breathing room, safe clean slate. |
| Ned (90 Days) | Manic energy, impatience, burnout risk. | Goal Ladder, active streaks, momentum building. | High Contrast Greens/Cyan: Energetic, friction-less reward. |
| Lisa (7 Years) | Service burnout, lacking boundaries. | Thought Challenge (CBT), boundaries, breathwork. | Warm Amber/Orange: Restorative, slowing the heart rate. |
| Walt (35+ Yrs) | Complacency, seeking deep awakening. | AI Insight Engine, Trigger Match, data sovereignty. | Rich Deep Tones (Fuchsia/Rose): Focused, distraction-free. |

**The Anti-Shame Engine Rules:**

* Missed daily challenges must silently roll over to the current day.
* No "red badge debt."
* Streaks are additive; there are no penalty screens for breaking a streak.

## 4. AI Assistant System Prompt

Use this exact context prompt when initializing a new AI coding session for this module.

> System Context: You are an expert React/TypeScript developer building the "Recovery Games" module for My Recovery Toolkit (MRT). The tech stack is Vite, React, TypeScript, Tailwind CSS, and Zustand.
>
> Absolute Constraints:
>
> * **Zero-Knowledge Architecture:** Do not write any code that sends game state, scores, or telemetry to an external server or Firebase. All state must be managed locally via Zustand and encrypted via AES-GCM before local storage.
> * **Design Language:** Do not use clinical, gloomy, or red-warning UI elements. Use Tailwind to implement "Vibrant Momentum" palettes: Sky Blue, High-Contrast Green, Warm Amber, or Deep Rich Tones depending on the component's target state.
> * **Anti-Shame Mechanics:** Never write logic that penalizes the user. Missed tasks roll over silently.
> * **Compliance:** Do not use the terms "Vault" (use "Journal" instead), "AI Sponsor," "AA," or "NA" in any copy.

## 5. Standard Game SDK Interface

To ensure scalability, every game added to the platform must strictly implement the following TypeScript interface before plugging into `GameShell`.

```typescript
export interface IRecoveryGame {
  id: string;
  title: string;
  personaTarget: 'David' | 'Ned' | 'Lisa' | 'Walt';
  initialize: () => void;
  start: () => void;
  pause: () => void;
  complete: (score: number, stats: any) => void;
  recordReflection: (reflectionPayload: any) => void; // Routes to Encrypted Journal
  exportData: () => any; // Formats for 06_DATA_EXPORT.md compliance
  destroy: () => void;
}
```

## 6. Phased Sprint Execution Plan (Asana Architecture)

### Phase 1: Architecture & Foundation

Goal: Establish the secure, local-first React environment and anti-shame state handlers.

* **Sprint 1: Core Framework & State Management**
  * Initialize `GameShell`, `GameHeader`, `GameFooter`, and `PlayerManager` components.
  * Implement the `IRecoveryGame` SDK standard.
  * Create `useGameStore.ts` and `useAchievementStore.ts` via Zustand.
  * Security Audit: Verify zero external network requests are attached to Zustand state changes.
* **Sprint 2: The Anti-Shame Engine**
  * Build localized Experience Points (XP) and streak-counting logic.
  * Implement the "silent rollover" utility for missed daily tasks.
  * Configure the Tailwind theme provider to accept dynamic persona state changes (Blue, Green, Amber, Deep Tones).

### Phase 2: Core CBT/REBT Loops & Interventions

Goal: Deploy high-frequency, evidence-based psychological tools.

* **Sprint 3: The Morning Intent (CBT Tool)**
  * Build the interactive "Morning Intent" flow focusing on REBT and cognitive restructuring.
  * Route the completion payload directly into the Encrypted Journal.
  * Apply the Sky Blue UI palette for a clean, low-stress morning experience.
* **Sprint 4: Craving-Buster Mini-Games (SOS Integration)**
  * Hook a new game router directly into the existing 1-Tap SOS Button.
  * Build 3-to-5 minute visual/rhythmic sorting games requiring zero cognitive load.
  * Implement the Web Vibration API for haptic, somatic grounding.

### Phase 3: Game Migration & Compliance

Goal: Port legacy games into the new compliant architecture.

* **Sprint 5: Fast Lane Migration**
  * Refactor legacy Fast Lane code to fit the `IRecoveryGame` TypeScript interface.
  * Attach local, private achievements (e.g., "Perfect Run") to the encrypted DB.
* **Sprint 6: 12-Step Jeopardy & Brand Safety**
  * Port Jeopardy logic to React/Vite.
  * Execute strict content scrub: Remove trademarked fellowship names and literature quotes.
  * Implement neutral category arrays ("Support Groups", "Peer Principles").

### Phase 4: Persona-Targeted Expansion

Goal: Build the specialized module library for the four user profiles.

* **Sprint 7: Persona Specific Games**
  * David: Coping Skills Challenge (Sky Blue - Grounding).
  * Ned: Goal Ladder (High Contrast Green - Momentum).
  * Lisa: Thought Challenge (Warm Amber - CBT/Boundary Setting).
  * Walt: Trigger Match (Deep Tones - AI Insight Engine pattern feeding).
* **Sprint 8: Knowledge Quests (Content Packs)**
  * Architect psychoeducation modules as decoupled JSON files (`Stress.json`, `HabitLoops.json`).
  * Build the React parser to render JSON packs as interactive, bite-sized quizzes.

### Phase 5: Data Sovereignty & Identity Processing

Goal: Fulfill the Walt specification for data ownership and enable viral marketing without breaking isolation.

* **Sprint 9: Data Sovereignty Protocol**
  * Create `docs/specs/06_DATA_EXPORT.md` specifically for game data.
  * Build cryptographic chunking utilities to batch-decrypt Encrypted Journal game logs without freezing the UI thread.
  * Compile decrypted stats and CBT reflections into a locally generated, downloadable PDF/JSON format.
* **Sprint 10: Identity Signaling Generator**
  * Build an HTML-to-canvas rendering utility.
  * Allow users to generate stylized, high-resolution "Milestone Images" (e.g., a "Jeopardy Champion" graphic) purely on-device.
  * Implement the Web Share API to allow native exporting to SMS/Instagram, maintaining app isolation while enabling user-driven social sharing.
