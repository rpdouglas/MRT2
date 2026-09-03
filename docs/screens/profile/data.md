# Profile → Data — `/profile/data`

**Source:** `src/components/profile/DataManagement.tsx` (→ `DataExportPanel.tsx`, `DataImportPanel.tsx`, `AccountDeletionModal.tsx`) + `src/components/AppShell.tsx` (the actual background auto-backup engine) + `src/lib/exporter.ts`, `src/lib/importer.ts`, `src/lib/deletion.ts`, `src/lib/googleDrive.ts`
**Personas:** Walt (sovereignty/export/audit — his primary use of this tab). Also the "get me out entirely" surface for anyone (Account Deletion), and the one legacy-migration path for anyone with an old JSON export (Import). Not crisis-adjacent.
**Tier:** Mixed — PDF export is premium-gated (`PremiumGate` `button_swap`, per README the only tier-gated control anywhere in Profile). JSON export, Cloud Auto-Sync, Import, and Account Deletion are all free/unlimited.
**Zero-knowledge status:** The most ZK-touching tab in Profile. Manual JSON export and the background Google Drive auto-sync both decrypt every encrypted collection client-side into a **plaintext** JSON blob before it leaves the device (the file/upload itself is unencrypted — called out explicitly in-UI: "Exported files are NOT encrypted. Store them securely."). Import writes new journal docs with `isEncrypted: false` — plaintext at rest until the user re-opens and re-saves each one. Account deletion crypto-shreds/deletes most data but — see Known gaps — misses `rosc_assessments` and other collections; this is already documented in depth in `docs/screens/delete-account.md` for the shared underlying function.

## What it does

Three stacked panels, rendered unconditionally by `DataManagement.tsx` (no tabs of its own): Cloud Auto-Sync status + manual JSON/PDF export (`DataExportPanel`), legacy JSON import (`DataImportPanel`), and account deletion (`AccountDeletionModal`). A fourth mechanism — the actual auto-backup engine — doesn't live in this tab's component tree at all: it's a `useEffect`/`useCallback` pair in `AppShell.tsx` that runs app-wide on every page, not just while Profile is open; `DataExportPanel` only *displays* its result.

## How it works

### Cloud Auto-Sync (background engine lives in `AppShell.tsx`, not this tab)
- `performAutoBackup` (`AppShell.tsx`) fires on a 10-second `setTimeout` whenever `isVaultUnlocked && driveAccessToken && isOnline` becomes true — i.e. shortly after every vault unlock for a Google-signed-in user, on **any** page, not on a server cron.
- Guard: skips entirely if `profile.lastExportAt` is set and less than 7 days old.
- Otherwise: `fetchAllUserData` → `prepareDataForExport` (decrypts — the same helper the manual export button uses) → `generateJSON` → `findBackupFile`/`uploadBackupToDrive` (`src/lib/googleDrive.ts`, restricted `drive.file` OAuth scope) — searches Drive for an existing `mrt_backup.json` and `PATCH`es it, or `POST`s a new one. On success, patches `lastExportAt`.
- Failure is **fully silent**: `catch (e) { console.error("Auto-backup failed silently:", e); }` — nothing surfaces in the Data tab or anywhere in the UI. A failed sync just leaves `lastExportAt` stale, and the Dashboard's backup-reminder banner (`docs/screens/dashboard.md`) eventually reappears.
- `DataExportPanel`'s own UI only *displays* this state: an "Active"/"Inactive" pill keyed off `driveAccessToken`, and `Last Cloud Sync: {lastExportAt}` if set — no manual "sync now" button, no way to see or clear the Drive file from here.
- `driveAccessToken` (`AuthContext`) only exists for Google-sign-in users; email/password users see "Automatic backups are only available for users who signed in with Google. Email users must perform manual exports."

### Manual Export (JSON free / PDF premium)
- Requires the vault to be unlocked: `DataExportPanel` wraps its JSON/PDF button grid in its own inline `<VaultGate>`. This is necessary because Profile's `/profile` and `/profile/:tab` routes are **not** wrapped in `VaultGate` at the `App.tsx` level (unlike most other authenticated routes), so this tab re-gates itself rather than relying on a route wrapper — see `security.md` for the same point applied to the Danger Zone.
- `handleExport(format)`: `fetchAllUserData(user.uid)` (`src/lib/db.ts`) pulls every collection into one `FullUserData` object; `prepareDataForExport` (`src/lib/exporter.ts`) decrypts client-side in 20-item chunks (`processInChunks`) — journals' `content`, workbook answers' per-question `answer.text`, and (per `docs/specs/09_PROFILE.md` §4) Recovery Games' `encryptedStats`/`encryptedReflection` via the same helper. A per-item decrypt failure doesn't abort the whole export: it's replaced inline (`"[DECRYPTION FAILED]"` for journals) and the item keeps `isEncrypted: true`, so a corrupted entry is visibly flagged in the output file rather than silently dropped or garbled.
- JSON: `generateJSON(cleanData)` → `Blob` → `mrt-backup-{date}.json`.
- PDF: `generatePDF(cleanData)` (jsPDF + jspdf-autotable) → `mrt-journal-{date}.pdf`, gated behind `<PremiumGate fallbackMode="button_swap" customMessage="Unlock PDF Exports">`.
- Both formats download via the standard browser idiom (`URL.createObjectURL` + a synthetic `<a download>` click) — this works because the file is generated inside the running app itself, not a hosted/sandboxed page. Either path then patches `users/{uid}.lastExportAt`, the same field the auto-sync guard and the Dashboard's backup-reminder banner both read.
- Progress bar: `fetchAllUserData` contributes a flat 10%, `prepareDataForExport`'s chunk callback is mapped to 10–90%, then a final jump to 100%. The `exporting` flag stays true for an extra 2s after completion purely so the 100% state is visible before the UI resets.

### Import
- `DataImportPanel` accepts one `.json` file → `importLegacyJournals(uid, file)` (`src/lib/importer.ts`).
- **Journals only, despite the framing.** The panel's copy ("Restore data from a JSON backup. This will add entries to your history.") and `docs/specs/09_PROFILE.md` §5 ("Parses JSON backups... both legacy formats and new full-schema formats") both read as if this restores a full backup. In code, `importLegacyJournals` reads only a bare top-level array, a `{ journals: [...] }` key, or a single bare object — `tasks`, `workbookAnswers`, and `game_progress` in an exported backup (including one this same tab's own Manual Export just produced) are silently ignored on re-import; only journal-shaped entries are ever written.
- Each accepted entry is mapped through `mapEntry()` (mood clamped 1–10, weather string-or-object normalized, `createdAt` parsed from an ISO string or `{seconds, nanoseconds}`) and written with **`isEncrypted: false`** — imported journal content lands in Firestore as plaintext, not re-encrypted under the active vault key at import time. Matches `docs/specs/09_PROFILE.md` §5's own note: it becomes encrypted "the next time the user edits and saves" that entry — there's no forced re-save prompt after import, so a recovered entry can sit as plaintext in Firestore indefinitely if the user never reopens it.
- Batched writes (450/batch), per-entry `try/catch` so one malformed row doesn't fail the whole import; reports `success`/`errors` counts. `describeImportError()` gives friendlier copy for `SyntaxError` (bad JSON), `permission-denied`, and network/`unavailable` failures; anything else falls back to a generic "couldn't import this file" message.

### Account Deletion
- `AccountDeletionModal`: 3-step Headless UI Dialog (confirm → reauth → shredding), the same visual pattern as Security's Reset Vault, but this one **does** require re-proving identity first: Google users re-auth via a popup (`reauthenticateWithGoogle`), email/password users must re-enter their password (`reauthenticateWithEmail`) — required because Firebase Auth's `deleteUser()` throws `auth/requires-recent-login` on a stale session.
- `handleReAuthAndDelete` → `executeTotalAccountAnnihilation(uid, onProgress)` (`src/lib/deletion.ts`) → then `deleteAccount()` (Firebase Auth `deleteUser`).
- **This is the exact same purge function used by the standalone public `/delete-account` route** — `docs/screens/delete-account.md` already documents `executeTotalAccountAnnihilation` in full (what it scans/deletes, what it misses, and why) since that page's "How it works" section covers the shared implementation in depth. Everything documented there about the purge's scope and gaps applies identically here; this doc doesn't repeat it — see Known gaps below for the short version and a pointer.
- Distinct error handling per Firebase Auth error code in this modal specifically: wrong password, expired session (`requires-recent-login` → told to log out/in and retry), cancelled Google popup — each gets its own message rather than one generic failure.

## Data model

| Field / collection | Touched by | Notes |
|---|---|---|
| `users/{uid}.lastExportAt` | Manual export **and** the `AppShell.tsx` auto-backup engine (shared field) | Drives both the Dashboard's backup-reminder banner and the 7-day auto-sync guard |
| `driveAccessToken` | Not a Firestore field — in-memory `AuthContext` value from the Google OAuth popup, never persisted | Only exists for the current session of a Google-sign-in user |
| `journals.content`, `workbook_answers.answer.text`, `game_progress.{encryptedStats,encryptedReflection}` | Read + decrypted by `fetchAllUserData`/`prepareDataForExport` for export | Never written by this tab's export path — read-only |
| `journals` (new docs, `isEncrypted: false`) | `importLegacyJournals` | See "Import" above — plaintext at write time |
| Deletion scope (via `executeTotalAccountAnnihilation`) | `journals`, `tasks`, `insights`, `ai_logs`, `feedback`, `game_progress`, `game_saves` (root, `uid`-filtered) + `users/{uid}/workbook_answers`, `users/{uid}/templates` (subcollections) + `users/{uid}` doc itself | Full detail and gaps: `docs/screens/delete-account.md` |

## Gating & limits

- PDF export: `<PremiumGate fallbackMode="button_swap">` — the only tier-gated control in this tab (and, per `README.md`, in all of Profile).
- JSON export, Cloud Auto-Sync, Import, Account Deletion: free tier, unlimited, no rate limit.

## Known gaps / debt

- **Account deletion doesn't fully purge the account.** `executeTotalAccountAnnihilation` (shared with `/delete-account`) does not scan/delete `users/{uid}/rosc_assessments`, `service/{id}` (sponsee notes), `client_errors`, or Stripe/Play-Billing subcollections under `users/{uid}` — see `docs/screens/delete-account.md`'s Known gaps for the full breakdown. Notably, Reset Vault's `executeCryptoShredding` (`security.md`) **does** correctly delete `rosc_assessments`, so the two destructive flows have inconsistent coverage of the same collection.
- **Import silently drops non-journal data** — tasks, workbooks, and game history in a backup file are ignored on re-import, asymmetric with what Manual Export produces from the same account.
- **Imported journals are written as plaintext** (`isEncrypted: false`) and stay that way until individually reopened and re-saved — a real, spec-documented, but easy-to-miss window where recovered content sits unencrypted in Firestore.
- **Auto-backup failures are completely silent** — no error surfaces anywhere; the only symptom is a stale `lastExportAt` and the Dashboard's backup-reminder banner eventually reappearing.
- No manual "sync now" control on the Cloud Auto-Sync card, and no way to inspect/delete the Drive backup file from this tab.

## Related docs

- `docs/screens/profile/README.md` — parent index; destructive-action modal pattern shared with Security's Reset Vault.
- `docs/screens/profile/security.md` — Reset Vault's contrasting (correct) `rosc_assessments` deletion; the `VaultGate`-at-route-level point referenced above.
- `docs/screens/delete-account.md` — full documentation of `executeTotalAccountAnnihilation`'s scope and gaps, shared verbatim by this tab's Account Deletion modal.
- `docs/screens/dashboard.md` — the backup-reminder banner this tab's `lastExportAt` field feeds.
- `docs/specs/09_PROFILE.md` §3–6 — Cloud Auto-Sync, Manual Export, Import, and Annihilation Engine sections; broadly accurate except where noted above (Import's actual scope, deletion's actual subcollection coverage).
- CLAUDE.md — Zero-Knowledge Encryption Boundary collection table; Premium Tier & Billing.
