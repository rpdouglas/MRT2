# 📐 Feature Spec: Wisdom (Workbooks)

**Status:** Live (v1.1)
**Storage:** `users/{uid}/workbook_answers/{workbookId_questionId}`

## 1. Data Structure
To prevent state conflicts, each answer is stored as an individual document.
* **ID Format:** `[workbookId]_[questionId]`
* **Fields:** `answer` (Encrypted), `isEncrypted` (Bool), `updatedAt` (Timestamp).

## 2. Reading Experience (Zen Mode)
* **Focus:** `WorkbookSession.tsx` implements a full-screen, distraction-free reading layer using `@tailwindcss/typography`.
* **Data Safety:** Answers are auto-saved to Firestore via `useAutoSave` every 2 seconds. Data is encrypted client-side *before* transmission.

## 3. AI Integration
* **Coach:** On-demand, individual question feedback via `getGeminiCoaching`.
* **Compass:** Aggregate section analysis via `analyzeFullWorkbook`. Suggested actions added to Habits are tagged with `source: 'ai'` to route them to the Action Plan tab.

## 4. Gamification
* **Chapters Mastered:** Calculated locally in `Workbooks.tsx` by cross-referencing completed answers against the required questions in the static `WORKBOOKS` schema.
