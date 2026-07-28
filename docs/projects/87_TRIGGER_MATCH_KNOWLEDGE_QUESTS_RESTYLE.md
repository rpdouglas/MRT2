# 📁 Project 87: Trigger Match & Knowledge Quests Immersive Shell Restyle

**Status:** ⚪ Planned
**Primary Persona:** Walt (Trigger Match's `recordProgress` persona target); Knowledge Quests targets `'All'` personas but shares this ticket since it shares the same underlying component.
**Objective:** Restyle Trigger Match and Knowledge Quests to match Goal Ladder's dark-immersive full-bleed treatment (PROJ-85), extended to Recovery Jeopardy (PROJ-86) — without changing the visual appearance of Thought Challenge, which reuses the same shared `ScenarioMatchQuiz` component but stays on the light `GameShell` and is currently inactive (`active: false` on the Games Hub).

---

## 1. The Executive Summary
**User Story:** As Walt (Trigger Match) or any user working through a Knowledge Quests pack, I want these two games to feel as polished and "Vibrant Momentum" as Goal Ladder and Recovery Jeopardy, instead of reverting to plain light `GameShell` chrome while every other recently-touched game screen has moved to the dark-immersive treatment.
**Competitive Gap:** N/A — visual polish/consistency, not a competitive differentiator. Lightweight spec per protocol, matching PROJ-85/86's precedent: purely presentational, no new data/schema/AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Purely presentational. Both games' existing `recordProgress`/`completeSession` calls are unchanged. No Firestore write shape changes.
* [x] **Encryption Strategy:** N/A — no new data touched. `game_progress` fields (`score`, `gameId`, `personaTarget`, `stats.*`) stay plaintext per the existing ZK boundary table row; nothing newly sensitive is introduced.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes. Modified:
* `src/components/games/triggerMatch/TriggerMatch.tsx` — drops `GameShell` for a self-contained dark-immersive shell (`GameSessionProvider` + custom header/footer), mirroring `GoalLadder.tsx`/`RecoveryJeopardy.tsx`. Accent: `#60A5FA` (Walt's existing Games Hub persona color).
* `src/components/games/knowledgeQuests/KnowledgeQuests.tsx` — same shell swap. Accent: `#F0ABFC` (the `'everyone'` persona color already used for this game's Games Hub tile).
* `src/components/games/ScenarioMatchQuiz.tsx` — gains an **optional** `theme` prop (`{ mode: 'dark'; accent: string }`) that swaps its card/option/button Tailwind classes when present. Omitting the prop (Thought Challenge's call site) preserves today's exact light styling — zero visual diff for that consumer.
* `src/components/games/thoughtChallenge/ThoughtChallenge.tsx` — **no changes.** Confirmed as the one other `ScenarioMatchQuiz` consumer; stays on light `GameShell`, untouched call site (no `theme` prop passed).

**Types (`src/components/games/ScenarioMatchQuiz.tsx`):**
```typescript
interface ScenarioMatchQuizProps {
  items: ScenarioMatchItem[];
  onComplete: (score: number, total: number) => void;
  theme?: { mode: 'dark'; accent: string }; // new, optional — undefined preserves current light styling
}
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* No new hooks or Firestore rules. Both games' existing session/scoring state (`status`, `result`, `activePackId`) and `useGameSession`/`useGameProgress` calls are copied verbatim — only the JSX chrome and the shared quiz component's styling change.

### Phase 2: UI/UX & Gamification
* Full-bleed dark-immersive background (`linear-gradient(160deg,#2E1A47,#1B0F2E)` + ambient glow blobs), matching `GoalLadder.tsx`/`RecoveryJeopardy.tsx`/`GlassCard.tsx`. Minimal header (title, + score chip once playing) and footer (Exit + Pause/Resume) replace `GameHeader`/`GameFooter`, per-game accent color instead of a shared indigo.
* `ScenarioMatchQuiz`'s dark theme: glass card (`bg-white/[0.07] border-white/10 backdrop-blur-sm`) replacing the flat white card; option buttons restyled for the dark background, with the accent color driving hover/selected states; the `Next`/`Finish` button uses the accent color instead of hardcoded `indigo-600`. Correct/incorrect indicator colors (emerald/rose) stay as-is — they're semantic, not brand-accent.
* **Somatic Check:** No red/alarm states introduced beyond the pre-existing rose "incorrect selection" indicator (already reviewed/shipped in the current light version). Exit remains a neutral action.
* **Reward:** No scoring/XP change — purely visual polish for the shell and shared quiz card, matching Goal Ladder/Jeopardy's precedent.

### Phase 3: Edge Cases
* [ ] Confirm `TriggerMatch.test.tsx`/`KnowledgeQuests.test.tsx` (assert on text content and `recordProgress` calls only, not class names) pass unmodified.
* [ ] Confirm `ThoughtChallenge.test.tsx` (if it exists) and Thought Challenge's rendered output are unchanged — the `theme` prop is opt-in, so its call site must not be touched.
* [ ] Confirm `GameShell.tsx`/`GameHeader.tsx`/`GameFooter.tsx` remain used as-is by their other consumers (`CravingBuster`, `ThoughtChallenge`, `FastLane`).
* [ ] 320px-wide screen check for both games' new header/footer and the pack-picker list (Knowledge Quests).

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** `npm run test:once` — full suite green, including the two games' existing tests unmodified.
* [ ] **Visual/manual check:** `npm run dev`, exercise both games' full idle → playing → complete loops (and Knowledge Quests' pack-picker → "Try Another Pack" loop), confirm Thought Challenge (if reachable in dev) still renders light/unchanged.
* [ ] **The Subway Test:** N/A (no network/data dependency in this change).
* [ ] **The "Lost PIN" Test:** N/A (no encrypted data involved).
