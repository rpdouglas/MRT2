# 📁 Project [ID]: [Project Name]

**Status:** [⚪ Planned | 🟡 Active | 🟢 Done]
**Primary Persona:** [David | Ned | Lisa | Walt]
**Objective:** [One precise sentence defining the outcome]

---

## 1. The Executive Summary
**User Story:** * **As** [Persona], I want to [Action] so that I can [Benefit/Relief].
**Competitive Gap:** How does this feature specifically beat "I Am Sober", "Reframe", or "Sober Grid"?

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [ ] **Data Sensitivity:** Does this feature handle PII or emotional data?
* [ ] **Encryption Strategy:** Will this use `src/lib/crypto.ts`? If yes, outline the encryption payload.
* [ ] **Key Rotation:** Does this data need to be included in `executePinRotation`?

---

## 3. Schema & Architecture 🗄️
*Define the exact Firestore paths and TypeScript interfaces.*

**Firestore Collections Impacted:**
* `collection_name`: List fields added or modified.

**Types (`src/lib/db.ts`):**
```typescript
// Define interfaces here before building
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* Define React Query hooks needed.
* Define Firebase security rules required.

### Phase 2: UI/UX & Gamification
* List components to create/modify.
* **Somatic Check:** Does this UI induce stress? (e.g., Avoid red "Overdue" text for missed habits).
* **Reward:** How does this tie into the XP/Leveling system?

### Phase 3: Edge Cases
* [ ] What happens if `navigator.onLine` is false?
* [ ] What happens if `isVaultUnlocked` is false?
* [ ] What happens on a 320px wide screen (iPhone SE)?

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** Target files and edge cases to test.
* [ ] **The Subway Test:** (Offline resilience check).
* [ ] **The "Lost PIN" Test:** (Crypto-shredding check).
