import os

FENCE = chr(96) * 3

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.replace('@@@', FENCE))
    print(f"✅ Synced: {path}")

# ==========================================
# 1. UPDATE THE BACKLOG (Adding Viral Loop)
# ==========================================
BACKLOG_CONTENT = r"""# 🧊 Feature Backlog (The Icebox)

**Storage:** Ideas and feature requests that are approved but deferred. Do not pull into `ACTIVE_CYCLE.md` until prioritized.

## 📈 Viral Growth & Marketing (The Market Gap)
* **Feature:** Secure Milestone Share Cards (Instagram/Facebook export).
* **Complexity:** Medium. Generates an anonymized, branded image (using the UI's Vibrant Momentum aesthetic) of the user's clean time to safely share on social media. Satisfies the "Identity Signaling" psychological trigger without compromising the vault.

## 🏃 Integrations & Wearables
* **Feature:** HealthConnect / Apple HealthKit API integration for Sleep and Step data.
* **Complexity:** Extremely High. Deferred until post-seed funding/legal review.

## 🎮 Gamification & UI
* **Feature:** Sims-style KPI Gauges (Expanded Vitality Rings).
* **Complexity:** Medium. Deferred to prevent UI clutter during initial growth phase.
* **Feature:** Daily Recovery Puzzles (Crosswords/Word Search).
* **Decision:** Rejected/Deferred indefinitely. We are a toolkit, not a gaming app.

## 🏆 Social & Fellowship
* **Feature:** "90 in 90" Meeting Tracker & Friend Challenges (PROJ-21).
* **Complexity:** High (Requires secure multiplayer networking). Deferred to 5,000 user milestone.

## 📸 Media Support
* **Feature:** Photo Attachments in Journal.
* **Complexity:** High (Requires Blob -> ArrayBuffer -> AES-GCM -> Base64).
"""

# ==========================================
# 2. UPDATE THE ROADMAP (Adding New Specs)
# ==========================================
ROADMAP_CONTENT = r"""# 🗺️ MRT Product Roadmap: "Continuous Momentum"

**Methodology:** Lean (Now / Next / Later)

## 🟢 NOW (Active Cycle Focus)
*Projects currently in active development and unblocking growth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |

## 🟡 NEXT (Up Next)
*Fully scoped projects awaiting engineering bandwidth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-25` | **The Daily Oracle** | Walt / Ned | Universal CBT/Stoic/Mindfulness prompted journaling templates (No fellowship-specific text). |
| ⚪ Planned | `PROJ-29` | **Enterprise DevOps** | Admin | Migrate GitHub Actions to OpenID Connect (OIDC) keyless authentication and enforce SHA-pinning for supply chain security. |
| ⚪ Planned | `PROJ-30` | **Data Sovereignty Engine** | Walt | Formalize the local decryption and structured export (JSON/PDF) protocol for legacy users. |

## ⚪ LATER (Strategic Epics)
*Approved concepts requiring further technical scoping.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-22` | **Insights Stats** | Walt | Data visualization tab within the Insights module. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright) for scaling safety. |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |
| ⚪ Planned | `PROJ-31` | **Crypto Chunking Pipeline** | Admin | Refactor PIN rotation to handle 10,000+ encrypted documents via background chunking to prevent UI thread lock. |

## ✅ RECENTLY SHIPPED
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)
* `PROJ-27` The CBT Engine (SMART Tools integration)
* `PROJ-26` The Beacon (Push Notifications)
"""

# ==========================================
# 3. CREATE DATA SOVEREIGNTY SPEC (PROJ-30)
# ==========================================
EXPORT_SPEC_CONTENT = r"""# 📁 Project 30: The Data Sovereignty Engine (Export)

**Status:** ⚪ Planned
**Primary Persona:** Walt (The Zen Master)
**Objective:** Establish a formal, zero-knowledge pathway for users to export decades of encrypted data into highly readable local files (PDF/JSON) without unencrypted data ever touching an external server.

---

## 1. The Executive Summary
**User Story:** * **As** Walt, I want to export my entire journal history to a PDF so that I can print it, review it with my therapist, or store it offline securely.
**Competitive Gap:** Many apps hold data hostage to ensure retention. We use "Data Sovereignty" as a core marketing pillar. Proving users can easily extract their lives builds ultimate trust.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Critical. This touches every single decrypted thought a user has logged.
* [x] **Encryption Strategy:** Data is fetched as `ciphertext` from Firestore. It MUST be decrypted strictly in browser memory. 
* [x] **File Generation:** Files (JSON/PDF) must be compiled using Blob/ArrayBuffer entirely client-side. The file must trigger a direct `<a>` download. No third-party PDF-generation APIs can be used.

---

## 3. Schema & Architecture 🗄️

**Libraries Introduced:**
* `jspdf` & `jspdf-autotable` (For client-side PDF generation)

**Types (`src/lib/export.ts`):**
@@@typescript
export interface ExportPayload {
    user: UserProfile;
    journals: DecryptedJournalEntry[];
    tasks: Task[];
    workbooks: DecryptedWorkbookAnswer[];
    timestamp: string;
}
@@@

---

## 4. Implementation Phases 🏗️

### Phase 1: The Extraction Engine
* Build a query to fetch all documents where `uid == currentUser`.
* Pipe the payloads through the `crypto.ts` decryptor.

### Phase 2: The Formatter
* **JSON:** Serialize the `ExportPayload` and trigger a `Blob` download.
* **PDF:** Use `jspdf` to create a beautiful, "Zen-styled" document. Include a title page, table of contents, and chronological journal entries.

### Phase 3: Edge Cases
* [ ] What happens if the user has 5,000 journals? The PDF generator will crash the browser. We must implement a date-range selector (e.g., "Export 2025") for heavy users.

"""

# ==========================================
# 4. CREATE CRYPTO SCALING SPEC (PROJ-31)
# ==========================================
CRYPTO_SPEC_CONTENT = r"""# 📁 Project 31: The Crypto Chunking Pipeline

**Status:** ⚪ Planned
**Primary Persona:** The Architect (Admin)
**Objective:** Scale the AES-GCM Key Rotation engine so it can seamlessly decrypt and re-encrypt 10,000+ records without crashing mobile browsers or freezing the UI.

---

## 1. The Executive Summary
**User Story:** * **As** the System Architect, I want to ensure that a power-user with 5 years of daily entries can securely change their PIN without their phone running out of memory and corrupting their database.
**Competitive Gap:** Scaling true Zero-Knowledge encryption is notoriously difficult. By solving this, we create a massive technical moat against competitors who rely on simple server-side DB encryption.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Critical. This touches the master PIN rotation cycle.
* [x] **Encryption Strategy:** Uses `src/lib/crypto.ts`. Requires handling the `Old Key` and `New Key` simultaneously in memory.

---

## 3. Implementation Phases 🏗️

### Phase 1: The Chunking Algorithm
* Rewrite `executePinRotation` in `src/lib/rotation.ts` to utilize a Generator function or recursive `setTimeout`/`requestAnimationFrame` loop.
* **Batch Size:** Set hard limit to processing 50 documents per tick.

### Phase 2: UI Feedback (The Progress Bar)
* Update the Security Profile tab to listen to a new `rotationProgress` state.
* If a user has a massive database, the UI must show "Encrypting batch 4 of 200... Please keep app open."

### Phase 3: Transaction Safety (Rollbacks)
* If the app closes midway through a rotation, the database is in a split state (some docs use Key A, some use Key B). 
* **Migration Flag:** Add a `keyVersion` field to documents during rotation. If a failure occurs, the app must detect the split state on next login and resume the chunking process automatically.

"""

if __name__ == "__main__":
    print("🚀 Initiating Governance Synchronization...")
    write_file("docs/BACKLOG.md", BACKLOG_CONTENT)
    write_file("docs/ROADMAP.md", ROADMAP_CONTENT)
    write_file("docs/specs/19_DATA_EXPORT.md", EXPORT_SPEC_CONTENT)
    write_file("docs/specs/20_CRYPTO_SCALING.md", CRYPTO_SPEC_CONTENT)
    print("🎉 All governance documents updated. Run `npm run build` when ready.")