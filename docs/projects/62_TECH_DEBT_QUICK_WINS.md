# 📁 Project 62: Tech Debt Quick Wins — Logging, Rules, Duplicate Reads, `any` Suppressions

**Status:** ✅ Shipped — all four phases complete, including the `firestore.rules` deploy to `mrt2-app-prod`.
**Primary Persona:** The Architect (Admin)
**Objective:** Clear the five small, already-scoped chores sitting in `ACTIVE_CYCLE.md`'s Chores & Tech Debt list — no new user-facing behavior, no schema changes.

**Source:** `docs/reports/2026-07_codebase_deep_review.md` "Quick wins" table (§1, §3, §4). Precedent: `PROJ-61` (Test Coverage Backfill) — same template, same "no new user-facing behavior" scope.

---

## 1. The Executive Summary
**User Story:** As the Lead Architect, I want the last of the deep-review's "quick win" findings closed out, so `ACTIVE_CYCLE.md`'s Chores list reflects only genuinely open items and the codebase stops carrying a debug log, an under-scoped Firestore rule, a dead-code read path, and four inference-gap `any` casts.
**Competitive Gap:** N/A — internal quality/safety net, mirrors the rationale in `PROJ-40`/`PROJ-61`.

**Scope correction vs. `ACTIVE_CYCLE.md`'s current wording:** re-verifying each item against the current tree (post-PROJ-59/60) turned up two things worth calling out before implementation starts:
1. The "Vitality.tsx raw `onSnapshot` + `addDoc`" item is **stale**. PROJ-60 already split `Vitality.tsx`; the `addDoc`-skips-`encrypt()` bug it references was fixed there. The remaining raw `onSnapshot` for Vitality now lives in `useTodaysVitalityLogs.ts`, and per that file's own comment it's a **deliberate** dedicated tag-filtered listener, kept separate from the generic `['journals', uid]` cache on purpose — not a bug. **Tasks.tsx is the only file left with this problem**, and unlike Vitality there is no existing hook to redirect it to — one has to be extracted (see Phase 3).
2. Two of the four `any` suppressions were already someone else's problem to solve for us: `UrgeSurfer.tsx`'s hand-rolled "average last 7 mood scores" logic is a byte-for-byte duplicate of `inferMoodFromRecentEntries()` / `MoodCacheEntry`, which PROJ-60 already extracted into `src/lib/vitalityScoring.ts`. Fixing it is a reuse, not a new type.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None of these five items touch encrypted content. `ai_logs`/`client_errors`/`feedback` are metadata-only collections per the ZK boundary table in `CLAUDE.md`; the Firestore-rules change (Phase 2) only tightens *who* can write a doc, not what fields it may contain.
* [x] **Encryption Strategy:** N/A — no `crypto.ts` interaction in this project.
* [ ] **Key Rotation:** N/A.

**One finding promoted out of "trivial" during audit:** tightening the `ai_logs`/`client_errors`/`feedback` create rules to `isCreatingOwnedResource()` is not a pure rules-file edit — see Phase 2, it requires a matching code change first or the tightened rule will break writes outright (client_errors currently ships no `uid` field at all).

---

## 3. Schema & Architecture 🗄️
No new Firestore collections or documents. One new client-side interface (a read hook return type for Tasks) and two Firestore-rule edits.

**Firestore Collections Impacted:**
* `ai_logs`: no field changes; `create` rule tightened from `request.auth != null` to `isCreatingOwnedResource()`.
* `client_errors`: **write payload gains a `uid` field** (currently absent) so the same rule tightening doesn't break error telemetry; `create` rule tightened to `isCreatingOwnedResource()`.
* `feedback`: no field changes (already writes `uid`); `create` rule tightened to `isCreatingOwnedResource()`.

**Types (`src/lib/db.ts` / new hook file):**
```typescript
// src/hooks/useTasksList.ts (new — mirrors useTodaysVitalityLogs.ts's pattern)
export function useTasksList(): { tasks: Task[]; loading: boolean } {
  // live onSnapshot on collection('tasks') where uid == user.uid, orderBy createdAt desc
  // kept as a dedicated listener (not useQuery) for the same reason
  // useTodaysVitalityLogs.ts gives: Tasks.tsx needs live cross-tab/cross-device
  // updates, which a one-shot useQuery read doesn't provide.
}
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Debug logging + CI secret hardening (no behavior change, do first)
* Delete `console.log("DEBUG: Current Auth Domain:", ...)` at `src/lib/firebase.ts:5`.
* `deploy.yml:144-146` writes the Firebase service-account JSON into `$GITHUB_ENV` with a static `EOF` delimiter (`echo "SERVICE_ACCOUNT_JSON<<EOF"`). Replace the static delimiter with a randomly generated one (e.g. `` `EOF_$(openssl rand -hex 8)` ``) per GitHub's own heredoc-injection guidance. **Do not** try to route around `$GITHUB_ENV` entirely — the value is consumed as a plain string input by the Firebase Hosting action at line 168 (`firebaseServiceAccount: "${{ env.SERVICE_ACCOUNT_JSON }}"`), which requires it to cross the step boundary this way.

### Phase 2: Firestore rules — `uid`-match on `ai_logs` / `client_errors` / `feedback`
* **Code change first, rule change second** (order matters — reverse order breaks error telemetry mid-deploy):
  1. `src/components/ErrorBoundary.tsx:32` — add `uid: auth?.currentUser?.uid` (import `auth` from `../lib/firebase`) to the `client_errors` write payload. It's a class component with no hook access, so pull the current user directly off the `auth` singleton rather than threading it through props/context.
  2. `src/lib/gemini.ts:112,175` — the `uid = auth?.currentUser?.uid || 'anonymous'` fallback will get silently rejected once the rule requires `request.resource.data.uid == request.auth.uid` (since `request.auth` is already guaranteed non-null for this rule to pass at all, `'anonymous'` can never equal it). Change fallback behavior to skip the `logAIUsage()` call entirely when `currentUser` is `undefined`, since this is fire-and-forget telemetry, not something to write with a value the rule will reject.
  3. `firestore.rules:103-124` — replace `allow create: if request.auth != null;` with `allow create: if isCreatingOwnedResource();` on all three of `ai_logs` (~103), `client_errors` (~110), `feedback` (~121). Leave `read`/`delete` (admin-only) untouched.
* Deploy with `firebase deploy --only firestore:rules` — confirm with the user before running, per this repo's "hard-to-reverse shared-state action" guidance (a rules deploy affects the live PROD ruleset immediately).

### Phase 3: Tasks.tsx duplicate read path
* Extract the raw `onSnapshot` block (`src/pages/Tasks.tsx:60-86`) into a new `src/hooks/useTasksList.ts`, structured the same way as `useTodaysVitalityLogs.ts` (dedicated listener, not `useQuery` — live cross-device task updates are the reason this page needs a subscription instead of a one-shot read). `Tasks.tsx` keeps its existing `useTaskOperations()` mutations unchanged; only the read path moves.
* Confirm no other page duplicates this same tasks-read query before closing this out (checked: `Dashboard.tsx` uses its own bounded one-shot `useQuery` for streak calculation — different shape, out of scope; `DebugTools.tsx` has its own raw read, called out separately in Phase 4 and intentionally not consolidated — it's an admin-only debug page, not a duplicate of the same production code path).

### Phase 4: Fix the four `any`-type suppressions
* **`src/pages/UrgeSurfer.tsx:43,46,49`** — replace the hand-rolled cache-filter/average with the existing `inferMoodFromRecentEntries()` + `MoodCacheEntry` type, imported from `src/lib/vitalityScoring.ts` (same function `useVitalityEntries.ts` already calls on the same `['journals', uid]` cache key). Deletes duplicate logic, not just the `any`.
* **`src/pages/Dashboard.tsx:130-136`** — the two `useQuery` blocks feeding this (`journals` at ~line 62, `tasks` at ~line 85) return implicitly-`any` `DocumentData` because `snap.docs.map(d => ({...d.data(), ...}))` isn't typed. Type each `queryFn`'s return as `JournalEntry[]` / `Task[]` (both already imported types) so `calculateJournalStats`/`calculateTaskStats`/`calculateVitalityStats`/`calculateUserLevel` — which accept the narrower `ScorableJournal[]`/`ScorableTask[]` structural types in `gamification.ts` — typecheck without a cast.
* **`src/components/journal/JournalHistory.tsx:129`** — `groupItemsByYearAndMonth(filteredEntries as any[])`. `JournalEntryWithStatus`'s `createdAt` is typed `Timestamp` but the runtime value assigned at line 107 is a `Date` (post-`.toDate()`), forced through `as unknown as JournalEntryWithStatus` at construction. Root cause needs a `tsc` check before committing to a fix — likely either widening `JournalEntryWithStatus.createdAt` to `Timestamp | Date`, or resolving a generic-inference gap between `groupItemsByYearAndMonth<T extends TimeStampedItem>` and the concrete type. Do not guess the fix in isolation from Phase 5's typecheck.
* **`src/pages/DebugTools.tsx:13`** — `useState<any[]>([])` → `useState<Task[]>([])`, importing the existing `Task` type from `../lib/tasks` (same type `Tasks.tsx` already uses). **Non-goal:** this page's raw `getDocs`/`updateDoc` calls are an admin-only debug tool, not a production duplicate path — leave them as raw Firestore calls; only the `any` is in scope.

---

## 5. QA & Verification 🧪
* [ ] **Run Suite:** `npm run test:once` and `npm run build` (full `tsc` check) — all existing suites must still pass; `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` are explicitly **not** part of this project (separate Chores item) so don't opportunistically enable them here.
* [ ] **Lint:** `npm run lint` — zero warnings, confirms all four `eslint-disable` comments were actually removed, not just the casts.
* [ ] **Rules deploy verification (Phase 2):** after code changes ship and before the rules deploy, manually trigger one write to each of `ai_logs` (any Gemini call), `client_errors` (throw a test error), and `feedback` (submit the feedback form) against a local/dev project with the *tightened* rules loaded in the Firestore emulator — confirm all three still succeed with a real signed-in user, and confirm an emulator test with a mismatched/missing `uid` is rejected.
* [ ] **The Subway Test:** N/A — no offline-affecting behavior changed.
* [ ] **The "Lost PIN" Test:** N/A — no encrypted/ZK data touched.
* [ ] **Manual regression:** Tasks page (Today/Later/Log tabs still populate live after the `useTasksList` extraction), UrgeSurfer smart-mood prefill still infers a sane default, Dashboard gamification stats/level still compute, JournalHistory search/grouping still renders correctly.
