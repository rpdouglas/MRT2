# 📁 Project 94: Production Error Telemetry Hardening

**Status:** ✅ Shipped
**Primary Persona:** Walt (traceability of what actually happened matters most to him), universal (any user who hits an error deserves it to be visible to engineering)
**Objective:** Close the real parts of `OBSERVABILITY_AUDIT.md`'s GAP-01 and GAP-03 — wire priority `console.error` call sites to the already-existing `safeCapture()` telemetry primitive, and fix `ErrorBoundary.tsx`'s guaranteed-to-fail Firestore write when a crash happens while unauthenticated — plus add lightweight Web Vitals telemetry (GAP-05).

---

## 1. The Executive Summary
**User Story:** As any user, when something goes wrong in the app, I want engineering to actually know about it, so problems get fixed instead of silently piling up.
**Source:** `OBSERVABILITY_AUDIT.md` (2026-07-29) Phase 1-2, GAP-01/GAP-03/GAP-05, Quick Win #1.

**Scope corrections — read before treating the source audit's claims as verified:**
- **GAP-03's severity is overstated.** `ErrorBoundary.tsx`'s `componentDidCatch` calls `trackUncaughtError()` (PostHog, via `telemetry.ts`) *unconditionally*, before attempting the Firestore `client_errors` write. So when a crash happens while logged out, PostHog **does** capture it successfully — only the redundant Firestore copy fails (confirmed against `firestore.rules`'s `isCreatingOwnedResource()`, which requires `request.auth != null`). The fix here is "stop attempting a write that's guaranteed to fail," not "restore lost telemetry" — it was never fully lost.
- **`safeCapture()` already exists** (`src/lib/telemetry.ts:11`), following a per-domain wrapper-function convention (`trackSosOpened`, `trackUncaughtError`, etc.) rather than raw inline calls. This ticket follows the same convention with a new `trackMutationFailed(domain, errorName)`.
- **87 raw `console.error` call sites exist across 47 files** (audit said "over 50" — directionally correct, undercounted). But the real architecture is not "87 scattered sites to individually wire" — it's a small number of high-leverage points, found by actually tracing the mutation hooks:
  - **`useTaskOperations.ts` hand-rolls 4 separate `useMutation` calls** (add/toggle/delete/update), each with an `onError` that **only rolls back the optimistic UI update** — no `console.error`, no telemetry, nothing. `Tasks.tsx` itself has no additional catch. **A failed task write today produces zero diagnostic trail of any kind** — more severe than either audit actually flagged, since neither audit traced this file's `useMutation` structure directly.
  - **`useJournalOperations.ts` has no `onError` on any of its 3 mutations at all.** Instead, 3 separate callers (`JournalEditor.tsx:250`, `UrgeSurfer.tsx:109`, `SmartToolContainer.tsx:160`) each independently duplicate `catch (error) { console.error(...); alert(...); }`. The audit attributed this pattern to the hook itself; it's actually duplicated three times at the call sites.
  - **The shared `useFirestoreMutation` wrapper** (`useFirestoreCrud.ts`) has the same silent-rollback-only `onError`, used by `TemplateEditor.tsx`, `JournalAnalysisWizard.tsx`, `ErrorLogViewer.tsx` — fixing it once covers all 3.
  - `AuthContext.tsx`/`EncryptionContext.tsx` genuinely do have scattered, non-wrapper `console.error` sites (4-5 each) — these are the one place the "wire individual sites" framing is actually correct.
- **Sentry/LogRocket (GAP-06) is explicitly out of scope** — PostHog already has its own exception-autocapture facility, and the audit's own scale context (Stage 1, 1-1,000 users) doesn't justify a second crash-reporting tool yet. Revisit only if PostHog's capture proves insufficient in practice.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [ ] **Data Sensitivity:** `trackMutationFailed(domain, errorName)` must pass only a domain string (`'task'`/`'journal'`/`'template'`) and the error's `.name`/`.message` — never the mutation's input data (which, for journal/template mutations, could contain decrypted content). Verify each `onError`'s `_err` parameter is inspected only for error metadata, never logged wholesale.
* [ ] **Encryption Strategy:** N/A — no new encrypted fields.
* [ ] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes.

**Files impacted:**
* `src/lib/telemetry.ts` — add `trackMutationFailed(domain: string, errorName: string)`, following the existing per-domain wrapper convention.
* `src/hooks/useFirestoreCrud.ts` (`useFirestoreMutation`) — add `trackMutationFailed` to the shared `onError`. Covers `TemplateEditor.tsx`, `JournalAnalysisWizard.tsx`, `ErrorLogViewer.tsx` in one change.
* `src/hooks/useTaskOperations.ts` — add `trackMutationFailed('task', ...)` to all 4 hand-rolled `onError` callbacks (add/toggle/delete/update). **Highest-severity fix in this ticket** — currently zero visibility of any kind for a failed task write.
* `src/hooks/useJournalOperations.ts` — add an `onError` (currently absent) to all 3 mutations, calling `trackMutationFailed('journal', ...)`. Centralizes what `JournalEditor.tsx`, `UrgeSurfer.tsx`, and `SmartToolContainer.tsx` each currently duplicate independently; their existing `alert()`-based user feedback stays as-is (UI concern, not telemetry).
* `src/components/ErrorBoundary.tsx` — skip the `addDoc(collection(db, 'client_errors'), ...)` attempt entirely when `!auth?.currentUser`, since it's guaranteed to fail the security rule. `trackUncaughtError()` already covers this case.
* `src/contexts/AuthContext.tsx`, `src/contexts/EncryptionContext.tsx` — no shared wrapper here; wire the genuinely scattered `console.error` sites (4-5 each) directly to `safeCapture`.
* `src/main.tsx` — install `web-vitals`, report `LCP`/`INP`/`CLS` via `safeCapture('web_vital', { name, value, rating })`.

---

## 4. Implementation Phases 🏗️

### Phase 1: ErrorBoundary fix
* Guard the Firestore write behind `if (auth?.currentUser)`.
* Confirm `trackUncaughtError()` still fires unconditionally (it must — that's the actual safety net for the logged-out case).

### Phase 2: Mutation-wrapper telemetry (the real leverage points)
* Add `trackMutationFailed()` to `telemetry.ts`.
* Wire it into `useFirestoreMutation`'s shared `onError` (3 files covered in one change).
* Wire it into `useTaskOperations.ts`'s 4 hand-rolled `onError` callbacks.
* Add `onError` to `useJournalOperations.ts`'s 3 mutations (new — didn't exist before), calling `trackMutationFailed('journal', ...)`.

### Phase 3: Scattered context-level sites
* Added a second telemetry wrapper, `trackClientError(domain, errorName)`, distinct from `trackMutationFailed` since these aren't TanStack mutations — auth state, vault unlock/setup/reset/status-check, FCM token refresh, FCM foreground listener, and the Stripe subscription `onSnapshot` listener error callback. 8 sites wired across `AuthContext.tsx` (4) and `EncryptionContext.tsx` (4).
* Confirmed `EncryptionContext.tsx`'s unlock-failure catch is genuinely the "unexpected error" path, not routine wrong-PIN entry — wrong PIN is handled earlier in the function (fail-closed, `console.warn` only, returns `false` before reaching this catch), so this doesn't spam telemetry on ordinary mistyped PINs.

### Phase 4: Web Vitals
* Installed `web-vitals@6.0.1`.
* Wired `onCLS`/`onINP`/`onLCP` in `src/main.tsx` to `safeCapture('web_vital', { name, value, rating })`.

### Phase 5: Edge Cases
* [x] Confirmed every one of the 16 new telemetry call sites passes only a static domain string and `error.name` — never `.message`, never mutation args, never decrypted content (verified by grep across all 5 modified files).
* [x] `web-vitals`'s callbacks fire asynchronously post-render; PostHog's `posthog.init()` call is synchronous at module load above them in `main.tsx` — no ordering issue.
* [x] `useJournalOperations.ts`'s new `onError` callbacks are purely additive — existing `onSettled` cache invalidation behavior is untouched.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing, confirming the additive `onError` callbacks don't change any mutation's success-path behavior.
* [x] **Security:** grepped all 16 new call sites — confirmed each passes only `domain` + `error.name`, never `.message` or mutation input data.
* [x] **Build:** `npm run build` clean; `vendor` chunk grew 867KB → 876KB (+8.4KB raw for `web-vitals`, in line with the ~1-2KB gzipped estimate).
* [x] **Regression:** full `npm run check` clean.
