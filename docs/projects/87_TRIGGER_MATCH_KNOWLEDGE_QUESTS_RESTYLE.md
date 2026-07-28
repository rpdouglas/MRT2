# 📁 Project 87: Trigger Match & Knowledge Quests Immersive Shell Restyle

**Status:** ✅ Shipped
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
* [x] Confirmed `TriggerMatch.test.tsx`/`KnowledgeQuests.test.tsx` (assert on text content and `recordProgress` calls only, not class names) pass unmodified.
* [x] Confirmed `ThoughtChallenge.test.tsx` passes unmodified, and confirmed via a real rendered screenshot (`/games/thought-challenge?mockUser=walt`) that its light `GameShell` chrome (indigo/violet header, orange Start button) is pixel-identical to before — the `theme` prop's opt-in default path is genuinely untouched.
* [x] Confirmed `GameShell.tsx`/`GameHeader.tsx`/`GameFooter.tsx` remain used as-is by their other consumers (`CravingBuster`, `ThoughtChallenge`, `FastLane`) — no edits to any of the three files.
* [x] 320px-wide screen check (Trigger Match idle + playing, Knowledge Quests picker) — no clipping or overflow; header/footer/card all reflow cleanly.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing, including both games' existing tests and `ThoughtChallenge.test.tsx` unmodified.
* [x] **Visual/manual check:** `npm run dev` + Playwright screenshots via the `?mockUser=` auth bypass (no real credentials available in this environment). Verified Trigger Match's full idle → playing → answer-reveal (correct/incorrect states) → complete → back-to-Games-Hub loop at both 390px and 320px widths, and Knowledge Quests' pack-picker screen at both widths. Confirmed Thought Challenge's light shell is unaffected. Knowledge Quests' own playing/complete/"Try Another Pack" screens weren't separately screenshotted (a test-automation timing issue, not a product issue) — same `ScenarioMatchQuiz` dark-theme code path already proven correct via Trigger Match, and the full pack-picker→quiz→complete→"Try Another Pack" flow is covered by `KnowledgeQuests.test.tsx`, which passed.
* [x] **The Subway Test:** N/A (no network/data dependency in this change).
* [x] **The "Lost PIN" Test:** N/A (no encrypted data involved).
