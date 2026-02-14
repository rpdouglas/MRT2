# 🧪 Phase Verification Prompt (QA)

**Role:** Senior SDET.
**Task:** Verify the code delivered in this Phase.

**Context:**
* Project: [INSERT PROJECT ID]
* Phase: [INSERT PHASE ID]

**Strategy:**
1. **Unit Tests:** Generate Vitest specs for new components.
2. **Integration:** Does this break any existing features (Regression)?
3. **Security:** Verify no plain-text leaks in logs.

**Output:**
* `.test.tsx` files.
* A specific "Smoke Test" checklist for the developer.