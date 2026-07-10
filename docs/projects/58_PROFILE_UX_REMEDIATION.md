# 📁 Project 58: Profile UX Remediation

**Status:** 🟢 Done
**Primary Persona:** Walt | Ned
**Objective:** Close the seven friction/consistency gaps found in `docs/reports/profile-gap-analysis.md` — three incompatible save models on one page, a TanStack Query architecture bypass that can desync Dashboard badges, two mismatched confirmation patterns for destructive actions, silently swallowed save errors, no deep-linking into Security/Data, and a handful of polish items — without touching the encryption boundary, without adding new Firestore fields, and without regressing the onboarding flow.

---

## 1. The Executive Summary
**User Story:** As Walt, reviewing my settings months into recovery, I want every field on my Profile page to behave the same way — either it saves as I type or it clearly waits for a button — and I want to be told the truth when something fails to save, so that I never have to wonder whether my sponsor's number, my sobriety date, or my dashboard badge preference actually took effect.
**Competitive Gap:** Consumer sobriety apps ("I Am Sober", "Reframe", "Sober Grid") get away with a single flat settings screen because they have almost nothing to configure. MRT's Profile is doing more — PIN vault rotation, encrypted export, Google Drive sync — which is a real differentiator, but only if it's trustworthy. Three different save behaviors on one screen and a save path that silently disagrees with what the Dashboard reads back is the kind of inconsistency that erodes trust in an app whose entire pitch is "we handle your recovery data carefully."

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** No. Every field this project touches (`displayName`, `sobrietyDate`, `sponsorName`, `sponsorPhone`, `substanceCost`, `costFrequency`, `currencySymbol`, `anchorSettings.*`, `pushNotificationsEnabled`, `heroColor`) is already the `users/{uid}` collection's plaintext row per CLAUDE.md's ZK table (`❌ No` — profile metadata only). This project adds no new fields and does not touch `journals`, `workbook_answers`, `service`, or `rosc_assessments`.
* [x] **Encryption Strategy:** N/A — `src/lib/crypto.ts` is never invoked for anything in this project. No encryption payload to design.
* [x] **Key Rotation:** N/A — none of the fields touched participate in `executePinRotation`/`pendingRotation` (`src/lib/rotation.ts`); that flow only re-encrypts `journals`, `workbook_answers`, `service`, and `rosc_assessments`.encryptedAIContext. This project's Phase 3 (Danger Zone dialog restyle) changes *how* the reset confirmation is presented, not the crypto-shredding logic in `EncryptionContext.resetVault()` itself.
* [x] **Non-negotiable query-key stability:** `useAnchorStatus.ts`, `useHeroColor.ts`, and `useReadingPreferences.ts` all already read/write the TanStack Query cache under the exact key `['profile', user?.uid]`. Any new profile hook introduced by this project **must** use that identical key — a mismatched key (e.g. `['userProfile', uid]`) wouldn't error, it would just silently reintroduce the same staleness bug this project exists to fix, one layer down.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `users/{uid}`: no field additions or removals. All fields already exist on `UserProfile` (`src/lib/db.ts:23-75`).

**Types (`src/lib/db.ts`):** `UserProfile` interface is unchanged — reused as-is.

**New files:**
* `src/hooks/useUserProfile.ts` — TanStack Query hook: `useQuery({ queryKey: ['profile', uid], queryFn: getProfile })` for reads, plus a `useMutation` wrapping `updateProfileData` for writes, with `onSuccess: () => invalidateQueries(['profile', uid])`. Mirrors the existing pattern in `useHeroColor.ts` and `useWorkbookAnswers.ts` (Project 55). Replaces `Profile.tsx`'s local `useState`/`useEffect`/`getProfile()`/raw `updateDoc()` calls.

**Modified files:**
* `src/pages/Profile.tsx` — rewired onto `useUserProfile`; save-model unification (Phase 2); Danger Zone dialog restyle (Phase 3); error-message fixes (Phase 3); sobriety-date bounds (Phase 5).
* `src/App.tsx` — nested routes for tab deep-linking (Phase 4).
* `src/components/AppShell.tsx` — de-duplicate the two near-identical "vault unlocked" banners (Phase 5).
* `src/components/profile/DataManagement.tsx` — replace generic "check console" import-failure message with a specific, actionable one (Phase 3).

**Deleted files:** none.

---

## 4. Implementation Phases 🏗️

### Phase 1: Architecture — route Profile through TanStack Query
* Build `useUserProfile` (see above), using query key `['profile', uid]` — the exact key `useAnchorStatus.ts` already reads.
* Replace `Profile.tsx`'s `loadProfile()` `useEffect` with the hook's `useQuery` data.
* Replace the raw `updateDoc(doc(db,"users",uid), {...})` calls in `handleSave` and `handleTogglePushNotifications` with the hook's mutation.
* **This alone fixes Critical Finding #2** (Dashboard badge staleness) as a side effect of the architecture fix, not a standalone patch — once Profile's writes invalidate `['profile', uid]`, `useAnchorStatus.ts` picks up the change on its next render with no changes needed on the Dashboard side.
* No new Firebase security rules needed — the existing `users/{userId}` owner-write rule already covers every field this hook touches.

### Phase 2: UI/UX — unify the save model
* Standardize the General tab to the pattern already proven by Hero Appearance / Reading Modality / Push Notifications: **autosave on change**, not a bottom Save button — for every field except the two onboarding-required fields (`displayName`, `sobrietyDate`), which keep an explicit "Complete Setup" submit *only while `isOnboarding` is true*, matching the existing onboarding-lock behavior in `docs/specs/09_PROFILE.md` §1.
* Add one consistent, small "Saved" affordance (e.g., a fading checkmark next to the field/section) shared by every autosaving control, so David or Ned glancing at the screen has one visual language for "this took," not three.
* **Somatic Check:** No red/failure states introduced. A failed autosave shows the existing calm error-banner pattern already used elsewhere in Profile, not a shaming inline red state on the field itself.
* **Reward:** No gamification change — this is a trust/consistency fix, not a new mechanic.

### Phase 3: UI/UX — confirmation patterns and honest errors
* Replace `handleHardReset`'s native `prompt()`/`alert()` with a Headless UI `Dialog`, reusing the exact staged-modal component pattern `DataManagement.tsx`'s account-deletion flow already established (typed "RESET" confirmation is preserved — only the presentation layer changes, so the deliberate friction stays, but it now looks like it belongs to this app on an iOS standalone PWA).
* Fix the two error-swallowing paths in `handleSave`: the `anchorSettings` write and the auth `displayName` sync each currently fall back to `console.warn` while the UI still reports "Profile updated successfully." Surface a distinct partial-failure message when either sub-write fails, instead of a blanket success.
* Replace `DataManagement.tsx`'s "Error: Import failed. Check console for details." with a message naming the actual problem where determinable (bad JSON, unrecognized schema, wrong file type) — no dead-end to devtools for a non-technical user.

### Phase 4: UI/UX — deep-linkable tabs
* Convert the `activeTab` client state into nested routes (`/profile/general`, `/profile/security`, `/profile/data`) so a support email, push notification, or the browser back/forward stack can land a user on a specific sub-section.
* Onboarding continues to force `/profile/general` and hide the tab bar/other routes until `hasCompletedOnboarding` is true — same gate, just expressed as a route guard instead of tab-bar visibility.

### Phase 5: Polish
* Hero-colour swatches: `h-9 w-9` (36px) → `h-11 w-11` (44px), matching the design system's own touch-target floor.
* `AppShell.tsx`: collapse the two near-duplicate "vault unlocked" banner blocks into one.
* Sobriety-date input: reject dates in the future and dates implausibly far in the past (client-side bound only — no schema change).

### Phase 6: Edge Cases
* [x] `navigator.onLine` false: unaffected — `useUserProfile`'s mutation inherits TanStack Query's standard offline queuing/retry, the same behavior `useTaskOperations`/`useHeroColor` already exercise; no new offline logic introduced. Not independently re-tested — relies on already-trusted inherited behavior, not a project-specific code path.
* [x] `isVaultUnlocked` false: unaffected — none of the fields in this project route through `EncryptionContext`; Security tab's PIN-rotation and Danger Zone flows are untouched in logic, only Danger Zone's confirmation *presentation* changes.
* [ ] 320px viewport (iPhone SE): not verified — no visual/viewport regression test was run against the real tab bar at this width. Flagged as remaining manual QA.
* [x] Deep link to `/profile/security` or `/profile/data` before `hasCompletedOnboarding` is true: redirects to `/profile/general` — covered by `Profile.test.tsx` test 14.

---

## 5. Out of Scope
* **Lisa persona — sponsor/sponsee connection flow (Gap Analysis Finding "Lisa has no surface here"):** deliberately excluded from this project. A sponsee roster, connection/consent request, and capacity indicator is a new relationship-management feature belonging to the Service Module domain, not a friction fix to an existing screen. Recommend a dedicated `docs/projects/XX_SPONSEE_CONNECTIONS.md` spec, planned separately.

---

## 6. QA & Verification 🧪
* [x] **Unit Tests:** (all passing; `npm run check` clean — lint, full suite, build)
  - `src/hooks/__tests__/useUserProfile.test.ts` (new, 5 tests) — query key is exactly `['profile', uid]`; mutation invalidates that key on success; partial-update merge behavior matches `updateProfileData`'s existing `{ merge: true }` semantics.
  - `src/pages/__tests__/Profile.test.tsx` (new, 16 tests) — autosave fields commit on change without a Save click; onboarding-required fields still gate on the explicit submit while `isOnboarding` is true; the `partial` status renders when the auth `displayName` sync sub-write throws; deep-linked tabs render directly and the onboarding redirect-guard fires; Danger Zone dialog confirm/type/cancel flow; sobriety-date bounds; swatch size.
  - `src/components/profile/__tests__/DataManagement.test.tsx` (new, 5 tests) — import-failure messages are specific per failure mode (bad JSON, permission-denied, network, generic), never the old console-redirect string.
* [x] **Integration — Dashboard/Profile cache coherence:** verified via `useUserProfile.test.ts` test 5, which asserts a `patchFields` write invalidates the exact `['profile', uid]` key `useAnchorStatus.ts` queries — not a full dual-hook render test, but a direct assertion on the shared cache key that was the actual point of failure.
* [x] **Security (raw Firestore doc check):** verified via mutation-argument assertions (`Profile.test.tsx`, `useUserProfile.test.ts`) confirming every write call is scoped to exactly the documented plaintext field set — not a live Firestore raw-doc fetch, but an equivalent check on the exact payloads that would be written.
* [ ] **The Subway Test:** (Offline resilience) not independently exercised — relies on inherited TanStack Query queuing/retry behavior already trusted elsewhere (see Phase 6).
* [x] **The "Lost PIN" Test:** Not applicable — no crypto-shredding logic changes; Danger Zone's restyled dialog calls the same `resetVault()` function with the same typed-confirmation gate.
