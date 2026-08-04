# Production Readiness Audit — Google Play Submission
**Repository:** `mrt2` (My Recovery Toolkit v1.4.0)  
**Audit Date:** July 28, 2026  
**Auditors:** Joint Audit (Principal Architect, Security Engineer, Mobile/Frontend Engineer, QA Lead, Accessibility Specialist, DevOps Engineer, Play Store Reviewer)

---

## Phase 1 — Project Understanding (Fast Pass)

### 1.1 Purpose & Target Users
**My Recovery Toolkit (MRT)** is a zero-knowledge, offline-first Progressive Web Application (PWA) tailored for 12-Step, SMART Recovery, CBT, and Buddhist-inspired recovery journeys.
The application serves six primary personas ([docs/PERSONAS.md](file:///workspaces/MRT2/docs/PERSONAS.md)):
1. **David** (High anxiety / acute crisis, Days 1–30): Needs crisis-first 1-tap grounding, minimal cognitive load, zero-delay tool access.
2. **Ned** (Early sobriety, Days 30–90): Driven by gamification, streak badges, and milestone tracking (Pink Cloud phase).
3. **Lisa** (Sponsor / AA): Manages sponsees while requiring total anonymity compliance.
4. **Walt** (Long-term recovery, 35+ years): Deep reflection, auditable AI, full data export sovereignty, zero forced gamification.
5. **Maya** (Systematiser, 6–18 months): Linear workbook progression and completion tracking.
6. **Jordan** (MAT Stabiliser, Day 1–12mo+): Requires discreet, non-judgmental custom tracking.

### 1.2 Core Workflows
- **Client-Side AES-GCM Encrypted Vault:** AES-256-GCM encryption ([src/lib/crypto.ts](file:///workspaces/MRT2/src/lib/crypto.ts#L17-L108)) using PBKDF2 key derivation (100,000 iterations) combined with a server-gated rate-limited pepper (`verifyVaultPin` Cloud Function, PROJ-65). Encrypts recovery journals, workbook answers, CBT tool entries, and game reflections before any Firestore transmission.
- **Smart Tools & CBT Suite:** Urge Surfer, Resentment Burner, CBA (Cost-Benefit Analysis), ABC Model, DENTS, Personification, Lifestyle Balance, Thought Records, 5 Questions, Morning Intent ([src/App.tsx#L129-L182](file:///workspaces/MRT2/src/App.tsx#L129-L182)).
- **Recovery Games Hub:** Craving Buster, Fast Lane, Goal Ladder, Thought Challenge, Trigger Match, Recovery Jeopardy, Daily Crossword ([src/App.tsx#L184-L228](file:///workspaces/MRT2/src/App.tsx#L184-L228)).
- **Daily Readings & Beacon Push Notifications:** Nightly automated AI generation of daily recovery readings across 5 modalities via Gemini 2.5 Cloud Functions ([functions/src/index.ts](file:///workspaces/MRT2/functions/src/index.ts#L1-L35)).

### 1.3 Architecture & Security Model Summary
- **Frontend Stack:** React 19.2 + Vite 7.2 + TypeScript 5.9 + Tailwind CSS 3.4 + TanStack Query 5.66 + React Router 7.1.
- **Backend Stack:** Firebase Auth, Cloud Firestore, Firebase Hosting, Cloud Functions v2 (Node 20).
- **Security Boundary:** Zero-knowledge client-side encryption. Server stores `IV:Ciphertext` base64 blobs for sensitive collections (`journals`, `workbook_answers`, `service`, `game_saves`). The server never holds unencrypted recovery text.
- **Claimed vs. Verified Features:**
    - *Claimed:* Account deletion web link for Google Play Data Safety compliance → **VERIFIED** ([src/pages/DeleteAccount.tsx](file:///workspaces/MRT2/src/pages/DeleteAccount.tsx#L1-L199) and [src/lib/deletion.ts](file:///workspaces/MRT2/src/lib/deletion.ts#L1-L72)).
    - *Claimed:* Offline-first mutation capability → **VERIFIED** (TanStack Query + IndexedDB offline caching).
    - *Claimed:* Hardened Vault PIN verification → **VERIFIED** (`verifyVaultPin` Cloud Function rate limiting, [functions/src/index.ts#L44-L49](file:///workspaces/MRT2/functions/src/index.ts#L44-L49)).

---

## Phase 2 — Architecture & Code Quality

### 2.1 Code Quality Metrics & Command Outputs
The automated QA pipeline (`npm run check`) was executed against the repository:
- **ESLint (`npm run lint`):** `0` errors, `0` warnings (configured with `--max-warnings 0`).
- **TypeScript Check (`tsc -b`):** Clean pass, no type compilation errors.
- **Spec Quality Audit (`npm run docs:check-specs`):** `0` spec structural defects.
- **Unit & Integration Tests (`npm run test:once`):** `98` test files passed, `662` individual tests passed (`100%` pass rate).
- **Production Bundle Build (`npm run build`):** Built in 39.41s. Generated 93 PWA precache entries (19.3 MB total uncompressed).

#### Bundle Size Outliers (Vite Output)

| Chunk Name | Raw Size | Gzip Size | Architectural Assessment |
| --- | --- | --- | --- |
| `vendor-D8WcDrwO.js` | **1,832.50 kB** | **569.43 kB** | **CRITICAL BLOAT:** Exceeds 1MB limit. Combines React, Firebase SDK, TanStack Query, Lucide icons in one monolithic chunk. |
| `firebase-b_evVlma.js` | 448.61 kB | 136.91 kB | Expected size for full Firebase Auth + Firestore + Storage client libraries. |
| `index-B1kcZxtG.js` | 433.78 kB | 123.87 kB | Main entry bundle containing shared contexts and core UI. |
| `recharts-DxocS2t0.js` | 292.84 kB | 73.88 kB | Successfully code-split visualization library for `InsightsLog` / `AdminDashboard`. |

### 2.2 Strictness & Code Quality Scan
- **Explicit `any` types:** `3` instances found across codebase:
  1. [src/lib/rotation.ts:478](file:///workspaces/MRT2/src/lib/rotation.ts#L478) (Comment explanation referring to key state).
  2. [src/lib/games/types.ts:4](file:///workspaces/MRT2/src/lib/games/types.ts#L4) (Documentation comment).
  3. [src/lib/games/types.ts:5](file:///workspaces/MRT2/src/lib/games/types.ts#L5) (Documentation comment).
    - *Assessment:* 0 functional `any` types in code execution paths!
- **`eslint-disable` annotations:** `8` explicit overrides (e.g., [src/contexts/AuthContext.tsx:26](file:///workspaces/MRT2/src/contexts/AuthContext.tsx#L26) for custom hook exports).
- **`TODO` / `FIXME` comments:** `0` instances across `src/` and `functions/src/`.
- **`console.log` statements:** `9` active statements found in `src/` (e.g., [src/components/journal/TemplateEditor.tsx:35](file:///workspaces/MRT2/src/components/journal/TemplateEditor.tsx#L35), [src/components/AppShell.tsx:58](file:///workspaces/MRT2/src/components/AppShell.tsx#L58)). Must be stripped in production builds.

### 2.3 Key Architectural Findings

#### Confirmed Issues
1. **Monolithic Vendor Chunk (1.83 MB):** [vite.config.ts](file:///workspaces/MRT2/vite.config.ts#L6-L85) does not define dynamic `manualChunks` splitting for `@heroicons/react`, `lucide-react`, or `firebase`. On initial app load on mobile 3G/4G networks, users will experience a multi-second render delay.
2. **`console.log` Pollution in Production Code:** Non-debug logs left in production build paths ([src/components/AppShell.tsx:58](file:///workspaces/MRT2/src/components/AppShell.tsx#L58), [src/components/journal/TemplateEditor.tsx:35](file:///workspaces/MRT2/src/components/journal/TemplateEditor.tsx#L35)).

#### Recommended Improvements
1. **Virtualization on Long Scroll Lists:** `InsightsLog.tsx` and `JournalHistory.tsx` handle arrays of history entries. While `react-virtuoso` is included in [package.json:44](file:///workspaces/MRT2/package.json#L44), several list components still render standard `.map()` arrays without windowing, posing potential DOM lag for users with 500+ journal entries (**Walt** persona).
2. **React Query Garbage Collection Tuning:** Global stale time is set to 5 minutes ([src/App.tsx:53](file:///workspaces/MRT2/src/App.tsx#L53)), which is appropriate for low-churn recovery data, but cache garbage collection parameters (`gcTime`) are unset.

---

## Phase 3 — Security Audit

### 3.1 Critical Vulnerability Findings

#### [CRITICAL] Finding SEC-01: Client-Side `mockUser` URL Parameter Auth Bypass Reachable in Bundle
- **Location:** [src/contexts/AuthContext.tsx#L38-L70](file:///workspaces/MRT2/src/contexts/AuthContext.tsx#L38-L70)
- **Code Reference:**
  ```typescript
  // Check query params for mockUser bypass
  const params = new URLSearchParams(window.location.search);
  const mockParam = params.get('mockUser');
  if (mockParam) {
    localStorage.setItem('mrt_mock_user', mockParam.toLowerCase());
  }

  const mockUserKey = localStorage.getItem('mrt_mock_user');
  if (mockUserKey) {
    // Generates mock user object & sets isAdmin = (mockUserKey === 'admin')
  ```
- **Impact:** Anyone visiting `https://<app-domain>/?mockUser=admin` can bypass client-side authentication completely, populate `AuthContext` with a fake admin user, and gain full access to client-side admin routes ([src/App.tsx:253](file:///workspaces/MRT2/src/App.tsx#L253)). While Firestore Security Rules block unauthenticated *database* writes, the client UI, admin tools, deduplication interfaces, and cached local state are exposed to arbitrary visitors without Firebase credentials!
- **Fix Required:** Wrap the `mockUser` check strictly in `if (import.meta.env.DEV)` or strip it completely prior to release.

#### [HIGH] Finding SEC-02: 49 Dependency Vulnerabilities in Root Package (34 High, 14 Moderate)
- **Location:** [package.json](file:///workspaces/MRT2/package.json) / [package-lock.json](file:///workspaces/MRT2/package-lock.json)
- **Evidence:** `npm audit` output: `{ low: 1, moderate: 14, high: 34, critical: 0, total: 49 }`.
- **Primary Attack Vectors:**
    - High severity vulnerabilities in dev toolchain / build dependencies (`vitepress`, `rollup`, `jsdom`).
- **Fix Required:** Run `npm audit fix` and manually bump nested vulnerable dependencies.

### 3.2 Security Surface Analysis

| Security Vector | Assessment | Evidence / Verification |
| --- | --- | --- |
| **Zero-Knowledge Encryption** | 🟢 **PASS** | AES-256-GCM + PBKDF2 (100k) + Server Pepper. Decryption performed strictly at UI render boundary ([src/lib/crypto.ts#L128-L218](file:///workspaces/MRT2/src/lib/crypto.ts#L128-L218)). |
| **Firestore Security Rules** | 🟢 **PASS** | `isOwner(userId)` enforced for profiles and subcollections. Subscriptions/Payments write disabled for clients ([firestore.rules#L77-L84](file:///workspaces/MRT2/firestore.rules#L77-L84)). Role & Tier modification blocked ([firestore.rules#L52-L55](file:///workspaces/MRT2/firestore.rules#L52-L55)). |
| **Hardcoded Secrets / API Keys** | 🟢 **PASS** | Zero hardcoded private keys. Gemini API Key & Vault Pepper managed via Firebase `defineSecret` ([functions/src/index.ts#L36-L37](file:///workspaces/MRT2/functions/src/index.ts#L36-L37)). |
| **Unguarded `/admin` Route** | 🔴 **FAIL** | Protected by `PrivateRoute` and `isAdmin` state, BUT `isAdmin` can be spoofed via `mockUser=admin` URL parameter in production (SEC-01). |
| **Account Deletion Flow** | 🟢 **PASS** | Dedicated unauthenticated public web route `/delete-account` ([src/pages/DeleteAccount.tsx](file:///workspaces/MRT2/src/pages/DeleteAccount.tsx)) invokes batch shredder ([src/lib/deletion.ts](file:///workspaces/MRT2/src/lib/deletion.ts)). Complies with Play Store policy. |

---

## Phase 4 — Play Store Compliance & UX/Accessibility

### 4.1 Play Store Policy Compliance Audit

#### 1. Data Safety & Privacy Policy
- **Requirement:** Google Play requires a prominent Privacy Policy URL and an in-depth Data Safety declaration.
- **Status:** **COMPLIANT.**
    - Privacy policy link and account deletion details hosted on public route `/delete-account` ([src/pages/DeleteAccount.tsx](file:///workspaces/MRT2/src/pages/DeleteAccount.tsx)) and `/links` ([src/pages/Links.tsx](file:///workspaces/MRT2/src/pages/Links.tsx)).
    - Account shredder purges all root collections (`journals`, `tasks`, `insights`, `ai_logs`, `feedback`, `game_progress`, `game_saves`) and user subcollections (`workbook_answers`, `templates`, `users/{uid}`) in 450-doc chunks before calling `firebase.auth().delete()`.

#### 2. Health & Medical Content Review
- **Requirement:** Google Play policy on Health Apps requires clear disclaimers that the app does not provide medical advice or replace professional treatment.
- **Status:** **ACTIONABLE FINDING (PL-01).**
    - App contains disclaimers in `Welcome.tsx` and CBT tools, but needs a permanent medical disclaimer footer on `/login` and `/welcome` stating: *"My Recovery Toolkit is a self-help peer support tool and is not a medical device, diagnostic tool, or replacement for professional clinical addiction treatment."*

#### 3. PWA Web Manifest & Android TWA Container
- **Manifest File:** Integrated via `vite-plugin-pwa` in [vite.config.ts#L12-L42](file:///workspaces/MRT2/vite.config.ts#L12-L42).
- **Package ID:** `ca.myrecoverytoolkit.app`
- **Icons Configured:** `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` (All verified present in `public/`).

### 4.2 Accessibility & UX Audit (WCAG 2.2 AA)

#### Confirmed Blockers & Issues
1. **Interactive Elements Without Accessible Labels:** Multiple custom game buttons in `CravingBuster.tsx` and `FastLane.tsx` use icon-only controls without `aria-label` or screen-reader visible text.
2. **Div-as-Button Anti-Pattern:** Found `onClick` handlers on `<div>` elements without `role="button"`, `tabIndex={0}`, or keyboard `onKeyDown` handlers in legacy workbook list items.
3. **Contrast Compliance:** High-vibrancy theme tokens in [src/lib/theme.ts](file:///workspaces/MRT2/src/lib/theme.ts) (e.g., `bg-cyan-200` page backgrounds with light gray muted text) must be audited for 4.5:1 contrast ratio under direct sunlight (**David** persona accessibility requirement).

---

## Phase 5 — Firebase, Testing, DevOps, Dependencies

### 5.1 Firebase Security & Infrastructure Quality
- **Firestore Rules:** Production-grade security rules ([firestore.rules](file:///workspaces/MRT2/firestore.rules)) with schema validation, owner isolation, and strict server-only write protections for billing tiers and admin roles.
- **Firestore Indexes:** Configured in [firestore.indexes.json](file:///workspaces/MRT2/firestore.indexes.json) for complex queries (`journals` sorted by `createdAt`, `ai_logs` sorted by `timestamp`).
- **Cloud Functions:** Standard v2 Cloud Functions initialized in `functions/src/index.ts` with secret manager bindings (`GEMINI_API_KEY`, `VAULT_PEPPER`). Rate-limiting implemented for vault PIN verification.

### 5.2 Test Suite & QA Pipeline Coverage
- **Runner:** Vitest 4.0 + React Testing Library.
- **Unit/Integration Test Summary:**
    - **98 Test Files**
    - **662 Tests Passing** (100% success rate)
    - Execution time: ~3.4 minutes full run.
- **End-to-End Testing:** Playwright configured in [playwright.config.ts](file:///workspaces/MRT2/playwright.config.ts) and `e2e/` test suite with Firebase Emulators.
- **Missing High-Value Test Coverage:**
    - Need explicit automated integration test asserting that `?mockUser=admin` is rejected in non-development environments.

### 5.3 CI/CD & Build Pipeline
- **GitHub Actions:** Workflows defined in `.github/workflows/` with automated linting, spec validation, unit tests, and Firebase Hosting deployment based on target branch (`feature/*` → DEV, `release/*` → UAT, `main` → PROD).
- **Environment Separation:** Strict separation between `mrt2-app-dev` and `mrt2-app-prod`.

---

## Phase 6 — Risk Register, Scores, and Verdict

### 6.1 Risk Register

| ID | Title | Severity | Impact | Likelihood | Recommendation | Est. Effort |
| --- | --- | --- | --- | --- | --- | --- |
| **SEC-01** | `mockUser` Auth Bypass in Prod | **Critical** | High | High | Strip `mockUser` handling in non-dev builds in `AuthContext.tsx`. | 30 mins |
| **SEC-02** | 49 Root Package Vulnerabilities | **High** | Medium | Medium | Run `npm audit fix` & update vulnerable dev tool dependencies. | 1 hr |
| **PERF-01** | 1.83 MB Monolithic Vendor Bundle | **High** | High | High | Configure `manualChunks` in `vite.config.ts` for React & Firebase. | 1 hr |
| **UX-01** | Missing ARIA Labels on Game Controls | **Medium** | Low | High | Add explicit `aria-label` tags to icon-only game controls. | 2 hrs |
| **PL-01** | Missing Explicit Medical Disclaimer | **Medium** | Medium | Medium | Add standard medical disclaimer text on login/welcome pages. | 30 mins |
| **CODE-01** | `console.log` Output in Production | **Low** | Low | High | Configure Babel/Vite drop `console.log` or strip active logs. | 30 mins |

### 6.2 Category Scoring

- **Architecture (92/100):** Exceptional modular structure, spec-driven domain separation, clean custom hooks pattern, and TanStack Query abstraction. Deducted 8 points for unconfigured vendor bundle splitting.
- **Security (78/100):** World-class ZK AES-GCM client-side encryption and Firestore security rules. Deducted 22 points due to the `mockUser` auth bypass parameter remaining active in production builds.
- **Performance (82/100):** Fast React 19 execution, code-split lazy routes, and pre-cached PWA assets. Deducted 18 points for 1.83 MB initial vendor chunk bloat.
- **UX (90/100):** Tailored persona-driven design system (Vibrant Momentum), clear error boundaries, and crisis-first flows for David persona.
- **Accessibility (84/100):** Solid semantic structure and focus management. Deducted 16 points for missing ARIA labels in game controls and div-button instances.
- **Testing (95/100):** Outstanding unit & integration coverage (98 test files, 662 passing tests) plus Playwright E2E integration with emulators.
- **Maintainability (96/100):** Zero `TODO`/`FIXME` comments, zero functional `any` types, strict spec quality automated enforcement.
- **Play Store Compliance (88/100):** Comprehensive account deletion flow and privacy policy. Deducted 12 points for missing explicit medical disclaimer footer.
- **Operational Readiness (92/100):** Full automated CI/CD pipeline, multi-environment setup, error reporting, and Firebase infrastructure.
- **Technical Debt (94/100):** Clean codebase with strict bi-weekly governance protocols and active debt ledger tracking.

```text
       Architecture: [████████████████████░░] 92/100
           Security: [███████████████░░░░░░░] 78/100
        Performance: [████████████████░░░░░░] 82/100
                 UX: [██████████████████░░░░] 90/100
      Accessibility: [████████████████░░░░░░] 84/100
            Testing: [███████████████████░░░] 95/100
    Maintainability: [███████████████████░░░] 96/100
Play Store Complian: [█████████████████░░░░░] 88/100
 Operational Readin: [███████████████████░░░] 92/100
     Technical Debt: [████████████████████░░] 94/100
---------------------------------------------------
      OVERALL SCORE: [██████████████████░░░░] 89/100
```

---

### 6.3 Strategic Release Roadmap

#### 🔴 Critical Before Release (Blockers)
1. **Fix `mockUser` Bypass (SEC-01):** Restrict `mockUser` URL query parameter parsing in [src/contexts/AuthContext.tsx](file:///workspaces/MRT2/src/contexts/AuthContext.tsx#L38-L44) exclusively to `import.meta.env.DEV`.
2. **Optimize Vendor Chunking (PERF-01):** Configure `build.rollupOptions.output.manualChunks` in [vite.config.ts](file:///workspaces/MRT2/vite.config.ts) to break down `vendor-D8WcDrwO.js` (1.83 MB).

#### 🟡 Should Fix Before Release
1. **Medical Disclaimer Footer (PL-01):** Insert health app peer-support disclaimer on `/login` and `/welcome`.
2. **Strip Production Log Statements (CODE-01):** Remove active `console.log` calls in `TemplateEditor.tsx` and `AppShell.tsx`.
3. **Dependency Patching (SEC-02):** Run `npm audit fix` to clean moderate/high dev tool vulnerabilities.

#### 🟢 Can Ship With Mitigation / Future Improvements
1. **Game Hub Accessibility (UX-01):** Add screen-reader labels to game control buttons.
2. **Virtualize Deep History Lists:** Implement `react-virtuoso` on journal history lists with 500+ items.

---

### 6.4 Final Verdict

### 🟡 Ready with Minor Fixes

**Justification:**  
The repository demonstrates production-grade code quality, comprehensive zero-knowledge encryption, and exceptional test coverage (662 passing tests). However, Google Play submission cannot proceed until **Finding SEC-01** (the client-side `mockUser` parameter auth bypass reachable in production builds) and **Finding PERF-01** (the 1.83 MB monolithic vendor JavaScript chunk) are remediated. Once these two items are addressed, the application is fully ready for Play Store release.

---

## Top 25 Ranked Actions

| Rank | Priority | Action Item | File Reference | Rationale |
| --- | --- | --- | --- | --- |
| 1 | **Critical** | Guard `mockUser` URL param behind `import.meta.env.DEV` | [src/contexts/AuthContext.tsx:38](file:///workspaces/MRT2/src/contexts/AuthContext.tsx#L38) | Prevents arbitrary URL auth bypass in production builds. |
| 2 | **Critical** | Configure `manualChunks` for vendor libraries in Vite | [vite.config.ts:80](file:///workspaces/MRT2/vite.config.ts#L80) | Splits 1.83 MB bundle into manageable chunks for mobile loading. |
| 3 | **Should Fix** | Add explicit medical disclaimer footer on sign-in pages | [src/pages/Welcome.tsx:1](file:///workspaces/MRT2/src/pages/Welcome.tsx) | Ensures compliance with Google Play Health App policies. |
| 4 | **Should Fix** | Strip `console.log` statements from production build | [src/components/AppShell.tsx:58](file:///workspaces/MRT2/src/components/AppShell.tsx#L58) | Prevents log clutter in user browser consoles. |
| 5 | **Should Fix** | Execute `npm audit fix` for root package vulnerabilities | [package.json:1](file:///workspaces/MRT2/package.json) | Resolves 49 reported dependency security CVEs. |
| 6 | **Should Fix** | Add `aria-label` attributes to icon-only game controls | [src/components/games/CravingBuster.tsx:1](file:///workspaces/MRT2/src/components/games/CravingBuster.tsx) | Meets WCAG 2.2 AA accessibility standards. |
| 7 | **Nice to Have** | Virtualize journal history lists with `react-virtuoso` | [src/components/journal/JournalHistory.tsx:1](file:///workspaces/MRT2/src/components/journal/JournalHistory.tsx) | Prevents DOM lag for users with hundreds of entries. |
| 8 | **Nice to Have** | Set explicit `gcTime` for TanStack Query client | [src/App.tsx:53](file:///workspaces/MRT2/src/App.tsx#L53) | Optimizes memory usage for long-running sessions. |
| 9 | **Nice to Have** | Audit color contrast ratios for `bg-cyan-200` themes | [src/lib/theme.ts:17](file:///workspaces/MRT2/src/lib/theme.ts#L17) | Ensures legibility under bright outdoor light conditions. |
| 10 | **Nice to Have** | Add E2E test verifying `mockUser` rejection in prod | [e2e/auth.spec.ts:1](file:///workspaces/MRT2/e2e) | Prevents regression of auth bypass fix. |
| 11 | **Future** | Tune PWA service worker precache route strategies | [vite.config.ts:43](file:///workspaces/MRT2/vite.config.ts#L43) | Further optimizes cold offline load speeds. |
| 12 | **Future** | Add automated accessibility check to CI pipeline | [.github/workflows/deploy.yml:1](file:///workspaces/MRT2/.github/workflows) | Catches missing ARIA tags on PR review. |
| 13 | **Future** | Audit Firestore read operations for `DailyReadings` | [functions/src/index.ts:20](file:///workspaces/MRT2/functions/src/index.ts#L20) | Optimizes document read costs at scale. |
| 14 | **Future** | Add responsive tablet layout tweaks for Games Hub | [src/pages/GamesHub.tsx:1](file:///workspaces/MRT2/src/pages/GamesHub.tsx) | Improves landscape presentation on Android tablets. |
| 15 | **Future** | Add haptic feedback toggle in user settings | [src/pages/Profile.tsx:1](file:///workspaces/MRT2/src/pages/Profile.tsx) | Allows users to customize sensory feedback preferences. |
| 16 | **Future** | Extend automated backup verification tests | [src/components/AppShell.tsx:58](file:///workspaces/MRT2/src/components/AppShell.tsx#L58) | Validates offline storage persistence integrity. |
| 17 | **Future** | Refine error fallback UI on network timeout | [src/components/ErrorBoundary.tsx:1](file:///workspaces/MRT2/src/components/ErrorBoundary.tsx) | Provides clearer guidance during transient offline state. |
| 18 | **Future** | Add explicit keyboard shortcuts for CBT tools | [src/components/smart_tools/CBATool.tsx:1](file:///workspaces/MRT2/src/components/smart_tools/CBATool.tsx) | Enhances desktop power user navigation. |
| 19 | **Future** | Review Firestore indexes for `rosc_assessments` | [firestore.indexes.json:1](file:///workspaces/MRT2/firestore.indexes.json) | Ensures fast retrieval as assessment volume grows. |
| 20 | **Future** | Add dark mode contrast overrides for game canvas | [src/components/games/fastLane/FastLane.tsx:1](file:///workspaces/MRT2/src/components/games/fastLane) | Ensures comfortable night viewing for craving tools. |
| 21 | **Future** | Optimize SVG asset size in `public/` directory | [public/Logo.png:1](file:///workspaces/MRT2/public/Logo.png) | Reduces initial download payload size. |
| 22 | **Future** | Standardize toast duration timing across sonner | [src/App.tsx:78](file:///workspaces/MRT2/src/App.tsx#L78) | Provides consistent feedback visibility time. |
| 23 | **Future** | Add CSP headers configuration to Firebase Hosting | [firebase.json:1](file:///workspaces/MRT2/firebase.json) | Strengthens browser defense against XSS vectors. |
| 24 | **Future** | Review memory usage of cached decrypted entries | [src/contexts/EncryptionContext.tsx:1](file:///workspaces/MRT2/src/contexts/EncryptionContext.tsx) | Prevents heap retention on multi-hour sessions. |
| 25 | **Future** | Conduct bi-weekly maintenance protocol review | [docs/governance/DEVELOPER_GUIDE.md:1](file:///workspaces/MRT2/docs/governance/DEVELOPER_GUIDE.md) | Maintains codebase health over time. |
