# 📁 Project 85: Goal Ladder Immersive Redesign & Hero-Derived Dashboard Theming

**Status:** 🟡 Active (PR #131 open, pending review/merge to `main`)
**Primary Persona:** Ned (Goal Ladder's target persona; also the persona most engaged by the Dashboard's visual identity)
**Objective:** Redesign the "Goal Ladder" game screen with a literal SVG ladder visual and a dark-immersive treatment matching the app's existing dark-glass visual family, and make the Dashboard's header/background derive from whichever of the 5 colors the user has picked for their Sobriety Hero card instead of a fixed color for everyone.

---

## 1. The Executive Summary
**User Story:** As Ned, I want Goal Ladder to actually feel like climbing a ladder, not just tapping through plain text cards, and as any user, I want my Dashboard to reflect the personal color identity I already chose for my Sobriety Hero card.
**Competitive Gap:** N/A — visual polish/personalization, not a competitive differentiator. Lightweight spec per protocol (written retroactively during ticket-close — see §6); no new data, schema, or AI surface. Personalized, identity-driven theming (vs. every competitor's one-size-fits-all palette) is a soft differentiator worth noting even though it wasn't the driver for this ticket.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Both changes are purely presentational. Goal Ladder's existing `recordProgress`/`completeSession` calls are unchanged (copied verbatim from the prior implementation). The Dashboard theming change only *reads* the already-existing, already-unencrypted `heroColor` profile field (documented in `CLAUDE.md`'s ZK boundary table as intentional plaintext metadata) — no new writes introduced.
* [x] **Encryption Strategy:** N/A — no new data touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes beyond one new interface field. New files: `src/components/games/goalLadder/LadderProgress.tsx` (pure presentational SVG component). Modified: `src/components/games/goalLadder/GoalLadder.tsx` (now self-contained, no longer wraps `GameShell`), `src/lib/heroColors.ts` (each `HeroColorTheme` entry gains `dashboardHeader: {from,via,to}` and `dashboardPage: string`), `src/pages/Dashboard.tsx` (reads `getHeroColorTheme(userProfile?.heroColor)` instead of the removed static `THEME.dashboard`), `src/lib/theme.ts` (the now-dead `dashboard` entry deleted).

**Types (`src/lib/heroColors.ts`):**
```typescript
export interface HeroColorTheme {
  label: string;
  gradient: string;
  shadow: string;
  accentText: string;
  glow: string;
  swatchClass: string;
  dashboardHeader: { from: string; via: string; to: string }; // new
  dashboardPage: string; // new
}
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* Goal Ladder: all existing session/scoring/progress-recording logic (`status`/`rung` state, `handleStart`, `handleClimb`, `recordProgress`, `completeSession`) copied verbatim — only the JSX chrome changed. Now wraps `GameSessionProvider` directly (already exported standalone) instead of via `GameShell`, so `CravingBuster`/`ThoughtChallenge`/`TriggerMatch` (the shell's other consumers) are untouched.
* Dashboard theming: `userProfile` was already available via `useUserProfile()` in `Dashboard.tsx` — no new hook needed, just a `getHeroColorTheme()` call.

### Phase 2: UI/UX & Gamification
* **File:** `src/components/games/goalLadder/LadderProgress.tsx` (new)
  * Literal SVG ladder — two rails, 8 rungs that light up teal (`#2DD4BF`, matching `PERSONA_COLORS.ned` already used on the Games Hub) as the player climbs, plus a marker tracking current position via an animatable CSS `transform`.
* **File:** `src/components/games/goalLadder/GoalLadder.tsx`
  * Full-bleed dark-immersive background (`linear-gradient(160deg,#2E1A47,#1B0F2E)` + ambient glow blobs), following the same visual family as `GlassCard.tsx`/`ROSCAssessmentCard.tsx`/`UrgeSurfer.tsx`. Custom minimal header (title + score chip) and footer (Exit + Pause/Resume) replace `GameHeader`/`GameFooter`'s equivalent, restyled dark instead of shared.
* **File:** `src/lib/heroColors.ts`
  * **Approved deviation from the literal request** ("header lighter than hero"): contrast analysis showed every Tailwind shade lighter than the hero card's own tones scores under 2:1 against `VibrantHeader`'s white title — worse than the Tasks bug fixed in PROJ-84. Confirmed with user: header instead stays in the hero's hue family but darkens only as much as needed for legibility (contrast-checked per color, ~3.5-4+ margin); background goes genuinely pale as requested (100-tier initially, bumped to 200-tier in a same-PR follow-up commit after user feedback that 100 read too washed-out).
* **Somatic Check:** No red/alarm states in either change. Goal Ladder's redesign is purely additive visual feedback on unchanged tap-to-climb mechanics. Dashboard theming is cosmetic only.
* **Reward:** Goal Ladder's lit-rung/marker feedback directly serves Ned's persona need for visible momentum, replacing what was previously the most static screen in his game set.

### Phase 3: Edge Cases
* [x] Goal Ladder: existing `GoalLadder.test.tsx` (mocks `useNavigate`/`useGameProgress`, asserts on text content only) confirmed to need zero changes, ran unmodified.
* [x] Dashboard theming: confirmed via grep that `THEME.dashboard` had exactly one consumer (`Dashboard.tsx`) before deletion, and that `heroColors.ts` had exactly two consumers (`Profile.tsx`, `SobrietyHero.tsx`) before this PR added a third — no blast radius to unrelated pages.
* [x] Caught and fixed a real bug during visual verification: Goal Ladder's `<h1>` title rendered dark blue instead of white, due to a global `h1`-`h6` base color rule in `index.css` — fixed with an explicit `text-white` class matching `VibrantHeader.tsx`'s existing convention.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing throughout (before and after a mid-ticket rebase — see §6).
* [x] **Visual/manual check:** No auth credentials available in this environment; verified by rendering the real components with the real compiled Tailwind CSS to static HTML and screenshotting with Playwright — Goal Ladder's idle/mid-climb/complete states, and all 5 hero colors' header+card+background combinations (both the 100-tier and the 200-tier follow-up).
* [x] **The Subway Test:** N/A (no network/data dependency in either change).
* [x] **The "Lost PIN" Test:** N/A (no encrypted data involved).

---

## 6. Process Notes
* This spec was written retroactively during `ticket-close`, after implementation — see PROJ-84 §6 for the same note; both tickets in this session shared the gap.
* **Branch-reuse correction:** this branch's prior PR (#130) merged to `main` before this work started. The two commits for this ticket were found stacked on top of already-merged history on the same branch name; they were rebased cleanly onto latest `main` and force-pushed before opening PR #131, per the session's branch-reuse rule (never stack unmerged work on a merged PR's history).
