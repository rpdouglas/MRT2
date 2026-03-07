# 📐 Feature Spec: Insights Log

**Status:** Live (v2.0)
**Context:** A timeline of AI-generated coaching and pattern analysis.

## 1. Data Structure (Expanded Schema)
**Collection:** `insights`
The log handles polymorphic data types with rich, AI-extracted arrays:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | 'journal' \| 'workbook' |
| `summary` | String | AI narrative |
| `relapse_risk_level` | String | 'Low' \| 'Moderate' \| 'High' \| 'Critical' |
| `trajectory` | String | 'Improving' \| 'Declining' etc. |
| `hidden_correlations` | Array | Hidden links identified by Deep Pattern AI |
| `key_themes` | Array | Recurring topics from Comparative analysis |
| `suggested_actions` | Array | List of 3 recommended habits |

## 2. Features
* **Bento Grid UI:** Renders the rich arrays into a high-density, multi-column "Bento Grid" using vibrant background colors (`bg-purple-50`, `bg-rose-50`, etc.) that align with the "Vibrant Momentum" design system.
* **Action Integration:** "Add to Quest" buttons allow users to convert AI advice into tracked `Tasks` with a 7-day due date and the `ai` source tag.
* **Graceful Degradation:** The UI safely checks for the presence of new arrays (`hidden_correlations`, etc.) and falls back cleanly for legacy insight documents that only utilized the generic `pillars` map.
