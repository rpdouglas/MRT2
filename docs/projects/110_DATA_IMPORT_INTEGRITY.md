# 📁 Project 110: Data Import Integrity & Zero-Knowledge Restore Fix

**Status:** 🟢 Done (2026-09-03) — Strategy B implemented, `zk-audit` passed (one risk found and fixed during the audit itself), full `npm run check` clean.
**Primary Persona:** Walt (data sovereignty — the persona who most relies on Export/Import for real backup-and-restore trust) and Dev/AI Partner (ZK boundary correctness).
**Objective:** Fix `DataImportPanel`'s "restore a backup" flow so it actually restores everything a real MRT export contains (not just journals), and so anything it recovers lands back in Firestore through the same encryption boundary every other write path uses — no plaintext content persisted server-side.

---

## 1. The Executive Summary
**User Story:** As Walt, when I export my full MRT backup and later re-import that same file (new device, after a vault reset, or just testing that my backup actually works), I want every part of it — journals, tasks, workbook answers, game history — restored, and I want the restored content to be exactly as protected as if I'd written it in the app today, not sitting in Firestore as plaintext because it happened to arrive via Import instead of the normal save path.
**Competitive Gap:** A zero-knowledge product's entire pitch is "the server never sees your plaintext." A backup/restore flow that silently reintroduces plaintext into an encrypted collection — the one flow whose entire job is data trustworthiness — undermines that pitch more than almost any other bug could. Competing sobriety apps ("I Am Sober", "Reframe") don't make this promise at all, so they have nothing to break; MRT does, so this is a real gap, not a nice-to-have.
**Source:** `TD-23` in `docs/ACTIVE_CYCLE.md`'s tech-debt ledger, found 2026-09-03 while drafting `docs/screens/profile/data.md`. Expanded during this spec's own investigation — see §1a below for a second, previously undocumented bug found in the process.

### 1a. Findings (full scope, not just the original TD-23 wording)
1. **Import silently drops non-journal data.** `importLegacyJournals` (`src/lib/importer.ts`) only ever reads `content`/`text`-shaped entries into the `journals` collection. A `FullUserData`-shaped export (the exact file MRT's own "Export JSON" produces) also contains `tasks`, `workbookAnswers`, and `gameProgress` arrays — none of them are read at all. Re-importing your own full backup restores journals only, with no error or warning; the UI copy ("Restore data from a JSON backup") implies a full restore.
2. **Recovered journal content is written as plaintext into an encrypted collection.** `mapEntry()` hardcodes `isEncrypted: false` and writes `content` verbatim. Per `CLAUDE.md`'s Zero-Knowledge Encryption Boundary table, `journals/{id}` content must be `IV:Ciphertext` (base64) via `encryptData()`/`encrypt()` before any Firestore write. Today it isn't — recovered entries sit in Firestore as plaintext indefinitely, until a user happens to individually reopen and re-save each one (no forced re-save prompt exists).
3. **New finding, not in the original TD-23 line item:** `exporter.ts`'s `prepareDataForExport` tries to decrypt workbook answers via a nested `entry.answers` map (`{[questionId]: {isEncrypted, text}}`) — but the real `users/{uid}/workbook_answers` docs (confirmed via `src/lib/workbookAnswers.ts` and `fetchAllUserData` in `src/lib/db.ts`) are flat: `{workbookId, sectionId, questionId, answer, isEncrypted, updatedAt}`, one doc per question, singular `answer` field. The nested-map branch never matches, so **workbook answers in a real export are never decrypted at all** — unlike journals and game-progress, which do get properly decrypted for the export file. Any import design must account for this: workbook answers arriving via a real MRT export are still ciphertext (encrypted with the *exporting* device's vault key), not plaintext needing re-encryption.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Yes — this is recovery journal/workbook content, the most sensitive data category in the app.
* [x] **Encryption Strategy:** Journal content recovered via import must pass through `encrypt()` (from `useEncryption()`) before the Firestore write, exactly like `useJournalOperations` does today — `isEncrypted: true` on write, not `false`. `importer.ts` is currently a standalone lib function with no access to the live vault key; it needs the context-bound `encrypt` function threaded in (dependency injection from `DataImportPanel.tsx`, which already renders inside `VaultGate` and has `useEncryption()` available), the same pattern already used elsewhere (e.g. `useWorkbookAnswers.ts` receiving `encrypt`/`decrypt` from context rather than importing `crypto.ts` directly).
* [x] **Key Rotation:** No change to `executePinRotation`'s scope — imported journals become ordinary encrypted `journals` docs indistinguishable from any other, so they're already covered by the existing rotation sweep. No new field/shape to add to rotation.
* [x] **Vault-locked guard:** `DataImportPanel`/`DataManagement` only render behind `VaultGate`, so in practice the vault is always unlocked when this UI is reachable — but `encrypt()` still throws if `checkLibUnlocked()` is false (see `EncryptionContext.tsx`'s `handleEncrypt`), so the import flow must catch that and fail closed with a clear message, never fall back to writing plaintext.

---

## 3. Schema & Architecture 🗄️
No new Firestore collections. No schema changes to `journals`, `tasks`, `workbook_answers` (`users/{uid}/workbook_answers`), or `game_progress` — imported records must conform to the exact same shape live writes already produce.

**Files impacted (scope, exact approach to be decided by `/planning`):**
* `src/lib/importer.ts` — extend beyond journals-only; accept an injected `encrypt` function; decide the exact code-flow for `tasks`/`workbookAnswers`/`gameProgress` restoration.
* `src/lib/exporter.ts` — the workbook-answer decrypt shape bug (finding #3 above) needs a decision: fix it now (as part of this project, so exports finally decrypt workbook answers like everything else) or explicitly leave it and design import to accept ciphertext workbook answers as-is. This is a real branch point for `/planning`'s strategies, not a foregone conclusion.
* `src/components/profile/DataImportPanel.tsx` — pass `encrypt` down; update result messaging to reflect multi-collection restore counts, not just journal count.
* Possibly `src/lib/db.ts` types (`FullUserData`, `WorkbookAnswer`) if the import path needs stricter incoming-shape validation than the current loose `Record<string, unknown>[]`.

---

## 4. Implementation Phases 🏗️
*High-level only — `/planning` produces the actual Three Strategies and picks the approach before any code changes.*

### Phase 1: Decide the export-side question
Fix `exporter.ts`'s workbook-answer decrypt bug as part of this project, or explicitly scope it out and design import around already-encrypted workbook-answer ciphertext. Either choice has real trade-offs `/planning` needs to weigh (e.g.: fixing export changes what's already-shipped export files look like going forward; not fixing it means import must handle two different "is this plaintext or ciphertext" cases depending on export vintage).

### Phase 2: Extend import to restore tasks/workbookAnswers/gameProgress
New doc IDs on import (matching today's journals-only behavior — never overwrite/clobber a live doc by reusing an imported ID), validated against the real `Task`/`WorkbookAnswer`/`GameProgressRecord` shapes rather than trusted blindly.

### Phase 3: Close the plaintext-write gap
Recovered journal `content` (and workbook-answer `answer`, if Phase 1 fixes export-side decryption) passed through `encrypt()` before every Firestore write; `isEncrypted: true` set correctly. Vault-locked failure fails closed with a clear message, never a silent plaintext write.

### Phase 4: Edge Cases
* [ ] What happens if `navigator.onLine` is false mid-import (a large multi-collection batch, not the current journals-only 450-doc batches)?
* [ ] What happens if `isVaultUnlocked` is false when `encrypt()` is called? (Should be unreachable given `VaultGate`, but must fail closed, not silently write plaintext, if it somehow happens.)
* [ ] What happens on a 320px wide screen (iPhone SE) — does the new richer result messaging ("Imported X journals, Y tasks, Z workbook answers...") still fit/read cleanly?
* [ ] What happens importing a file exported *before* this fix ships (workbook answers still ciphertext-shaped-wrong, or journals already correctly plaintext under the old export contract)? Backward compatibility with existing users' already-downloaded backup files matters here.
* [ ] Duplicate-import behavior: re-importing the same file twice today silently double-creates journal entries (new doc IDs every time, no dedup). Decide whether that's acceptable to carry forward for tasks/workbookAnswers/gameProgress too, or worth a dedup pass — flag for `/planning`, don't assume.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `src/lib/__tests__/importer.test.ts` (new, 8 tests) — every per-collection mapper, a vault-locked-during-import failure path (fails closed, zero plaintext writes), malformed/partial backup handling, and the new ciphertext-shape guard. `src/components/profile/__tests__/DataManagement.test.tsx` extended (2 new tests: multi-collection summary message, vault-locked error message) rather than just the pre-existing journals-only error-classification coverage.
* [ ] **Round-trip test against a real account:** not run — no live Firebase project/emulator with real account data available in this environment. The unit tests substitute a real `crypto.ts` AES-GCM round-trip (genuine encrypt→write-assertion→decrypt, not a mock), which is the same standard this repo's other ZK-adjacent lib tests (`rotation.test.ts`, `exporter.test.ts`) use in place of a live-account round trip.
* [ ] **The Subway Test:** not run — this project's batches are chunked (450 docs/batch, matching the existing journals-only convention) but a real interrupted-mid-batch scenario needs a browser/network-throttling environment not available here. Flagged as an honest gap, not silently skipped.
* [x] **The "Lost PIN" Test (adapted):** the security-boundary unit test directly asserts the raw written Firestore doc's `content`/`encryptedReflection` fields are genuine ciphertext (contain the IV separator, independently decrypt back to the original text) rather than plaintext with an `isEncrypted: true` label slapped on — the actual regression this test category exists to catch, verified via code assertion rather than a live crypto-shred.
* [x] `zk-audit` skill pass completed — found and fixed one real risk (untrusted pass-through of a claimed-encrypted `workbook_answers.answer` field with no shape verification); see the audit's own PASS output in this session's transcript and the `CIPHERTEXT_SHAPE` guard in `importer.ts`.

---

## 6. Follow-up: TD-26 (`exporter.ts`'s decrypt bug) — closed 2026-09-03
Phase 1 above deferred deciding whether to fix `exporter.ts`'s workbook-answer decrypt bug as part of this project (Strategy C) or leave it out of scope (Strategy B, chosen). It was picked up as its own tracked ledger item (`TD-26`) and closed in a follow-up PR, effectively implementing Strategy C after the fact, once its interaction with this project's already-shipped import code was identified:

* `exporter.ts` now decrypts `workbookAnswers[i].answer` correctly, matching the real flat doc shape and mirroring the journal decrypt pattern exactly (`isEncrypted: false` + plaintext on success, `[DECRYPTION FAILED]` marker + `isEncrypted: true` retained on failure).
* This changes what a *future* export contains — real plaintext, not the accidentally-still-ciphertext this project's `mapWorkbookAnswer` was built to expect. Left unaddressed, every export downloaded after the `exporter.ts` fix would have failed to re-import (rejected by the `CIPHERTEXT_SHAPE` guard).
* `importer.ts`'s `mapWorkbookAnswer` now branches on the incoming `isEncrypted` flag: `false` (a post-fix export) re-encrypts the plaintext with the current vault key, same treatment as journals/game-progress; anything else is checked against the existing ciphertext-shape guard and passed through unchanged — preserving backward compatibility with already-downloaded pre-fix export files, which this project's original design didn't need to consider since the export bug wasn't fixed yet at the time.
* `zk-audit` re-run against the coordinated change: PASS, no new risk found.
* Tests: the 2 `exporter.test.ts` cases that asserted against the bug's own wrong nested-shape assumption were rewritten to the real flat shape; 2 new `importer.test.ts` cases cover the re-encrypt path and confirm the old pass-through path still works unchanged.
