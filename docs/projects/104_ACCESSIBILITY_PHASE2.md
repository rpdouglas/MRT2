# 📁 Project 104: Accessibility Phase 2 — Crisis Access, WCAG 2.2, & Structural Gaps

**Status:** 🟡 In Progress — Phase 1 shipped 2026-08-31; Phases 2-6 planned
**Primary Persona:** David (crisis-access reachability, PIN authentication burden), All (screen-reader/keyboard users, structural gaps)
**Objective:** Close the accessibility gaps found by `docs/reports/2026-08_accessibility_gap_analysis.md` that weren't covered by `PROJ-91`/`PROJ-97`/`PROJ-98` — starting with a real product-safety bug (SOS unreachable when the vault is locked) and continuing through WCAG 2.2's new criteria, CI coverage expansion, and structural gaps (zero `aria-live` regions, no skip-link, no global reduced-motion baseline).

---

## 1. The Executive Summary
**User Story:** As David in an acute crisis state, I want to reach crisis support (SOS, sponsor, hotline) regardless of whether my vault happens to be locked, so that a security screen never stands between me and help.
**Source:** `docs/reports/2026-08_accessibility_gap_analysis.md` — independently verified by tracing the actual render tree (`AppShell.tsx` → `VaultGate.tsx` → `Page`), not assumed from a single research pass.
**Competitive Gap:** Not a differentiator — this is a correctness bug in the app's own stated design floor ("Max 3 taps per flow. Zero cognitive load. Crisis-first design" for David, `CLAUDE.md`), not a feature comparison against "I Am Sober"/"Reframe"/"Sober Grid".

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Phase 1 touches only UI reachability (a button's location) and CSS layering (z-index) — no data, no encryption boundary involvement. Phases 2 (`VaultGate.tsx` attribute/UX changes) and later touch the PIN *input's* accessibility attributes and copy, never the PIN *derivation* logic in `src/lib/crypto.ts` or the pepper exchange in `verifyVaultPin`.
* [x] **Encryption Strategy:** N/A for Phase 1. Phase 2's `autoComplete`/show-PIN/`aria-*` additions are presentation-layer only — no change to how the PIN is hashed, transmitted, or used to derive the vault key.
* [x] **Key Rotation:** N/A — no interaction with `executePinRotation` or `executeCryptoShredding` in any phase of this spec.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes in any phase. No `src/lib/db.ts` changes.

**Phase 1 — confirmed root cause (verified by reading the code, not assumed):**
1. `src/App.tsx` nests routes `PrivateRoute` → `AppShell` → `VaultGate` → `Page`. `AppShell.tsx:82` unconditionally mounts `<SOSModal isOpen={isSOSOpen} onClose={...} />` — correct, this part already works regardless of lock state.
2. The *only* control that sets `isSOSOpen` to `true` is the SOS button in `VibrantHeader.tsx:127-134` (`onClick={toggleSOS}`), which is imported per-page and rendered as part of `VaultGate`'s `children`. `VaultGate.tsx` renders *either* its PIN screen *or* `children` (never both) — so on any vault-gated route, a locked user has no control that can open the modal that's already sitting in the tree.
3. `VaultGate.tsx:214`'s PIN screen is `z-[60]`. `SOSModal.tsx:28`'s `Dialog` was `z-50`. Even with a working trigger, the modal would render beneath the lock overlay.
4. `SOSModal.tsx:161-172` ("Somatic Anchor" → `/vitality`) and `:175-186` ("Log the Urge" → `/journal?template=urge_log`) both route to `VaultGate`-wrapped pages — reachable but requiring an unlock the user didn't expect mid-crisis.

**Files touched, Phase 1:**
* `src/components/AppShell.tsx` — new persistent SOS trigger button.
* `src/components/SOSModal.tsx` — z-index bump; new `useEncryption()` import for lock-state-aware option hints.

---

## 4. Implementation Phases 🏗️

### Phase 1: Crisis-access reachability — ✅ Shipped 2026-08-31
* Added a persistent SOS trigger button directly in `AppShell.tsx`, rendered unconditionally (outside/above `VaultGate`'s coverage), reusing the `setIsSOSOpen` already destructured from `useLayout()` at line 24. Styled to match `VibrantHeader.tsx`'s existing SOS button (same icon, `aria-label="Emergency SOS"`), positioned with a z-index above `VaultGate`'s `z-[60]` lock overlay so it stays clickable while locked.
* Bumped `SOSModal.tsx`'s `Dialog` from `z-50` to `z-[70]` so the modal renders above the lock screen when triggered from a locked route.
* Added a lock-state-aware hint (via `useEncryption()`'s `isVaultUnlocked`) under the "Somatic Anchor" and "Log the Urge" option cards when locked — `988`/`911`/sponsor-contact/Urge Surfer/Craving Buster remain fully available regardless of lock state either way; only these two options need the extra context since they're the ones that actually require unlocking.
* **Somatic Check:** This *removes* a stress-inducing surprise (a distressed, locked-out user unexpectedly landing on a PIN screen) rather than introducing one. No red/urgent styling added.
* **Reward:** N/A — this is a reachability fix, not a gamified interaction.

### Phase 2: WCAG 2.2 SC 3.3.8 — PIN accessibility (⚪ Planned)
* `VaultGate.tsx`'s unlock field: add `autoComplete="current-password"` (parity with the setup field's already-correct `autoComplete="new-password"`).
* Add a "show PIN" reveal toggle to reduce transcription errors.
* Wire `aria-invalid`/`aria-describedby` from the PIN input to the existing error banner (`"Improper PIN. Access Denied."`, `VaultGate.tsx:149`).
* Surface the actual lockout duration as a countdown — `functions/src/index.ts:44-49`'s `computeLockoutSeconds` already computes this server-side; today the client only shows a static "please wait" string (`VaultGate.tsx:155`).
* **Explicitly deferred, not Phase 2 scope:** a biometric/WebAuthn unlock alternative (the actual SC 3.3.8-compliant "alternative to a cognitive function test"). Requires a hardware-backed key-wrapping design compatible with the zero-knowledge model — real architecture work, needs its own future spec once scoped.

### Phase 3: CI coverage expansion (⚪ Planned)
* Extend `e2e/golden-paths/a11y.spec.ts` beyond its current 7 routes to add: `/tools/urge-surfer`, `/login`, `/delete-account`, `/profile`, `/admin`.
* Add an assertion that opens the SOS modal (from an already-covered route) and scans it directly — today it's invisible to the axe gate entirely, since it's state-triggered, not a route.

### Phase 4: Structural gaps (⚪ Planned)
* Global `prefers-reduced-motion`/`:focus-visible` CSS baseline in `src/index.css` — closes the `docs/ROADMAP.md` Wave 1 item that's been open since before this ticket (currently only 2 files handle it per-component).
* Skip-to-main-content link in `AppShell.tsx` (currently zero skip-link anywhere in the app).
* Focus management on route change — move focus to the new route's `<h1>` on navigation (React Router doesn't do this automatically; confirmed via upstream issue tracker, not this app's own regression).
* `aria-live="polite"` regions for form-validation errors and async save/error states — zero exist anywhere in `src/` today, a repo-wide gap.

### Phase 5: Form labels & hand-rolled modals (⚪ Planned)
* Accessible names for 6 identified inputs: `JournalEditor.tsx`'s free-write textarea, mood slider, and tag input; `WorkbookSession.tsx`'s guided-answer textarea; `Profile.tsx`'s Display Name and Sobriety Date fields.
* Escape-key handling for 3 hand-rolled `fixed inset-0` modals that don't use HeadlessUI `Dialog`: `src/components/games/jeopardy/QuestionModal.tsx`, `src/components/readings/ReadingModal.tsx`, `src/components/dashboard/DynamicAnchorWidget.tsx` — same pattern `PROJ-91` already used to fix `SobrietyHero.tsx`'s equivalent popover.

### Phase 6: Cognitive/UX polish (⚪ Planned)
* Replace native `window.confirm()` for task deletion (`Tasks.tsx:188`), journal-entry deletion (`JournalHistory.tsx:287`), and template deletion (`TemplateEditor.tsx:87`) with a styled confirm + `sonner` undo-toast (already a dependency, unused for this). `DeleteAccount.tsx`'s more rigorous re-auth+confirm flow is correct as-is and out of scope — its extra friction is appropriate given the ZK design.
* Plain-language rewrites for 3 flagged strings: `SOSModal.tsx:170` ("de-escalate your nervous system"), `VaultGate.tsx:83-85` ("Zero-Knowledge Policy"), `VaultGate.tsx:228-229` (lockout/reset copy).

### Edge Cases
* [x] `navigator.onLine` false: Phase 1's SOS button/modal don't touch network state — `tel:`/`https://wa.me/` links already degrade gracefully offline (native OS dialer/browser handles the failure, unchanged behavior).
* [x] `isVaultUnlocked` false: this is the entire subject of Phase 1 — confirmed the fix works specifically *because* the vault is locked, not despite it.
* [ ] 320px wide screen (iPhone SE): not yet manually verified for the new AppShell-level SOS button's position relative to existing chrome at this breakpoint — needed before Phase 1 is considered fully QA'd (see §5).

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `src/components/__tests__/SOSModal.test.tsx` — the pre-existing suite mocked `AuthContext`/`db`/`firebase` but not `EncryptionContext`, so adding `useEncryption()` to `SOSModal` broke all 3 existing tests (`useEncryption must be used within an EncryptionProvider`). Fixed by mocking `EncryptionContext` per this repo's established convention (`VaultGate.test.tsx`/`UrgeSurfer.test.tsx`'s `vi.mock('../../contexts/EncryptionContext', ...)` pattern). Added a 4th test asserting the locked-state hint renders on exactly the 2 gated option cards (and not on the always-available ones) when `isVaultUnlocked: false`. 702/702 full suite passing (was 701 before this ticket).
* [x] **The Subway Test:** N/A for Phase 1 (no network-dependent behavior changed).
* [x] **The "Lost PIN" Test:** N/A for Phase 1 (no crypto/PIN-derivation logic touched).
* [ ] **Manual verification (Phase 1):** lock the vault, navigate to a vault-gated route (e.g. `/journal`), confirm the SOS button is now visible on the PIN screen, confirm tapping it renders the modal *above* the lock overlay (not hidden beneath it), confirm the two vault-gated SOS options show the new locked-state hint. Not yet done in a real browser from this sandbox — unit test coverage above verifies the same logic, but a live click-through hasn't happened.
* [ ] **320px viewport check** for the new AppShell-level SOS button (iPhone SE width) — not yet done, tracked as an open edge case above.
* [x] **Regression:** `npm run build` ✅, `npm run lint` ✅ (zero warnings), `npm run docs:check-specs` ✅ (71/71 specs pass), `npm run test:once` ✅ (702/702).
* [ ] **Phase 3's own deliverable** (once built) becomes the permanent regression gate for the crisis-access fix and the other routes named above — today's unit test + manual spot-check is the only check until then.
