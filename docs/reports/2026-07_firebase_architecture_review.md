# Firebase Architecture Review

**Audit Date:** 20 July 2026
**Scope:** Full review of how MRT2 uses Firebase — Auth, Firestore, Cloud Functions, Hosting, FCM — measured against current Firebase best practices and how comparable zero-knowledge / offline-first apps are architected.
**Method:** Direct inspection of `src/lib/firebase.ts`, `src/lib/crypto.ts`, `src/lib/db.ts`, `src/hooks/*`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `.github/workflows/deploy.yml`, `scripts/sync_security_rules.sh`, and all six functions in `functions/src/index.ts`, cross-referenced against Firebase's own App Check, Firestore, and Cloud Functions best-practice documentation.
**Published report (with diagram and tables):** https://claude.ai/code/artifact/18719f62-3c9b-40d7-ac35-fa1bf50b5256

---

## Bottom Line

Solid, deliberate foundation. The zero-knowledge encryption boundary is genuinely well built, not a bolt-on — PBKDF2 + server-pepper key derivation, transactional PIN rate-limiting with escalating lockouts, and consistent `IV:Ciphertext` storage. The gaps are mostly at the network edge and in process guardrails, not in the core data model.

**Biggest single gap:** no Firebase App Check. Firestore, Auth, and every callable function currently accept requests from any client holding the public web config — there's no attestation that traffic is coming from the real app.

**Quiet risk:** `scripts/sync_security_rules.sh` lets `firestore.rules` ship straight to prod behind a single y/n prompt — no lint, no tests, no CI — a side door around the pipeline that otherwise gates every other deploy.

---

## Architecture Overview

Every write of recovery content is encrypted in the browser before it ever reaches Firebase:

```
Browser / PWA (React 19, Vault PIN entry)
        │
   crypto.ts — AES-GCM, PBKDF2 + server pepper   ← zero-knowledge boundary
        │
        ├── Firebase Auth (Google, email/password)
        ├── Firestore (ciphertext + plaintext metadata)
        ├── Cloud Functions v2 (verifyVaultPin, generateAIInsights, dailyBeacon, …)
        └── Hosting + FCM (dist/, push tokens)
                │
                └── Gemini 2.5 — six approved AI-analysis flows only, via generateAIInsights proxy
```

The server — Firestore, Functions, and the six approved Gemini call sites — only ever sees ciphertext, a hashed PIN, or content the user has explicitly routed through an approved AI-analysis flow.

---

## Current State by Area

### Encryption & the zero-knowledge boundary

- ✅ **Key derivation is layered correctly.** 4-digit PIN + 16-byte salt → PBKDF2 (100k iterations) combined via HMAC-SHA256 with a server pepper obtained through `verifyVaultPin`. The client only ever sends a SHA-256 hash of the PIN — never the raw value — and the function returns the pepper inside a Firestore transaction that also drives escalating lockouts (5 → 60s, 8 → 15min, 12 → 24h).
- ✅ **Storage format is consistent and legacy-aware.** `encrypt()` in `src/lib/crypto.ts` writes a single `IV:Ciphertext` string per field; `decrypt()` treats anything without a colon as pre-encryption legacy plaintext rather than throwing — a deliberate migration safety net, not an oversight.
- ⚠️ **The AI carve-out is scoped but not enforced in code.** Six flows are permitted to decrypt content client-side and send it to Gemini via the `generateAIInsights` proxy. That boundary currently lives in CLAUDE.md convention, not in a lint rule or runtime check — nothing stops a seventh call site from doing the same thing silently.

### Firestore & security rules

- ✅ **Rules block self-escalation.** `firestore.rules` forces `tier: 'free'` and `role: 'user'` on profile creation, and blocks client updates to `tier`, `tierSource`, `role`, and `pinAttempts`. Stripe extension subcollections are read-only to the owning user.
- ❌ **Rules aren't unit-tested.** No `@firebase/rules-unit-testing` emulator tests were found. The only local tooling for rules is `scripts/sync_security_rules.sh`, a manual script that deploys straight to dev/UAT/prod behind a y/n prompt — bypassing the `verify` job (lint, spec-quality, tests) that gates every other change in `.github/workflows/deploy.yml`.
- ✅ **Query shape is clean.** No collection-group queries, no N+1 loops. Three composite indexes cover the real query patterns (`journals` by date, `tasks` by due date and status). Bulk operations (PIN rotation, account deletion) use chunked `writeBatch` calls rather than one giant write.

### Cloud Functions

- ✅ **Modern, consistent runtime.** All six functions are 2nd-gen (`onCall`/`onSchedule`/`onDocumentWritten`), Node 20, secrets via `defineSecret` (`GEMINI_API_KEY`, `VAULT_PEPPER`) with legacy runtime config explicitly disallowed. Every callable rejects unauthenticated requests; admin-only actions additionally check a custom claim.
- ⚠️ **`generateAIInsights` trusts its payload.** The `{ analysisType, dataPayload }` body is cast with `as` and only checked for presence — journal/workbook strings are interpolated into Gemini prompts without a schema or length/shape validation pass.
- ⚠️ **No visible cost guardrails.** Neither `maxInstances` concurrency caps nor budget alerts were found. `dailyBeacon` paginates the entire `users` collection daily and `generateAIInsights` calls out to Gemini on demand — both are the kind of function you want a spend ceiling on, not just server-side rate limiting.

### Data access patterns

- ✅ **Listener usage matches Google's own guidance.** Only `useTasksList` and `useTodaysVitalityLogs` use `onSnapshot` — for data that's genuinely live and cross-tab. Everything else is one-shot `useQuery`/`useMutation` through TanStack Query, which is the right call for data that doesn't need sub-second freshness and keeps read costs predictable.
- ⚠️ **Two caches, one mental model needed.** Firestore's own IndexedDB persistence (multi-tab) sits underneath TanStack Query's in-memory cache. It works, but it means "why is this stale" has two possible answers. Query-key convention (`[collection, uid, ...]`) is documented by comment only — nothing enforces it, so a mismatched key silently breaks invalidation.

### CI/CD & environments

- ✅ **Deploy pipeline learned from its own drift.** `.github/workflows/deploy.yml` explicitly deploys `firestore:rules,firestore:indexes,functions` after hosting — a comment notes this was added because the hosting-deploy action alone doesn't ship them, which had previously caused drift. Branch → environment mapping (`feature/*` → dev, `release/*` → UAT, `main` → prod) is clean and secrets are environment-scoped.

---

## Best-Practice Comparison

| Practice | Guidance | MRT2 Status |
| --- | --- | --- |
| App Check on Firestore, Auth, callable functions | Enable early; monitor before enforcing | ❌ Not implemented |
| Deny-by-default, ownership-scoped Firestore rules | Production-mode default, per-field lockdown | ✅ Implemented |
| Rules unit-tested via emulator in CI | Local Emulator Suite + CI | ❌ Not found |
| Client-side encryption, keys never sent to server | Separate key storage from data | ✅ Implemented (AES-GCM + pepper) |
| Functions v2 + Secret Manager, no legacy config | 2nd-gen, `defineSecret` | ✅ Implemented |
| Runtime schema validation on callable payloads | Validate before use, don't trust `as` casts | ◐ Partial — presence checks only |
| Concurrency caps / budget alerts | Limit `maxInstances`, set spend alerts | ❌ Not found |
| Long-lived listeners only where data is genuinely live | One-shot reads for infrequent-change data | ✅ Implemented (2 targeted listeners) |
| CI deploys rules/indexes/functions with hosting | Avoid hosting-only drift | ◐ CI does; manual script bypasses it |
| Offline persistence for offline-first UX | Multi-tab persistent local cache | ✅ Implemented |

---

## Recommendations

### High priority

1. **Turn on Firebase App Check.** Add reCAPTCHA Enterprise (web provider) to `src/lib/firebase.ts`, run in monitoring mode for ~1 week to check the verified/unverified traffic ratio, then enforce on Firestore, Auth, and the six callable functions. This is the one control that stops a scripted client from hitting Firestore or Gemini-proxy functions directly with just the public config. *Effort: Medium.*
2. **Validate the `generateAIInsights` payload.** Add a schema check (e.g. zod) on `dataPayload` in `functions/src/index.ts` before it's interpolated into a Gemini prompt — shape, type, and a sane length ceiling per `analysisType`. Closes the gap between what CLAUDE.md documents ("sanitize before every AI call") and what the code currently enforces. *Effort: Small.*
3. **Close the rules-deploy side door.** `scripts/sync_security_rules.sh` pushes straight to prod behind a single y/n prompt, with no lint/test gate. Retire it in favor of the existing CI path, or add the same checks CI already runs before it's allowed to touch UAT/prod. *Effort: Small.*

### Medium priority

4. **Add Firestore rules unit tests to CI.** `@firebase/rules-unit-testing` against the Local Emulator Suite, wired into the same `verify` job that already runs lint and spec-quality checks. Rules changes currently ship on trust, not tests. *Effort: Medium.*
5. **Set cost guardrails on Cloud Functions.** `maxInstances` on `generateAIInsights` and `dailyBeacon`, plus a GCP budget alert on the project. Existing per-user rate limits protect against abuse by one account; they don't cap total spend if traffic spikes. *Effort: Small.*

### Low priority

6. **Remove the dormant Analytics config.** `measurementId` is present in the Firebase web config but `firebase/analytics` is never imported — PostHog already covers product analytics. Drop the unused key for clarity. *Effort: Trivial.*
7. **Document the transaction-vs-batch boundary.** `verifyVaultPin` is the only `runTransaction` caller in the codebase; PIN rotation and account deletion use chunked `writeBatch` calls that are atomic per-chunk but not across the whole operation. Worth a line in the relevant spec confirming that's the intended consistency model for crypto-shredding. *Effort: Trivial.*

---

## Appendix — Where This Came From

| File | Relevance |
| --- | --- |
| `src/lib/firebase.ts` | SDK init, offline persistence, emulator gating |
| `src/lib/crypto.ts` | AES-GCM encryption, key derivation, legacy-plaintext fallback |
| `firebase.json` / `.firebaserc` | Hosting, emulator, and project-alias config |
| `firestore.rules` / `firestore.indexes.json` | Access control and composite indexes |
| `.github/workflows/deploy.yml` | CI verify + branch-to-environment deploy pipeline |
| `scripts/sync_security_rules.sh` | Manual rules-deploy side door (Recommendation 3) |
| `functions/src/index.ts` | All six Cloud Functions |
| `src/hooks/useFirestoreCrud.ts` | Shared query/mutation factory, key convention |
| `src/hooks/useTasksList.ts`, `useTodaysVitalityLogs.ts` | The two `onSnapshot` listener hooks |
| `src/lib/db.ts` | Typed collection helpers, domain interfaces |

**Sources consulted:**
- [Firebase App Check — official docs](https://firebase.google.com/docs/app-check)
- [Protect your app from abuse with App Check](https://firebase.google.com/learn/pathways/firebase-app-check)
- [Firebase security checklist](https://firebase.google.com/support/guides/security-checklist)
- [Best practices for Cloud Firestore](https://firebase.google.com/docs/firestore/best-practices)
- [Writing conditions for Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Understand real-time queries at scale](https://firebase.google.com/docs/firestore/real-time_queries_at_scale)
- [How to secure Firestore with client-side encryption](https://bootstrapped.app/guide/how-to-secure-firebase-firestore-with-client-side-encryption)
