# 📐 Feature Spec: Insights Log

**Status:** Live (v2.2)
**Context:** A timeline of AI-generated coaching and pattern analysis.

## 1. Data Structure (Expanded Schema)
**Collection:** `insights`
The log handles polymorphic data types with rich, AI-extracted arrays depending on the source:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | 'journal' \| 'workbook' |
| `summary` | String | AI narrative |
| `relapse_risk_level` | String | 'Low' \| 'Moderate' \| 'High' \| 'Critical' (Journal Deep Dives) |
| `trajectory` | String | 'Improving' \| 'Declining' etc. (Journal Reviews) |
| `pillars` | Map | Contains `understanding` and `blind_spots` always, plus a third field that differs by `type`: `emotional_resonance` for Workbook reviews, `growth` for Journal reviews/Deep Dives. (Both variants defined in `InsightPayload`, `src/lib/insights.ts`.) |
| `hidden_correlations` | Array | Hidden links identified by Deep Pattern AI |
| `key_themes` | Array | Recurring topics from Comparative analysis |
| `suggested_actions` | Array | List of 3 recommended habits |

## 2. UI Architecture & Navigation
* **Collapsible Timeline:** To prevent cognitive overload, insights are passed through `groupItemsByYearAndMonth` and rendered as a grouped timeline.
* **Accordion Rows:** Each insight is wrapped in a `@headlessui/react` `<Disclosure>`. The collapsed header displays the Date, Scope Context, and Risk/Trajectory badges.
* **Bento Grid Panels:** Expanding the accordion reveals the high-density "Bento Grid" (Strengths, Risks, Key Themes, Hidden Links) using vibrant background colors (`bg-purple-50`, `bg-rose-50`) aligned with the "Vibrant Momentum" design system.

## 3. Action Integration
* "Add to Quest" buttons allow users to convert AI advice into tracked `Tasks` with a 7-day due date and the `ai` source tag. The UI explicitly disables these buttons upon click to prevent accidental duplicate task creation.
