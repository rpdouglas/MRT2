# 📐 Feature Spec: The CBT Engine (SMART Tools)

**Status:** Live (v1.11.0)
**Architecture:** Virtual Module (Abstracted Journal Interface) + Render Props
**Primary Code:** `src/components/smart_tools/`

## 1. Overview
The CBT Engine digitizes evidence-based SMART Recovery worksheets into interactive, responsive React components. 

## 2. Technical Architecture

### A. The Virtual Module Storage Strategy
To avoid schema bloat, CBT tools do not have their own Firestore collections. 
* They are saved directly to the `journals` collection.
* **The Payload:** The tool's state is wrapped in a metadata object, passed through `JSON.stringify()`, encrypted via AES-GCM, and stored in the `content` field.
* **Tags:** They are flagged with `['SMART Tool', toolType]` so the `JournalHistory` timeline can render them and the `JournalAnalysisWizard` can read them.

### B. The `SmartToolContainer` (HOC / Render Prop)
A generic wrapper component (`SmartToolContainer<T>`) handles all complex logic, allowing the individual tools to remain pure UI layers.
* **Encryption Gate:** Enforces `isVaultUnlocked`.
* **Session Rehydration:** Accepts a `resumeSession` boolean. If true, it queries the DB on mount for the most recent entry tagged with that tool, decrypts the payload, and hydrates the UI.
* **Idempotent Saves:** Exposes a "Save to Journal" button. If the session was resumed, it triggers `updateJournal` to prevent DB bloat. Otherwise, it triggers `addJournal`.

## 3. Tool Implementations
* **Cost Benefit Analysis (CBA):** A responsive 2x2 Bento Grid using Emerald and Rose tints.
* **ABC Coping Tool:** A sequential, vertical flow (A -> B -> C -> D -> E) designed to map to the cognitive behavioral chain.
* **D.E.N.T.S. Strategy:** An Acronym Vertical Stack with distinct, vibrant background tints for pre-planning escape routes.
* **Personify & Disarm:** A "Rogue's Gallery" card grid leveraging Narrative Therapy to externalize the addictive voice.
* **Lifestyle Balance:** An interactive "Wheel of Life" radar chart (powered by `recharts`) that maps 6 core life categories to geometric shapes, immediately highlighting holistic imbalances.

## 4. Routing
* **Tools Hub (`/tools`):** A centralized directory replacing the hardcoded Urge Surfer dashboard link.
