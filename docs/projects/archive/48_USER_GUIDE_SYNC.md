# 📁 Project 48: User Guide Synchronization Sprint

**Status:** ✅ Shipped (2026-05-06 · `feature/update_user_guide`)
**Primary Persona:** All Personas (Focus on Onboarding)
**Objective:** Synchronize the VitePress user documentation with the v1.6.0 codebase, addressing the drift in the Daily Readings, Dynamic Anchor, Task Recurrence, Voice-to-Vault, and Push Notification systems.

---

## 1. The Executive Summary
**User Story:** 
* **As** a new user, I want the User Guide to accurately reflect the screens and features I see in the app so that I can confidently navigate my recovery tools without confusion.
* **As** Lisa (The Service Superstar), I want to know exactly how to share Daily Readings securely so I can support my sponsees without violating anonymity.

**Competitive Gap:** Many apps abandon their documentation as they scale, leading to user frustration. Maintaining a perfectly synchronized, native-feeling User Guide reinforces MRT's brand promise of reliability and safety.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Safe. This project only modifies public-facing markdown documentation in the `docs-site/` directory.
* [x] **Encryption Strategy:** N/A for documentation. However, the documentation *must* accurately explain that Daily Readings are shared plaintext content, while Journals/Workbooks are ZK-encrypted.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

**Files Impacted (`docs-site/`):**
* `.vitepress/config.mts`: Add new route to the sidebar array.
* `guide/09-daily-readings.md`: **[NEW FILE]**
* `guide/02-dashboard.md`: Modify.
* `guide/03-journal-and-ai.md`: Modify.
* `guide/04-tasks-habits.md`: Modify.

---

## 4. Implementation Phases 🏗️

### Phase 1: The Daily Readings Integration
* **Create:** `docs-site/guide/09-daily-readings.md`.
* **Content:** 
  * Explain the 7 available modalities (AA, NA, Recovery Dharma, SMART, etc.) and how they rotate automatically based on the day of the year.
  * Detail the "Share" functionality, explicitly noting that it strips all personal data (PII) to protect anonymity for sponsors.
* **Config:** Update `.vitepress/config.mts` to include `09-daily-readings` under the "Core Features" sidebar.

### Phase 2: The Dashboard & Anchor Rewrite
* **Update:** `docs-site/guide/02-dashboard.md`.
* **Content:** 
  * Remove outdated references to the static "Daily Pledge".
  * Introduce the **Dynamic Anchor**: Explain the 3-column Quick Action Bar and how the prompts adapt based on the time of day (Morning, Afternoon, Evening, Night).
  * Add a section on **Push Notifications (The Beacon)**, explaining how to enable them for milestone celebrations and habit nudges, and how to manage the `notifyCheckIn`, `notifyReading`, and `notifyIntent` settings in the Profile.

### Phase 3: The Ledger & Vault Expansion
* **Update Tasks (`04-tasks-habits.md`):** 
  * Expand the "Smart Reset" section to thoroughly explain "Lazy Evaluation"—clarifying exactly *why* missed habits move to today and how the streak penalty is calculated to prevent schedule debt.
  * Explain advanced recurrence options (e.g., "1st Monday of the Month").
* **Update Vault (`03-journal-and-ai.md`):** 
  * Add a dedicated "Voice-to-Vault" section. Explain that the app uses AI to transcribe audio, detect mood, and generate tags automatically, lowering the friction for users in acute crisis.

---

## 5. QA & Verification 🧪
* [ ] **Build Check:** Run `npm run docs:build` to ensure VitePress compiles the new markdown without broken links.
* [ ] **Navigation Test:** Verify the new "Daily Readings" page appears in the VitePress sidebar and the Next/Previous pagination links work correctly.
* [ ] **Review:** Ensure no documentation promises functionality that contradicts the Zero-Knowledge boundary.

---

---

## 6. Shipped Notes

**"3-column" spec error:** Phase 2 described the Dynamic Anchor as a "3-column Quick Action Bar." The actual implementation (`DynamicAnchorWidget.tsx` — `grid-cols-2`) is 2 columns: a Check-In button and a Daily Reading button with a dropdown chevron. The guide was written to match the code.

**Smart Reset / Lazy Evaluation:** Added to `04-tasks-habits.md` — explains on-demand evaluation at app load, the streak penalty table (first miss → 0, subsequent misses → decrement below 0), and the equivalence between the silent reset and the Forgiveness Tap write.

**Share button:** Spec described the share feature as "stripping PII." In practice, readings contain no user data by design — the share output is the reading text plus the MRT URL. Documented accurately.

---

*MRT · PROJ-48 User Guide Synchronization Sprint · v1.0 · May 2026 · Status: ✅ Shipped*