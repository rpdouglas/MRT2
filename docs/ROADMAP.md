# 🗺️ MRT Product Roadmap: "The 4 Waves"

**Methodology:** Strategic Waves (Prioritizing User Acquisition & Retention)

> **Spec-file note:** IDs referenced here without a `docs/projects/XX_FEATURE.md` file (PROJ-18, 19, 24, 32, 33, 34, 35, 37, 39, 48, and `[BILLING]`) predate CLAUDE.md's spec-file requirement and are exempt from backfill — flagged and resolved during the 2026-07-18 governance audit. Any of these picked up for new work should get a proper spec at that time.

## 🌊 Wave 1: Acquisition & Friction (Weeks 1–6)
*The immediate goal: Stop users from abandoning the app on Day 1 by removing the "Security Tax."*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ✅ **Shipped** | `PROJ-41` | **The Dynamic Anchor** | David / Ned | A slim, frictionless, 2-column Quick Action Bar replacing the static daily pledge. |
| 🟡 **In Progress** | `PROJ-07` | **Play Store TWA** | All | Generate assetlinks.json and finalize Google Play Store deployment. Sprint 9.1 implemented 2026-07-19 (manifest hardening, mobile CSS, legal footer links, `/delete-account` route) — code-verified, not yet device-tested. Sprint 9.2 (Bubblewrap, submission) waiting on remaining Google Play Console verification steps only; both prior blockers (PROJ-67, PROJ-68) are resolved. See `docs/projects/07_PLAY_STORE_TWA.md`. |
| ✅ **Shipped** | `PROJ-67` | **Signing Key & Secrets Hygiene** | All | New keystore generated and stored in Google Secret Manager; `assetlinks.json` updated; old compromised keystore purged from all git history and force-pushed (2026-07-19). See `docs/projects/67_SIGNING_KEY_SECRETS_HYGIENE.md`. |
| ✅ **Shipped** | `PROJ-68` | **Gate Stripe Checkout Out of the Android TWA** | All | In-app Stripe purchase flow hidden specifically inside the Play-installed TWA (`isAndroidTWA()` referrer check), sidestepping the jurisdiction-dependent Play Billing policy question rather than resolving it. See `docs/projects/68_STRIPE_TWA_GATING.md`. |
| ✅ **Shipped** | `PROJ-65` | **Vault PIN Brute-Force Hardening** | All | Rate-limited server-pepper key derivation (multi-device-safe alternative to the originally-proposed IndexedDB Master Key, which was rejected) so a Firestore breach doesn't reduce to a 10,000-combination PIN search. Implemented 2026-07-17, external security review passed 2026-07-19 — see `docs/projects/65_VAULT_KEY_HARDENING.md`. |
| ✅ **Shipped** | `PROJ-73` | **Test Suite Hardening — Vault-PIN Pepper Coverage** | All | Closes the coverage gap left by PROJ-65 so the peppered PIN-derivation scheme is actually exercised by automated tests at every layer (Cloud Function handler, client orchestration, browser e2e). Phases 1-3 shipped; Phase 4 (stretch — Recovery Games) component-test coverage shipped 2026-07-22, and Subway Test (PROJ-72's browser QA gap) automated 2026-07-23 as a real Playwright e2e spec. All QA checklist items closed. See `docs/projects/73_TEST_SUITE_HARDENING.md`. |

## 🌊 Wave 2: Retention & Community (Weeks 7–16)
*The secondary goal: Keep users past Day 30 through peer support and shame-free resets.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `NEW` | **Privacy-Preserving Community** | All | Opt-in, pseudonymized social feed moderated by Gemini. (Requires heavy Zero-Knowledge schema design). |
| ⚪ Planned | `PROJ-35` | **The Autopsy Engine** | David | A shame-free CBT reset flow that captures triggers immediately following a relapse. |
| ⚪ Planned | `NEW` | **Multi-Addiction Clocks** | All | Tracking multiple habits/substances simultaneously. |

## 🌊 Wave 3: Platform Maturity & Sponsors (Weeks 17–26)
*The third goal: Capture the "Lisa" (Sponsor) and "Walt" (Long-term) demographics.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⏸️ **Paused** | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. (Paused to focus on Wave 1 Onboarding). Its Dashboard "Coming Soon" placeholder slot is being reassigned to `PROJ-72` Recovery Games — when unpaused, this needs a new entry point (e.g. a nav item) instead. |
| ⚪ Planned | `PROJ-33` | **Predictive Relapse Engine** | Walt / Lisa | AI analysis of Insights collection to generate proactive warning tasks. |
| ⚪ Planned | `PROJ-34` | **Aggregated Stats Engine** | All | Cloud Functions to calculate stats on-write to reduce Firestore read costs. |

## 🌊 Wave 4: Enterprise & Ecosystem (Weeks 27–52)
*The final goal: Defensible technical moats and B2B expansion.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-37` | **Secure Handshake Protocol** | Lisa | Local QR-code generation to share encrypted 4th-step inventory directly to a sponsor. |

## ✅ RECENTLY SHIPPED
* `PROJ-82` PostHog Telemetry Expansion & Zero-Knowledge Alignment (PostHog Telemetry Expansion — safe, ZK-guarded analytics across crisis modal, urge surfer, recovery games, somatic vitality, and React error boundary.)
* `PROJ-80` Games Hub Unified Hero Restyle (Restyled the Recovery Games hub into one unified dark card with a flat game list (replacing the tile grid), delisted Craving Buster/Thought Challenge from it without touching their routes or components, and surfaced Thought Challenge as a new Tools Hub entry so it isn't left unreachable.)
* `PROJ-79` Daily Crossword (Added Daily Crossword, the 8th Recovery Games entry — a server-generated, non-personalized daily puzzle persisted like every other game but deliberately excluded from XP, matching its reward-free design.)
* `Maintenance` Build-Process Tooling Gap Closure (Added dependency-audit, secrets-scanning, ingestion, debt-ledger, and release-scribe skills/hooks to close gaps between the documented Recursive Build Protocol and the actual `.claude/` tooling.)
* `PROJ-78` VibrantHeader Right-Column Overflow (VibrantHeader Right-Column Overflow — fixed a layout bug where the header's shrink-0 center title/subtitle column never yielded width, pushing the SOS button up to 29px past the viewport edge on pages with a long subtitle (worst case: Workbooks at 412px/320px). Fix: center column now min-w-0 with a truncating subtitle; SOS's own column deliberately untouched so it can never shrink.)
* `PROJ-77` Nav Tab-Bar Unification (Nav Tab-Bar Unification — extracted a shared TabBar component and migrated Journal, Vitality, Workbooks, Tasks, and Profile onto it, sourcing per-feature colors from theme.ts. Fixed a real overflow/overlap bug at narrow viewports found during QA (min-w-fit + overflow-x-auto).)
* `PROJ-73` Test Suite Hardening — Vault-PIN Pepper Coverage (Closes the coverage gap left by PROJ-65 so the peppered PIN-derivation scheme is actually exercised by automated tests at every layer (Cloud Function handler, client orchestration, browser e2e). Phase 4 (stretch — Recovery Games) component-test coverage shipped 2026-07-22, and the Subway Test (PROJ-72's browser QA gap) automated 2026-07-23 as a real Playwright e2e spec. All QA checklist items closed.)
* `PROJ-75` Workbook Marketplace (v1 — Official Catalog) (Added workbook marketplace v1 — Marketplace tab lets users add/remove official workbooks from their library via a new installedWorkbookIds profile field, no new Firestore collection or rules.)
* `PROJ-74` Legacy Vault Unlock Hang on Decrypt-Mismatch (Legacy Vault Unlock Hang — a decrypt mismatch during legacy (pre-pinVerifier) vault unlock now fails closed with a clear error instead of hanging the unlock button indefinitely.)
* `PROJ-72` Recovery Games (Zero-knowledge, anti-shame persona-targeted mini-games and psychoeducation tools layered on the existing XP/streak system, replacing the Dashboard's dead "Service — Coming Soon" tile. All 7 phases shipped: Craving Buster (David), Morning Intent, Recovery Jeopardy (group activity), Fast Lane (Walt, a multi-week economic life-sim), Goal Ladder (Ned), Thought Challenge (Lisa), Trigger Match (Walt), and Knowledge Quests (general psychoeducation, decoupled content packs) — closed out by extending the existing data-export/deletion engine to cover Recovery Games data and adding Milestone Image sharing to Fast Lane/Jeopardy win screens.)
* `PROJ-30` Data Sovereignty Engine (Local decryption and structured export (JSON/PDF) via `DataExportPanel.tsx`/`exporter.ts`, plus Google Drive auto-sync and account deletion. This row was stale — still `⚪ Planned` in Wave 4 despite the engine being fully built; corrected while extending it to cover Recovery Games data for `PROJ-72`.)
* `Maintenance` SMART Tool Journal Entries (Journal History previously rendered completed SMART Tool sessions as raw JSON text. Now reuses the existing Tool History rendering pattern — a tool badge, one-line headline, and expandable humanized field list — in the main Journal History timeline, and fixed search/share to use humanized text for these entries. Unfinished drafts and the (now-unsafe) Edit button no longer show for tool entries; AI analysis (JournalAnalysisWizard, Deep Pattern Analysis) also reads humanized text instead of raw JSON.)
* `PROJ-71` Tools Hub Regrouping (Regrouped the flat Tools Hub into four moment-based collapsible accordion sections (Right Now / Before It Happens / After a Hard Moment / Big Picture) with Right Now expanded by default, added a resume-draft callout, and brought the page onto the Momentum Kinetic visual system via a new tools GlassCard variant.)
* `PROJ-23` The QA Sentinel (Playwright E2E golden-path suite (Gate/Vault/Ledger) wired into CI as a blocking pre-deploy gate against local Firebase emulators. Found and fixed a real journal-entry data-loss race condition along the way, plus three CI-only environment gaps (firebase-tools, Java 21, Firebase client env vars) invisible in local dev.)
* `PROJ-70` Changelog Historical Scrub (Rewrote all remaining changelog entries (v1.0.0-v1.8.18) into plain user-facing language: stripped PROJ-ID tags, file/hook/component names, and engineering jargon; deleted or trimmed entries with zero user-facing content (admin-only tooling, pure test/architecture work).)
* `PROJ-69` Changelog Split — Public/Internal Separation (Split the public docs-site changelog from internal engineering detail: scrubbed two live security disclosures and rewrote five mislabeled entries, added a leak-guarded --public-note/--version path to sync_ticket_docs.py, and added a Check 0 user-visible classification gate to the ticket-close skill.)
* `PROJ-68` Gate Stripe Checkout Out of the Android TWA (Decided against implementing full Google Play Billing — sidesteps the jurisdiction-dependent Payments policy question entirely by hiding the in-app Stripe purchase flow specifically inside the Play-installed TWA, via a new `isAndroidTWA()` referrer check. Existing subscribers can still manage/cancel from inside the app; only new purchases are gated. Unblocks PROJ-07 Sprint 9.2.)
* `PROJ-65` Vault PIN Brute-Force Hardening (Rate-limited server-pepper key derivation so a Firestore breach doesn't reduce to a 10,000-combination PIN search — multi-device-safe alternative to the originally-proposed IndexedDB Master Key. Implemented and manually verified end-to-end 2026-07-17; external security review passed 2026-07-19, closing the last open item.)
* `PROJ-67` Signing Key & Secrets Hygiene (Rotated the Android app-signing keystore after discovering it was tracked in git — new keystore generated and stored in Google Secret Manager, `assetlinks.json` updated, old keystore purged from all git history via `git filter-repo` and force-pushed to `origin/main`, verified clean both locally and on the remote. Found in `docs/reports/2026-07_app_readiness_review.md` §1.)
* `PROJ-66` User Guide Relabel Sync (Brought the published docs-site user guide and its dev spec into alignment with the in-app "My X" navigation labels from commit `a05a24f` — sidebar nav, page H1s, freemium bullets, and `docs/specs/12_USER_GUIDE.md`'s architecture description corrected. Found via the 2026-07-18 governance audit as a spec with no prior ROADMAP/ACTIVE_CYCLE reference.)
* `PROJ-64` Gemini AI Proxy & Platform Hardening (Cloud Functions proxy removes the client-exposed Gemini API key, server-side AI rate limiting, Firestore persistent offline cache, PostHog decryption-failure telemetry — shipped 2026-07-13 in commit `6748388`, spec backfilled 2026-07-16 after a governance audit found the shipping commit's message overstated its scope; the key-derivation hardening it also claimed was never actually implemented and is tracked separately as `PROJ-65`.)
* `PROJ-63` Mobile Screenshot Generator (Implement automated mobile screenshot generator with persona-based mock bypass.)
* `PROJ-62` Tech Debt Quick Wins — Logging, Rules, Duplicate Reads, `any` Suppressions (Cleared five deep-review quick-win chores: removed a debug console.log, hardened the CI service-account heredoc, tightened ai_logs/client_errors/feedback Firestore rules to uid-match, extracted Tasks.tsx's raw onSnapshot into useTasksList, and fixed the last four any-type suppressions (two of which were masking real latent bugs).)
* `Maintenance` Journal Sharing Format (Appended `myrecoverytoolkit.ca` to the end of the plaintext journal entry share text and added screen reader accessibility title to the Share button.)
* `PROJ-61` Test Coverage Backfill — ZK-Adjacent & Firestore-Write Paths (Backfilled test coverage for exporter.ts, useROSCAssessments, useRateLimits, and functions/prompts.ts prompt-construction logic.)
* `PROJ-60` God File Decomposition — Vitality & Data Management (Split Vitality.tsx and DataManagement.tsx along independent concerns, isolating account deletion and fixing a ZK plaintext-write bug in Vitality journal saves.)
* `PROJ-59` Data Access Layer Consolidation (Consolidated Firestore data-access layer onto TanStack Query: fixed two stale-cache bugs, extracted a shared query/mutation factory, migrated all raw CRUD call sites.)
* `PROJ-58` Profile UX Remediation (Unified three incompatible save models into one autosave pattern; fixed a TanStack Query bypass that could desync Dashboard badges after a Profile save; restyled the vault-reset confirmation into a Headless UI dialog; made Security/Data tabs deep-linkable routes; cause-specific import-failure messages; distinct partial-failure state for the displayName auth sync; 44px touch targets)
* `PROJ-57` Journal Template Modality Expansion (Default journal template picker expanded from 4 Twelve-Step-only templates to 15 templates across 11 recovery modalities — CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, General — grouped by modality; new templates render as guided multi-prompt forms reusing the existing custom-template rendering path)
* `PROJ-56` Sobriety Hero Color Themes (Swatch button on the dashboard hero plus a matching "Hero Appearance" picker in Profile → General; 5 curated presets stored as a plaintext `heroColor` field on `users/{uid}`, defaulting to today's amber look when unset.)
* `PROJ-55` Workbook Remediation (Real, step-specific content for 12-Step Steps 2-11 with unique literature-grounded contexts; migrated Workbook pages off direct Firestore calls onto a TanStack Query hook; fixed a fragile decryption heuristic; removed orphaned data module; dynamic gamification denominator)
* `PROJ-50` Guided CBT/REBT Interactive Workflows (Step-locked guided flows for ABCDE, CBA, and DENTS Scenario Mode; new Thought Record and Five Questions tools; AI coaching prompts; Tools Hub redesign with Start Fresh/Resume/History entry points and completion tracking)
* `PROJ-54` Journal Insights Momentum UI Redesign (GlassCard, dark theme, smooth charts, and typography upgrade)
* `PROJ-53` ROSC Matrix Visual Upgrade (Pill Capsules) (Animated segmented pill visualization, glassmorphic dark theme, replacing the Recharts radar chart)
* `PROJ-49` The Recovery Capital (ROSC) Matrix (Monthly SAMHSA domain assessment, Recharts radar chart with longitudinal overlay, ZK-encrypted AI narrative, free-tier self-report scores)
* `PROJ-47` The Ledger — Precision, Resilience & Tab Redesign (Monthly day-drift fix, grace window, missedCountHistory, Today/Later/Log tabs)
* `PROJ-48` User Guide Synchronization Sprint (Daily Readings page, Dynamic Anchor, Voice-to-Vault, Recurrence Table, Smart Reset expansion)
* `PROJ-46` The Ledger — Frictionless Task Module Upgrade (Swipe Gestures, Quick Capture, Rhythm Score, AI Context Cards)
* `PROJ-42` Daily Readings Engine (Multi-Modality Content)
* `PROJ-41` The Dynamic Anchor (Circadian Companion Widget) — ships as a 2-card Check-In/Reading bar; the spec'd 3rd "Intent" card was descoped and its dead code removed, see docs/projects/41_DYNAMIC_ANCHOR.md §6.
* `PROJ-40` Test Suite Audit (Vitest Pipeline Overhaul)
* `PROJ-39` Deferred Vault Lock (Frictionless Onboarding)
* `PROJ-31` Crypto Chunking Pipeline (Zero-Knowledge Scaling)
* `PROJ-26` The Beacon (Push Notification Engine) — server-scheduled Web Push (FCM) for sobriety milestones and overdue-habit reminders; spec backfilled 2026-07-09 as part of the notification-system remediation.
* `PROJ-17` Changelog Beacon (Dashboard toast comparing a build hash against what the user last saw) — shipped 2026-03-17 but had been silently non-functional since 2026-02-17 due to an unwired build-manifest generator; found and fixed 2026-07-16 as part of a governance audit, spec backfilled at the same time — see `docs/projects/17_CHANGELOG_BEACON.md`.
* `PROJ-19` The Landing Page (Vibrant Momentum & Persona Showcase)
* `PROJ-24` The Asset Engine (Strict-Typed Image Dictionary)
* `PROJ-18` Command Center (AI Telemetry Dashboard & SRE Rate Limiting)
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
