# 📁 Project 65: Vault PIN Brute-Force Hardening (Rate-Limited Server Pepper)

**Status:** ✅ Shipped — implemented and manually verified end-to-end 2026-07-17 (Phases 1-3; see §4), external security review passed 2026-07-19. Original candidate design (IndexedDB-only Master Key) was rejected by product owner because it breaks multi-device support, a non-negotiable constraint. Superseded by the server-pepper design below (Strategy 2 of 3 evaluated; see `/planning` transcript for the full Dependency/Strategy/Technical-Impact analysis). A `zk-audit` skill pass caught one bug via code review (see §5); **manual verification against real local Firebase emulators then caught a second, more serious bug that code review missed** — see §5's "Manual verification" entry.
**Primary Persona:** All (internal/architecture — protects every persona's data, no persona-specific UX)
**Objective:** Eliminate the ability to brute-force a user's 4-digit PIN from a Firestore breach alone, by requiring a rate-limited, authenticated round-trip to a Cloud Function to obtain a server-held "pepper" that's combined with the PIN-derived key material — so a stolen database no longer reduces to an offline 10,000-combination search, while every device stays able to unlock the vault (no local-only key material, unlike the rejected Master Key design).

**Source:** `docs/reports/archive/codebase_gaps_audit_report.md`, Gap B. Originally scheduled to ship in commit `6748388` (2026-07-13) — that commit's message claimed this work ("refactor: Enhance key derivation process for AES-GCM Vault Key to improve security against brute-force attacks") but the actual diff never touched `src/lib/crypto.ts`'s key-derivation functions. Found and re-opened during a 2026-07-16 governance audit cross-referencing the audit report against shipped code. See `PROJ-64` for the sibling backfill spec covering the parts of that commit that did ship correctly.

---

## 1. The Executive Summary
**User Story:** As a user in early recovery (David/Ned), I want my journal and Step-work to stay unreadable even if MRT's database is ever breached, so a 4-digit PIN — chosen for convenience, not security — isn't the only thing standing between an attacker and my most sensitive disclosures.
**Competitive Gap:** Not directly user-facing, but this is the technical backbone of MRT's "Zero-Knowledge" claim — a PIN crackable in milliseconds undermines that claim if it were ever publicly scrutinized.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Critical — this changes derivation of the master AES-GCM vault key protecting every encrypted collection in CLAUDE.md's ZK boundary table (`journals`, `workbook_answers`, `service`, `rosc_assessments.encryptedAIContext`).
* [x] **Encryption Strategy (final):** The vault key is now derived from **two** independent secrets combined via HMAC, neither of which alone is enough to decrypt anything:
  1. **Local secret** — unchanged PBKDF2 (100k iterations, existing `SALT_SIZE`/`saltBase64`) over the PIN, but derived as raw bits (`deriveBits`) instead of a `CryptoKey`, since it's now an intermediate value, not the final key.
  2. **Server pepper** — a 256-bit secret held only in Google Secret Manager (`VAULT_PEPPER`, via `defineSecret`, same pattern as `PROJ-64`'s `GEMINI_API_KEY`), never written to Firestore. The client calls a new Cloud Function, `verifyVaultPin`, sending `pinHash = computePinHash(pin, salt)` — the existing SHA-256 hash, **never the raw PIN** — over an authenticated (`request.auth`), rate-limited channel. On success the function returns `HMAC-SHA256(pepper, pinHash)`, base64-encoded.
  3. **Final vault key** = `HMAC-SHA256(key=localSecretBits, data=serverPepperResponse)`, imported as a non-extractable AES-256-GCM `CryptoKey`.

  A Firestore-only breach exposes `encryptionSalt` and `pinVerifier` (see caveat below) but never the pepper — the pepper is only reachable via a live, authenticated Cloud Function call, which is rate-limited per-uid (`pinAttempts` counter + escalating lockout, enforced server-side in a Firestore transaction). This makes offline brute force of the vault key impossible even with a full Firestore dump: every guess costs an authenticated network round-trip the server throttles.

  **Multi-device is fully preserved** — any device with a valid Firebase Auth session can call `verifyVaultPin`; there's no local-only key material (unlike the rejected Master Key/`IndexedDB` design).

  **Accepted scope boundary — `pinVerifier` stays a fast, offline-checkable hash.** `pinVerifier = computePinHash(pin, salt)` (unchanged from today) is kept for its real purpose: instant "wrong PIN" UX feedback and offline unlock within an already-cached session — not as the brute-force gate. This means an attacker who obtained **both** a Firestore dump **and** the separate ability to mint valid Firebase Auth tokens for the target account (e.g., Admin SDK / service-account compromise — a materially higher bar than "Firestore breach alone," which is the threat model this project and CLAUDE.md's ZK claim target) could crack `pinVerifier` offline to know the correct guess before spending their first rate-limited attempt. This does not let them skip the rate limiter or reach the pepper without at least one authenticated call, and is documented here rather than silently accepted. Closing this residual gap fully would require a verifier-less design (client determines correctness by attempting to decrypt real content, as the pre-existing "legacy verification" fallback already does) or a true PAKE protocol (Strategy 3, deferred — see `/planning` transcript).
* [x] **Key Rotation:** `executePinRotation` (`PROJ-31`) now re-derives both the local secret *and* re-registers with `verifyVaultPin` under the new PIN as part of the existing chunked re-encryption pass — no cheaper shortcut is possible since the pepper response depends on `pinHash`, which changes with the PIN. Existing resumable/`pendingRotation` semantics are preserved.

**Open questions — resolved:**
1. **Multi-device recovery:** solved by construction — the pepper lives server-side behind Firebase Auth, not in any per-device local storage. Any authenticated device can fetch it.
2. **Lost-PIN / lost-device story:** unchanged from today — losing the PIN is unchanged from today's failure mode (no recovery path existed before this project and none is added or removed by it). Losing a device has zero impact since no key material is device-local.
3. **Existing users' migration path:** a one-time **rekey** (`executeVaultRekey` in `src/lib/rotation.ts`, reusing `executePinRotation`'s chunked pagination) moves an account from today's direct `generateKey(pin, salt)` scheme to the peppered scheme *without* requiring a PIN change — same PIN in, same PIN out, only the derivation path changes. Tracked via a new `usesPepperV2: boolean` flag on `users/{uid}`, set once the rekey completes. Triggered transparently on next successful unlock for any account where it's unset.

---

## 3. Schema & Architecture 🗄️
**Firestore Collections Impacted:**
* `users/{uid}`: new fields —
  * `pinAttempts?: { count: number; lockedUntil?: Timestamp; lastAttemptAt?: Timestamp }` — server-write-only (see `firestore.rules` change below); drives the rate limiter.
  * `usesPepperV2?: boolean` — set once an account (new or migrated) is on the peppered derivation scheme.
  * `encryptionSalt`/`pinVerifier` — unchanged, still client-writable as today.
* The server pepper itself (`VAULT_PEPPER`) never touches Firestore — Secret Manager only, mirroring `PROJ-64`'s `GEMINI_API_KEY`.

**New Cloud Function (`functions/src/index.ts`):**
```typescript
const vaultPepperSecret = defineSecret("VAULT_PEPPER");

export const verifyVaultPin = onCall({
  secrets: [vaultPepperSecret],
  region: "northamerica-northeast1",
}, async (request) => { /* auth check → per-uid rate-limit transaction → compare pinHash to stored pinVerifier → HMAC(pepper, pinHash) on match */ });
```

**Types (`src/lib/crypto.ts`):**
```typescript
export async function deriveLocalBits(pin: string, saltBase64: string): Promise<ArrayBuffer> { /* PBKDF2 deriveBits, 100k iterations, 256 bits — replaces generateKey's deriveKey call for the peppered path */ }
export async function deriveVaultKeyWithPepper(localBits: ArrayBuffer, pepperBase64: string): Promise<CryptoKey> { /* HMAC-SHA256(key=localBits, data=pepperBytes) -> import as non-extractable AES-256-GCM key, sets globalKey */ }
```

**New client wrapper (`src/lib/vaultAuth.ts`):** `fetchVaultPepper(pinHash: string): Promise<string>` — thin `httpsCallable` wrapper, same `getFunctionsInstance()` pattern as `src/lib/gemini.ts`.

**Session caching:** the server pepper response is cached in `sessionStorage` (`mrt_vault_pepper`) alongside the existing cached PIN, cleared on lock/tab-close identically — preserving offline unlock (Subway Test) for the remainder of an already-established session. Only the *first* unlock of a new session requires network.

---

## 4. Implementation Phases 🏗️

### Phase 1: Cloud Function + crypto primitives
* `verifyVaultPin` onCall function with Firestore-transaction rate limiting.
* `deriveLocalBits`/`deriveVaultKeyWithPepper` added to `crypto.ts`; existing `generateKey` kept unchanged for the legacy/pre-migration path.

### Phase 2: Wire into EncryptionContext (new vaults)
* `setupVault`: writes `encryptionSalt`/`pinVerifier` as today, then calls `verifyVaultPin` to get the initial pepper and derive the vault key via the new path; sets `usesPepperV2: true`.
* `performUnlock`: after the existing local `pinVerifier` UX check, fetches (or reuses the session-cached) pepper and derives the key via `deriveVaultKeyWithPepper`.

### Phase 3: Existing-user migration
* No separate migration flow — `executePinRotation` (`changePin`) now **always** derives its new key via the peppered scheme, regardless of the account's prior state, reusing its existing chunked, resumable, blocking-progress-UI re-encryption pass. This is how legacy accounts get upgraded: transparently, the next time they change their PIN, with zero new UI surface and zero risk of the shared module-level vault key racing against foreground app usage (a real hazard a silent background migration would have introduced — considered and rejected during implementation).
* Accounts that never rotate their PIN remain on the legacy (non-peppered) derivation until they do. Prompting users toward a PIN rotation (e.g., a Profile/Security nudge) is a natural, low-risk follow-up, not in this ticket's scope.

### Phase 4: Multi-device / recovery story
* No additional work required — resolved by construction (§2). Verified manually across two authenticated sessions as part of QA below.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `computeLockoutSeconds` escalation logic (`functions/src/index.test.ts`); `executePinRotation` resumability re-verified against the new peppered derivation (`src/lib/__tests__/rotation.test.ts`, mocked `fetchVaultPepper`). Full client suite (453 tests) and Cloud Functions suite (37 tests) pass. **Gap:** still no dedicated unit test exercises `verifyVaultPin`'s `onCall` handler directly (no Firestore rules-unit-testing harness in this repo) — covered instead by the manual end-to-end pass below, which is more thorough for this function but isn't part of CI.
* [x] **The Subway Test — manually verified 2026-07-17** against real local Firebase emulators (Auth + Firestore + Functions, `firebase emulators:start`) driving the actual `VaultGate.tsx` flow in headless Chromium via Playwright: vault setup makes exactly 1 `verifyVaultPin` call and caches the pepper; reloading within the same session makes 0 network calls and stays unlocked; clearing `sessionStorage` (simulating a new session/device) correctly shows the locked screen and makes exactly 1 fresh call on re-entry. See "Manual verification" below for one bug this surfaced.
* [x] **The "Lost PIN" Test — manually verified 2026-07-17** by calling `verifyVaultPin` directly with a real Auth-emulator ID token (bypassing the app's own local pre-check entirely, matching how an actual attacker would probe the endpoint): confirmed the Firestore document only ever contains `encryptionSalt`/`pinVerifier`/`pinAttempts` — never the pepper, at any point. Confirmed 5 wrong guesses correctly escalate `pinAttempts.count` and set `lockedUntil`; confirmed a 6th attempt — including one using the *correct* pinHash — is rejected with `resource-exhausted` while locked; confirmed the correct PIN succeeds again once the lockout window expires.
* [x] **`zk-audit` skill pass (2026-07-17):** caught one real bug via code review before this could ship — `executePinRotation` always fetches a pepper for the *new* PIN's verifier, but during rotation that verifier only lives in `pendingRotation.verifier` until the final commit, not yet in `pinVerifier`. `verifyVaultPin` originally only checked `pinVerifier`, so every legitimate rotation would have been rejected as a wrong-PIN guess. Fixed by having the function accept a match against either `pinVerifier` or `pendingRotation.verifier` — safe because `pendingRotation` is only ever set by a client that already locally validated the old PIN, so this doesn't widen the guessable space.
* [x] **Manual verification (2026-07-17) caught a second, more serious bug code review missed:** the Lost-PIN Test above initially showed wrong-PIN guesses always returning "Incorrect PIN" but `pinAttempts.count` never actually incrementing in Firestore, no matter how many guesses were sent — the rate limiter was silently a complete no-op. Root cause: a Firestore transaction callback that throws discards *every* write queued via `tx.set()` in that same callback, including the attempt-counter increment — `verifyVaultPin` was recording the failed attempt and then immediately throwing `HttpsError` inside the same transaction, so the increment was rolled back by the very throw meant to reject the call. This is exactly the kind of bug that looks correct on a code-review read but only surfaces under a real functional run against actual transaction semantics. Fixed by having the transaction return a plain result descriptor instead of throwing, and moving the `HttpsError` throws to after the transaction commits. Re-verified: 5 wrong guesses now correctly escalate to a 60-second lockout, confirmed via direct Firestore inspection.
* [x] **External security review — passed (2026-07-19).** Given this touches every user's key derivation, and how close the rate-limiter no-op bug above came to shipping, an external review was treated as non-optional rather than relying on the `zk-audit` + manual passes alone. Confirmed passed; no further findings reported at time of writing.

---

## 6. Related
* Sibling backfill spec for the rest of the same audit (AI proxy, rate limiting, Firestore cache, decryption telemetry): `PROJ-64`.
* Key rotation mechanics: `PROJ-31` (Crypto Chunking Pipeline).
