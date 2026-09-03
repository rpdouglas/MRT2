# Profile → Security — `/profile/security`

**Source:** `src/pages/Profile.tsx` (inline JSX, `activeTab === 'security'` block) + `src/contexts/EncryptionContext.tsx` (`changePin`, `resetVault`) + `src/lib/rotation.ts` (`executePinRotation`, `executeCryptoShredding`)
**Personas:** All — anyone with a vault PIN. Not crisis-adjacent itself, but it's the *only* way out of a forgotten PIN (Reset Vault), which matters for David/Ned in early recovery who are more likely to churn through PINs.
**Tier:** Not gated — identical for free and premium.
**Zero-knowledge status:** This tab is the vault-key-management surface. PIN rotation re-derives the master AES-GCM key and re-encrypts every ZK-encrypted collection's ciphertext client-side under the new key; Reset Vault crypto-shreds the same collections and clears the key-material fields off `users/{uid}`. Per CLAUDE.md's approved vault-PIN exception, only a SHA-256 hash of the PIN (never the raw PIN, never decrypted content) ever transits to the server, via `verifyVaultPin`.

## What it does

Two blocks: **Change Vault PIN** (rotate the PIN, which re-encrypts every historical document under a new key) and a **Danger Zone → Reset Vault** (crypto-shred everything and start over, for a forgotten PIN — there is no PIN-recovery flow; this is the only escape hatch, and it destroys the data).

## How it works

### Change Vault PIN
- Form: Current PIN / New PIN / Confirm New — all `type="password" inputMode="numeric"` text inputs. `inputMode="numeric"` only affects the mobile keyboard shown; there's no `pattern` or `maxLength` restricting input to digits, so despite the "4-digit PIN" mental model elsewhere in the app, any 4+ character string (letters included) passes client validation.
- Client checks before submit: `newPin === confirmPin`, `newPin.length >= 4` ("PIN must be at least 4 digits" — the message implies digits, the check doesn't), `oldPin !== newPin`.
- `handleRotation` calls `changePin(oldPin, newPin, setRotProgress)` (`useEncryption`), which delegates to `executePinRotation` in `src/lib/rotation.ts`. Per `docs/projects/65_VAULT_KEY_HARDENING.md` and the code:
  1. Validates `oldPin` against the stored `pinVerifier` (`computePinHash`) — throws `INCORRECT_PIN` on mismatch.
  2. Fetches the pepper for the **old** key up front, only if the account is already `usesPepperV2`.
  3. **Resumable by design:** if a prior rotation attempt to this same new PIN was interrupted mid-batch, its `pendingRotation.{salt,verifier}` (persisted on `users/{uid}` before any document writes) is reused so already-migrated documents are detected and skipped rather than reprocessed or misreported as corrupted. A fresh salt/verifier is generated only when there's no compatible pending attempt.
  4. The **new** key is *always* derived via the peppered scheme (`deriveVaultKeyWithPepper`), regardless of whether the account started on the legacy direct-PBKDF2 scheme — this is the transparent per-CLAUDE.md upgrade path: every account that rotates its PIN ends up `usesPepperV2: true`.
  5. Re-encrypts five collections in order, cursor-paginated (`BATCH_SIZE = 50`): `journals.content`, `users/{uid}/workbook_answers.answer`, `users/{uid}/rosc_assessments.encryptedAIContext`, `game_progress.{encryptedStats,encryptedReflection}`, `game_saves.encryptedState`. Per document: decrypt under the OLD key; if that fails, retry decrypting under the NEW key (detects "already migrated by an earlier interrupted attempt") before concluding `DECRYPTION_FAILED`.
  6. Progress reporting is uneven: 2% after the pepper fetch, ramps 5→45% across journals, 45→90% across workbooks — but the rosc_assessments/game_progress/game_saves loops never call `onProgress` at all, so the bar can visually sit at 90% for however long those collections take before jumping straight to 100%.
  7. On success: finalizes `users/{uid}` with the new `encryptionSalt`/`pinVerifier`, deletes `pendingRotation`, sets `usesPepperV2: true`.
  8. On any mid-batch failure: throws `PARTIAL_ROTATION_FAILURE` rather than rolling back — some collections may already be under the new key while others aren't. The in-memory key is deliberately **not** reset back to the old PIN in this case (see the code comment in `rotation.ts`), because doing so would strand already-migrated documents. The UI's error copy explicitly tells the user not to close the app and to retry with the same PIN pair — safe because of the resumable `pendingRotation` + per-doc fallback above.
- On success: local PIN fields clear, a green "PIN changed successfully. All data securely re-encrypted." banner shows, and `EncryptionContext` updates its in-memory `salt`/`verifier`/`usesPepperV2` and refreshes both session caches (`mrt_vault_pin`, `mrt_vault_pepper`) so the session stays unlocked under the new PIN without requiring re-entry.
- **No UI anywhere in this tab shows whether the account is currently on the peppered (`usesPepperV2`) or legacy scheme, and there is no nudge to rotate.** `docs/projects/65_VAULT_KEY_HARDENING.md` §4 Phase 3 explicitly calls a "Profile/Security nudge" toward rotation "a natural, low-risk follow-up, not in this ticket's scope" — that follow-up still doesn't exist; a user who never rotates their PIN stays on the legacy, non-peppered derivation indefinitely with no visibility into that fact.

### Danger Zone: Reset Vault
- A 3-step Headless UI `Dialog` (confirm → type "RESET" → resetting) — per `README.md`, deliberately rebuilt onto this pattern to replace an older `window.prompt()`/`alert()` pair and visually match Account Deletion's modal.
- `handleConfirmReset` → `resetVault()` (`useEncryption`) → `executeCryptoShredding(uid)` in `src/lib/rotation.ts`:
  - Cursor-deletes (500/page, 450-op batches) every doc in **five** collections: `journals` (`where uid==`), `users/{uid}/workbook_answers`, `users/{uid}/rosc_assessments`, `game_progress` (`where uid==`), `game_saves` (`where uid==`) — i.e. every collection CLAUDE.md's ZK table marks as encrypted or partially-encrypted, except `service/{id}` (sponsee notes), which doesn't appear to be referenced by any live collection query anywhere in this codebase (out of scope to chase further here).
  - Does **not** delete `tasks` or `insights` (correct — CLAUDE.md marks both plaintext/non-vault) and does **not** delete the `users/{uid}` document itself — it only clears `encryptionSalt`, `pinVerifier`, `usesPepperV2`, `pinAttempts` off it via `update()`. Profile metadata (`displayName`, `sobrietyDate`, tier, etc.) survives a vault reset; only the vault's contents and key material die.
  - After shredding: `clearKey()` (drops the in-memory `CryptoKey`), both session caches removed, all vault state reset to unset/locked, then `window.location.reload()` — a full app remount lands back on `VaultGate`'s "set up a new vault" screen.
- **No PIN re-entry is required to reset the vault** — only typing the literal word "RESET." Contrast with Account Deletion (`data.md`), which forces a re-authentication step (password or Google popup) before proceeding. Anyone with access to an authenticated, unattended session (Profile's routes are not wrapped in `VaultGate` at the `App.tsx` level — see Data tab's note on the same point) can permanently destroy the vault's contents without ever proving they know the PIN.

## Data model

All fields below are on `users/{uid}` unless noted; none are premium/tier-related.

| Field | Written by | Notes |
|---|---|---|
| `encryptionSalt` | `executePinRotation` (new value) / `executeCryptoShredding` (cleared) | PBKDF2 salt |
| `pinVerifier` | same | `computePinHash(pin, salt)` — offline-checkable "wrong PIN" hash, not the brute-force gate (see `docs/projects/65_VAULT_KEY_HARDENING.md` §2's accepted scope boundary) |
| `usesPepperV2` | same | Set `true` on every successful rotation; never set back to `false` except by Reset Vault |
| `pendingRotation.{salt,verifier}` | `executePinRotation` | Transient — only exists mid-rotation, deleted on success, drives resumability |
| `pinAttempts` | server-write-only (`verifyVaultPin` Cloud Function) | Rate-limit counter/lockout; this tab does not read or display it |
| `journals.content`, `workbook_answers.answer`, `rosc_assessments.encryptedAIContext`, `game_progress.{encryptedStats,encryptedReflection}`, `game_saves.encryptedState` | `executePinRotation` (re-encrypt) / `executeCryptoShredding` (delete) | The five ZK-encrypted surfaces this tab actually touches |

## Gating & limits

No tier gating. The server-side rate limiter on wrong-PIN guesses (`verifyVaultPin`'s per-uid `pinAttempts` lockout, PROJ-65) applies equally to a rotation attempt with a wrong old PIN as to a normal vault unlock, since both call the same Cloud Function — but see Known gaps below for how (poorly) a lockout surfaces in this tab's UI.

## Known gaps / debt

- No `usesPepperV2` status is shown anywhere in this UI, and no nudge exists to encourage rotating off the legacy scheme — explicitly deferred in `docs/projects/65_VAULT_KEY_HARDENING.md` §4 Phase 3, still undone.
- **Reset Vault requires no proof of PIN knowledge** — only typing "RESET" — unlike Account Deletion's re-auth step on the Data tab. See "Danger Zone" above.
- PIN fields have no digit-only / fixed-length constraint despite the "4-digit PIN" framing elsewhere; `inputMode="numeric"` is a keyboard hint only.
- `handleRotation`'s error handling only special-cases `err.message === 'INCORRECT_PIN'` and `'PARTIAL_ROTATION_FAILURE'`; a lockout (`resource-exhausted` from `verifyVaultPin`'s rate limiter) falls through to the generic "An error occurred during rotation. Please try again." — a locked-out user has no way to tell that apart from any other failure, or to know how long to wait.
- Rotation progress bar is only meaningfully driven for journals (5→45%) and workbooks (45→90%); the rosc_assessments/game_progress/game_saves passes issue no progress updates, so the bar can stall visually at 90%.

## Related docs

- `docs/screens/profile/README.md` — parent index; destructive-action modal pattern shared with Data's Account Deletion.
- `docs/projects/65_VAULT_KEY_HARDENING.md` — full design/QA history for the peppered key-derivation scheme this tab drives.
- `docs/screens/profile/data.md` — Account Deletion's contrasting re-auth requirement; the `VaultGate`-at-route-level point referenced above.
- CLAUDE.md — Zero-Knowledge Encryption Boundary (key derivation, approved vault-PIN exception).
- `docs/specs/09_PROFILE.md` §1 — "PIN Management and Vault Rotation flows," broadly accurate at a high level.
