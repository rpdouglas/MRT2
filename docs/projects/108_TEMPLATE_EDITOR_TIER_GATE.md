# 📁 Project 108: Gate the `/templates` Route Itself, Not Just Its Entry Point

**Status:** 🟢 Done
**Primary Persona:** All (monetization enforcement — no persona-specific UX)
**Objective:** Close the gap CLAUDE.md already flags — `JournalEditor.tsx`'s custom-templates button is tier-gated, but the `/templates` route and `TemplateEditor.tsx` itself have zero tier check, so any authenticated free user can reach and use the feature directly by URL.

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want the actual feature surface (the route/component) tier-gated, not just the one button that links to it, so navigating to `/templates` directly can't bypass the Supporter-tier requirement.
**Competitive Gap:** N/A — monetization-consistency fix, not a feature.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None. `users/{uid}/templates/{id}` is unencrypted structural prompt text (name/content/tags), per CLAUDE.md's collection table — not personal disclosure. This ticket is a billing-enforcement fix, not a privacy fix.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A — unaffected, not in `executePinRotation`/`executeCryptoShredding` scope today and this doesn't change that.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:** None — no schema change. This is a UI-reachability fix, not a data-shape fix.

**Scope boundary (explicit, mirroring PROJ-106's "explicitly out of scope" convention):** `firestore.rules`' `templates` subcollection rule (`allow read, write: if isOwner(userId);`, line 106) has no server-side tier check either — a free user with a scripted client or console access could still read/write templates directly, bypassing any UI gate entirely. Closing *that* would mean a new pattern for this rules file (a cross-document `get()` read of the parent `users/{uid}.tier` field — there's no existing precedent for that here, and it adds a per-write read cost). CLAUDE.md's own wording of this gap ("the `/templates` route and `TemplateEditor.tsx` itself have no tier check... any authenticated free user can reach it directly by URL") is specifically about the client-reachable surface, not the rules layer, and templates are non-sensitive structural content, not a security boundary — so this ticket closes the UI/route gap only. The rules-layer question is a separate, larger design decision (first cross-document tier check in this file) and is flagged here rather than folded in silently.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
No new hooks or Firebase rules needed — reuses existing `useAuth()`'s `userTier` and the existing `PremiumGate` component (`src/components/PremiumGate.tsx`), already used elsewhere (`DataExportPanel.tsx`) for an inline gate. No prior use of `PremiumGate` as a full-page/route wrapper exists in this codebase, so this establishes that as the pattern for future full-page gates rather than inventing a new mechanism.

### Phase 2: UI/UX & Gamification
* `TemplateEditor.tsx` — wrap the entire component return in `<PremiumGate fallbackMode="lock_overlay">`, gating at the component itself (not just the route element in `App.tsx`) so the same protection holds regardless of how the component is ever reached in the future.
* **Somatic Check:** `lock_overlay` mode blurs the (empty-state) editor behind a calm "Premium Access Required" card with a single "View Benefits" CTA — no red/error styling, consistent with how `DataExportPanel.tsx` already presents this same fallback elsewhere. Not a punitive surface.
* **Reward:** N/A — gating fix, not a new reward surface.

### Phase 3: Edge Cases
* [x] `navigator.onLine` false — unaffected; `PremiumGate`'s tier check reads `userTier` from `AuthContext` (already loaded), no new network call.
* [x] `isVaultUnlocked` false — N/A; `/templates` was never `VaultGate`-wrapped (templates are unencrypted, correctly per the collection table) and this ticket doesn't change that.
* [x] 320px wide screen — reuses `PremiumGate`'s existing `lock_overlay` markup verbatim, already used at this width elsewhere in the app; no new layout introduced.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `src/components/__tests__/PremiumGate.test.tsx` already covers `PremiumGate`'s tier branches; added a `TemplateEditor.test.tsx` case asserting a free-tier user sees the lock overlay (not the editor UI) and a premium-tier user sees the editor.
* [x] **The Subway Test:** N/A — no offline-specific behavior changed.
* [x] **The "Lost PIN" Test:** N/A — no crypto/PIN logic touched.
