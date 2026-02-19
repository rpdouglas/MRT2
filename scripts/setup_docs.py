import os

# --- CONTENT DEFINITIONS ---

proj_01 = """# 🔐 Project 01: Security Hardening

**Objective:** Eliminate critical vulnerabilities found in the Feb 2026 Audit.
**Status:** 🟢 Done
**Personas Involved:** The Architect, Walt (The Zen Master)

## 🛑 Phase 1: Access Control (The Gate)
* [x] **Delete Backdoors:** Remove `src/components/AdminGrant.tsx`.
* [x] **Fix Rules:** Update `firestore.rules` to remove hardcoded emails. Use Custom Claims logic instead.
* [x] **Lock Button:** Add a "Lock Vault" button to the UI that clears `globalKey` from memory instantly.

## 🛡️ Phase 2: Pipeline Safety (The Guard)
* [x] **CI/CD Gates:** Update `.github/workflows/deploy.yaml`.
    * [x] Add `npm install`
    * [x] Add `npm run lint`
    * [x] Add `npm run test` (Make sure it fails the build if tests fail).

## 🧪 Phase 3: Integrity Verification (The Proof)
* [x] **Unit Tests:** Create `src/lib/crypto.test.ts`.
    * [x] Test: `encrypt('hello')` -> `decrypt(result)` === `'hello'`.
    * [x] Test: Decrypting with wrong key throws specific error.
"""

proj_02 = """# ⚡ Project 02: Professional Task List (The Engine)

**Objective:** Transform the Tasks module into a high-performance, minimalist to-do list.
**Status:** 🟢 Done
**Personas Involved:** Ned (The Pink Cloud)

## 🏗️ Phase 1: Logic & Optimistic UI (The Feel)
* [x] **Optimistic Toggle:** Implement `onMutate` in React Query. Clicking a checkbox must feel instant.
* [x] **Refactor Hook:** Create `useTaskOperations` to handle add/edit/delete/toggle.
* [x] **Schema Update:** Add `source` field ('manual' | 'ai') to differentiate user tasks from Insight Actions.

## 🧠 Phase 2: Visual Rebranding (The Look)
* [x] **List Layout:** Replace "Cards" with "Compact Rows" (High density).
* [x] **Terminology:** Rename "New Quest" -> "New Task".
* [x] **Smart Tabs:** Implement Today, Upcoming, Action Plan, and History log.

## 🎨 Phase 3: "Invisible" Gamification
* [x] **Subtle Rewards:** Completion triggers a subtle UI update.
* [x] **Streak Display:** Show recurrence label and visual overdue indicators.
"""

proj_03 = """# 📖 Project 03: Wisdom Polish (Interactive Workbooks)

**Objective:** Transform the Workbook experience from a "Data Entry Form" to a "Premium Interactive Book".
**Status:** 🟢 Done
**Personas Involved:** Walt (The Zen Master)

## 🏗️ Phase 1: Typography & Layout
* [x] **Tailwind Typography:** Implement `@tailwindcss/typography` (`prose` classes) for rich text rendering in questions.
* [x] **Reading Mode:** Focus mode that hides the sidebar/header for deep work.
* [x] **Sticky Nav:** Move navigation to an inline sticky toolbar for mobile UX.

## 🧠 Phase 2: Data Safety & AI
* [x] **Auto-Save:** Implement `useAutoSave` to save answers to Firestore while typing.
* [x] **Draft Indicator:** Visual "Saving..." / "Saved" status in the header.
* [x] **On-Demand AI:** Individual question feedback via `getGeminiCoaching`.

## 🎨 Phase 3: Gamification
* [x] **Chapters Mastered:** Replace "Active" metric with locally calculated Mastered chapters.
* [x] **Task Routing:** Ensure Compass actions route to the `Action Plan` tab with `source: 'ai'`.
"""

proj_04 = """# 🛠️ Project 04: The Frictionless Core

**Objective:** Refine the core engine (Auth, Data Retrieval, Education) to improve user retention.
**Status:** 🟡 Active
**Personas Involved:** Universal (David, Ned, Lisa, Walt)

## 🏗️ Phase 1: The "Vault & Gate" Polish
* [ ] **Refresh Bug:** Fix Journal decryption race condition by wiring `isVaultUnlocked` to the query render.
* [ ] **Auth UI:** Redesign `Login.tsx` into a modern split Sign-In/Sign-Up flow.
* [ ] **Trust Badges:** Add "Zero-Knowledge Encrypted" badges to the sign-up screen.

## 🧠 Phase 2: The "Memory Engine"
* [ ] **Client-Side Search:** Build a search bar in `JournalHistory.tsx` to filter decrypted content and tags.
* [ ] **Insights Polish:** Add trend arrows to `JournalInsights.tsx`.
* [ ] **Interactive Word Cloud:** Make Word Cloud click-to-filter.

## 🎨 Phase 3: The "Knowledge Base"
* [ ] **VitePress Setup:** Initialize VitePress in a `/docs-site` directory for static hosting.
* [ ] **Documentation Migration:** Move Privacy Policy, TOS, and User Guide to the VitePress site.
* [ ] **App Integration:** Replace internal `UserGuide.tsx` with external links to the new site.
"""

proj_05 = """# 🤝 Project 05: The "Lisa" Service Module

**Objective:** Build the "Digital Rolodex" for sponsors to manage sponsees securely.
**Status:** ⚪ Planned
**Personas Involved:** Lisa (The Service Superstar)

## 🏗️ Phase 1: Schema & Crypto
* [ ] **Schema:** Create `service` collection structure.
* [ ] **Crypto:** Verify `src/lib/crypto.ts` can handle small, discrete fields individually without breaking decryption.

## 🧠 Phase 2: Logic Layer
* [ ] **Hook:** Build `useServiceData()` context hook.
* [ ] **CRUD:** Implement `addSponsee()`, `updateSponseeNote()`.
* [ ] **Boundary Check:** Ensure deleting a sponsee deletes their encrypted notes (crypto-shredding).

## 🎨 Phase 3: UI Implementation
* [ ] **Dashboard:** Create `ServiceWidget` for the main dashboard.
* [ ] **List View:** Create `pages/Service.tsx` with "Active" and "Alumni" tabs.
* [ ] **Detail View:** A secure card showing encrypted notes + unencrypted Next Meeting time.

## 🚀 Phase 4: Release
* [ ] **Docs:** Update User Guide with a section for Sponsors.
"""

# --- SCRIPT LOGIC ---

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"✅ Updated: {path}")

def delete_file(path):
    if os.path.exists(path):
        os.remove(path)
        print(f"🗑️ Deleted old file: {path}")

if __name__ == "__main__":
    base_dir = "docs/projects"
    
    print("🚀 Synchronizing /docs/projects/ directory...")
    
    # Write updated/new files
    write_file(f"{base_dir}/01_SECURITY_HARDENING.md", proj_01)
    write_file(f"{base_dir}/02_CORE_POLISH_TASKS.md", proj_02)
    write_file(f"{base_dir}/03_CORE_POLISH_WISDOM.md", proj_03)
    write_file(f"{base_dir}/04_FRICTIONLESS_CORE.md", proj_04)
    write_file(f"{base_dir}/05_SERVICE_MODULE.md", proj_05)
    
    # Cleanup old incorrectly named file
    delete_file(f"{base_dir}/04_SERVICE_MODE.md")
    
    print("✨ Project documentation is now fully standardized and aligned with the Roadmap.")