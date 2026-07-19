# 📁 Project 53: ROSC Matrix Visual Upgrade (Pill Capsules)

**Status:** ✅ Shipped  
**Primary Personas:** Maya (The Systematiser) / Walt (The Zen Master)  
**Objective:** Replace the Recharts-based radar chart in the ROSC Matrix with the newly designed, animated "Pill Capsules" visualization, introducing a premium glassmorphic dark theme.

---

## 1. The Executive Summary
**User Story:** * **As** Maya, I want my recovery capital data presented in a highly legible, segmented format so I can easily track my exact scores and month-over-month growth.
* **As** Walt, I want the visual feedback of my monthly check-ins to feel premium, calm, and deeply reflective of my ongoing momentum.

**Context:** The current `Recharts` radar chart, while functional, lacks the high-fidelity somatic feedback desired for the "Momentum Kinetic" theme. This project ports a custom-built, animated "Pill Capsule" UI into the Insights dashboard, translating raw inline styles into scalable Tailwind CSS.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** High. The component renders decrypted ROSC scores.
* [x] **Encryption Strategy:** UNCHANGED. This is strictly a Presentation Layer update. The underlying Firestore structure (`ROSCScore`, `trajectory`, `encryptedAIContext`) and the local decryption boundary remain completely unaffected.
* [x] **Key Rotation:** Not impacted by this presentation update.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:** None.

**File Architecture Changes:**
* `src/components/insights/ROSCRadarChart.tsx`: Deprecated/Deleted.
* `src/components/insights/ROSCPillCapsules.tsx`: NEW. Contains the segmented logic and `useSegReveal` hook.
* `src/components/insights/ROSCAssessmentCard.tsx`: Modified to wrap the new glassmorphic shell.

*Note: The `recharts` dependency will remain in `package.json` as it is utilized by other insight features, but it will be retired from the ROSC Matrix.*

---

## 4. Implementation Phases 🏗️

### Phase 1: Component Porting & Tailwind Conversion
* Create `src/components/insights/ROSCPillCapsules.tsx`.
* Translate the inline styles from the `pillcapsule_sample.jsx` mockup into idiomatic Tailwind CSS classes (keeping inline styles only for dynamic attributes like animation delays or specific hex gradients).
* Port the `useSegReveal` hook to handle the staggered 1-10 segment fill animation.
* Build the Pill Segments: Convert the 10 discrete capsule segments into a flex container. Implement the visual diffing between the `current` score (gradient + glow) and the `previous` score (subtle fill).
* Implement the `Legend` and `PillarLabel` sub-components internally.

### Phase 2: The Glassmorphic Shell Integration
* Update `ROSCAssessmentCard.tsx` to integrate the premium dark `GlassShell` styling with ambient glowing orbs.
* Swap the expanded state's chart container from the current light theme (`bg-white`, `border-fuchsia-100`) to the new dark theme.
* Adapt `ROSCAssessmentCard` to hide its default light-themed total score banner when expanded, utilizing the `GlassShell`'s integrated custom `CardHeader`.

### Phase 3: Data Wiring
* Connect the `ROSCPillCapsules` props directly to the `ROSCAssessment` data type.
* Map `assessment.scores` to the 4 specific domains (Health, Home, Purpose, Community).
* Pass `previous` assessment data to correctly map the baseline \"ghosted\" pill segments from the prior month.
* Refactor the `gain` string to calculate dynamically based on `current` vs `previous` totals.

---

## 5. QA & Verification 🧪
* [x] **Animation Integrity:** Verify that the `useSegReveal` staggered timeouts respect the 1-10 scale and do not glitch or stutter upon component re-renders.
* [x] **Mobile Responsiveness:** Ensure the flex layout and SVG boundaries scale correctly down to a 320px viewport width (e.g., iPhone SE).
* [x] **Fallback States:** Test the UI when no `previous` assessment exists (first-time users). Ensure the baseline ghosting gracefully hides without throwing undefined errors.
* [x] **Strict Typing:** Run `npm run lint` and `npm run check` to ensure no `any` types were introduced during the JSX to TSX porting process.