# 📐 Feature Spec: [Feature Name]

**Status:** [Draft | In Progress | Live]
**Version:** 1.0
**Owner:** [Your Name]
**Access Level:** [Free | Premium]

## 1. The "Why" (User Story)
* **As a:** [Persona, e.g., David]
* **I want to:** [Action]
* **So that:** [Benefit]

## 2. User Experience (The Flow)
* **Entry Point:** [Where does it start? e.g., Dashboard -> Fab Button]
* **Happy Path:**
    1.  User clicks X.
    2.  System displays Y.
* **Error States:**
    * Offline: [Behavior]
    * Decryption Failure: [Behavior]
* **Paywall State:** [Behavior if Free user clicks a Premium feature]

## 3. Technical Architecture
* **Data Model:** (Link to Firestore Schema)
* **Security:** (Encryption requirements)
* **Dependencies:** (e.g., Gemini API, Chart.js)

## 4. Edge Cases & Constraints
* [ ] What happens if the user has no network?
* [ ] What happens if the vault is locked?

## 5. Verification (QA)
* [ ] Unit Test: `src/features/X/__tests__/X.test.ts`
* [ ] Manual Check: [Step-by-step verification]
