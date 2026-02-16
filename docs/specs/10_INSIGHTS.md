# 📐 Feature Spec: Insights Log

**Status:** Live (v1.0)
**Context:** A timeline of AI-generated coaching and analysis.

## 1. Data Structure
**Collection:** `insights`
The log handles polymorphic data types:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | 'journal' \| 'workbook' |
| `summary` | String | AI narrative |
| `pillars` | Map | Structured analysis (Growth, Blind Spots) |
| `suggested_actions` | Array | List of 3 recommended habits |

## 2. Features
* **Polymorphic UI:** Renders different cards based on `type`.
    * *Journal:* Shows Mood/Sentiment badges.
    * *Workbook:* Shows Pillars (Understanding/Growth/Blind Spots).
* **Action Integration:** "Add to Quest" buttons allow users to convert AI advice into tracked `Tasks` with a 7-day due date.

## 3. Verification
* [ ] **Filtering:** Filter by "Journal" - do Workbook entries disappear?
* [ ] **Action:** Click "Add to Quest". Does it appear in the Tasks list?
