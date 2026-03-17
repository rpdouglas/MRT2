# 📖 Feature Specification: The Journal (The Vault)

**Status:** Live (v2.3)
**Security Level:** Zero-Knowledge (Client-Side AES-GCM)
**Primary Persona:** David (The Crisis User), Walt (The Zen Master), Ned (Pink Cloud)

---

## 1. Overview
The Journal is the central "Input" mechanism of My Recovery Toolkit. It allows users to document their daily inventory, process emotions, and receive AI-driven recovery coaching. Crucially, it is a **secure, encrypted vault**; plain text data is never stored on the server.

## 2. The Three Modes (Tabs)
The Journal functionality is split into three distinct views via `JournalTabs.tsx`:

### A. Write (The Editor - "Sticky Studio")
* **Layout:** A flexible column layout with a persistent **Command Toolbar** at the bottom.
* **Input Methods:** Text and Voice-to-Vault (audio transcribed and analyzed via Gemini 2.5 Flash).
* **Templates:** Sourced from `src/data/journalTemplates.ts` or user-defined custom templates (Premium feature).

### B. History (The Timeline)
* **Structure:** A virtualized list (`Virtuoso`) optimized for long-term recovery tracking, grouped by Year and Month.
* **The Memory Engine (Search):** Client-side search bar filters entries *after* they are decrypted in memory.

### C. Insights (The Dashboard)
* **Visualizations:** Emotional Velocity (Area Chart), Weekly Rhythm, and an Interactive Word Cloud with a local storage blocklist.

---

## 3. Advanced AI Features

### 🧠 The Analysis Wizard (Cost Shield Enabled)
* **Component:** `JournalAnalysisWizard.tsx`
* **Concept:** An "on-demand" recovery coach that reads decrypted history to find patterns.
* **Usage Limits (Rate Limiting):** Controlled via `useRateLimits.ts` reading `UserProfile.usage_limits`.
    * **Free Tier:** Limited to 1 Weekly/Monthly Analysis per 7/30 days, and 1 Deep Dive per 30 days. Requires a minimum entry count (7 for weekly, 30 for monthly/deep dive).
    * **Premium Tier:** Unlimited access (bypasses the timestamp checks).
* **Output:** Generates a `ComparativeAnalysisResult` or `DeepPatternResult` which is saved to the `insights` collection.

### 🎙️ Voice-to-Vault
* **Component:** `AudioRecorder.tsx`
* **Flow:** Records audio -> Converts to Base64 -> Sent to Gemini 2.5 Flash -> Returns Transcription + Mood Score + Smart Tags.
