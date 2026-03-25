# 📁 Project 27: The CBT Engine (SMART Tools)

**Status:** 🟡 Active
**Primary Persona:** Ned (The Pink Cloud) / Walt (The Zen Master)
**Objective:** Refactor legacy SMART Recovery CBT tools into strictly-typed React components secured by Zero-Knowledge encryption and integrated into the AI Analysis pipeline.

---

## 1. The Executive Summary
**User Story:** * **As** Ned, I want to complete a Cost Benefit Analysis (CBA) on my phone so that I can logically process a craving before I act on it.
* **As** Walt, I want my cognitive behavioral exercises saved securely so the AI Compass can identify my irrational beliefs over time.
**Competitive Gap:** Most apps link out to static PDF worksheets. We offer native, interactive, beautifully designed tools that save securely offline and feed directly into the overarching AI analysis engine.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** High. These tools capture deep emotional triggers, irrational beliefs, and relapse justifications.
* [x] **Encryption Strategy:** Will use `src/lib/crypto.ts`. The payload (a complex object) will be processed via `JSON.stringify()` and passed to the encryptor. The resulting ciphertext will be stored.
* [x] **Key Rotation:** Because these are stored as `journals`, they are automatically included in the existing `executePinRotation` batch pipeline. No extra rotation logic needed!

---

## 3. Schema & Architecture 🗄️
**Architectural Decision:** We will NOT create new collections. We will use a **"Virtual Module"** approach (identical to Vitality). Tools will save to the `journals` collection.

**Firestore Collections Impacted:**
* `journals`: 
  * `content`: Encrypted stringified JSON.
  * `tags`: e.g., `["SMART Tool", "CBA"]` or `["SMART Tool", "ABC"]`.
  * `moodScore`: Defaults to 5 (or user selected).

**Types (`src/lib/types/smart.ts`):**
```typescript
export interface CBAPayload {
    advantagesDoing: string[];
    disadvantagesDoing: string[];
    advantagesNotDoing: string[];
    disadvantagesNotDoing: string[];
}

export interface ABCPayload {
    activatingEvent: string;
    irrationalBeliefs: string;
    consequences: string;
    disputes: string;
    effectiveNewBeliefs: string;
}
// Further interfaces defined during Phase 1
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State (The Foundation)
* Define all TypeScript interfaces in `src/lib/types/smart.ts`.
* Create `SmartToolContainer.tsx`: A wrapper component that handles local debounced state, encryption, and auto-saving via TanStack Query (`useJournalOperations`).

### Phase 2: UI/UX & Gamification (The Refactor)
* Port legacy `.jsx` tools to modern `.tsx` utilizing Tailwind v4 (glassmorphism, vibrant gradients).
* **Somatic Check:** Ensure the forms do not feel like "homework". Use auto-expanding textareas and clear, empathetic labeling.
* **Reward:** Saving a tool grants standard Journal XP (+25 XP).

### Phase 3: Edge Cases
* [ ] What happens if `navigator.onLine` is false? -> `useJournalOperations` leverages Firestore offline persistence.
* [ ] What happens if `isVaultUnlocked` is false? -> The `SmartToolContainer` must block entry and display the PIN unlock screen.
* [ ] What happens on a 320px wide screen (iPhone SE)? -> CSS Grid must collapse to single columns (`grid-cols-1`).

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** Verify `smart.ts` interfaces compile securely.
* [ ] **The Subway Test:** Fill out a CBA offline, reconnect, verify it hits Firestore.
* [ ] **The "AI Visibility" Test:** Run an AI Journal Analysis. Verify the AI successfully parses the stringified JSON content block.
