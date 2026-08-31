# MRT2 — Security Assessment

*Synthesized from a dedicated code-level security research pass: full read of `src/lib/crypto.ts`, `functions/src/index.ts`'s vault-PIN and AI-proxy logic, `firestore.rules` (all 210 lines), `src/contexts/AuthContext.tsx`, two `npm audit` runs, and repo-wide greps for injection/secrets patterns. This is independent verification against real code and real command output — not a restatement of the project's own documentation.*

---

## 1. Authentication

- **Methods:** Google OAuth (popup, `drive.file` scope requested for the Drive backup feature) and email/password. **No anonymous auth.**
- **Session persistence:** Firebase Auth SDK default (`browserLocalPersistence`) — implicit rather than explicitly configured, but appropriate for an offline-first PWA.
- **Rating: 8/10.**

## 2. Authorization

- Admin access is **genuinely server-enforced**: `firestore.rules`'s `isAdmin()` checks the real Firebase custom claim (`request.auth.token.admin == true`), not a client-writable field. At least one Cloud Function (`generateReadingsAdmin`) independently re-checks the same custom claim before doing privileged work.
- A legacy client-side `role === 'admin'` Firestore-field fallback exists for **UI display purposes only** and is instrumented with telemetry specifically to measure when it's safe to remove — confirmed it cannot be used to bypass either the Firestore-rules or Cloud-Function-level checks.
- **Rating: 8/10.**

## 3. Encryption

- **Algorithm:** AES-256-GCM via the native Web Crypto API (no third-party JS crypto library) — the correct choice, since non-extractable `CryptoKey` objects genuinely cannot be exfiltrated even by a compromised JS context.
- **IV handling:** a **fresh, cryptographically random 12-byte IV is generated on every single encryption call** — verified in code, the single most important thing to get right with AES-GCM, and MRT2 gets it right.
- **Key derivation:** PBKDF2-SHA256, 100,000 iterations, 16-byte random salt. **Current-generation accounts** (post-PROJ-65, "usesPepperV2") combine this with a server-issued, rate-limited HMAC-SHA256 pepper — verified in code to match its documentation exactly.
- **Known gap:** accounts that have **not rotated their PIN since PROJ-65 shipped** still use the pre-hardening scheme (PBKDF2-only, no server pepper). For those accounts, a Firestore-only breach becomes an offline attack against a 4-digit (10,000-value) PIN space at 100k iterations — feasible in seconds-to-minutes on modern hardware. This is documented and accepted internally as migration-pending, but it is a **live** weakness, not a historical one, until affected accounts rotate.
- **Rating: 8/10** (9 for the current scheme in isolation; docked for the live legacy-account gap).

## 4. Data Storage

- Firestore stores `IV:Ciphertext` (hex-encoded) for encrypted fields; the collection-by-collection encryption boundary (`CLAUDE.md`'s table) was spot-checked against real hook code and found accurate.
- **A legacy plaintext-fallback shim** exists in `decrypt()` (any string without a `:` is returned as-is) — a deliberate, narrow compatibility measure for pre-encryption-era documents, not a bug, but worth monitoring as the codebase ages.
- **Rating: 8/10.**

## 5. Secrets Management

- **No live secrets found in tracked source, env files, or client-reachable bundles** — confirmed by direct grep (`sk-`, `private_key`, `BEGIN PRIVATE KEY`, service-account JSON patterns) and by confirming the Gemini API key declared in `.env.example` is a vestigial, never-read variable (the real key lives exclusively in Google Secret Manager, accessed server-side via `defineSecret`).
- **Two historical incidents, both fully remediated same-day:** (1) an Android release signing keystore was briefly tracked in git, purged via `git filter-repo` + force-push, new keystore reissued to Secret Manager; (2) a CI workflow bug wrote the decoded prod Firebase Admin SDK private key into `$GITHUB_ENV`/logs (GitHub's secret redaction doesn't recognize derived/decoded values), discovered, key rotated, workflow hardened with per-field `::add-mask::` calls. Both are closed with verified evidence, but are worth surfacing in any diligence process as a demonstrated (if well-handled) pipeline risk.
- **Rating: 8/10** (docked for the historical incidents, credited for the genuinely thorough remediation and hardening that followed).

## 6. Firestore Security Rules

- **No overly-permissive rule found** (`if true`, or bare `if request.auth != null` on any per-user collection) anywhere in the 210-line ruleset.
- **No overly-restrictive rule found** relative to the documented encryption/access model.
- Self-escalation to premium/admin is explicitly blocked at write time (`tier`/`tierSource`/`role`/`pinAttempts` excluded from non-admin update diffs).
- **Gap:** shape/size validation exists for only `journals` and `game_saves`; `workbook_answers`, `service`, `rosc_assessments`, `game_progress` have no server-side ceiling.
- **Rating: 8/10.**

## 7. OWASP Top 10 — Spot Check

| Risk | Finding |
|---|---|
| A01 Broken Access Control | No violation found; ownership rules consistently `request.auth.uid == resource.data.uid`; admin gate is server-side. |
| A02 Cryptographic Failures | See §3 — one live gap (legacy pre-pepper accounts). |
| A03 Injection | No SQL surface (Firestore is not SQL). **Zero** `dangerouslySetInnerHTML`, `.innerHTML =`, `eval(`, or `document.write` found anywhere in `src/`. Prompt-injection into Gemini is mitigated (delimiting + system-instruction guard) and honestly self-scoped in the code's own comments as "not a hard security boundary" — an accurate characterization given the blast radius is limited to the same authenticated user seeing a manipulated response. |
| A04 Insecure Design | Vault-PIN rate limiting is a genuine, well-designed server-side control (see §8). |
| A05 Security Misconfiguration | `disallowLegacyRuntimeConfig: true` enforced; modern `defineSecret` used throughout. `/debug` route reachability (see §9) is the one real misconfiguration-adjacent finding. |
| A06 Vulnerable Components | 0 critical, 8 high npm-audit findings — 7 of 8 confined to dev/build tooling; 1 (`react-router-dom`) is a direct production dependency with a patch available and likely-low real exploitability (app is SPA-mode, not RSC-mode). |
| A07 Identification & Auth Failures | No anonymous auth, no weak-password policy gaps identified (not independently stress-tested against Firebase Auth's own password rules). |
| A08 Software & Data Integrity Failures | CI has 7 sequential gates before deploy; no unsigned/unverified artifact deployment path identified. |
| A09 Security Logging & Monitoring Failures | See Infrastructure Gap Analysis — no APM/crash-reporter is the most relevant gap here. |
| A10 Server-Side Request Forgery | No user-controlled URL-fetching server endpoints were identified in this pass. |

## 8. Vault PIN Rate Limiting (`verifyVaultPin`)

This is one of the strongest-evidenced findings in the entire audit:

- **Only a SHA-256 hash of the PIN ever transits to the server** — verified at both the client call site and the server's input-shape validation (`/^[0-9a-f]{64}$/`).
- **Escalating, server-side lockout**: 5+ failed attempts → 60s, 8+ → 15 min, 12+ → 24 hours — stored in a field (`pinAttempts`) that `firestore.rules` explicitly forbids the client from writing directly, closing the "client-side-only rate limiting is trivially bypassable" failure mode that is extremely common in PIN/passcode-gated apps.
- **A subtle correctness detail was verified, not assumed**: the implementation deliberately avoids throwing from inside the Firestore transaction on a wrong-PIN attempt (which would roll back the attempt-counter increment and silently neuter the rate limiter) — this is a considered fix, evidenced by the code's own comments and by a documented incident in `docs/projects/65_VAULT_KEY_HARDENING.md` where this exact bug was caught only by manual emulator testing after code review missed it.
- **Rating: 9/10** for this specific control in isolation.

## 9. Gaps Requiring Attention (ranked)

1. **No Firebase App Check anywhere** — confirmed by repo-wide grep, independently corroborated by the project's own internal production-readiness audit. Every callable function has no attestation that traffic originates from the genuine app; the practical residual risk is bounded per-account abuse (rate limits still apply) but unbounded across many attacker-controlled accounts. **Priority: P0.**
2. **Legacy pre-pepper vault-key derivation** — live weakness for un-rotated accounts. **Priority: P0.**
3. **`/debug` route reachable by any authenticated user**, gated only by a UI warning banner — directly mutates the signed-in user's own Firestore task documents with no role check. Low blast radius (self-scoped) but inconsistent with the hard `isAdmin` gate on `/admin`. **Priority: P1.**
4. **`react-router-dom` HIGH npm-audit finding** — patch available, low real-world exploitability given SPA (non-RSC) mode, but zero-cost to fix. **Priority: P1.**
5. **`useFirestoreCrud.ts`'s encrypt-before-write contract is convention-enforced, not structurally enforced** — no current violation found, but a latent regression risk for future features. **Priority: P1.**

## 10. Privacy & Compliance Readiness

- **GDPR:** technical foundations are strong — a real data-export flow (JSON/PDF), a real account-deletion flow (`executeTotalAccountAnnihilation`), and encryption-at-rest for sensitive collections all map to GDPR's data-portability/right-to-erasure/data-protection-by-design principles. **Not verified:** a formal Data Processing Agreement, sub-processor disclosure list (Gemini/PostHog/Stripe/Google Drive), or a documented lawful-basis analysis — these are legal-process artifacts, not code, and were outside this audit's reach.
- **HIPAA:** MRT2 is a consumer self-help app, not a covered entity or business associate in the traditional sense (no evidence of it being sold to/integrated with a covered healthcare provider) — HIPAA likely does not strictly apply today, but if any B2B/treatment-center distribution is pursued (see Product Review §11), a formal HIPAA-readiness assessment and BAA capability would become necessary. **Not currently in place.**
- **PIPEDA:** similar posture to GDPR — strong technical foundation, no formal compliance documentation found in-repo.
- **SOC 2:** no evidence of a SOC 2 Type I/II audit or the operational maturity artifacts (formal change-management sign-off, access-review cadence, incident-response runbook execution evidence) that a SOC 2 audit requires. The engineering discipline evidenced throughout this audit (CI gates, documented incident response, ticket-numbered specs) is a genuinely strong *starting point* for a future SOC 2 effort, but SOC 2 itself has not been pursued.
- **Zero-trust maturity:** the client-to-backend trust model is unusually mature for a consumer app (server-verified admin claims, server-side rate limiting, no implicit trust of client-supplied `role`/`tier` fields) — the one missing zero-trust layer is App Check (client-attestation), covered above.

**Overall Security Rating: 8/10.** This is a genuinely strong security posture for a product at this stage — the core cryptographic and access-control design is sound and independently verified, not just claimed. The gaps that exist are specific, named, and none of them represent an active, exploitable breach today; they represent exposure that grows with scale (App Check) or exposure scoped to a shrinking population (legacy PIN accounts).
