# 📐 Feature Spec: Wisdom (Workbooks & Library)

**Status:** Live (v2.1)
**Storage:** `users/{uid}/workbook_answers/{workbookId_questionId}`

## 1. Data Structure
To prevent state conflicts, each answer is stored as an individual document.
* **ID Format:** `[workbookId]_[questionId]`
* **Fields:** `answer` (Encrypted), `isEncrypted` (Bool), `updatedAt` (Timestamp).

## 2. The Library Hub (`Workbooks.tsx`)
The main entry point is structured via a dual-tab navigation system:
* **Workbooks Tab:** Renders the interactive, 12-Step, Buddhist logic flows, and Specialty workbooks.
    * **Core Asset:** Includes the fully populated "Women for Recovery" workbook. (This asset is active in the codebase and should be heavily utilized in Go-To-Market campaigns targeting the "Lisa" persona).
* **Literature Tab:** A placeholder for upcoming classic reading materials and daily meditations.

## 3. Reading Experience & Mobile UX (`WorkbookSession.tsx`)
* **Zen Mode:** A full-screen, distraction-free reading layer using `@tailwindcss/typography`.
* **Mobile Keyboard Protection:** The layout uses strict flexbox constraints (`flex-1 min-h-0` on the parent, `shrink-0` on the question text, and `flex-1 resize-none` on the textarea). This ensures that when virtual keyboards appear on iOS/Android, the input area shrinks dynamically rather than pushing the question context off the screen.
* **Data Safety:** Answers are auto-saved to Firestore via `useAutoSave` every 2 seconds. Data is encrypted client-side *before* transmission.

## 4. AI Integration
* **Coach:** On-demand, individual question feedback via `getGeminiCoaching` (powered by ultra-fast `flash-lite`).
* **Compass:** Aggregate section analysis via `analyzeFullWorkbook`. Suggested actions added to Habits are tagged with `source: 'ai'` to route them to the Action Plan tab.
