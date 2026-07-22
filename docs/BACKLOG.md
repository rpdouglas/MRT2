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
* **`mrt2-app-uat` — `VAULT_PEPPER` secret not set / Secret Manager API not enabled.** Surfaced 2026-07-19 while closing out `docs/projects/67_SIGNING_KEY_SECRETS_HYGIENE.md` §7 (prod and dev were both fixed in that pass). uat isn't currently in active use, so this is deferred rather than fixed now — but it will break the first Cloud Functions deploy to uat with the same `defineSecret("VAULT_PEPPER")` failure prod hit, until someone enables `secretmanager.googleapis.com` on `mrt2-app-uat` and runs `firebase functions:secrets:set VAULT_PEPPER --project=mrt2-app-uat` (plus the matching `roles/secretmanager.secretAccessor` IAM grant). No spec needed — this is a one-command chore, not a feature.
