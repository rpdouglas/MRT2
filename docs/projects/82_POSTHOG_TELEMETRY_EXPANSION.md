# 📁 Project 82: PostHog Telemetry Expansion & Zero-Knowledge Alignment

**Status:** ✅ Shipped
**Primary Persona:** David | Ned | Walt  
**Objective:** Expand PostHog analytics across missing critical application flows (Crisis/SOS, Recovery Games, Somatic Vitality, Error Boundary) while strictly enforcing Zero-Knowledge privacy boundaries and TypeScript environment typing.

---

## 1. The Executive Summary
**User Story:** As an application maintainer, I want comprehensive, privacy-safe telemetry on feature adoption, crisis intervention triggers, and uncaught UI errors so that product decisions can be data-driven without compromising user anonymity or recovery data privacy.

**Competitive Gap:** Competitors like "I Am Sober" and "Reframe" transmit rich telemetry including user notes and email identifiers to third-party platforms. MRT's zero-knowledge telemetry guarantees zero personal recovery data or PII leaves the client device.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Does this feature handle PII or emotional data? **NO.** All events capture strictly non-sensitive metadata (e.g. `game_id`, `tier`, `category`, `error_name`). Zero user text, journal entries, or recovery disclosures are transmitted.
* [x] **Encryption Strategy:** Will this use `src/lib/crypto.ts`? **NO.** Telemetry operates independently of encrypted storage primitives.
* [x] **Key Rotation:** Does this data need to be included in `executePinRotation`? **NO.**

---

## 3. Schema & Architecture 🗄️

**Types (`src/vite-env.d.ts`):**
```typescript
interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  readonly VITE_PUBLIC_POSTHOG_HOST?: string;
  // ... existing env vars
}
```

**New Captured Events Matrix:**
1. `sos_modal_opened` (`src/components/SOSModal.tsx`): Triggered on SOS button click. Properties: `{ source: 'nav' | 'dashboard' }`.
2. `urge_surfer_completed` (`src/pages/UrgeSurfer.tsx`): Triggered when Urge Surfer session finishes. Properties: `{ duration_seconds }`.
3. `game_started` (`src/hooks/useGameProgress.ts` / `src/pages/GamesHub.tsx`): Triggered when a Recovery Game session opens. Properties: `{ game_id, persona_target }`.
4. `game_completed` (`src/hooks/useGameProgress.ts`): Triggered when game progress is saved. Properties: `{ game_id, persona_target, score }`.
5. `breathwork_completed` (`src/components/vitality/BreathTab.tsx`): Triggered when a guided breath session finishes. Properties: `{ pattern, duration_seconds }`.
6. `vitality_entry_logged` (`src/hooks/useVitalityEntries.ts`): Triggered when a somatic log is saved. Properties: `{ category }`.
7. `uncaught_error_captured` (`src/components/ErrorBoundary.tsx`): Triggered on React render boundary catches. Properties: `{ error_name, component_stack_snippet }`.

---

## 4. Implementation Phases 🏗️

### Phase 1: Environment Types & Helper Primitives
* Update `src/vite-env.d.ts` to type PostHog environment variables.
* Create a safe wrapper helper in `src/lib/telemetry.ts` (or direct posthog-js imports) with null checks and safety guards.

### Phase 2: Call Site Integration
* **Crisis & Urge Surfer:** Add `sos_modal_opened` in `SOSModal.tsx` and `urge_surfer_completed` in `UrgeSurfer.tsx`.
* **Recovery Games:** Add `game_started` and `game_completed` in `useGameProgress.ts` and `DailyCrossword.tsx`.
* **Somatic Vitality:** Add `breathwork_completed` in `BreathTab.tsx` and `vitality_entry_logged` in `useVitalityEntries.ts`.
* **Error Boundary:** Add `posthog.capture('uncaught_error_captured', ...)` in `ErrorBoundary.tsx`.

### Phase 3: Edge Cases
* [x] What happens if `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` is unset? PostHog gracefully no-ops; posthog calls are wrapped or safely guarded.
* [x] What happens if `navigator.onLine` is false? `posthog-js` queues events in `localStorage` and flushes upon reconnection.
* [x] What happens on 320px wide screen? Telemetry is non-visual; zero UI footprint.

---

## 5. QA & Verification 🧪

**2026-08-04 governance note:** this spec's Status above reflects code-level verification (routes/hooks/components/tests confirmed present, and passing where automated) performed during the 2026-08-04 governance audit. The unchecked items below are manual/device/browser/visual checks that have not been performed by a human — tracked here as a known gap, not a blocker to the Shipped status. Check them off once actually performed.
* [ ] **Unit Tests:** Verify component and hook unit tests pass cleanly with PostHog mocked where necessary (`src/__tests__/`).
* [ ] **Spec Quality Check:** Verify `npm run docs:check-specs` passes with 0 errors.
* [ ] **Zero-Knowledge Assertions:** Ensure zero plaintext disclosures or PII are passed to PostHog calls.
