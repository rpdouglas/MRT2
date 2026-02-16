# 📐 Feature Spec: Wisdom (Workbooks)

**Status:** Live (v1.0)
**Context:** Structured recovery content (12-Step, CBT, Dharma).

## 1. Overview
A static library of interactive workbooks. Users answer questions, which are encrypted and stored in `users/{uid}/workbook_progress`.

## 2. Data Structure
* **Source:** `src/data/workbooks.ts` (Static JSON).
* **Storage:** `workbook_progress` collection.
* **Encryption:** Answers are encrypted individually.

## 3. AI Features
* **The Coach:** "Get AI Coaching" button sends the Question + Answer to Gemini 2.5 Pro.
* **Analysis:** "Consult Compass" (Wizard) analyzes the entire section for patterns.

## 4. Verification Checklist
* [ ] Does progress persist after refresh?
* [ ] Are answers truly encrypted in Firestore?
* [ ] Does the "Mastery" score update on the dashboard?
