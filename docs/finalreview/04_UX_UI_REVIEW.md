# MRT2 — UX/UI Review

*Methodology note (read before the findings): this review is built from **code-level evidence** — component structure, the design-system documentation, accessibility test suites, and persona-driven UX rules encoded in `CLAUDE.md`/`docs/PERSONAS.md` — not from live, visual navigation of a running instance or screenshots captured during this audit. Where a claim would require actually looking at rendered pixels (color contrast in practice, animation feel, real-device touch-target sizing), it is marked **[Not independently verified — visual/live testing not performed in this pass]** rather than asserted as fact.*

---

## 1. Design System

The app has a named design system, **"Vibrant Momentum"** (per `README.md` and `docs/design/mrt_design_system.md`), with a single documented primary brand color scale (`blue`, `700: #1d4ed8`) extended in `tailwind.config.js`. Design reference files exist as `.jsx` samples in `docs/design/` and `docs/reports/`, suggesting a deliberate visual-language documentation practice rather than ad hoc styling.

**Rating: 7/10.** A named, documented system with a real reference implementation is above-average for a project this size. Docked because the full palette/typography/spacing scale was not independently re-verified in this pass beyond what the codebase-assessment agents sampled (Tailwind config extension is minimal — one color scale — so most visual decisions live in component-level utility classes rather than a centralized token system, which caps consistency at scale).

## 2. Navigation & Information Architecture

- **Structure:** A persistent `AppShell` (sidebar + mobile nav) wraps every authenticated route; navigation is organized around 6 bento-tile destinations from the Dashboard (Journal, Tasks, Vitality, Workbooks, Games, Tools), plus Profile and (for admins) an entirely separate Admin surface.
- **Crisis-path shortcut:** the SOS Modal is a global overlay reachable from any authenticated screen — this is architecturally the single most important IA decision in the app, since David's persona floor is "max 3 taps per flow" and the SOS modal is explicitly designed to satisfy it directly, without navigating the normal nav chrome.
- **Tools Hub** organizes 10 tools into 4 moment-based categories (Right Now / Before It Happens / After a Hard Moment / Big Picture) rather than an alphabetical or type-based list — this is a genuinely user-need-driven IA choice, mapping directly onto David (Right Now) vs. Walt/Maya (Big Picture) without requiring the user to know a CBT technique's name in advance.

**Rating: 8/10.** The IA is organized around emotional/crisis state rather than feature taxonomy, which is the correct call for this product category. **[Live click-through of the nav on a real device — not independently verified.]**

## 3. Interaction Design

Evidence of interaction-design care found in code:
- **Autosave with visible state** (Profile, WorkbookSession) — a `saving/saved/error` indicator rather than a silent save or a blocking "Save" button, reducing anxiety about data loss for a crisis-vulnerable user base.
- **Swipeable task rows** (`SwipeableTaskRow`) and a **quick-capture sheet** for Tasks — native-app-like gesture affordances on a PWA, above the median for what most PWAs bother implementing.
- **Zen-mode workbook sessions** — one question at a time, full-screen, explicitly designed to reduce cognitive load during a guided reflection exercise.
- **Deliberate non-persistence as a feature**, not a bug: Resentment Burner explicitly does not save its content anywhere — the interaction design correctly recognizes that some tools exist for catharsis, not archival.

**Rating: 8/10.** Interaction patterns consistently show evidence of being chosen for a specific emotional/cognitive reason (see the persona and Somatic Check discipline below), not just default component behavior.

## 4. Accessibility (UX-facing summary — see `08_SECURITY_ASSESSMENT.md`'s sibling audit for the technical enforcement detail)

- **Dual-gate CI enforcement**: static `jsx-a11y` ESLint rules + a runtime `axe-core` Playwright scan across 7 real routes (including the vault PIN-entry screen itself) tagged to WCAG 2.2 AA — a hard regression gate, not a best-effort checklist.
- **Near-total absence of the most common real-world a11y anti-pattern** (`<div onClick>` with no keyboard/aria support) — only one instance exists in the entire `src/` tree, and it is the textbook-correct backdrop-dismiss exception, compensated with an Escape-key handler.
- **Icon-only buttons consistently carry `aria-label`s** in every sampled file (e.g. "Refresh weather," "Start recording"/"Stop recording" as state-dependent labels, not generic).
- **Gap:** reduced-motion and focus-visible handling exist but are applied per-component (2 explicit `prefers-reduced-motion` checks found) rather than as a global CSS baseline — meaning any *new* component author has to remember to add it rather than inheriting it for free.
- **A dedicated 320px-viewport Playwright test exists** (`viewport-320.spec.ts`) — this is a genuinely rare practice that directly serves David's "zero cognitive load, low-end-device" persona floor.

**Rating: 8/10** — one of the strongest-evidenced areas in this entire audit, specifically because the enforcement is automated and CI-gated rather than trust-based.

## 5. Typography, Spacing, Visual Hierarchy, Color

**[Not independently verified — this category requires visual inspection of rendered screens, which was not performed in this pass. The `_raw_screenshots/` directory referenced in the repo (18 marketing/persona PNGs) and `docs/SCREENSHOTS_INDEX.md` were noted to exist but their contents were not reviewed as part of this specific research pass.]**

What *can* be said from code: the design system has one documented primary color scale, uses Tailwind utility classes exclusively (no CSS-in-JS, no styled-components), and PROJ-83/84/85 (referenced in the feature catalogue) are dedicated typography-scale, bento-contrast, and hero-theme polish tickets — i.e., visual-hierarchy refinement is treated as ongoing, ticketed work, not a one-time pass.

## 6. Motion & Animation

- Confetti on milestone achievement (Dashboard) — explicitly guarded by a `prefers-reduced-motion` check.
- Ember-particle burn animation (Resentment Burner) — custom `requestAnimationFrame` easing.
- Crossword celebration animation — CSS-media-query gated for reduced motion.

**Rating: 7/10** for what's verifiable — deliberate, purposeful animation (celebration, catharsis) rather than decorative motion for its own sake, with real (if not universal) reduced-motion respect.

## 7. Responsiveness

A dedicated automated test (`viewport-320.spec.ts`) targets the iPhone SE / 320px-wide breakpoint specifically — this is the narrowest common real-device width and the one most responsive-design audits skip. **[Full responsive behavior across the breakpoint range, and on real tablet/desktop viewports, was not independently visually verified in this pass.]**

**Rating: 7/10**, provisional pending live verification.

## 8. Consistency & Component System

`GuidedWorkflowEngine` (shared across 8 CBT tools) and `ScenarioMatchQuiz` (shared across 3 games) indicate genuine component-level consistency enforcement — a user who learns one guided-tool's interaction pattern gets that knowledge for free in the next 7. `GlassCard` with a `variant="games"` prop suggests a shared card primitive rather than each surface reinventing card styling independently.

**Rating: 8/10.**

## 9. Empty / Loading / Error States

Evidence found across multiple features:
- **Decrypt failure** → renders `"🔒 [Locked - Decryption Failed]"` rather than crashing or showing raw garbage (`JournalHistory.tsx`).
- **Autosave error** → visible inline status, not a silent failure (`Profile.tsx`, `WorkbookSession.tsx`).
- **Import error** → `describeImportError()` maps raw exceptions to plain-language, non-technical copy (`DataImportPanel.tsx`) — a level of empathy in error messaging most apps skip.
- **Auth error** → `describeAuthError()` similarly translates raw Firebase error codes into human copy (`Welcome.tsx`/`Login.tsx`).
- **Empty states**: Admin Analytics tab explicitly handles the zero-data case; GamesHub shows a "Continue · Week N" chip only when a Fast Lane save actually exists, implying a considered default/empty state rather than an assumed-populated one.

**Rating: 8/10** — this is a genuinely above-average pattern of turning technical failure states into calm, plain-language UX, which matters enormously for a crisis-adjacent product where a cryptic error message is not a neutral inconvenience.

## 10. Forms & Validation

Server-side payload-shape validation exists for AI calls (`validateAIProxyPayload`) and Firestore writes (`isValidJournalShape`/`isValidGameSaveShape`), but this audit did not independently verify **client-side form validation UX** (inline field errors, real-time validation feedback) across the app's many forms (Login, Profile, TaskFormModal, Feedback). **[Not independently verified.]**

## 11. Dashboard Design

The Dashboard's 6-tile bento grid, sobriety-day hero, and Dynamic Anchor Widget were all confirmed to exist and be actively iterated (3+ dedicated specs touch this single page). The deliberate relocation of gamification (Achievements) *off* the main Dashboard and into an opt-in Profile tab — specifically because Walt's persona explicitly wants zero gamification in his flows while Ned's wants streaks — is one of the strongest pieces of evidence in this entire audit that persona-driven design isn't just documentation theater; it shaped a real information-architecture decision (PROJ-76).

**Rating: 9/10** for the persona-conflict resolution shown here specifically; the visual execution itself is unverified.

## 12. Brand Identity

Consistent naming ("Vibrant Momentum" design system, "The Beacon" for push notifications, "The Ledger" for tasks, "Wisdom Log" for insights, "Recovery Compass" for AI features) suggests a considered, human voice applied consistently across the product rather than generic feature labels — a genuine differentiator against clinical-feeling competitor apps.

**Rating: 8/10.**

## 13. User Journeys — Persona Fit Assessment

| Persona | Documented need | Evidence of fit in code |
|---|---|---|
| David (crisis, Day 1-30) | Max 3 taps, zero cognitive load | SOS Modal, crisis-tool VaultGate bypass, Urge Surfer's plaintext fallback-on-locked-vault, Resentment Burner's zero-persistence design |
| Ned (Pink Cloud, Day 30-90) | Gamification, streaks, no punishment on break | Goal Ladder (no reset mechanic), streak-forgiveness-adjacent Tasks design, XP/Achievements system |
| Lisa (sponsor, AA) | Rolodex, urgency-sorted sponsee list | **Not built** — the single largest persona-to-feature gap found in this audit |
| Walt (long-term, analytical) | Depth, traceable AI, zero gamification | Deep Pattern Analysis (90-day), Data Export/Sovereignty, Achievements deliberately excluded from his default view |
| Maya (systematiser, completion-mode) | Linear progress, completion %, auditable AI | Workbook mastery %, Tool History with tag filtering, ROSC quantified scoring |
| Jordan (MAT stabiliser) | Discreet tooling, custom labels, no drug names on lock-screen | Push notification design references this constraint; **custom counter labels for MAT dosing were referenced in the persona brief but not directly confirmed present in the reviewed code** — flagged as needing direct verification |

**Overall UX Rating: 7.5/10** (code-evidenced categories average ~8; unverified visual categories are excluded from this average rather than guessed at).

## What a Full UX Audit Would Still Need

1. Live click-through on real mobile hardware (iOS Safari standalone specifically, given the app's PWA/notification constraints).
2. A structured usability pass against each of the 6 personas' documented "worst case" scenarios (the Subway Test / Lost PIN Test referenced in the spec template are automated *technical* checks, not moderated usability tests).
3. Actual color-contrast measurement (WCAG contrast ratios) — the axe-core CI gate covers *computed* contrast at test time, which is strong evidence contrast is likely compliant, but a designer's qualitative pass on hierarchy/legibility is a different question than a pass/fail contrast ratio.
4. Verification of the Jordan/MAT-specific discreet-UI claims against the actual Tasks/notification code paths.
