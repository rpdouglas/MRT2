# 📁 Project 30: The Data Sovereignty Engine (Export)

**Status:** ✅ Shipped — this spec file was stale (still marked `⚪ Planned`) despite the engine being fully built; corrected during PROJ-72 Phase 7 when it was extended to cover Recovery Games data. Live behavior is documented in `docs/specs/09_PROFILE.md` §4 (Manual Export Engine) and §6 (Annihilation Engine).
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
```typescript
export interface ExportPayload {
    user: UserProfile;
    journals: DecryptedJournalEntry[];
    tasks: Task[];
    workbooks: DecryptedWorkbookAnswer[];
    timestamp: string;
}
```

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

---

## 5. QA & Verification 🧪

**2026-08-04 governance note:** this spec's Status above reflects code-level verification (routes/hooks/components/tests confirmed present, and passing where automated) performed during the 2026-08-04 governance audit. The unchecked items below are manual/device/browser/visual checks that have not been performed by a human — tracked here as a known gap, not a blocker to the Shipped status. Check them off once actually performed.
* [ ] **Unit Tests:** `ExportPayload` serialization, PDF generation for empty/large datasets.
* [ ] **The Subway Test:** Export flow must work fully offline against cached decrypted data.
* [ ] **The "Lost PIN" Test:** Confirm export is inaccessible pre-unlock and that no decrypted content persists after the export session ends.

