# 📁 Project 92: Performance & Scale Polish

**Status:** ✅ Shipped
**Primary Persona:** Walt (500+ entry lists), Ned (load speed) — though most of the originally-suspected gaps turned out not to exist
**Objective:** Close the one confirmed remaining performance gap (`gcTime`) plus one genuinely low-risk, self-contained cleanup (`lucide-react` removal) surfaced by a separate dependency audit — while explicitly NOT absorbing that audit's other, higher-blast-radius findings into this ticket.

---

## 1. The Executive Summary
**User Story:** As a long-term user with hundreds of entries, I want the app to stay responsive when I navigate away and back, without unnecessary refetch flicker.
**Source:** `docs/reports/PRODUCTION_READINESS_AUDIT.md` §2.3 (Action #7 virtualization, #8 gcTime, #11 PWA precache, #13/#19 Firestore reads/indexes, #21 asset optimization), and `DEPENDENCY_AUDIT.md` (2026-07-29, untracked root-level file — a separate architecture/dependency review, not part of the original Play Store audit).

**Scope correction — most of the original PROJ-92 scope no longer exists, verified against real code:**
- **Virtualization (#7):** Already implemented. `Tasks.tsx:337` and `JournalHistory.tsx:281` both already use `react-virtuoso`'s `<Virtuoso>`. No change needed.
- **PWA precache tuning (#11):** Reviewed `vite.config.ts`'s workbox config — Google Fonts (CacheFirst) and Firebase Storage (StaleWhileRevalidate) runtime caching already configured reasonably. No concrete gap found without real usage data to act on; not proposing a speculative change.
- **DailyReadings Firestore read audit (#13):** `functions/src/index.ts`'s `dailyBeacon` already paginates users in batches and does one `tasks` query per user — this is a deliberate, already-monitored design (`BEACON_BATCH_WARN_THRESHOLD` logs a warning if batch count grows, explicitly flagging when to reconsider architecture). Not a silent gap.
- **`rosc_assessments` indexes (#19):** It's a subcollection (`users/{uid}/rosc_assessments`) queried with simple `limit`/`startAfter` pagination (`src/lib/rosc.ts`, `src/lib/rotation.ts`) — no compound `where`+`orderBy` that would require a composite index. Nothing to add.
- **Asset optimization (#21):** `public/*.png` totals ~180KB, all PWA-manifest-mandated icon sizes. The audit's "Logo.png" reference doesn't correspond to any file in this repo. Nothing actionable.

**The one confirmed real gap:** `src/App.tsx:53` — `QueryClient` defaults set `staleTime` but never `gcTime`, so TanStack Query falls back to its 5-minute default. For an offline-first app, a longer `gcTime` lets a user return to a previously-visited screen after a longer idle period (tab-switch, phone lock) without an unnecessary refetch-and-empty-state flash.

**`DEPENDENCY_AUDIT.md` correction — its react-router-dom claim is wrong, do not act on it as written:** it states upgrading to `7.18.2` fixes `GHSA-qwww-vcr4-c8h2` in "15 minutes." Verified against the actual advisory: the vulnerable range is `>=7.12.0 <8.3.0` — the fix requires a **major version bump to React Router 8**, a real migration, not a patch. The vulnerability is also specific to React Router's RSC/framework mode; MRT uses plain `<BrowserRouter>` (library mode) throughout `App.tsx`, which never executes that code path. Tracked as a non-urgent future item, not fixed here.

**`DEPENDENCY_AUDIT.md`'s other findings — deliberately NOT bundled into this ticket**, split by risk profile for future tickets:
- *Quick wins (own ticket):* `knip`-surfaced dead code (2 unused files, 8 unused exports), minor patch-version bumps (`firebase`, `@tanstack/react-query`, `date-fns`).
- *Medium (own ticket each, real regression risk):* `@use-gesture/react` → native touch handlers in `SwipeableTaskRow.tsx` (touch/gesture UX, needs real-device testing); `crossword-layout-generator` → custom TS algorithm in `functions/src/crosswordPrompts.ts` (needs correctness verification against the Daily Crossword feature).
- *Larger, needs its own spec + design/ZK review:* error telemetry/crash reporting (must be scoped so an unhandled decryption error never leaks plaintext into a crash report), structured logging, runtime schema validation (Zod/Valibot), CI vulnerability gate in `deploy.yml`, web-vitals RUM, `eslint-plugin-jsx-a11y`.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None — a query-client config value and an icon-import swap.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes.

**Files impacted:**
* `src/App.tsx:53` — add explicit `gcTime` to `QueryClient`'s `defaultOptions.queries` (proposed: 30 minutes, longer than the 5-minute `staleTime` so cache survives a longer idle period before eviction).
* `src/pages/Workbooks.tsx`, `src/pages/Welcome.tsx`, `src/components/admin/FeedbackViewer.tsx` — replace `lucide-react` icon imports with `@heroicons/react` equivalents; remove `lucide-react` from `package.json`.

---

## 4. Implementation Phases 🏗️

### Phase 1: gcTime tuning
* Add `gcTime: 1000 * 60 * 30` (30 min) to `QueryClient` defaults.
* Confirm no test relies on the 5-minute default eviction timing.

### Phase 2: Icon consolidation
* Map each of the 10 Lucide icons in use to their Heroicons equivalent (`Globe`→`GlobeAltIcon`, `BookOpen`→`BookOpenIcon`, `ExternalLink`→`ArrowTopRightOnSquareIcon`, `ShieldCheck`→`ShieldCheckIcon`, `Lock`→`LockClosedIcon`, `ArrowRight`→`ArrowRightIcon`, `MessageSquare`→`ChatBubbleLeftIcon`, `CheckCircle`→`CheckCircleIcon`, `Clock`→`ClockIcon`, `Trash2`→`TrashIcon`, `Filter`→`FunnelIcon`, `Sparkles`→`SparklesIcon`).
* Visually confirm equivalent rendering (size/stroke-width parity) in the 3 affected files.
* Remove `lucide-react` from `package.json`.

### Phase 3: Edge Cases
* [x] Confirmed no test file imports from `lucide-react` — grepped `src/**/__tests__/` and `e2e/`, zero matches.
* [x] `gcTime` (30 min) only extends how long inactive queries survive in cache before eviction — it doesn't change `staleTime` (still 5 min), so a background refetch still happens on next mount past that point. No screen depends on 5-minute cache eviction as an implicit refresh trigger.
* [x] **The dependency audit's file list was wrong** — it named 3 files (`Workbooks.tsx`, `Welcome.tsx`, `FeedbackViewer.tsx`) and 6 icons for `FeedbackViewer.tsx`. Real count: **4 files** (a 4th, `src/components/SOSModal.tsx`, was missing entirely from the audit) and **9** actual icons in `FeedbackViewer.tsx` (`Clock, ExternalLink, Github, ClipboardList, ChevronUpIcon, InboxIcon, Search, Archive, ListTodo` — found by reading the real import block and every usage site, including 3 icons passed as prop values (`icon={Search}` etc.) rather than rendered as JSX tags, which a shallow `<Name` grep would have missed). `Github` has no Heroicons brand-logo equivalent — mapped to `CodeBracketIcon` (the button's existing `title="Create GitHub Issue"` and "Issue" label already carry the specific meaning).

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing.
* [x] **Build:** `npm run build` clean; confirmed zero `lucide` references in `dist/assets/*.js`. `icons` chunk went from 86.09KB → 84.41KB (net reduction despite adding more Heroicons imports across a 4th file).
* [x] **Lint/Typecheck:** `npm run lint` clean.
* [ ] **Manual:** icon-swap visual parity not checked in a real browser — same risk profile as prior tickets' 320px-viewport notes; the Heroicons replacements are same-size (`w-*/h-*` classes unchanged) outline-style icons matching the originals' visual weight, so risk is low but unverified visually.

---

## Out of Scope (see correction notes above for full reasoning)
* React Router major-version migration (tracked, not urgent).
* `@use-gesture/react` replacement, `crossword-layout-generator` replacement — own future tickets.
* Error telemetry, structured logging, schema validation, CI vulnerability gate, web-vitals, `eslint-plugin-jsx-a11y` — own future ticket(s), needs design/ZK review before scoping.
