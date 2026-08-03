# 🧊 Feature Backlog (The Persona Icebox)

**Last Reviewed:** 2026-07-12

**Storage:** Ideas and feature requests that are approved but deferred. Tagged by Persona to ensure we are building for specific psychological needs, not just adding features.

## 👤 David (The User in Crisis)
* **Feature:** Harm Reduction Mode.
  * **Concept:** A toggle that shifts the app's language from "Abstinence" to "Management" (e.g., tracking drinks per week instead of days since last drink).
  * **Status:** Deferred to post-Wave 2.
* **Feature:** Clinical Telehealth Off-Ramps (MAT Resources).
  * **Concept:** Direct links to Medication-Assisted Treatment if the SOS button is pressed multiple times.
  * **Status:** Deferred — unscheduled.
* ~~**Feature:** Bundle Size / Code-Splitting Reduction.~~ **Resolved by `PROJ-89` (vendor chunk split, 2026-07-29) and `PROJ-98` (PWA precache scope, 2026-08-02).** Precache is now 3.36MB (was ~19MB); no chunk exceeds 875KB raw. Removed from active backlog — re-add if bundle size regresses again.

## 👤 Ned (The Pink Cloud)
* **Feature:** "90 in 90" Meeting Tracker & Friend Challenges (PROJ-21).
  * **Concept:** Gamified attendance tracking.
  * **Complexity:** High (Requires secure multiplayer networking). Deferred to 5,000 user milestone.
* **Feature:** Sleep Log / Wearable Integration.
  * **Concept:** Apple HealthKit API integration to correlate sleep debt with cravings.
  * **Complexity:** Extremely High. Deferred to Wave 4.

## 👤 Lisa (The Service Superstar)
* **Feature:** Accountability Partner Mode.
  * **Concept:** A read-only "Listener" view where a sponsor can see a sponsee's clean time and public mood graph (without seeing encrypted journal entries).
  * **Status:** Deferred — unscheduled.

## 👤 Walt (The Zen Master)
* **Feature:** Photo Attachments in Journal.
  * **Complexity:** High (Requires Blob -> ArrayBuffer -> AES-GCM -> Base64). Deferred indefinitely.

## 🅿️ Parked / Unscheduled (Have specs, not on the Roadmap)
* **PROJ-38 — The Urge Intervention System ("The Lifeline Protocol").** Full spec exists at `docs/projects/38_URGE_INTERVENTION.md`. Status: ⚪ Planned, not yet scheduled into a Wave.
* **PROJ-45 — Adaptive Persona UI Engine.** Full spec exists at `docs/projects/45_ADAPTIVE_PERSONA_UI.md`. Status: ⚪ Planned — PARKED, explicitly not in active sprint pending the Open Questions in the spec's §6.
* **PROJ-97 — Dependency Hygiene Round 2.** Full spec exists at `docs/projects/97_DEPENDENCY_HYGIENE_ROUND_2.md`. Status: ⚪ Planned, not yet scheduled into a Wave. Replaces two unmaintained dependencies (`@use-gesture/react` in `SwipeableTaskRow.tsx`, `crossword-layout-generator` in the Daily Crossword generator), clears `knip`-flagged dead code, and adds `eslint-plugin-jsx-a11y`.
* **`PROJ-07` Sprint 9.2 — confirm current Google Play Console verification status.** Surfaced 2026-08-03 during governance remediation (Phase 2.1 of `docs/reports/2026-08_governance_alignment_remediation_plan.md`): `docs/ACTIVE_CYCLE.md` has stated Sprint 9.2 (Bubblewrap compile, Play Console submission) is "blocked on remaining Google Play Console verification steps" since 2026-07-19, and that status hasn't been rechecked since — it may already be resolved. Needs a human with Play Console access; not checkable from an agent sandbox. **Fix once checked:** if resolved, move PROJ-07 to fully shipped in both `docs/ROADMAP.md` and `docs/ACTIVE_CYCLE.md`; if still blocked, just refresh the note's timestamp so the next reader knows it was rechecked, not stale.
* **`mrt2-app-uat` — `VAULT_PEPPER` secret not set / Secret Manager API not enabled.** Surfaced 2026-07-19 while closing out `docs/projects/67_SIGNING_KEY_SECRETS_HYGIENE.md` §7 (prod and dev were both fixed in that pass). uat isn't currently in active use, so this is deferred rather than fixed now — but it will break the first Cloud Functions deploy to uat with the same `defineSecret("VAULT_PEPPER")` failure prod hit, until someone enables `secretmanager.googleapis.com` on `mrt2-app-uat` and runs `firebase functions:secrets:set VAULT_PEPPER --project=mrt2-app-uat` (plus the matching `roles/secretmanager.secretAccessor` IAM grant). No spec needed — this is a one-command chore, not a feature.

## 🔧 Infrastructure & Scale Triggers (No persona — internal readiness, no spec written yet)
*Surfaced by `docs/reports/2026-08_full_production_readiness_audit.md`'s Large-Refactor bucket (§20) and Scalability Review (§18). None are urgent at current traffic; each has a stated trigger condition below rather than a target Wave. Deliberately not spec'd yet per `CLAUDE.md`'s "no planning before a spec exists" rule — write the spec when the trigger is actually approaching, not speculatively now.*
* **`dailyBeacon` pub/sub fan-out rework.** The nightly notification function's own code comment already flags ~6,000 users (20 sequential batches) as its self-identified concern point; a separate, more urgent correctness bug in the same function (an unchunked `sendEach()` call past the SDK's 500-message limit) is tracked as its own item in `docs/projects/99_FIRESTORE_BACKEND_HARDENING.md` Phase 4, not deferred here. **Trigger:** approaching ~5,000-6,000 total users, or the first time a `dailyBeacon` timeout is observed in production logs, whichever comes first.
* **Aggregated Stats Engine (`PROJ-34`, already on `ROADMAP.md` Wave 3 as a one-line entry, no spec yet).** Cloud Functions to pre-compute streak/stat aggregates on-write, removing the full-history reads several client hooks currently perform (`getUserTasks`, `src/lib/insights.ts`, `JournalHistory.tsx`'s full-history mode). **Trigger:** the first real user complaint or measured slowdown attributable to full-history reads — the audit found the *pattern* but no evidence yet that it's actually hurting anyone at current scale.
* **Firebase App Check.** Confirmed absent across Firestore, Auth, and all eight Cloud Functions — the single largest network-edge gap in the security review, but the zero-knowledge encryption boundary already limits what an unauthenticated-but-unattested client could actually obtain (ciphertext, not plaintext, for most collections). **Trigger:** any observed sign of scripted/automated abuse traffic hitting Firestore or the Cloud Functions directly (a GCP budget alert, per `docs/projects/99_FIRESTORE_BACKEND_HARDENING.md` Phase 4, would be the first signal), or proactively before a significant marketing/user-acquisition push, whichever comes first.
* **Bulk-migration framework** (paginated, resumable, Cloud-Function-driven — beyond the current single-`uid` admin button in `SchemaMigration.tsx`, which doesn't paginate past 500 documents for even one user). **Trigger:** the next genuinely breaking schema change that needs to apply to every existing account, not before — building this speculatively risks over-engineering for a shape of migration nobody has needed yet (`usesPepperV2`'s lazy per-account flag has covered every real migration so far).
