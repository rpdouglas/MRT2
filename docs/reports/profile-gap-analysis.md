# Profile Section: Frictionless-Operation Audit

**MRT · Gap Analysis · Lightweight Review**

A read-only pass through `Profile.tsx` and every sub-component, hook, and route it touches — scored for friction, consistency, and layout sense against the app's own personas.

- **Scope:** General / Security / Data tabs, entry routing, 8 hooks & contexts
- **Method:** Full-file read, no code changed
- **Findings:** 7 flagged, ranked below

---

## At a glance

| | |
|---|---|
| **3** | different save models on one General tab, with no visual distinction |
| **1** | flat route — no deep link to Security or Data sub-tabs |
| **36px** | hero-colour swatch target, below the app's own 44px rule |
| **2** | confirmation UI patterns for the app's two most destructive actions |
| **0** | sponsor/sponsee connection surface for the Lisa persona |

---

## Persona fit

CLAUDE.md's own test: does this screen serve the person it names?

**David — crisis, max 3 taps** · *Partial*
Profile correctly stays out of his critical path; SOS lives outside it. His one real dependency — the sponsor phone number — is a plain, unvalidated text field with no reachability check.

**Ned — gamification, streaks** · *Good fit*
Hero-colour and badge toggles are low-friction and instant-save, appropriately playful without leaking gamification clutter from the Dashboard.

**Walt — data, legibility, exports** · *Partial*
JSON/PDF export and Drive sync satisfy the sovereignty test, but import failures dump the user to devtools, and swatch targets sit under his 44px floor.

**Lisa — sponsor, service, boundaries** · *Gap*
No sponsor-mode, no sponsee list, no capacity indicator anywhere near account settings. This persona has zero footprint in Profile.

---

## Ranked findings

Highest-impact first. Severity reflects risk of silent data loss or a broken product rule, not visual polish alone.

### 🔴 Critical — Three incompatible save models share one page
Identity, sobriety date, financial fields, and Dashboard Badge toggles all wait for the bottom `Save Changes` button. Push Notifications and Hero Appearance save instantly on click. Reading modality also saves instantly. Nothing on screen signals which bucket a control belongs to.

*Why it matters:* a user can toggle a badge, watch a swatch "take" instantly nearby, reasonably assume everything saved, and navigate away — losing the badge and any identity edits with no warning.

### 🔴 Critical — Profile bypasses the app's own data-flow rule
`Profile.tsx` reads/writes via local `useState` + direct `getProfile()`/`updateDoc` calls, never through TanStack Query. Meanwhile `useAnchorStatus.ts` — which drives the Dashboard's badge widget — reads the same `['profile', uid]` cache key *through* `useQuery`.

*Why it matters:* toggling a Dashboard Badge off in Profile may not hide it on the Dashboard until the query's staleTime expires — a real, testable inconsistency, and a direct violation of CLAUDE.md's "all Firestore ops through TanStack Query" rule.

### 🟡 Moderate — Two destructive actions, two confirmation patterns
Vault reset ("Danger Zone") confirms via a native `window.prompt()` asking the user to type RESET. Account deletion uses a fully styled Headless-UI dialog with staged re-auth. Both are appropriately serious — but they don't look like they belong to the same app, and native prompts render inconsistently in standalone iOS PWA mode.

### 🟡 Moderate — No deep link into Security or Data
Sub-sections are client-side tab state on a single flat `/profile` route, not distinct URLs. A support email or push notification can't land a user directly on Security; the back button doesn't step between tabs either.

### 🟡 Moderate — Errors get swallowed behind a success message
The nested `anchorSettings` write and the auth `displayName` sync inside `handleSave` both catch failures into `console.warn` only. The user sees "Profile updated successfully" even when part of the save silently failed. Separately, import errors surface as "Check console for details" — a dead end for non-technical users.

### 🟡 Moderate — Lisa has no surface here
The only "sponsor" concept in Profile is a plain name/phone pair the user enters for their *own* SOS contact — not a sponsee roster, connection request, or capacity indicator. There is no entry point into a Service Module from account settings at all.

### 🟢 Minor — Small polish gaps
Hero-colour swatches render at 36px, under the design system's own 44px touch-target floor. `AppShell.tsx` renders two near-duplicate "vault unlocked" banners with slightly different copy. The sobriety-date field accepts any date, past or future, with no client-side bound.

---

## What's already working

Worth preserving, not just fixing what's broken.

PIN rotation has clear, distinct error states for wrong PIN vs. mid-rotation interruption vs. generic failure, plus a real documented recovery path for partial failures. Account deletion's staged re-auth dialog correctly disables its own close button mid-shred so the operation can't be aborted halfway. Onboarding hides Security/Data until identity fields are complete, which is the right call for a first-run flow. Export/import correctly gates PDF behind tier without hiding that it exists.

---

## Priority order

| # | Finding | Fix effort |
|---|---|---|
| 1 | Unify save behaviour on General tab — one pattern, or a visible "auto-saved" state per field | Small–Medium |
| 2 | Route Profile's own read/write through TanStack Query, matching sibling hooks | Medium |
| 3 | Replace native prompt/alert in vault reset with the existing Headless-UI dialog pattern | Small |
| 4 | Surface real errors instead of a blanket success message | Small |
| 5 | Nested routes for Security/Data if deep-linking is ever needed | Medium |
| 6 | Scope Lisa's sponsor/sponsee flow — likely belongs to Service Module, not Profile | Separate spec |

---

## File inventory (17 files reviewed)

| Path | Role |
|---|---|
| `src/pages/Profile.tsx` | Main page — 3 tabs, identity, financial, sponsor, badges, push, colour, reading |
| `src/components/profile/DataManagement.tsx` | Data tab — sync status, export, import, account deletion |
| `src/components/readings/ModalitySelector.tsx` | Reading-tradition checklist, embedded in General tab |
| `src/hooks/useHeroColor.ts` | Optimistic mutation for appearance swatch |
| `src/hooks/useReadingPreferences.ts` | Query + mutation for reading modality selection |
| `src/hooks/useAnchorStatus.ts` | Reads same profile cache key to drive Dashboard badges |
| `src/contexts/AuthContext.tsx` | Session, tier, reauth, deleteAccount, logout |
| `src/contexts/EncryptionContext.tsx` | Vault lock state, changePin, resetVault |
| `src/lib/db.ts` | UserProfile type and raw Firestore access |
| `src/lib/rotation.ts` | PIN rotation / crypto-shredding execution |
| `src/lib/deletion.ts` | Account annihilation execution |
| `src/lib/exporter.ts` / `importer.ts` | Export/import engines |
| `src/lib/messaging.ts` | FCM permission + token logic |
| `src/components/AppShell.tsx` | Sidebar nav + vault banners linking into Profile |
| `src/components/VaultGate.tsx` | Vault lock/unlock, PIN recovery wizard |
| `src/components/PremiumGate.tsx` | Tier gate wrapping PDF export |
| `src/App.tsx` | Router — single flat /profile route |

---

Lightweight review per your call — no spec file gate applied. Findings 1, 2, and 6 above are good candidates for a proper `docs/projects/XX_PROFILE_REVISION.md` spec if you want to act on them through the full planning protocol.
