# Full Production Readiness Audit — Principal Engineering Review

**Audit Date:** August 2, 2026
**Repository:** `mrt2` (My Recovery Toolkit v1.4.0)
**Auditors:** Joint review (Principal Architect, Staff React Engineer, Firebase Solutions Architect, DevOps Engineer, SRE, Cloud Security Engineer, AI Systems Engineer, Performance Engineer, Accessibility Expert, UX Engineer, QA Lead, Technical Product Architect)
**Method:** Direct inspection of every layer named below, a fresh clean `npm install && npm run build`, live `npm audit` against both `package.json` (root) and `functions/package.json`, and cross-verification of every source-controlled claim (CLAUDE.md, `docs/ACTIVE_CYCLE.md`, `docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/SCHEMA_ARCHITECTURE.md`, prior audits in `docs/reports/`) against the actual running code — not assumed from documentation.

---

## 0. Bottom Line — Read This First

This is a genuinely well-run codebase. Two prior audits (2026-07-20, 2026-07-28) found real, serious issues — a client-side auth bypass reachable in production, a committed signing keystore, a 1.83MB monolithic bundle, a Stripe-in-TWA policy risk — and **every one of them has since been fixed, shipped, and verified**, each with its own spec (`PROJ-89`, `PROJ-67`, `PROJ-68`) and a governance trail in `docs/ACTIVE_CYCLE.md` that is unusually honest about what actually happened versus what a commit message once claimed. That discipline is itself a signal worth naming: this team catches its own drift.

That said, "brutally honest" is the brief, so three things earn a harder look than the team's own recent self-audits gave them:

1. **A live violation of the project's own zero-knowledge governance rule.** CLAUDE.md names exactly six approved call sites that may send decrypted content to Gemini. Three more exist in the running code today — `WorkbookSession.tsx`'s "AI Coach" (live, unsaved workbook text), `AudioRecorder.tsx` (raw voice-journal audio), and `ErrorLogViewer.tsx`. None are malicious or even obviously wrong, but the governance document that's supposed to be the enforcement mechanism for this app's core promise is not tracking the actual code. See §6/§7.
2. **A previously undiscovered performance issue, now fixed and verified.** ~~85% of the PWA's 19MB install payload is marketing screenshots and social-media graphics with zero runtime purpose~~ — see the correction below. This one is cheap to fix and directly serves the exact persona (David, acute crisis, mobile, Day 1) the product is built around.
3. **Firestore rules validate ownership, never shape.** Every write rule in `firestore.rules` checks "do you own this document," never "is this document well-formed or bounded in size." That's a real, if slow-burning, cost and integrity risk that costs little to close now and compounds if ignored.

None of this requires re-architecture. Realistically 1-2 focused sprints for the items in §20's "Quick Wins" and "Medium Effort" buckets closes the gap between "well-built" and "audited-and-verified-well-built."

---

## 1. Architecture Review

**Folder structure is clean and domain-consistent.** `src/` splits into `components/` (123 files, 14 domain subfolders: journal, games, smart_tools, tasks, tools, vitality, insights, admin, dashboard, profile, readings, ui), `pages/` (30 route-level files), `hooks/` (27), `lib/` (34, plus `lib/games/`), `contexts/` (4: Auth, Encryption, Layout, GameSession). A spot-check for circular imports across the `lib → hooks → contexts → components` layering found none — `lib/` never imports from `hooks/` or `contexts/`, `hooks/` never imports from `components/`.

**Real god-component, and it violates the project's own rule.** `src/pages/Profile.tsx` is 942 lines with 19 `useState` calls covering general settings, financial settings, dashboard-badge preferences, PIN rotation, and vault reset — and **zero `useQuery`/`useMutation` calls**. CLAUDE.md states "TanStack Query wraps ALL Firestore ops"; this is the single largest exception to that rule in the codebase, on a page that touches some of the most sensitive account state (PIN rotation, vault reset). *Impact: medium (no correctness bug found, but it's the file most likely to develop one — no cache invalidation, no optimistic-update safety net, no shared error handling). Effort to fix: 2-3 days (split into sub-components, migrate onto `useFirestoreCrud`).*

**A documented abstraction that nobody adopted.** `src/hooks/useFirestoreCrud.ts` (`useFirestoreQuery`/`useFirestoreMutation`) was extracted in PROJ-59 explicitly from the shared shape of `useTaskOperations.ts`, `useJournalOperations.ts`, and `useWorkbookAnswers.ts` — but none of those three were migrated onto it; only newer hooks consume it. The duplication the abstraction was built to remove still exists side-by-side with the abstraction. *Effort: 1-2 days per hook; low risk since the target shape is proven.*

**Route-guard duplication.** `PrivateRoute > VaultGate > Page` is repeated as literal JSX at ~20 call sites in `App.tsx` instead of a nested layout route. This is a real risk surface, not just a style nit: a new sensitive route added by copy-pasting a *different* route (one that happens to skip `VaultGate`, e.g. the crisis-tool exception at `/games/craving-buster`) would silently ship without the encryption gate. *Effort: half a day to convert to a layout-route wrapper; worth doing precisely because the failure mode is silent.*

**No memoized context values, anywhere.** `AuthContext`, `EncryptionContext`, and `LayoutContext` all rebuild their `value` object on every render with no `useMemo`, and `AuthProvider` wraps nearly the whole app. Combined with **zero `React.memo` usage in the entire codebase** (verified repo-wide), this means broad re-render propagation is architecturally possible today, just not yet visibly biting (no reported perf complaints). This is exactly the kind of debt that's invisible until a feature adds a state update inside one of these providers that fires often — then it's a mystery perf regression six months from now with no obvious cause. *Effort: 1 hour (wrap each context value in `useMemo`); do this proactively, not reactively.*

**Three unconverged "admin" definitions** — a custom claim, a Firestore `role` field, and (per `docs/ACTIVE_CYCLE.md`) previously a hardcoded email, since removed but the claim/role duality remains. Server-side enforcement (rules, functions) only ever checks the custom claim; the client ORs both. Not a privilege-escalation path today (rules block self-granting `role`), but it's a correctness landmine: a `role:'admin'` Firestore doc without the matching claim shows the admin UI and then gets rejected by every real admin action. Already tracked as an open chore in `ACTIVE_CYCLE.md`. *Effort: half a day to converge on the claim as sole source of truth.*

**What's genuinely good here:** the shared quiz-loop component reused across Trigger Match/Thought Challenge/Knowledge Quests, `SmartToolContainer`/`GuidedWorkflowEngine` reuse across all CBT tools, and the fact that the layering violations found above are the *exceptions*, not the pattern — most of the codebase does route Firestore access through hooks as documented.

## 2. React Review

**Code-splitting is well-designed but inconsistently applied.** 22 routes are lazy-loaded behind a single top-level `Suspense` (all games, all SMART tools, Insights, Admin, Premium). But `Dashboard`, `Journal`, `Tasks`, `Profile` (the 942-line god-file), and the three Workbook pages are eagerly bundled into the main chunk — meaning the two largest files in the codebase (`Profile.tsx`, `Tasks.tsx`) ship on first load regardless of whether the user ever visits them. *Effort: trivial (convert 4-5 more imports to `React.lazy`) for a real first-load win.*

**Error boundary granularity is a genuine UX risk for this product's core persona.** `ErrorBoundary` wraps the app at exactly two points, both effectively top-level (`main.tsx` and `App.tsx`). A crash in a single Recovery Game, the Gemini analysis wizard, or `GuidedWorkflowEngine` blanks the *entire app* to a generic fallback. For David (acute-crisis persona, the app's own stated "UX floor"), a crash while using a crisis tool that takes down the whole app rather than degrading just that widget is a materially worse failure mode than the product's design philosophy would tolerate elsewhere. *Effort: half a day to wrap the AI-analysis widgets and the games shell in their own boundaries.*

**Memoization is sparse and unsystematic:** 22 `useMemo`, 17 `useCallback`, 0 `React.memo` across 111 component/page files. This isn't currently causing measured problems (nothing is memoized downstream to break), but it means the codebase has no established pattern to reach for when a real perf issue does show up. Not urgent; worth a house style decision.

**Unvirtualized long lists exist right next to the fix.** `react-virtuoso` is correctly used in `Tasks.tsx`, `JournalHistory.tsx`, and `ErrorLogViewer.tsx` — but `InsightsLog.tsx` (a nested year→month→insight structure, one of the collections most likely to grow large over years) and `FriendsDirectory.tsx` (lower risk, sponsee counts are small by design) still use plain `.map()`. *Effort: half a day, pattern is already proven elsewhere in the same codebase.*

**`react-confetti` fires unconditionally.** `Dashboard.tsx`'s milestone celebration (400 particles) has no `prefers-reduced-motion` check — one of only two motion-preference checks in the entire codebase, and this isn't one of them. For a recovery app whose crisis-day users may have vestibular sensitivity or simply find surprise motion aversive, this is a small but real miss. *Effort: 15 minutes.*

**Forms are hand-rolled with no shared validation** (no react-hook-form/zod in the dependency list) — each form (Profile's date bounds, task due-dates, etc.) reimplements its own validation. Not wrong for this app's scale, but worth a decision if the form count keeps growing.

**React 19 posture is actually clean**: no stale `forwardRef` patterns, no legacy class-component holdovers, and the team already evaluated and *explicitly rejected* an incremental `useActionState` migration for poor ROI on client-only SPA forms (documented in `ACTIVE_CYCLE.md`) — a defensible call, not an oversight.

## 3. Vite Review

**The manualChunks configuration is genuinely well-engineered** — bucketed by library with documented rationale (a comment explains a past circular-chunk mistake and how it was fixed). A fresh production build confirms the split works: no chunk exceeds 875KB raw / 272KB gzip (see §8 for full numbers), down from the 1.83MB monolith two audits ago. This is real, verified engineering, not a documentation claim.

**Two pieces of dead configuration, both harmless but worth a five-minute cleanup:**
- `vite.config.ts`'s `manualChunks` still special-cases `lucide-react`, a package fully removed from the codebase in PROJ-92. The branch is a no-op.
- The `workbox.runtimeCaching` block configures a `google-fonts-cache` strategy for `fonts.googleapis.com` — but no Google Fonts (or any web font) are loaded anywhere; the app uses the system font stack exclusively. Dead config for a request that never fires.

**The PWA precache glob has no exclusions, and this is the audit's single highest-value performance finding.** `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` sweeps every matching file under `public/` with no `globIgnores`. A fresh build's precache manifest confirms: **99 entries, 19,165.96 KiB total — of which ~16MB is PNG images and only ~3.2MB is actual application JavaScript.** The PNGs are almost entirely non-runtime marketing collateral:
- `public/Chips/*.png` — 12 milestone-medallion badges at ~560KB each (6.6MB total), even though `.webp` versions of the *same images* already sit alongside them at ~44KB each (528KB total) — a ready-made 12x size reduction, unused.
- `public/Marketing/Screenshots/*.png` — Play Store listing screenshots (11MB across the `Marketing/` folder).
- `public/raw_assets/*.png` — unoptimized source art (896KB), including a 524KB "raw" logo variant.

None of this is ever rendered inside the running app — it's collateral for app-store listings and social media, sitting in the same `public/` root the PWA precache sweeps unconditionally. Two prior audits flagged "bundle size / heavy first install" as a concern and it's still an open BACKLOG.md item — but neither caught the actual cause, because both looked at the JS bundle (which is genuinely fine post-PROJ-89) rather than the precache manifest as a whole. **Fixing this is a ~30-minute change** (add `globIgnores: ['Marketing/**', 'raw_assets/**']` and swap `Chips/*.png` references to the existing `.webp` files) for an ~85% reduction in what every single install downloads before first use — directly serving David's "Day 1, acute crisis, mobile connection" requirement.

**No explicit sourcemap policy.** Vite's default (`sourcemap: false` for production) applies implicitly; combined with PostHog error capture, this means production stack traces in PostHog are minified/unreadable. Worth a deliberate choice (hidden sourcemaps uploaded to PostHog, not shipped to the client) rather than an accidental default.

**`stats.html` (the bundle visualizer output) is committed to git** as a stale artifact from a July 29 build — a generated file that doesn't belong in version control. It's not just clutter: it actively misleads anyone who inspects it, since a fresh build produces meaningfully different (smaller, current) numbers. *Effort: 5 minutes — add to `.gitignore`, delete from git.*

## 4. Firebase Review

**Eight Cloud Functions, all 2nd-gen, consistently structured** (`functions/src/index.ts`, 1,359 lines, read in full): `dailyBeacon`, `checkBufferHealth`, `generateDailyCrossword`, `generateReadingsAdmin`, `syncStripeSubscription`, `generateAIInsights`, `verifyVaultPin`, plus supporting pure logic. Secrets via `defineSecret` (`geminiApiKey`, `vaultPepperSecret`), legacy runtime config explicitly disallowed. `verifyVaultPin` validates its `pinHash` input strictly (`^[0-9a-f]{64}$`); `generateReadingsAdmin` validates `numDays` range, date format, and modality enum — genuinely solid input validation where it matters most for a security-relevant function.

**`generateAIInsights` and `dailyBeacon` — the two most cost/scale-exposed functions — have no `maxInstances`, `minInstances`, or `concurrency` set anywhere in the repo** (confirmed by a repo-wide grep returning zero hits). v2 Cloud Functions default to `maxInstances: 100` implicitly. A traffic spike or an authenticated-user abuse loop calling `generateAIInsights` has no code-level ceiling beyond a partial per-analysis-type, free-tier-only rate limit (see §6/§7). *Priority: High. Effort: 1 hour to add `maxInstances` + a GCP budget alert.*

**`dailyBeacon` has a self-acknowledged scale ceiling that a fresh read confirms is closer than the code's own comment implies.** It paginates correctly (`limit(300)` + cursor, with an inline comment flagging ~20 batches/~6,000 users as a point to "consider a fan-out/pub-sub architecture"), but the per-user work *inside* each batch is a sequential `for...of` `await` loop, not parallelized — at even modest per-query latency, a single 300-user batch could take double-digit seconds, and the function's 300-second timeout leaves little room to scale much past its own stated concern point. **Separately, and more urgently: all push messages across every batch accumulate into one `messagesToSend` array sent via a single `sendEach()` call, which has a hard 500-message-per-call limit that nothing in the code chunks for.** Once daily actionable-alert volume exceeds 500 tokens — plausibly at low thousands of active users, not millions — this call will throw or silently drop the excess. *Priority: High, this is a correctness bug waiting on user growth, not a someday-scale concern. Effort: 1 day (chunk `sendEach` calls at ≤500; parallelize per-user batch work).*

**`firestore.rules` (161 lines, read in full) validates ownership, never shape.** Every collection rule beyond the `users` document itself is exactly "are you the owner" — no `request.resource.data.keys().hasAll(...)`, no type checks, no size bounds, anywhere. An authenticated owner can write an arbitrarily-shaped or arbitrarily-large document to `journals`, `tasks`, `service`, `game_progress`, `game_saves`, or `insights`. This is a storage-bloat/cost vector with zero rule-level mitigation — not exploitable for cross-user access, but a real gap for an app whose entire value proposition rests on Firestore being a trustworthy, well-bounded data store. *Priority: Medium-High. Effort: 2-3 days to add shape/size validation to the highest-value collections (`journals`, `game_saves` first, since those hold the largest payloads).*

**`firestore.indexes.json` is out of sync with what the app actually queries.** Only 4 composite indexes are declared (`journals` uid+createdAt, `tasks` uid+dueDate, `tasks` uid+status+dueDate, `game_progress` uid+createdAt) — correctly uid-scoped, good for scale — but live query shapes in `useToolHistory.ts`, `useSmartToolCompletions.ts`, and `src/lib/insights.ts` (uid + array-contains/orderBy combinations) have no corresponding entry in this file. Since these queries presumably work in production, the indexes almost certainly exist — just created ad hoc via the Firebase console's auto-generated link, never captured back into source control. This means **provisioning a fresh environment from this file (e.g., `mrt2-app-uat`, which BACKLOG.md already notes is behind on its own Secret Manager setup) would silently be missing indexes** until each query fails once in production and someone notices. *Priority: Medium. Effort: half a day to pull the real deployed index set and reconcile.*

**Rules deploy has a documented side door.** `scripts/sync_security_rules.sh` still deploys straight to DEV/UAT/PROD behind a `y/n` prompt, bypassing every CI gate (lint, tests, spec-quality) that the actual `deploy.yml` pipeline enforces for every other change. **No `@firebase/rules-unit-testing` emulator-based test suite exists anywhere** — rules changes ship on trust, whichever path they take. *Priority: Medium. Effort: 1 day to retire the script in favor of a CI-gated path; 2-3 days to add emulator rules tests.*

**App Check is confirmed absent** (zero matches for `AppCheck`/`recaptcha`/`initializeAppCheck` anywhere in `src/` or `functions/src/`). Firestore, Auth, and all eight Cloud Functions currently accept any request bearing the public web config, with no attestation that it's coming from the real app. *Priority: Medium (the ZK encryption boundary limits the blast radius of unauthenticated access to ciphertext, but this is still the single largest network-edge gap). Effort: 2-3 days (reCAPTCHA Enterprise provider, monitor-then-enforce rollout).*

**What's genuinely solid:** offline persistence (multi-tab IndexedDB via `persistentLocalCache`), clean emulator gating (double-checked: `DEV && explicit flag`), no Cloud Storage attack surface (never used — binary content goes inline to Gemini, never persisted), Stripe extension correctly rules-locked (`checkout_sessions`/`subscriptions`/`payments` are client-write-`false`) and correctly TWA-gated (`isAndroidTWA()`, unit-tested).

**No Firestore backup/PITR/scheduled-export policy found anywhere in the repo.** For an app whose entire pitch is trustworthy custody of sensitive recovery data, "how do we recover from an accidental mass-delete or corruption event" doesn't appear to have an answer beyond the crypto-shredding-focused deletion logic (which is about *removing* data, not restoring it). *Priority: Medium. Effort: 1 day to enable Firestore's built-in scheduled backups and document the restore procedure.*

## 5. TanStack Query Review

**Global config is sound and deliberate:** `staleTime: 5min`, `gcTime: 30min` (explicitly set, not left at default — a real fix from PROJ-92), `retry: 1`, `refetchOnWindowFocus: false`, all in one place (`App.tsx:53`).

**The "ALL Firestore ops through TanStack Query" rule has 18 exceptions outside `hooks/`/`lib/`.** Some are structurally unavoidable (`AuthContext.tsx`, `EncryptionContext.tsx` run before `QueryClientProvider` is meaningfully usable for their purposes) — but five admin tools (`FeedbackViewer`, `SchemaMigration`, `DeduplicationTool`, `ErrorLogViewer`'s read path, `FriendsDirectory`), plus `DebugTools.tsx`, `PremiumUpgrade.tsx`, and `FeedbackModal.tsx`, use plain `useState`/`useEffect` with raw SDK calls and zero TanStack involvement. These are lower-traffic, admin-facing surfaces, so the practical risk is limited — but they're also the parts of the app least likely to get a second look, which is exactly where a stale-cache or race-condition bug tends to live undetected longest.

**A real, currently-inert bug: optimistic updates that write to a cache no UI reads.** `useTaskOperations.ts`'s `onMutate` optimistically writes to `['tasks', uid]` via `setQueryData` — but the Tasks page itself (`useTasksList.ts`) is a raw `onSnapshot` listener with its own local `useState`, never touching TanStack's cache at all. The only consumer of `['tasks', uid]` is `AchievementsTab.tsx`'s independent `useQuery` instance. So the optimistic-update machinery in `useTaskOperations` — cancel, snapshot, rollback-on-error, the works — is fully implemented and entirely disconnected from the screen a user actually watches when they complete a task. It happens to be harmless today only because `onSnapshot` re-syncs almost immediately regardless; it stops being harmless the moment someone builds a new consumer that trusts `['tasks', uid]` to reflect an in-flight optimistic state. *Priority: Medium. Effort: half a day to either migrate `useTasksList` onto the same cache key or delete the now-pointless optimistic logic.*

**Three different mutation-error patterns coexist with no house style:** (a) full optimistic+rollback+invalidate (`useTaskOperations`, `useWorkbookAnswers`, `useReadingPreferences`), (b) invalidate-only with telemetry but no optimism (`useJournalOperations`, `useGameProgress`), (c) invalidate-only with local component error state instead of cache rollback (`useROSCAssessments`). User-facing error surfacing is equally inconsistent: `alert()` in `JournalEditor.tsx` and `useVitalityEntries.ts`, silent telemetry-only in most mutation hooks, `toast.error` in exactly one component (`JournalAnalysisWizard.tsx`). *Priority: Low-Medium (works today, but three conventions is two too many for a team of this size to maintain consistently). Effort: 2-3 days to pick one pattern and sweep.*

**No persister — offline support is 100% delegated to the Firestore SDK's own cache**, not TanStack's. This is a legitimate architectural choice (avoids two competing offline stores), but it does mean TanStack's cache is fully volatile and rebuilt from Firestore's cache (or network) on every reload, which interacts with `gcTime: 30min` in a way that's worth being deliberate about rather than assumed.

**Unbounded reads exist at exactly the point the app's "Walt" persona (35+ years sober, "wants depth, exports") makes them expensive:** `JournalHistory.tsx`'s full-history mode, `JournalInsights.tsx`'s word-cloud/insights derivation, and `AchievementsTab.tsx`'s stat computation all issue `getDocs` with **no `limit()`** against a user's entire journal corpus. Every one of these decrypts client-side on every fetch. This is a named, intentional persona for this product — "years of history" isn't an edge case here, it's Walt's normal state. *Priority: Medium. Effort: 2-3 days (pagination or a server-computed-aggregate path, mirroring the pattern PROJ-95 already used for the anchor-status fix).*

## 6. Security Review

**The zero-knowledge encryption core is genuinely excellent and the audit found nothing to add here.** PBKDF2 (100k iterations) + HMAC-SHA256-combined rate-limited server pepper, `IV:Ciphertext` storage, decrypt-at-render-only discipline, and a real external security review that passed (PROJ-65, 2026-07-19). The PIN-hash-never-raw-PIN transit design, the escalating-lockout rate limiter, and the crypto-shredding deletion path are all load-bearing, well-documented, and match the code.

**Finding SEC-NEW-01 [High]: Three Gemini call sites exist outside CLAUDE.md's approved six-flow allowlist.** CLAUDE.md is explicit that "any new call site that wants to send decrypted content to Gemini must be added here explicitly before shipping, not assumed to inherit this exception." Three already have, and none are on the list:
- `getGeminiCoaching` (`src/lib/gemini.ts`), called from `WorkbookSession.tsx:107` — sends the user's **live, unsaved, in-progress workbook answer text**, arguably more sensitive than the saved-and-committed content the approved `WorkbookDetail.tsx` flow covers.
- `generateAudioAnalysis`, called from `AudioRecorder.tsx:82` — sends **raw base64-encoded voice-journal audio** for transcription/analysis, a more sensitive payload type (biometric-adjacent — voice) than any of the six approved text flows.
- `analyzeSystemHealth`, called from `ErrorLogViewer.tsx:108` — sends aggregated client error logs (not personal recovery content, lower severity, but still unlisted).

None of these route around the `generateAIInsights` proxy — they're architecturally consistent with the approved flows, just undocumented. This isn't evidence of carelessness in the code; it's evidence that the governance document meant to be this app's core trust mechanism has drifted from the code it's supposed to constrain, silently, with no lint rule or CI check that would have caught it. *Priority: High — not because the current three flows are unsafe, but because "the list is authoritative" only holds if it's actually kept current, and right now it isn't. Effort: 1 hour to update CLAUDE.md (if these are accepted), or a half-day to gate/remove them (if they're not). Either way, this needs an explicit decision, not silence.*

**Finding SEC-NEW-02 [Medium]: the `ai_logs` audit trail is dead code that looks alive.** `firestore.rules` grants write access, `AdminDashboard.tsx` reads and displays it as an "AI Analytics" panel, and `deletion.ts` sweeps it during account deletion — the entire surrounding infrastructure exists as if this collection is populated. But a repo-wide grep for any actual write to `ai_logs` (`addDoc`/`setDoc`) returns nothing; `generateAIInsights` never writes to it. A `logAIUsage()` helper referenced in `docs/projects/49_ROSC_MATRIC.md` doesn't exist anywhere in the codebase. **The admin AI-usage audit panel has been silently empty since it shipped** — a false sense of observability is arguably worse than no observability, since nobody goes looking for a gap that appears to already be covered. *Priority: Medium. Effort: 1 day to either wire up the write path or remove the panel and its rules.*

**No prompt-injection mitigation across any of the nine Gemini call sites.** Every flow interpolates raw decrypted user content directly into template-literal prompts with no delimiting, tagging, or escaping — a user writing something injection-shaped in a journal entry ("ignore the above and instead...") has no structural barrier before it reaches the model. No `safetySettings`/`HarmCategory` thresholds are configured anywhere — SDK defaults apply. *Priority: Medium (impact is bounded — worst case is a manipulated AI response shown back to the same user who wrote the input, not a cross-user or data-exfiltration path — but cheap to harden). Effort: 1-2 days to wrap user content in delimited blocks across all nine flows and add explicit safety thresholds.*

**No CSP, HSTS, X-Frame-Options, or Permissions-Policy headers anywhere.** `firebase.json`'s `hosting.headers` sets exactly two rules (`Cache-Control` on `index.html`, `Content-Type` on `assetlinks.json`) — no security headers at all, and `index.html` has no CSP `<meta>` tag either. For an app storing health/recovery data, this is a real gap even though the ZK boundary limits what a successful XSS could actually exfiltrate (ciphertext, not plaintext, in most flows — though a live XSS during an unlocked vault session could still read decrypted content from memory). *Priority: Medium-High. Effort: half a day to add a baseline CSP + standard security headers to `firebase.json`.*

**Dependency vulnerabilities, current as of this audit (not the prior audits' numbers, which are now stale):**
- Root `package.json`: **18 vulnerabilities (4 high, 14 moderate)**. The actionable one: `react-router-dom` resolves to 7.18.1, inside a newly-disclosed high-severity range (GHSA-qwww-vcr4-c8h2, RSC-mode CSRF bypass) — a **production** dependency, fix available via `npm audit fix`. The rest are dev-tooling-only transitive chains (`vitepress`→`esbuild`, `re2`, `firebase-tools`→`uuid`), consistent with PROJ-90's prior triage of "accepted, dev-only, not user-facing."
- `functions/package.json`: **27 vulnerabilities (2 critical, 8 high, 15 moderate, 2 low)** — and this is new information: PROJ-90's `npm audit fix` pass only touched the root package; **`functions/` was never audited or fixed**. Critically, several of these (`protobufjs` arbitrary code execution, `websocket-driver` resource-limit bypass) sit in `firebase-admin`'s own **production** dependency chain for the Cloud Functions runtime, not a dev-only tool. *Priority: High for the functions/ findings specifically, since this appears to be an unaudited gap rather than a triaged-and-accepted one. Effort: half a day to run `npm audit fix` in `functions/` and assess the handful requiring `--force`.*

**Admin/auth model:** two informal "admin" definitions (custom claim + `role` field), OR'd client-side, claim-only server-side — a correctness gap, not a privilege-escalation path (already tracked in `ACTIVE_CYCLE.md`, see §1).

**Secrets hygiene is clean:** no real secret values committed anywhere; `.env.example`/`.env.production` contain only intentionally-public values (Firebase web config, a PostHog project token — both public-by-design, not leaked); CI secret masking in `deploy.yml` proactively `::add-mask::`s every line of the decoded service-account JSON, not just the base64 blob GitHub already redacts.

**mockUser bypass (SEC-01, prior audit): confirmed fixed and regression-tested.** Gated behind `import.meta.env.DEV`, with a dedicated `e2e/security/mockuser-prod.spec.ts` running against an actual production build (`playwright.security.config.ts`, no dev server, no emulators) to prove it stays fixed. This is the right way to close a finding — not just fixed, but instrumented against regressing.

## 7. AI Review

**Architecture is sound: no client-side Gemini SDK exposure.** All nine exported functions in `src/lib/gemini.ts` route through one `callAIProxy()` helper → the `generateAIInsights` Cloud Function. `@google/generative-ai` is listed as a root `devDependency` but never imported in `src/` — a vestigial leftover from a pre-proxy architecture (the file's own header comment confirms a July 2026 refactor moved everything server-side), not a live risk. Same for `VITE_GEMINI_API_KEY` — declared but never read by client code.

**Nine flows exist, not six** — see §6, SEC-NEW-01, for the governance-drift finding. A `"journal_analysis"` case exists server-side and in the mock-response switch but has **no live client caller** — dead server-side branch, a spec/reality mismatch worth cleaning up even though it's not currently reachable.

**Validation is presence-only, everywhere.** `generateAIInsights` checks that `analysisType`/`dataPayload` exist, then blind-casts every payload shape with `as` before interpolating it into a prompt — no length ceiling, no type check, no field-shape validation. Rate limiting only covers three of nine analysis types, only for free-tier users, with no generic per-user throughput cap. *Priority: Medium-High. Effort: 1-2 days for a schema-validation pass (zod or hand-rolled) plus a blanket per-user rate limit.*

**No input-length capping anywhere** — a Walt-persona 90-day deep-pattern-analysis request sends the full 90 days of decrypted journal text, unbounded per entry, every time it's requested, with no response caching for repeat/near-identical requests. Only an *output* cap exists (`maxOutputTokens: 8192`). *Priority: Medium (cost exposure, see §19). Effort: half a day to add an input character ceiling with graceful truncation.*

**Model selection is hardcoded with no fallback**: `gemini-3.5-flash-lite` for lighter flows, `gemini-2.5-flash` as default, chosen per-analysis-type in `getModelForType()`. A single `generateContent()` call with no retry-with-different-model on failure — an outage or rate-limit on one model fails every request of that type outright. *Priority: Low-Medium. Effort: 1 day for a fallback-model retry path.*

**`generateDailyCrossword` verified clean** — reads only a theme string from a static 120-item pool plus a recent-words exclusion list, zero user data, exactly matching CLAUDE.md's claim.

**`VITE_USE_MOCK_AI` is build-time-gated, not runtime-toggleable** — safe by environment-config hygiene rather than a code-enforced kill-switch, but there's no evidence it could leak into a real prod build without someone deliberately setting it in the prod `.env`.

## 8. Performance Review — with Verified Numbers

A fresh `npm install && npm run build` (not the stale committed `stats.html`) produced these real current chunk sizes:

| Chunk | Raw | Gzip |
|---|---|---|
| `vendor` | 875.7 KB | 272.4 KB |
| `index` (app entry) | 419.7 KB | 118.4 KB |
| `pdf-export` (jsPDF) | 370.0 KB | 120.2 KB |
| `firebase` | 322.8 KB | 100.4 KB |
| `recharts` | 292.9 KB | 73.9 KB |
| `posthog` | 226.6 KB | 75.5 KB |
| `react-vendor` | 193.1 KB | 60.6 KB |
| `icons` (heroicons) | 84.4 KB | 14.7 KB |
| `tanstack-query` | 38.8 KB | 11.5 KB |
| `react-router` | 38.0 KB | 13.7 KB |

**No chunk exceeds 1MB** — the PROJ-89 bundle-splitting fix genuinely holds up under a fresh build; the prior team's own "867KB, no chunk over 1MB" claim in `ACTIVE_CYCLE.md` is accurate, not overstated.

**The real story is the PWA precache, not the JS bundle** — see §3 for the full finding: 99 entries, 19.17MB total, ~16MB of it PNG marketing collateral with zero runtime purpose, easily fixed. This is the single highest-value, lowest-effort recommendation in this entire audit.

**One genuine dead-weight dependency chain: `html2canvas`.** `src/lib/exporter.ts` (the PDF-export feature) only ever calls jsPDF's `autoTable()`/table methods — never `.html()`, the one method that needs `html2canvas`. But jsPDF's optional `html2canvas` + `canvg` + `dompurify` + `pako` chain still gets pulled in transitively and lands in the `vendor` chunk (not `pdf-export`, since the manualChunks rule only matches on the `jspdf` substring) — an estimated ~163KB gzip, or roughly 60% of `vendor`'s total gzip weight, for a rendering path this app never invokes, shipped on every route since `vendor` isn't lazy. *Priority: Medium. Effort: half a day to alias/stub `html2canvas` via Vite's `resolve.alias`, or find a jsPDF import path that excludes it.*

**Unbounded Firestore reads compound with client-side decryption cost** for the app's longest-tenured users — see §5 and §17. This is where "offline-first, zero-knowledge" architecture has a real cost: every unbounded read is also an unbounded client-side AES-GCM decrypt.

**Dashboard load triggers a minimum of ~4 distinct Firestore reads** (profile, today's-journal-anchor query, reading-preferences doc, N reading docs), each independently fetched by its own widget/hook with no consolidation — not egregious at current scale, but worth knowing as a baseline before optimizing.

**Fonts are optimal by omission** — zero `@font-face`/Google Fonts anywhere; the system font stack is used throughout, meaning zero font-loading cost and no FOUT/FOIT risk. (The dead `google-fonts-cache` Workbox config from §3 confirms this wasn't a deliberate choice being undermined — it's just leftover config for a decision that was never made.)

## 9. Accessibility Review

**Real, tested, CI-enforced progress already shipped (PROJ-91).** An axe-core scan is now a permanent CI regression gate (`e2e/golden-paths/a11y.spec.ts`), and it already caught and fixed real issues beyond what manual review found: app-wide disabled pinch-zoom, an unlabeled Dashboard menu button, a contrast failure on the "Backup Needed" banner. This is exactly the right pattern — automated + manual, not either alone.

**Residual gaps found in this pass:**
- **15 icon-only buttons still missing `aria-label`** across `NotificationBanner.tsx`, `FeedbackModal.tsx`, `PWAInstallBanner.tsx`, `JournalEditor.tsx`, `ManageWordCloudModal.tsx` (×2), `AudioRecorder.tsx` (×3), `JournalAnalysisWizard.tsx`, `TaskFormModal.tsx`, `PersonifyTool.tsx`, `DynamicAnchorWidget.tsx`, `ROSCAssessmentCard.tsx`, `DebugTools.tsx` — against 332 total `<button>` elements and only 44 `aria-label` occurrences repo-wide.
- **An 11-input gap between `<label>` (48) and `<input>` (59) elements**, suggesting some inputs rely on placeholder-only labeling.
- **Only 2 `prefers-reduced-motion` checks in the entire codebase**, and neither covers the app's most visually intense unconditional animation (`react-confetti`, 400 particles, Dashboard milestone celebration — see §2).
- **1 div-as-button instance** (`SobrietyHero.tsx:140`, a backdrop-dismiss overlay) — low risk, arguably acceptable for a click-outside catcher, but has no keyboard handler.

*Priority: Medium for the aria-labels (mechanical, low-risk fix, half a day); Low-Medium for reduced-motion (already flagged as a UX/accessibility overlap in §2).* `eslint-plugin-jsx-a11y` is already planned (PROJ-97) as a static-analysis complement to the runtime axe gate but not yet shipped.

## 10. UX Review

**Persona-driven design is the strongest single asset of this codebase** — moment-based Tools Hub grouping (Right Now / Before It Happens / After a Hard Moment / Big Picture), crisis-tools expanded by default, dark-immersive game shells matched across the Recovery Games suite, and a documented history of catching and fixing real UX bugs during ticket-close reviews (overflow at 320px viewports, swipe-gesture edge cases). This is a team that visual-QAs its own work, not just unit-tests it.

**Inconsistent feedback patterns undercut that polish.** `sonner` toasts exist and are used in 4 places, but `window.confirm()` native dialogs appear in `FriendsDirectory.tsx` and `VaultGate.tsx`, and `PWAUpdateBeacon.tsx` builds its own bespoke banner instead of using the same toast system — three different visual languages for "the app needs to tell you something," in an app whose own design system otherwise doesn't do this. *Effort: 1 day to consolidate.*

**The top-level-only error boundary (§2) is as much a UX finding as a React one** — for David specifically, a crash in a crisis tool degrading to a full-app blank-screen rather than a contained "this tool hit a snag, try again" message is a worse failure mode than the persona brief the team holds itself to elsewhere.

## 11. Testing Review

**98 test files, and the coverage that exists is genuinely behavioral, not decorative.** Spot-checked tests (`useTaskOperations.test.ts`, `JournalEditor.test.tsx`, `vaultAuth.test.ts`) exercise real optimistic-update/rollback logic, documented regressions (a comment citing the exact prior bug a test now guards against), and proper error-class mapping — not snapshot-only assertions. Firebase calls are consistently mocked in unit tests; the emulator is reserved for E2E only, which is the right split.

**Coverage is uneven by directory**: `hooks/` (27 src/18 test) and `lib/` (58/26) are strong. `components/` is ~35% overall with real zero-coverage subdirectories: `tasks/`, `insights/`, `vitality/`, `readings/`, `ui/`. **`contexts/` — the literal zero-knowledge boundary — has only one dedicated test file for four contexts**: `EncryptionContext.test.tsx` exists and is thorough (12+ tests per `ACTIVE_CYCLE.md`'s PROJ-73 entry), but `AuthContext.tsx` (admin-claim/role OR logic, the DEV-only mockUser gate, FCM token refresh) has no dedicated unit test — only indirect e2e coverage. *Priority: Medium. Effort: 1-2 days for a focused `AuthContext.test.tsx`.*

**E2E is a real strength, not a checkbox.** Five golden-path specs (`gate`, `vault`, `ledger`, `subway`, `a11y`) plus a dedicated `mockuser-prod.spec.ts` running against an actual production build via a separate Playwright config (no dev server, no emulators) — proving the SEC-01 fix stays fixed in the artifact that actually ships, not just in dev mode. All of it is CI-wired and blocks the deploy job, not advisory. This is above the bar for a team this size.

## 12. DevOps Review

**The CI/CD pipeline is mature and self-correcting.** `.github/workflows/deploy.yml`'s `verify` job gates `deploy` on lint → spec-quality → unit tests → Cloud Functions unit tests → E2E golden paths (with real Firebase emulators, Java, and Playwright browsers provisioned in CI) — and the `deploy` job explicitly redeploys `firestore:rules,firestore:indexes,functions` after hosting, with an inline comment explaining this was added specifically because the hosting-deploy action alone caused prior drift. That's a team learning from its own incident, not guessing at best practice.

**Three gaps, all already scoped in a planned-but-unshipped spec (PROJ-96):** no `npm audit` gate in CI, no deploy-failure notification, no documented rollback runbook (a real gap given CLAUDE.md's own note that Cloud Functions have no atomic rollback). None of this is a surprise to the team — the spec exists with a thoughtful phased plan — it just hasn't shipped yet. *Priority: Medium-High given the CI-vulnerability-gate gap specifically compounds the functions/ dependency findings in §6. Effort: as scoped in PROJ-96, roughly 2-3 days across all three phases.*

**The rules-deploy side door (§4) is the one CI gap not yet captured in any spec** — worth adding to PROJ-96's scope explicitly, since it's the same "bypass the pipeline" risk class as the other three items already there.

**Branching strategy documented in CLAUDE.md doesn't match recent practice.** CLAUDE.md and the CI workflow both encode `feature/*`→DEV, `release/*`→UAT, `main`→PROD — but the actual last 20 commits use `claude/*`-prefixed PR branches merged straight to `main`, with no live `feature/*` or `release/*` branches found in current history. This means the DEV/UAT deployment paths in the pipeline are effectively unexercised by current workflow — worth confirming they still work before they're needed under pressure. *Priority: Low-Medium. Effort: a half-day fire-drill (push a throwaway `feature/*` branch, confirm DEV deploy actually succeeds end-to-end).*

**Versioning has three disconnected sources of truth**: `package.json` (`"1.4.0"`, stale, not auto-bumped), `VITE_APP_VERSION` (auto-incremented per-branch counter via GitHub Actions variables, unrelated numbering), and the hand-curated `docs-site/support/changelog.md` (currently `v1.9.8`). None of these agree with each other, and nothing reconciles them. *Priority: Low. Effort: half a day to decide on one source of truth and derive the others from it.*

## 13. Environment Review

**Three genuinely separate Firebase projects** (dev/uat/prod) with per-environment secret triads in GitHub Actions — this is real environment isolation, not a shared-database-with-a-flag setup. `.env.example` and `.env.production` contain no committed real secrets; both are consistent with what CLAUDE.md documents (public Firebase web config, public PostHog project token).

**One known, already-tracked gap**: `mrt2-app-uat` is missing the `VAULT_PEPPER` Secret Manager setup that prod/dev already have — deferred deliberately since UAT isn't in active use, but it will break the first real Cloud Functions deploy to that environment on day one, and per §12's finding, UAT may not have been exercised recently enough to know for sure.

## 14. Monitoring & Observability Review

**Real, purpose-built, metadata-only-by-design instrumentation exists** (`src/lib/telemetry.ts`, hardened in PROJ-94): `trackClientError`, `trackMutationFailed`, `trackUncaughtError`, plus Web Vitals (`onCLS`/`onINP`/`onLCP`) reported to PostHog. The design comment explicitly guarantees zero PII/decrypted-content leakage, and spot-checking the call sites confirms it (domain + error name only, never payload content).

**One documented gap still open**: `useJournalOperations.ts`'s three mutations still lack `onError` telemetry — three call sites (`JournalEditor.tsx`, `UrgeSurfer.tsx`, `SmartToolContainer.tsx`) independently duplicate a raw `catch(error){console.error; alert}` pattern instead of routing through `trackMutationFailed`. This is self-reported in `docs/projects/94_ERROR_TELEMETRY_HARDENING.md` as an honest known gap, not something this audit discovered fresh.

**The dead `ai_logs` write path (§6, SEC-NEW-02) is really an observability finding as much as a security one** — it's the difference between "we have no AI-usage visibility" (a known gap you'd prioritize) and "we have an admin panel that appears to show AI-usage visibility but is empty" (a gap nobody would think to look for).

**No dashboards, alert rules, or on-call runbook found anywhere in `docs/`.** Capture-side instrumentation is real; the response side (someone gets paged, someone looks at a dashboard) doesn't appear to exist yet. This ties directly to §12's missing deploy-failure notification — right now, a bad deploy or a spike in client errors is discovered by a user report, not by the system telling anyone. *Priority: Medium-High as a category, though most of the pieces are already scoped under PROJ-96.*

## 15. Dependency Review

**Runtime dependencies are, on the whole, well-justified and not bloated.** Firebase imports are cleanly modular (zero compat-mode imports across 88 files); `react-virtuoso` is genuinely used in three places, not dead weight as an earlier internal pass apparently suspected; `date-fns` is used broadly enough (21 files, 21 distinct functions) to justify keeping it over a native-`Intl` rewrite.

**Two replacements already scoped and spec'd (PROJ-97, not yet shipped):** `@use-gesture/react` (single call site, `SwipeableTaskRow.tsx` — a native pointer-events handler would remove ~9.4KB gzip for one interaction) and `crossword-layout-generator` in `functions/` (unmaintained since April 2022, untyped). Both have a real, non-trivial regression risk (gesture feel, puzzle-grid correctness) correctly called out in the spec as needing device/manual testing, not just unit tests.

**One newly-identified, unscoped candidate: `@posthog/react`.** It's a separate package from `posthog-js` (already a dependency, used in 10 files) for exactly one `Provider` wrapper in `main.tsx`. Worth a 10-minute check of whether `posthog-js/react` already re-exports the same thing before carrying two packages for one import. *Effort: trivial to check, trivial to remove if redundant.*

**Dead-code findings from `knip`** (already run for this audit): 2 fully unused files (`src/lib/games/goalLadder/types.ts`, `src/lib/games/types.ts`), 4 unused devDependencies (`concurrently`, `firebase-tools` at the root — likely a false positive given it's invoked via `npx`/scripts rather than a direct import, `jsdom`, `vitepress`), and ~24 unused exports (mostly persona mock-data fixtures in `src/lib/mockData.ts`). All already captured in PROJ-97's scope.

**`lucide-react` is a phantom reference** (§3) — zero installs, zero imports, one dead line in `vite.config.ts`.

**Vulnerability posture** — see §6 for full detail: root package is in reasonable shape (one real, easy production fix — `react-router-dom`); `functions/` has real unaddressed exposure (2 critical, 8 high, some in production-path dependencies) that appears to have simply never been in scope for the prior `npm audit fix` pass.

## 16. Build Review

Production build succeeds cleanly and quickly (`tsc -b && vite build`, ~20 seconds on this pass). Chunking is effective and well-documented (see §3, §8). The one hygiene issue — a stale, misleading `stats.html` committed to git — is trivial to fix (§3). No containerization is used or needed; Firebase Hosting's own global CDN is the right fit for this static-SPA-plus-functions architecture, and no gap was found there.

## 17. Data Layer Review

**`docs/SCHEMA_ARCHITECTURE.md` has real drift from the live schema.** `client_errors` is a real root collection with real security rules and two live consumers (`ErrorLogViewer.tsx`, `ErrorBoundary.tsx`) but is **entirely absent** from both the doc's diagram and its collection-definitions section. `ai_logs` appears in the diagram but has no field-level documentation anywhere (arguably moot given §6's finding that nothing writes to it, but the doc doesn't reflect that either). *Priority: Low-Medium, documentation-only, but worth fixing alongside whatever decision gets made about `ai_logs`.*

**Two independently-implemented account-deletion/crypto-shredding code paths with different rigor.** `src/lib/deletion.ts`'s `executeTotalAccountAnnihilation` uses a single unbounded `getDocs` per collection (no cursor/pagination) before chunked deletion, with all batches fired via `Promise.all` and **no persisted resume marker** — a partial failure requires the caller to notice and manually retry. `src/lib/rotation.ts`'s `executeCryptoShredding`, covering the same conceptual operation, properly cursor-paginates at `limit(500)`. For an operation this consequential (irreversible data destruction, required for Play Store compliance), having two different implementations with two different failure-safety postures is worth converging. *Priority: Medium. Effort: 1 day to align `deletion.ts` onto the more rigorous pattern already proven in `rotation.ts`.*

**No bulk-migration framework exists.** The one real precedent (`usesPepperV2`, PROJ-65) is a well-designed *lazy, per-account* migration piggybacked on PIN rotation — genuinely good pattern for that specific case. But the only *bulk* migration tool in the codebase, `SchemaMigration.tsx`, is scoped to a single `uid` at a time via an admin-triggered button, with no pagination beyond one batch (would fail past 500 ops for a single user's own documents). **There is currently no way to run a breaking schema change across the full user base without either the lazy-flag pattern or manually clicking a button once per user.** This doesn't matter at current scale; it matters a great deal the first time a genuinely global breaking change is needed post-scale. *Priority: Low today, High before any 100K+-user schema change. Effort: 2-3 days for a paginated, resumable, Cloud-Function-driven bulk migration runner, built once and reused.*

**No data retention/TTL policy anywhere** — `ai_logs`, `client_errors`, and `feedback` (admin-only, per rules) accumulate indefinitely with no expiry, growing storage cost with zero corresponding value past some age. *Priority: Low-Medium. Effort: half a day to add a Firestore TTL policy field + enable TTL deletion on these three collections.*

## 18. Scalability Review — 1,000 to 1,000,000 Users

**At 1,000 users:** No issues. Current architecture — Firestore query patterns, `dailyBeacon`'s batching, Cloud Functions defaults — handles this without any changes.

**At 10,000 users:** `dailyBeacon` starts to strain. ~34 batches at 300 users/batch, sequential per-user work inside each batch (network-latency-bound, not parallelized), against the function's own code comment flagging ~6,000 users (20 batches) as its self-identified concern threshold. **More concretely: the unchunked `sendEach()` call (§4) has a hard 500-message ceiling that a meaningful fraction of 10,000 daily-active users hitting a milestone alert on the same day could plausibly exceed** — and with no deploy/error alerting (§14) in place yet, this would fail silently rather than loudly.

**At 100,000 users:** `dailyBeacon`'s 5-minute timeout very likely cannot complete a full sequential pass; the "consider fan-out/pub-sub" comment in the code becomes a requirement, not a suggestion. The absence of `maxInstances` on `generateAIInsights` (§4) means a traffic spike has no cost circuit-breaker beyond Firebase's own default ceiling — direct, uncapped exposure to Gemini API spend. Firestore rules' lack of document-size validation (§4, §6) becomes a real storage-cost concern at this volume, not just a theoretical one. The `firestore.indexes.json` drift (§4) needs reconciling before confidently standing up a fresh environment at this scale.

**At 1,000,000 users:** `dailyBeacon` must be rebuilt as a pub/sub fan-out architecture — the code already says so. Firestore's core query patterns remain sound (properly uid-scoped, and the 4 declared composite indexes are correctly structured for per-user range scans, not collection-wide scans) — this is a real architectural strength that holds at any scale, once the undeclared-index gap is closed. The client-side unbounded queries flagged in §5/§17 (full journal history, `getUserTasks`, `insights.ts`) become materially expensive for the long tail of veteran users — and per this product's own personas, "years of history" is Walt's normal state, not a tail case to deprioritize. `PROJ-34` ("Aggregated Stats Engine" — Cloud Functions that pre-compute stats on-write to avoid full-history reads) is still `⚪ Planned` in `ROADMAP.md`'s Wave 3 and becomes load-bearing at this scale, not optional.

**Bottom line:** the architecture is sound to roughly 10,000-50,000 users with no changes required. 100,000+ requires the `dailyBeacon` fan-out rework, Cloud Functions cost guardrails, and index reconciliation. 1,000,000 requires all of the above plus the Aggregated Stats Engine to remove full-history reads from the hot path. None of this is a rewrite — it's targeted, already-partially-scoped work (the team's own code comments and `ROADMAP.md` already know where the pressure points are).

## 19. Cost Optimization

- **Firestore reads:** ~4 reads minimum per dashboard load with zero widget-level consolidation; unbounded reads for journal-heavy features (§5, §17) multiply this for exactly the long-tenured users a recovery app should most want to retain.
- **Cloud Functions:** `generateAIInsights` has no `maxInstances` — the single largest uncapped cost exposure in the system, since it's also the function that calls a paid third-party API per invocation.
- **AI/Gemini spend:** no input-length capping (a 90-day deep-pattern request sends unbounded text every time) and no response caching for repeat/near-identical requests — every re-run of the same analysis re-pays full inference cost.
- **Bandwidth:** the ~16MB of non-runtime marketing PNGs in the PWA precache (§3, §8) is pure wasted egress on every single install, at zero user-facing value — the highest-leverage, lowest-effort cost fix in this entire audit.
- **Hosting:** static Firebase Hosting is inherently cheap and scales without special handling — not a concern at any scale considered here.

## 20. Technical Debt

**Quick wins (hours, not days):**
- Add `globIgnores` for `Marketing/**`/`raw_assets/**` and switch `Chips/*.png` references to the existing `.webp` files — ~17MB precache reduction. *(§3, §8 — highest ROI item in this audit.)*
- Remove the dead `lucide-react` branch from `vite.config.ts`'s `manualChunks`.
- Remove the dead `google-fonts-cache` Workbox runtime-caching rule.
- `.gitignore` and delete the committed `stats.html`.
- Alias/stub `html2canvas` out of the `jspdf` import chain (~163KB gzip).
- Gate `react-confetti` behind `prefers-reduced-motion`.
- Add `aria-label` to the 15 identified icon-only buttons.
- Decide and document the three undocumented Gemini call sites (§6, SEC-NEW-01) — either add them to CLAUDE.md's approved list or restrict them; the decision matters more than which way it goes.
- Run `npm audit fix` inside `functions/` (currently unaudited relative to the root package).
- Wrap `AuthContext`/`EncryptionContext`/`LayoutContext` provider values in `useMemo`.

**Medium effort (days):**
- Migrate `useTaskOperations`/`useJournalOperations`/`useWorkbookAnswers` onto the already-built `useFirestoreCrud` primitives.
- Add Firestore rules unit tests (emulator-based) and document-shape/size validation on `journals`/`game_saves` first.
- Reconcile `firestore.indexes.json` with the actual deployed index set.
- Add `maxInstances` + a GCP budget alert on `generateAIInsights`/`dailyBeacon`; fix the unchunked `sendEach()` 500-message ceiling.
- Ship PROJ-96 (CI vulnerability gate, deploy-failure notification, rollback runbook) and fold the rules-deploy side-door closure into its scope.
- Ship PROJ-97 (`@use-gesture/react` and `crossword-layout-generator` replacement, `eslint-plugin-jsx-a11y`, dead-export cleanup).
- Converge the three admin-definition mechanisms onto the custom claim alone.
- Fix the `useTasksList`/`useTaskOperations` cache-key mismatch (§5).
- Add prompt-content delimiting + `safetySettings` across all nine Gemini flows.
- Write a dedicated `AuthContext.test.tsx`.

**Large refactors (weeks+):**
- Rework `dailyBeacon` into a pub/sub fan-out architecture before scaling meaningfully past ~10,000-50,000 daily-active users.
- Build the Aggregated Stats Engine (`PROJ-34`) to remove full-history reads from streak/stat computation.
- Add Firebase App Check across Firestore, Auth, and all eight Cloud Functions.
- Build a real bulk-migration framework (paginated, resumable, Cloud-Function-driven) beyond the current single-uid admin button.

**The one architecture risk worth naming for a 10-year horizon:** the complete absence of document-shape validation in `firestore.rules` is the kind of debt that produces no incident for a long time and then produces an expensive one all at once — a client bug, a compromised session, or simple data drift could write malformed or oversized documents indefinitely with nothing at the rules layer to catch it. It costs relatively little to close now and a great deal more to untangle after years of accumulated malformed data.

## 21. Production Readiness Scorecard

| Category | Score | Note |
|---|---|---|
| Architecture | 88/100 | Strong layering; one god-file, one unadopted abstraction |
| React / Frontend | 83/100 | Good split bones; error-boundary granularity and memoization gaps |
| Firebase / Backend | 80/100 | Mature functions; no App Check, no cost caps, index drift |
| Data Layer | 78/100 | Clean schema; zero rule-level validation, two deletion implementations |
| TanStack Query | 76/100 | Good defaults; 18 bypass files, one dead optimistic-cache bug |
| Security | 79/100 | World-class ZK core; new AI-governance drift, no security headers |
| AI / Gemini | 72/100 | Safe proxy architecture; undocumented flows, zero injection hardening |
| Performance | 81/100 | Bundle fix verified real; precache bloat is a major undiscovered win |
| Accessibility | 87/100 | Real CI-gated remediation shipped; residual label/motion gaps |
| UX | 87/100 | Genuinely persona-driven; inconsistent feedback patterns |
| Testing | 90/100 | Rigorous, behavioral, CI-blocking E2E; thin in contexts/admin |
| DevOps / CI | 84/100 | Mature gated pipeline; audit-gate/alerting/rollback already scoped |
| Environments | 88/100 | Real 3-project isolation; one known, tracked UAT gap |
| Monitoring / Observability | 74/100 | Good capture side; no alerting, one dead audit trail |
| Dependencies | 82/100 | Mostly well-justified; two stale packages already scoped, one real dead-weight import |
| Build | 85/100 | Clean, fast, effective; one stale-artifact hygiene issue |

**Overall Production Readiness: 82/100 — Conditionally Production-Ready.**

This is a codebase with a genuinely mature engineering culture: it audits itself, tracks its own debt honestly (including admitting when a past commit message overstated its own scope), and has already closed every hard blocker two prior audits found. The gap between 82 and a 90+ score isn't architectural rework — it's the specific, mostly-already-scoped list in §20's Quick Wins and Medium Effort buckets, plus the one new governance-drift item (§6, SEC-NEW-01) that needs a human decision, not just an engineering fix. Ship-blocking items: none identified in this pass. Recommended-before-meaningful-scale items: the `dailyBeacon`/cost-guardrail work in §18, and the AI governance reconciliation in §6 — both because they get harder to unwind the longer they sit, not because either is an active incident today.
