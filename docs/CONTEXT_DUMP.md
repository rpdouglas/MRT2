# 🧠 MRT: Platform Context
**Stack:** React 19 + Vite + Tailwind v4 + Firebase + Gemini 2.5
**Security:** Zero-Knowledge (AES-GCM Client-Side)
**Version:** v1.0.0 (Production)

## 🏗️ Architectural Pillars

### 1. Zero-Knowledge Security
* **Boundary:** `src/lib/crypto.ts` is the absolute boundary.
* **Rule:** Plain text sensitive data (Journals, Workbook Answers) **NEVER** leaves the client device.
* **Mechanism:** Data is encrypted with a key derived from `User PIN + Salt` (PBKDF2) before being sent to Firestore.
* **Recovery:** If the PIN is lost, the data is mathematically unrecoverable. This is a feature, not a bug.

### 2. Offline-First PWA
* **State:** We use `TanStack Query` with `persistPersister` (planned) or local state to handle flaky connections.
* **Sync:** The "Online/Offline" indicator (`LayoutContext`) informs the user of sync status.

### 3. AI Isolation
* **Model:** Gemini 2.5 Flash / Pro.
* **Flow:** Data is decrypted on the client -> Sent to Gemini API -> Result displayed/saved.
* **Privacy:** We do not fine-tune models on user data. Prompts are stateless.


## 🎨 Design System (Vibrant Momentum)
**Philosophy:** "Recovery is a high-performance lifestyle."
**Visuals:** High-saturation gradients, 100dvh layouts, glassmorphism.

### Module Themes (Atmospheric Tinting)
| Module | Persona Match | Gradient Source | Glow (Shadow) | Vibe |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | David (Crisis) | Sky → Blue | `bg-slate-200` | Hope & Clarity |
| **Tasks** | Ned (Pink Cloud) | Cyan → Teal | `bg-cyan-200` | Energy & Action |
| **Service** | **Lisa (Service)** | **Rose → Amber** | `bg-orange-200` | Warmth & Connection |
| **Insights** | Walt (Zen) | Fuchsia → Rose | `bg-fuchsia-200` | Mystical & AI |
| **Vitality** | Universal | Rose → Amber | `bg-orange-200` | Somatic Health |

### UI Rules
* **The Trinity Header:** Left (Menu), Center (Context), Right (Action/SOS).
* **Tactility:** Buttons use `active:scale-95`.
* **Typography:** Hero numbers (`font-black`), Metadata (`tracking-wider`, `uppercase`).


## 📂 Directory Structure
* `src/components/journal/` -> Editor, History, and Analysis.
* `src/components/service/` -> Sponsee management & Service commitments.
* `src/lib/` -> Core logic (`crypto.ts`, `firebase.ts`, `gemini.ts`).
* `src/data/` -> Static content (Workbook questions, Slogans).
* `functions/` -> (Planned) Server-side sanitization.

## 🛠️ Coding Standards
* **Strict Typing:** No `any`. Interfaces for `JournalEntry` and `Task` are mandatory.
* **No Magic Strings:** Use constants for Collection Names (`journals`, `tasks`).
* **Environment:** All secrets via `import.meta.env`.