# 📐 Feature Spec: Wisdom (Workbooks & Library)

**Status:** Live (v2.2 — see Project 55: Workbook Remediation)
**Storage:** `users/{uid}/workbook_answers/{workbookId_questionId}`

## 1. Data Structure
To prevent state conflicts, each answer is stored as an individual document.
* **ID Format:** `[workbookId]_[questionId]`
* **Fields:** `answer` (Encrypted), `isEncrypted` (Bool), `updatedAt` (Timestamp).
* **Reads/writes:** exclusively through the `useWorkbookAnswers` hook (`src/hooks/useWorkbookAnswers.ts`), which wraps `src/lib/workbookAnswers.ts`'s plain Firestore CRUD in TanStack Query (`useQuery` for reads, `useMutation` with optimistic rollback for writes) — no page calls `getDocs`/`setDoc` directly. Decryption is gated strictly on the `isEncrypted` field.

## 2. The Library Hub (`Workbooks.tsx`)
The main entry point is structured via a dual-tab navigation system:
* **Workbooks Tab:** Renders the interactive, 12-Step, Buddhist logic flows, and Specialty workbooks.
    * **Core Asset:** Includes the fully populated "Women for Recovery" workbook. (This asset is active in the codebase and should be heavily utilized in Go-To-Market campaigns targeting the "Lisa" persona).
* **Fellowships Tab:** A dedicated directory featuring outbound links to official websites and core literature for major recovery modalities (AA, NA, SMART, Recovery Dharma, WFS).

## 3. Reading Experience & Mobile UX (`WorkbookSession.tsx`)
* **Zen Mode:** A full-screen, distraction-free reading layer using `@tailwindcss/typography`.
* **Mobile Keyboard Protection:** The layout uses strict flexbox constraints (`flex-1 min-h-0` on the parent, `shrink-0` on the question text, and `flex-1 resize-none` on the textarea). This ensures that when virtual keyboards appear on iOS/Android, the input area shrinks dynamically rather than pushing the question context off the screen.
* **Data Safety:** `useAutoSave` debounces input for 2 seconds, then delegates the write to `useWorkbookAnswers`'s `saveAnswer` mutation, which encrypts client-side *before* transmission.

## 4. AI Integration
* **Coach:** On-demand, individual question feedback via `getGeminiCoaching` (powered by ultra-fast `flash-lite`).
* **Compass:** Aggregate section analysis via `analyzeFullWorkbook`. Suggested actions added to Habits are tagged with `source: 'ai'` to route them to the Action Plan tab.

## 5. Content Coverage
* All 12 steps of the `12_steps` workbook (`src/data/workbooks.ts`) are hand-authored, step-specific content — Steps 1 and 12 predate Project 55; Steps 2-11 were rewritten under Project 55 to replace a generated placeholder template, each with 15 unique, literature-grounded `context` strings (previously 3 contexts shared across each step's 5-question sections). Guarded by `src/data/__tests__/workbooks.test.ts`.
* The Dashboard's workbook "Mastery" stat denominator is computed dynamically from `WORKBOOKS` (`TOTAL_WORKBOOK_QUESTIONS` in `src/lib/gamification.ts`) rather than a hardcoded guess, and is displayed as "Questions Answered: X / Y" rather than a bare percentage.
