---
name: fix
description: Surgical bug fix. Paste the error log and file content. Produces a diff plan before any code. Zero collateral damage.

---

# MRT Surgical Fix Protocol

## Pre-Check
Confirm the error log and relevant file are in context. If not, ask for them before proceeding.

## Process
1. Root cause: identify the exact line and character causing the error (one sentence)
2. ZK check: if this file touches crypto.ts, useEncryption, or any Firestore write — confirm the fix does not move the encryption boundary
3. Diff plan before any code:
   REMOVE (line N): [exact text]
   ADD    (line N): [exact text]
4. Regression test: write one Vitest test that would have caught this error
5. Verification: state the exact command to run

## Constraints
- NO variable renaming or cleanup outside the error scope
- NO deleting helper functions unless they are the error source
- NO any types — use unknown or a proper interface
- If the fix requires structural changes: output SURGICAL_LIMIT_REACHED, describe the minimal unsafe fix and a separate refactor ticket