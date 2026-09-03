# Delete Account — `/delete-account`

**Source:** `src/pages/DeleteAccount.tsx` + `src/lib/deletion.ts` (`executeTotalAccountAnnihilation`) + `AuthContext.deleteAccount` (Firebase Auth `deleteUser`)
**Personas:** None targeted — a compliance-driven utility page for any user who wants to leave, regardless of persona.
**Tier:** N/A — deletion is available to any authenticated user regardless of `tier`; no premium-only or free-only behavior.
**Zero-knowledge status:** Destructive-only. Deletes (does not decrypt or read the content of) every scanned document — see Data model below for exactly what is and isn't covered.

## What it does

A **public, unauthenticated** web route (reachable without an existing app session) that lets a visitor sign in fresh and permanently delete their MRT account and its data — required, per an in-file comment, by Google Play's Data Safety policy, which mandates a web-accessible account-deletion path that doesn't require opening the app. It is explicitly distinct from `AccountDeletionModal.tsx` (referenced in this page's own doc comment), which re-verifies an *already active* in-app session rather than authenticating from scratch.

## How it works

A four-step state machine (`Step = 'login' | 'confirm' | 'deleting' | 'done'`):

1. **`login`** — email/password or Google sign-in (`loginWithEmail`/`loginWithGoogle` from `AuthContext`), same as `Login.tsx`. Firebase error codes are mapped to plain copy (wrong password, user not found, too-many-requests, popup-closed). On success, moves to `confirm` — note this is a *fresh* authentication (this page has no assumption of an existing session), which is exactly why `auth/requires-recent-login` can still surface later if the session is judged stale mid-flow.
2. **`confirm`** — a single explicit confirmation screen: "This will permanently and immediately cryptographically shred all your journals, workbooks, tasks, and settings from our servers, then delete your login. **There is no recovery.**" One button: "Permanently Delete My Account." This is the only confirmation gate — no re-typed email/password, no "type DELETE to confirm" text input (contrast with `Profile.tsx`'s "type RESET" gate on vault-reset, which is a lower-stakes, reversible-by-re-onboarding action).
3. **`deleting`** — calls, in order:
   1. `executeTotalAccountAnnihilation(user.uid, onProgress)` from `src/lib/deletion.ts` — the Firestore data purge (see Data model).
   2. `deleteAccount()` from `AuthContext`, which is a thin wrapper around Firebase Auth's client-SDK `deleteUser(user)` — removing the Auth account itself.
   A progress message string is threaded through and shown live (`progressMsg`), with an explicit "Do not close this window" warning.
4. **`done`** — a static confirmation screen. No further action possible.

**Failure handling:** if `deleteAccount()` throws `auth/requires-recent-login` (the client Auth SDK requires a recent sign-in for this destructive an operation), the user is told their session expired mid-deletion and to reload and sign in again to retry — importantly, this means the Firestore purge in step 1 may have **already succeeded** by the time the Auth deletion fails, leaving Firestore data gone but the Auth account still present; the page does not track or surface that partial-completion state distinctly from a full failure. Any other error falls back to `error.message` or a generic "Something went wrong" message, and the step reverts to `confirm` for a retry.

### What this page's deletion actually covers
This is **entirely client-side** — there is no Cloud Function backing this flow, and it is a *different* mechanism from `executeCryptoShredding` in `src/lib/rotation.ts` (which CLAUDE.md's `game_progress`/`game_saves` table row references) — that function is part of the **PIN-reset/vault-rotation** path (`Profile.tsx`'s "Destroy & Reset Vault" danger-zone action), not account deletion. `executeTotalAccountAnnihilation` is its own, separate implementation with its own (non-cursor-paginated) batch-delete logic.

`executeTotalAccountAnnihilation(uid)` scans and deletes, via chunked `writeBatch` calls (450 ops/batch) run entirely as the authenticated user against Firestore's client SDK (permitted by `firestore.rules`' `allow delete: if isOwner(userId) || isAdmin();` on most collections it touches):

**Deleted:**
- `journals` (queried by `where('uid', '==', uid)`)
- `tasks`
- `insights`
- `ai_logs`
- `feedback`
- `game_progress` (PROJ-72 Phase 7)
- `game_saves` (PROJ-72 Phase 7)
- `users/{uid}/workbook_answers` (subcollection)
- `users/{uid}/templates` (subcollection)
- `users/{uid}` itself (the profile doc)

**NOT deleted by this function** (notable gap — see below):
- `service/{id}` — sponsee notes (per CLAUDE.md's collection table, AES-GCM encrypted content). Not scanned or queued for deletion anywhere in `deletion.ts`.
- `users/{uid}/rosc_assessments` — ROSC assessment docs (per CLAUDE.md, partially encrypted). Not scanned either — the function's subcollection scan list is only `workbook_answers` and `templates`.
- `client_errors` — a separate collection from `ai_logs`/`feedback`, also `uid`-scoped per `firestore.rules`, not covered here.
- `playPurchases`/`playPurchaseIndex` (Play Billing purchase records) — not covered.
- `checkout_sessions`/`subscriptions`/`payments` (Stripe subcollections under `users/{uid}`) — not covered explicitly (they're deleted implicitly only if Firestore's client SDK cascades subcollection deletes when the parent doc is removed, which it does **not** — Firestore does not automatically delete subcollections when a parent document is deleted. These likely remain as orphaned subcollections after the parent `users/{uid}` doc is gone).

## Data model

| Collection scanned | Encrypted (per CLAUDE.md)? | Deleted by this page? |
|---|---|---|
| `journals/{id}` | ✅ content | Yes |
| `tasks/{id}` | ❌ | Yes |
| `insights/{id}` | ❌ | Yes |
| `ai_logs/{id}` | ❌ (metadata only) | Yes |
| `feedback/{id}` | — | Yes |
| `game_progress/{id}` | ✅ Partial | Yes |
| `game_saves/{id}` | ✅ Yes (fully) | Yes |
| `users/{uid}/workbook_answers/{id}` | ✅ | Yes |
| `users/{uid}/templates/{id}` | ❌ | Yes |
| `users/{uid}` (profile doc) | ❌ | Yes |
| `service/{id}` | ✅ Partial | **No — not scanned** |
| `users/{uid}/rosc_assessments/{id}` | ✅ Partial | **No — not scanned** |
| `client_errors/{id}` | — | **No — not scanned** |
| `users/{uid}/checkout_sessions`, `/subscriptions`, `/payments`, `/playPurchases` | — | **No — orphaned subcollections, since Firestore doesn't cascade-delete on parent doc removal** |
| `playPurchaseIndex/{token}` | — | **No — not scanned** |
| Firebase Auth user record | N/A | Yes, via `deleteAccount()` → `deleteUser(user)` |

## Gating & limits

None beyond authentication itself (the `login` step) — no tier check, no rate limit, no admin-only restriction. Any authenticated user can delete their own account. Server-side, `firestore.rules`' `allow delete: if isOwner(userId) || isAdmin();` (and equivalent per-collection owner-delete rules) is what actually authorizes each individual document delete — this page does not rely on any special server-side deletion endpoint or elevated privilege.

## Known gaps / debt

- **Incomplete data purge:** `service` (sponsee notes) and `users/{uid}/rosc_assessments` are not scanned/deleted by `executeTotalAccountAnnihilation`, despite both being CLAUDE.md-documented, user-scoped, at-least-partially-encrypted collections. A deleted account's sponsee notes and ROSC assessments would remain in Firestore indefinitely under `where('uid','==',<deleted-uid>)`/`users/{deleted-uid}/rosc_assessments` — orphaned and unreachable by the user, but not actually purged, which is a real gap against a GDPR-style "right to be forgotten" claim (this page's own copy says "permanently and immediately... shred all your journals, workbooks, tasks, and settings" — sponsee notes and ROSC data aren't literally named, but the practical claim of full erasure is broader than what's implemented).
- **Orphaned Stripe/Play Billing subcollections:** `checkout_sessions`, `subscriptions`, `payments`, and `playPurchases` under `users/{uid}` are not explicitly deleted, and Firestore does not cascade-delete subcollections when the parent doc is removed — these likely persist as unreachable orphan data after account deletion.
- **`client_errors` not covered** — a `uid`-scoped collection (admin-readable only per rules) that's separate from `ai_logs`, also skipped.
- **Partial-failure ambiguity:** if the Firestore purge (`executeTotalAccountAnnihilation`) succeeds but the subsequent `deleteAccount()` Auth deletion fails with `auth/requires-recent-login`, the user is told to "reload and sign in again to retry" — but a retry would re-run `executeTotalAccountAnnihilation` against an already-emptied set of collections (harmless — it just deletes nothing new) and then attempt Auth deletion again. The UI does not distinguish "everything failed, nothing happened" from "your data is already gone, only the login remains" — both surface the same retry prompt.
- Not literally "crypto-shredding" in the `executeCryptoShredding` (`src/lib/rotation.ts`) sense CLAUDE.md uses for `game_progress`/`game_saves` — this page's confirmation copy uses the phrase "cryptographically shred," but the actual mechanism here is a plain Firestore document delete of both encrypted and plaintext docs, not a key-destruction-based shred. Worth flagging if `CLAUDE.md`'s data-model table language around crypto-shredding is ever tightened, since this page's user-facing copy currently borrows that term loosely.

## Related docs

- `src/components/AccountDeletionModal.tsx` — the in-app equivalent flow for an already-authenticated session (not documented here; this doc covers only the standalone `/delete-account` route).
- CLAUDE.md's Zero-Knowledge Encryption Boundary collection table — source of the encrypted/plaintext status cited above.
- `docs/projects/*` — no `XX_ACCOUNT_DELETION.md` spec was found during this review; confirm one exists before extending this flow, per CLAUDE.md's "no feature without a spec" rule.
