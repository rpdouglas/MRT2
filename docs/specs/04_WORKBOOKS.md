# 📐 Feature Spec: Wisdom (Workbooks)

**Status:** Live (v1.1)
**Storage:** `users/{uid}/workbook_answers/{workbookId_questionId}`

## 1. Data Structure
To prevent state conflicts, each answer is stored as an individual document.
* **ID Format:** `[workbookId]_[questionId]`
* **Fields:** `answer` (Encrypted), `isEncrypted` (Bool), `updatedAt` (Timestamp).

## 2. AI Integration
* **Coach:** Individual feedback via `getGeminiCoaching`.
* **Compass:** Aggregate section analysis via `analyzeFullWorkbook`.
