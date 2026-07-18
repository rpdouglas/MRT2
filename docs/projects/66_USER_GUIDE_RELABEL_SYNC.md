# 📁 Project 66: User Guide Relabel Sync

**Status:** 🟢 Done
**Primary Persona:** All (David, Ned, Lisa, Walt) — every user who reads the external guide
**Objective:** Bring the published user guide (docs-site) and its underlying spec file into alignment with the in-app "My X" navigation labels introduced by commit `a05a24f`, so guide readers see the same names they see in the app.

---

## 1. The Executive Summary
**User Story:** As a user reading the User Guide to learn a feature, I want the guide to call each page by the same name the app's sidebar uses, so that I can find and trust the guidance I'm reading.
**Competitive Gap:** N/A — this is a documentation-consistency fix, not a new user-facing feature.

**Background:** Commit `a05a24f` ("feat: update terminology to personalize user experience") relabeled the primary in-app nav (`src/components/AppShell.tsx`) and page headers to "My Dashboard," "My Journal," "My Vitality," "My Tasks," "My Workbooks," "My Insights," and "My Profile." That commit shipped outside the normal spec/planning workflow, so no project ticket tracked "update the published guide to match." A follow-up audit found the docs-site VitePress guide (`docs-site/`) and one dev spec were only partially updated, leaving stale pre-relabel brand names ("The Horizon," "The Ledger," "The Pulse," "The Compass," "The Library") and one spec (`docs/specs/12_USER_GUIDE.md`) describing an in-app guide component (`src/pages/UserGuide.tsx`) that does not exist — the real guide is an external VitePress site linked from `Profile.tsx`.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** No — this project touches only static markdown/config documentation strings (page titles, sidebar labels). No user data, PII, or emotional content involved.
* [x] **Encryption Strategy:** N/A — no `src/lib/crypto.ts` usage; no Firestore reads/writes.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
*No Firestore or TypeScript schema changes — this is a documentation-only project.*

**Files Impacted (docs-site, static site — no app code changed):**
* `docs-site/.vitepress/config.mts` — sidebar nav label strings
* `docs-site/guide/04-tasks-habits.md` — H1 title
* `docs-site/guide/05-vitality.md` — H1 title
* `docs-site/guide/10-insights.md` — H1 title
* `docs-site/guide/06-workbooks.md` — H1 title (drop stale parenthetical)
* `docs-site/guide/freemium.md` — feature-tier bullet labels
* `docs-site/guide/01-getting-started.md` — body prose consistency
* `docs/specs/12_USER_GUIDE.md` — dev spec, corrected to describe the actual external-link architecture
* `docs/specs/05_TASKS.md` — dev spec title

---

## 4. Implementation Phases 🏗️

### Phase 1: Guide Site Sync
* Update `docs-site/.vitepress/config.mts` sidebar entries so every "Core Features" item reads "My Dashboard," "My Tasks," "My Vitality," "My Workbooks" (Journal was already correct).
* Fix the H1 title in `04-tasks-habits.md`, `05-vitality.md`, and `10-insights.md` to match the "My X" captions already present in each file's body.
* Remove the stale "(The Library)" parenthetical from `06-workbooks.md`'s title.
* Replace the three old brand-name bullets in `freemium.md` with their current "My X" equivalents.
* Light prose pass on `01-getting-started.md` for "My Dashboard" / "My Journal" / "My Workbooks" consistency in body text (Vault terminology is untouched — it's a legitimate, still-current term for the encryption gate, not a page name).

### Phase 2: Dev Spec Correction
* Rewrite `docs/specs/12_USER_GUIDE.md` to describe the guide as it actually exists today: an externally published VitePress site (`docs-site/`) linked from `src/pages/Profile.tsx` and `src/pages/Links.tsx`, not a native `src/pages/UserGuide.tsx` component (which does not exist in the codebase).
* Fix the title of `docs/specs/05_TASKS.md` to drop the stale "(The Ledger)" qualifier.

### Phase 3: Edge Cases
* [x] Confirm "Vault" and "Compass" (AI analysis feature name) are left untouched where they refer to the encryption gate or AI feature, not a renamed nav page — those are current, correct terms, not relabel casualties.
* [x] Confirm `docs/specs/01_JOURNAL.md` and `docs/specs/04_WORKBOOKS.md` were already updated by `a05a24f` and don't need further changes.
* [x] No in-app strings change — this is docs/config only, so no `isVaultUnlocked`/offline/mobile-width concerns apply.

---

## 5. QA & Verification 🧪
* [x] **Manual Review:** Every "My X" label in `src/components/AppShell.tsx` cross-checked against every page title and sidebar entry in `docs-site/` for exact match.
* [x] **docs:check-specs:** `npm run docs:check-specs` passes with this spec file included.
* [x] **Grep Sweep:** Repo-wide grep for "The Horizon", "The Ledger", "The Pulse", "The Compass", "The Library" confirms no remaining stale occurrences in `docs-site/` or `docs/specs/`.
