# MRT2 Codebase Deep Review

**MRT · Full-Depth Architecture, Quality, Security & Performance Review**

A read-only pass across the entire codebase — `src/lib`, `src/hooks`, `src/components`, `src/pages`, `functions/src`, `firestore.rules`, CI/CD, and build config — looking for refactoring opportunities, tooling gaps, and risk, not feature correctness. Scoped deliberately to avoid repeating ground already covered by `docs/reports/july_2026_features_and_code_review.md` (feature changelog), the `governance` skill (doc-vs-code drift), the `review` skill (session/CLAUDE.md drift), and the `zk-audit` skill (per-feature encryption-boundary checks). This review looks at what none of those cover: cross-cutting architectural consistency, code-quality hotspots, security beyond the ZK boundary, test coverage, and performance/tooling posture.

- **Scope:** Full codebase, no exclusions
- **Method:** Full-file reads across all major directories, cross-checked against `CLAUDE.md` rules; every finding below is file-and-line verified
- **Findings:** 20+ across 8 categories, prioritized at the end

---

## At a glance

| | |
|---|---|
| **10+** | user-facing files bypassing the "TanStack Query wraps ALL Firestore ops" rule — the exact smell PROJ-58 fixed in Profile.tsx, recurring elsewhere |
| **926** | lines in the largest file (`Profile.tsx`) — 4 of the top 10 largest files mix 3+ unrelated concerns |
| **4** | files where the CI-failing "no `any` types" rule is suppressed with `eslint-disable`, not followed |
| **0** | `React.memo` usages anywhere in the app |
| **2** | Firestore-write hooks (`useROSCAssessments`, `useRateLimits`) with zero test coverage |
| **0** | bundle-analyzer / dependency-graph tools installed (clean whitespace for tooling additions) |

---

## 1. Architecture & Data-Access Consistency

**This is the single highest-value finding in the review.**

`CLAUDE.md` states: *"TanStack Query wraps ALL Firestore reads/writes; no direct Firestore calls."* `docs/reports/profile-gap-analysis.md` flagged `Profile.tsx` for violating this, and PROJ-58 fixed it. But the same smell recurs across at least 10 other user-facing files — it was never a one-off, it's a recurring pattern that new code keeps reintroducing.

### 🔴 Critical — Duplicate, competing data paths (not just a missing hook — an existing hook being ignored)

- **`src/pages/Tasks.tsx:60-86`** — a raw `onSnapshot` listener into local `useState`, running *in the same file* that imports `useTaskOperations` (a correct, existing TanStack Query hook) for mutations only. Reads bypass the hook; writes go through it. Two competing code paths maintain the same data.
- **`src/pages/Vitality.tsx:87-104, 141`** — raw `onSnapshot` + raw `addDoc` for vitality/journal entries, hand-rolling exactly what `useJournalOperations` already does correctly elsewhere in the app.

*Why it matters:* these aren't missing abstractions — the correct hook already exists and already works. The fix is deletion of a duplicate path, not new code, which makes this the cheapest high-value fix in the whole review.

### 🟠 Major — Fully raw CRUD, no query layer at all

- **`src/components/journal/TemplateEditor.tsx`** — entirely hand-rolled: `getDocs` (42-43), `deleteDoc` (110), `updateDoc` (140), `addDoc` (143). No `useQuery`/`useMutation` anywhere in the file.
- **`src/components/journal/JournalAnalysisWizard.tsx:163,182`** — two raw `addDoc(collection(database,'insights'))` calls, no mutation hook.
- **`src/components/smart_tools/SmartToolContainer.tsx:66`** — raw `getDocs` in a `useEffect` for session resume.
- **`src/components/journal/JournalInsights.tsx:121`** — raw `getDocs` in a plain `useEffect`, no cache.
- **`src/components/profile/DataManagement.tsx:58,106`** — raw `getDoc`/`setDoc` for `lastExportAt`. Notably, this is the file `Profile.tsx` now delegates its Data tab to post-PROJ-58 — the bypass moved down a level rather than disappearing.
- **`src/components/AppShell.tsx:42,58`** — raw `getDoc`/`setDoc` for background auto-backup timestamp.
- **`src/components/SOSModal.tsx:25`** and **`src/pages/Login.tsx:45`** — raw `getDoc` for sponsor-contact lookup and onboarding-routing check respectively.
- **`src/components/journal/JournalEditor.tsx:105`** (`loadUserTags`) — the file uses hooks correctly elsewhere, but this one fetch bypasses.

### 🟡 Moderate — Correct read pattern, drifted write pattern

Three files correctly wrap **reads** in `useQuery` but perform **writes** as raw Firestore calls with a manual `queryClient.invalidateQueries()` instead of `useMutation`:
- `src/components/admin/ErrorLogViewer.tsx:73` (delete)
- `src/components/dashboard/DynamicAnchorWidget.tsx:73` (reading-date bump)
- `src/pages/Dashboard.tsx:62,67` (build-hash tracking in a `useEffect`)

This is lower-severity — the cache does stay in sync — but it's a third variant of "the rule, sort of," which is exactly the kind of inconsistency that makes onboarding new contributors harder.

### Possible dead code

`src/lib/journal.ts` (Firestore CRUD for journals) and `src/hooks/useJournalOperations.ts` (which inlines its *own* Firestore CRUD for journals rather than calling `journal.ts`) appear to implement the same operations independently. Worth a direct diff to confirm which one is actually live and delete the other.

### Recommendation

1. **Quick wins:** delete the duplicate `onSnapshot`/`addDoc` blocks in `Tasks.tsx` and `Vitality.tsx` and rely on the existing hooks — no new code required.
2. **Medium:** migrate `TemplateEditor.tsx`, `JournalAnalysisWizard.tsx`, `SmartToolContainer.tsx`, `JournalInsights.tsx`, `DataManagement.tsx` onto `useQuery`/`useMutation`.
3. **Structural:** `useTaskOperations`, `useJournalOperations`, and `useWorkbookAnswers` share an identical shape (mutation + optimistic `onMutate`/`onError`/`onSettled` + `invalidateQueries`). A shared `useFirestoreCrud<T>(collectionPath, queryKey)` factory would make "the right way" the *easy* way, which is probably why the bypass keeps recurring — the correct pattern currently requires more boilerplate than a quick inline `getDocs`.

---

## 2. Code Quality — God Files

Ranked by line count (top 10, non-test files). Hooks top out at 222 lines (`useTaskOperations.ts`) — the size problem is concentrated entirely in `pages/` and `components/`.

| Rank | Lines | File | Split candidate? |
|---|---|---|---|
| 1 | 926 | `src/pages/Profile.tsx` | Firestore-bypass smell is gone (PROJ-58), but 3 largely-independent tabs (General/Security/Data) still live in one component. Data tab was already extracted once — General and Security could follow. |
| 2 | 531 | `src/pages/Tasks.tsx` | Partly justified (3 tabs, gesture handling), but the raw `onSnapshot` (§1) is a defect, not just size. |
| 3 | 497 | `src/pages/Vitality.tsx` | **Yes** — breathwork timer state machine, bio-balance scoring, mood inference, and Firestore I/O are 4 unrelated concerns in one file. |
| 4 | 468 | `src/components/journal/JournalInsights.tsx` | **Yes** — raw data-fetch + stats math + Recharts composition + a localStorage-backed mood-word blocklist feature, all in one file. |
| 5 | 463 | `src/components/profile/DataManagement.tsx` | **Yes** — export, import, and account deletion (the single highest-risk operation in the app) share one file and blast radius. |
| 6 | 399 | `src/components/journal/JournalEditor.tsx` | Borderline — large but cohesive around one editing surface. |
| 7 | 385 | `src/components/journal/JournalAnalysisWizard.tsx` | Borderline. |
| 8 | 377 | `src/pages/Dashboard.tsx` | Borderline — many widgets, but each is thin. |
| 9 | 375 | `src/pages/InsightsLog.tsx` | Not reviewed in depth this pass. |
| 10 | 370 | `src/components/journal/JournalHistory.tsx` | Not reviewed in depth this pass. |

**Priority:** `Vitality.tsx` and `DataManagement.tsx` are the clearest wins — both mix genuinely unrelated concerns, and `DataManagement.tsx` specifically bundles account deletion (destructive, irreversible) with two much lower-risk operations, meaning any future change to export/import carries unnecessary risk of touching deletion logic.

---

## 3. Type Safety Enforcement Gap

`CLAUDE.md`: *"NO `any` types. Use `unknown` and cast via interfaces."* Marked CI-failing. In practice, every production `any` found is suppressed rather than fixed:

| File | Line(s) | Pattern |
|---|---|---|
| `src/components/journal/JournalHistory.tsx` | 129 | `filteredEntries as any[]` with inline disable |
| `src/pages/Dashboard.tsx` | 141-146 | **File-level** `/* eslint-disable @typescript-eslint/no-explicit-any */` — broader than a single line, can silently absorb future `any` additions in that file without another lint failure |
| `src/pages/UrgeSurfer.tsx` | 46, 49 | `(e: any) =>`, `curr: any` in a reduce, both with inline disables |
| `src/pages/DebugTools.tsx` | 13 | `useState<any[]>([])` |

Test files have **zero** `any` usage — the rule holds up better in tests than in production code. `functions/src/` has zero hits — clean.

**Recommendation:** type these four properly (all four are inference gaps, not fundamentally-untypeable data) and remove the suppressions. `Dashboard.tsx`'s file-level disable should be narrowed to line-level even if the underlying `any` isn't fixed immediately, so the CI gate isn't broadly disabled for the rest of that file's lifetime.

---

## 4. Security Beyond the ZK Boundary

The `zk-audit` skill checks the encryption boundary per-feature. This section looks at the rest of the security surface: Firestore rules holistically, admin-escalation paths, secrets handling, and Cloud Function input validation.

### 🟡 Moderate — Inconsistent ownership check on 3 collections

`firestore.rules` uses `isCreatingOwnedResource()` (verifies `request.resource.data.uid == request.auth.uid`) for `journals`, `tasks`, `insights`, and `service`. Three collections don't:

```
// firestore.rules:103-124
match /ai_logs/{logId} {
  allow create: if request.auth != null;   // no uid-match check
  allow read: if isAdmin();
}
match /client_errors/{errorId} {
  allow create: if request.auth != null;   // no uid-match check
  allow read, delete: if isAdmin();
}
match /feedback/{reportId} {
  allow create: if request.auth != null;   // no uid-match check
  allow read, update, delete: if isAdmin();
}
```

Any authenticated user can write one of these documents with a spoofed `uid` pointing at another user. Reads are admin-only, so there's no confidentiality leak — but it breaks log/report integrity (a malicious user could frame another user's uid in a feedback report or error log). **Fix:** add the same `isCreatingOwnedResource()` check used everywhere else — this is a one-line-per-block change, not a redesign.

### ✅ No admin-escalation path found

`users/{uid}.role` is rules-protected: creation forces `role=='user'` unless already admin (`firestore.rules:38-42`), and updates block the owner from including `role`/`tier`/`tierSource` in the diff at all (`:49-52`). The only path to real admin privilege is `scripts/set_admin_role.cjs`, which sets a Firebase Auth **custom claim** via a gitignored, untracked service-account credential — not client-reachable.

### 🟢 Minor — Hardcoded email as a client-side admin-UI bypass

`src/contexts/AuthContext.tsx:50`:
```ts
setIsAdmin(profile.role === 'admin' || currentUser.email === 'rpdouglas@gmail.com');
```
This only affects which admin UI renders client-side — every actual admin-only read/write still requires the real custom claim, so there's no privilege escalation. But it's a hardcoded identity shipped in the client bundle, and it creates three different informal definitions of "admin" (custom claim, this literal email, the `role` field) that should converge on one.

### 🟢 Noted — Client-bundled Gemini API key (architectural tradeoff, not a bug)

`src/lib/gemini.ts:16` loads `VITE_GEMINI_API_KEY` and calls Gemini directly from the browser. `functions/src/index.ts:28` correctly uses `defineSecret("GEMINI_API_KEY")` server-side for its own calls. The client-side key is, by the nature of `VITE_`-prefixed env vars, extractable from the shipped bundle and usable by a third party against your quota/billing. This is presumably a deliberate low-latency/simplicity tradeoff (matches the "Approved Gemini exception" flows in `CLAUDE.md`), but worth an explicit acknowledgment/rate-limit review given it's now a standing exposure, not a one-time oversight.

### 🟢 Minor — CI secret-handling anti-pattern

`.github/workflows/deploy.yml` pipes the Firebase service-account JSON into `$GITHUB_ENV` via a heredoc-style block. This is a documented GitHub Actions anti-pattern (a line in the file content matching the delimiter could inject arbitrary env vars into later steps). Exploitability here is low — service-account JSON won't naturally contain a bare `EOF` line — but a random delimiter or passing the value via a step `env:` input instead would close the gap for free.

### 🟢 Minor — Leftover debug logging

`src/lib/firebase.ts:5` — `console.log("DEBUG: Current Auth Domain:", ...)` ships to production. Not a secret leak (auth domain isn't sensitive) but debug scaffolding that should be removed.

### ✅ Cloud Functions — reviewed all 5 exports

`generateReadingsAdmin` (the only `onCall`) has solid auth (`request.auth?.token.admin` check) and input validation (day-range, date regex, modality enum) before the values reach a Gemini prompt or a Firestore write. The two `onSchedule` functions need no user-auth check by design. `syncStripeSubscription` (`onDocumentWritten`) has no in-function auth check, but is safe *only because* `subscriptions` writes are rules-locked to `if false` (admin SDK only) — this is an implicit trust dependency worth a one-line code comment so a future rules change doesn't silently reopen it.

### ✅ No hardcoded secrets found anywhere in the repo, no tracked service-account credentials.

---

## 5. Test Coverage Gaps

| Area | Tested | Total | Ratio | Notable untested |
|---|---|---|---|---|
| `src/lib/` | 12 | ~32 | 38% | `db.ts`, `gemini.ts` (only ever `vi.mock`'d — real logic never executes in any test), `exporter.ts` (calls `decrypt()` directly during data export), `deletion.ts`, `importer.ts` |
| `src/hooks/` | 10 | 18 | 56% | `useROSCAssessments.ts`, `useRateLimits.ts` — **both do Firestore writes with zero test coverage anywhere** |
| `src/components/` | 16 | 66 | 24% | — |
| `src/pages/` | 4 | 19 | 21% | — |
| `functions/src/` | partial | 3 files | — | `prompts.ts` has zero coverage; `index.ts`'s 4 actual deployed triggers (`dailyBeacon`, `checkBufferHealth`, `generateReadingsAdmin`, `syncStripeSubscription`) are never invoked by any test — only their internal pure-logic helpers (`processUserBatch`, milestone calculators) are unit tested |

**Highest-priority gap:** `exporter.ts` sits directly on the decryption path (calls `decrypt()` from `crypto.ts` to produce a user's data export) and has no test at all. In a zero-knowledge app, anything touching plaintext recovery content deserves coverage, even if `crypto.ts` itself is tested. `useROSCAssessments`/`useRateLimits` are the only two Firestore-write hooks in the app with no test whatsoever — worth closing before the next feature builds on top of either.

---

## 6. Performance & Bundle Health

### 🟠 Bundle chunking — warning threshold raised rather than addressed

```ts
// vite.config.ts:93-110
chunkSizeWarningLimit: 1000,   // doubled from Vite's 500kB default
rollupOptions: {
  output: {
    manualChunks(id) {
      if (id.includes('node_modules')) {
        if (id.includes('firebase')) return 'firebase';
        if (id.includes('recharts')) return 'recharts';
        if (id.includes('@google/generative-ai')) return 'gemini';
        return 'vendor';   // everything else: react, router, virtuoso,
      }                    // date-fns, heroicons, lucide, headlessui,
    }                      // tanstack-query, jspdf, posthog, sonner...
  }
}
```
Everything that isn't Firebase/Recharts/Gemini lands in one `vendor` bucket. Raising the warning limit instead of splitting `vendor` further (e.g. separating the React runtime from UI libraries from one-off heavy libs like `jspdf`) is consistent with tolerating bundle bloat rather than fixing its cause. No bundle-visualizer is installed to even see what's driving `vendor`'s size (see §7).

### 🟡 Zero `React.memo` usage

Confirmed 0 occurrences of `React.memo` anywhere in `src/components` or `src/pages`. `useMemo`/`useCallback` appear in only ~25% of component/page files combined. In a component-heavy app with a 66-file component tree, this means most re-renders are unmanaged by default — not necessarily a real problem today, but worth a targeted profiling pass on the pages with the most state (Dashboard, Tasks, Journal) rather than a blanket memoization pass.

### ✅ Virtualization is correctly applied where it matters

`react-virtuoso` is used in exactly the 3 places with genuinely long lists: `JournalHistory.tsx`, `Tasks.tsx`, and `ErrorLogViewer.tsx`. No further action needed here unless another long-list surface emerges.

### 🟢 Minor — TypeScript strictness

`tsconfig.app.json` has `strict: true` plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` — a solidly strict baseline. Missing: `noUncheckedIndexedAccess` (catches real out-of-bounds-index bugs at compile time; commonly recommended alongside `strict`) and `exactOptionalPropertyTypes`. Low-effort addition, though turning either on retroactively may surface a batch of new type errors to clean up.

---

## 7. Tooling & Dependency Recommendations

**Confirmed gap, zero existing tooling:** no `rollup-plugin-visualizer` (or equivalent bundle visualizer), no `depcheck`/`knip` (unused export/dependency detection), no `madge` (circular-import detection). Given the bundle-chunking finding above, a visualizer would directly answer "what's actually in `vendor`" instead of guessing. `depcheck`/`knip` would also help identify any dead code left behind by the CRUD-duplication issue in §1 (e.g. confirming whether `src/lib/journal.ts` is actually still imported anywhere).

**Recommendation:** add at minimum:
- `rollup-plugin-visualizer` (dev-only, wire into `vite.config.ts`, run on demand) — directly informs the `manualChunks` fix in §6.
- `knip` or `depcheck` — one-time run to catch dead exports (candidates: the `journal.ts` vs `useJournalOperations.ts` duplication in §1).

**Minor:** `functions/package.json` pins noticeably older ESLint (`^8.9.0`) and `@typescript-eslint/*` (`^5.12.0`) than the root project (`^9.39.2`/`^8.50.0`). Dev-tooling drift only, not a security concern, but worth aligning so Cloud Functions code is linted to the same standard as the rest of the app.

**No other dependency redundancy found** — single date library, single query library, single virtualization library, single charting library. `@heroicons/react` and `lucide-react` coexist; whether that's an intentional split or overlap wasn't conclusively determined without an import-site audit (out of scope for this pass).

---

## Prioritized Recommendations

### Quick wins (small effort, do these first)
| Finding | File(s) |
|---|---|
| Remove leftover debug `console.log` | `src/lib/firebase.ts:5` |
| Add `uid`-match check to 3 Firestore rules (copy the existing `isCreatingOwnedResource()` pattern) | `firestore.rules:103-124` |
| Delete duplicate raw `onSnapshot`/`addDoc` paths — the correct hook already exists | `src/pages/Tasks.tsx`, `src/pages/Vitality.tsx` |
| Fix or properly narrow the 4 `any`-type suppressions | `JournalHistory.tsx`, `Dashboard.tsx`, `UrgeSurfer.tsx`, `DebugTools.tsx` |
| Harden the GH Actions service-account heredoc | `.github/workflows/deploy.yml` |
| Add `noUncheckedIndexedAccess` to `tsconfig.app.json` | `tsconfig.app.json` |

### Larger refactors (real value, more effort)
| Finding | Scope |
|---|---|
| Consolidate the Firestore-bypass pattern across ~10 files onto `useQuery`/`useMutation` | `TemplateEditor`, `JournalAnalysisWizard`, `SmartToolContainer`, `JournalInsights`, `DataManagement`, `AppShell`, `SOSModal`, `Login` |
| Extract a shared `useFirestoreCrud<T>` factory from the 3 structurally-identical CRUD hooks | `useTaskOperations`, `useJournalOperations`, `useWorkbookAnswers` |
| Split `Vitality.tsx` and `DataManagement.tsx` by concern | Timer/scoring/Firestore separation; export/import/deletion separation |
| Backfill tests for `exporter.ts`, `useROSCAssessments`, `useRateLimits`, `functions/src/prompts.ts` | Decryption-adjacent and Firestore-write paths with zero coverage |
| Restructure the `vendor` bundle chunk after adding a visualizer | `vite.config.ts` |
| Resolve `src/lib/journal.ts` vs `useJournalOperations.ts` duplication | Confirm which is live, delete the other |

---

## What's already working

Worth preserving, not just fixing what's broken. Firestore rules correctly block `role`/`tier` self-escalation and lock `subscriptions`/`payments`/`checkout_sessions` writes to server-only. Cloud Function input validation (`generateReadingsAdmin`) is a good template — date-regex, range checks, and enum validation before anything touches Firestore or a Gemini prompt. `react-virtuoso` is applied exactly where it's needed and nowhere it isn't. TypeScript's `strict` baseline is solid. No hardcoded secrets exist anywhere in the tree, and the CI secrets pipeline is otherwise sound. Zero TODO/FIXME markers is a genuine sign of discipline — known issues are tracked in `BACKLOG.md`/`ACTIVE_CYCLE.md`/`TRIAGE_REPORT.md` rather than left to rot in code comments.

---

*Full-depth review per your request — no area excluded. Items above (especially the Firestore-bypass consolidation and the Firestore-rules fix) are good candidates to graduate into `docs/ACTIVE_CYCLE.md`'s Chores & Tech Debt section or a `docs/projects/XX_DATA_LAYER_CONSOLIDATION.md` spec if you want to act on them through the full planning protocol — not done automatically here.*
