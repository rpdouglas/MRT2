
# 🛠️ The Maintenance Protocol (v1.0)

**Project:** My Recovery Toolkit (MRT)
**Objective:** Automate the "Shadow Processes" of documentation, data mapping, and debt reduction to prevent system rot.

---

## Protocol A: The Schema Sync (Data Dictionary)

**Frequency:** Weekly, or after modifying `types.ts`.
**Goal:** Keep a human-readable map of the database structure so we don't forget field names or types.

**Prompt:**
```text
I am uploading `src/types/index.ts` (or relevant type definitions) and `src/lib/gemini.ts`.

Task: Generate a "Data Dictionary" table for our Master Documentation.
1. List every Firestore Collection (e.g., `users`, `journals`, `workbooks`).
2. For each collection, list the Fields, their Data Types, and Description.
3. Highlight any "Virtual Fields" (fields that exist in the App Type but not in the DB, e.g., derived state).
4. Note any fields that are "Legacy/Optional" (marked with `?`).

```

---

## Protocol B: The Debt Ledger (Technical Debt Sweep)

**Frequency:** Bi-Weekly.
**Goal:** Surface hidden TODOs, hacks, and loose typing before they cause bugs.

**Prompt:**

```text
I am providing a full codebase dump.

Task: Perform a "Technical Debt Audit".
1. Scan for comments containing `TODO`, `FIXME`, or `HACK`.
2. Scan for usage of `any` type or `@ts-ignore`.
3. Scan for "Magic Numbers" or hardcoded strings that should be constants.

Output a prioritized "Debt Ledger" table:
- Severity (High/Med/Low)
- File Path
- Issue Description
- Suggested Fix Strategy

```

---

## Protocol C: The Release Scribe (Changelog)

**Frequency:** Before pushing to Production.
**Goal:** Translate technical git commits into a user-friendly update list.

**Prompt:**

```text
I am providing the list of Git Commits since the last release (or a summary of features built).

Task: Write the "What's New" release notes for the end users.
1. Tone: Encouraging, professional, recovery-focused.
2. Grouping: Group updates by "New Features," "Improvements," and "Fixes."
3. Translation: Translate technical terms (e.g., "Refactored Recharts debounce") into user benefits (e.g., "Smoother charts that load faster").

