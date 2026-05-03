---
name: zk-audit
description: Zero-Knowledge security audit. Use after any feature that touches Firestore writes, encryption, or user data. Checks for ZK boundary violations.
---

# ZK Security Audit

Review the code I'm about to describe (or that is currently in context) for Zero-Knowledge violations.

## Check 1: Encryption Boundary
- Does any user-generated content reach Firestore without passing through encryptData()?
- Are all encrypted field names in the interface marked clearly?
- Is the encryption key ever exposed in component props, React state, or console output?

## Check 2: Firestore Write Audit
For every Firestore write in the change:
- List the collection path
- List every field written
- Mark each field: ENCRYPTED / PLAINTEXT-OK / VIOLATION-RISK

## Check 3: Security Test
Write the Vitest test that reads the raw Firestore document from the emulator
and asserts encrypted fields are NOT human-readable strings:
```typescript
const rawDoc = await adminDb.collection('[collection]').doc(testDocId).get();
const data = rawDoc.data();
expect(data?.encryptedField).not.toMatch(/[a-zA-Z]{10,}/); // not plaintext
```

## Output
- PASS: ZK boundary intact
- RISK: [specific concern]
- VIOLATION: [exact location, exact fix needed]