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
* **Feature:** Bundle Size / Code-Splitting Reduction.
  * **Concept:** The `vendor` chunk is 1.8MB (567KB gzipped); the service worker precaches ~19MB total — a heavy first install for a TWA aimed partly at users in acute crisis on mobile connections.
  * **Status:** Deferred — worth doing before scaling, not submission-blocking. Surfaced in `docs/reports/2026-07_app_readiness_review.md` (2026-07-18).

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
* **PROJ-23 — The QA Sentinel (Playwright E2E pipeline).** Full spec exists at `docs/projects/archive/23_QA_SENTINEL.md`. Status: ⚪ Planned — not yet built; PROJ-40 backfilled unit-test coverage only, so the E2E golden-path suite this spec scopes remains an open gap. Surfaced during the 2026-07-16 governance audit (previously an orphan spec referenced nowhere). **Priority raised 2026-07-18:** `docs/reports/2026-07_app_readiness_review.md` flags zero browser-level regression coverage of golden paths (login → vault unlock → journal encrypt/decrypt) as a scaling risk ahead of Play Store submission. Recommend scheduling into an active Wave rather than leaving parked.
