# 📁 Project 54: Journal Insights Momentum UI Redesign

**Status:** ✅ Shipped
**Primary Persona:** Walt
**Objective:** Reformat the Journal Insights tab into a visually cohesive, emotionally intelligent dashboard utilizing the Momentum Kinetic v3.0 design system.

---

## 1. The Executive Summary
**User Story:** 
* **As** Walt, I want to review my recovery metrics, emotional velocity, and recurring themes in a calming, narrative-focused interface so that I can gain deep reflection and long-term insight without sensory overload.

**Competitive Gap:** 
Unlike traditional recovery apps that treat data as dry, clinical dashboards, this redesign shifts the insights tab to an atmospheric, reflection-first "Glass and Glow" interface (using the Walt persona rules). The interface itself responds to the emotional weight of recovery, utilizing ambient motion and semantic colors.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** High. The component processes raw journal text (to generate word clouds) and correlates mood data with time and weather.
* [x] **Encryption Strategy:** Relies on existing `src/lib/crypto.ts` patterns. Journal entries are decrypted at the UI boundary. The word cloud generation and frequency mapping must remain strictly client-side. No decrypted data leaves the device.
* [x] **Key Rotation:** Covered under the existing journal entry key rotation process in `executePinRotation`. No new schema data is being introduced.

---

## 3. Schema & Architecture 🗄️
*Define the exact Firestore paths and TypeScript interfaces.*

**Firestore Collections Impacted:**
* None. This is a pure presentation-layer refactor. Data fetches from `journals` and `insights` remain unchanged.

**Types (`src/lib/db.ts`):**
```typescript
// Existing interfaces in JournalInsights.tsx (DailyStats, WeeklyComparisonStats, WordFrequency) will be retained.
// We will introduce new Design Token types if needed for the GlassCard and PillBar integrations.
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* Retain the existing `useEffect` hooks in `src/components/journal/JournalInsights.tsx` that map daily trends, weekly comparisons, and word frequencies.
* Maintain the LocalStorage implementation for the `mrt_word_cloud_ignore_list` user blocklist.

### Phase 2: UI/UX & Gamification
* **Component 1: GlassCard Wrappers:** Replace the existing `bg-white border-indigo-50` cards with the new Momentum Kinetic v3.0 `GlassCard` component. Use the "Insights" module design tokens (Analytical gradients: `#E879F9` to `#EC4899`, dark background `#1A0528`).
* **Component 2: Typography Upgrade:** Apply `JetBrains Mono` for all data figures (Top Stats, Chart Axes, Word Frequencies) and `DM Sans` for prose, labels, and the word cloud text.
* **Component 3: Chart Styling (Kinetic Rules):** 
  * Update Recharts `AreaChart` (Emotional Velocity) to use smooth curves, translucent fills dropping from 15% opacity to 0%, and replace circular dots with horizontal ticks (if applicable).
  * Reduce chart grid line opacity to max 8%.
  * Replace the basic "Weekly Rhythm" bars with the signature Momentum Kinetic `PillBar` component or styled Recharts bars that match the pill aesthetic.
* **Somatic Check:** Does this UI induce stress? Walt mode requires reduced saturation (25% reduction), increased whitespace (40% increase), and ambient motion only. No stark red failure colors.
* **Reward:** Ensure the Top Stats visually celebrate milestones using the `state-milestone` semantic token when streaks are maintained.

### Phase 3: Edge Cases
* [x] **Empty States:** Replace dry empty states with compassionate copy (e.g., "Every journey starts with a first reflection" instead of "Not enough data yet").
* [x] **What happens if `navigator.onLine` is false?** Ensure the insights tab gracefully degrades, displaying cached data or a styled offline message without breaking the GlassCard layout.
* [x] **What happens if `isVaultUnlocked` is false?** Maintain the standard Vault Lock screen prompt before allowing access to the word cloud and decrypted journal trends.
* [x] **What happens on a 320px wide screen (iPhone SE)?** Ensure chart widths scale cleanly and the word cloud wraps without overlapping the GlassCard borders.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** Verify that the Word Cloud filtering logic and modal interactions remain intact after the UI swap.
* [x] **The Subway Test:** Disconnect network, load the Insights tab, and ensure charts render with locally cached TanStack Query data or fail gracefully.
* [x] **Visual QA:** Cross-reference the rendered component with the Walt persona rules in `docs/design/mrt_design_system.md` (Analytical state, Mystical & AI vibe).
