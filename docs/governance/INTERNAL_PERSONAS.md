# 👥 Internal Stakeholder Personas

> [!NOTE]
> While user-facing personas (David, Ned, Walt, Lisa, Maya, Jordan) govern the **User Experience and copy**, internal stakeholder personas govern the **Code Architecture, Business Strategy, Marketing Funnels, and Support Operations** of My Recovery Toolkit (MRT).

---

## §1 Stakeholder Hierarchy & Roles

| Role | Persona | Key Code/Infrastructure Concern |
| :--- | :--- | :--- |
| **CEO / Product Owner** | Alex | Firestore read/write costs, HIPAA/legal compliance, App Store verification, business viability. |
| **Developer / AI Partner** | Dev / AI | TypeScript compile safety, linting (zero-warnings), Vitest coverage, CI/CD speed, modularity. |
| **Growth & Marketing** | Morgan | PostHog telemetry, SEO landing page indices, PWA install prompts, social sharing card formatting. |
| **Support & Moderation** | Taylor | Admin feedback dashboards, bug reporting databases, anti-predator reporting flows. |

---

## §2 The Personas

### 1. "Alex" (The CEO / Product Owner)
> *"We must build a highly scalable, compliant business that respects absolute privacy without draining our runway."*

* **System Archetype:** The Business Owner (Velocity & Viability)
* **Core Motivation:** Driving feature shipping speed, keeping operational costs low, and mitigating security/legal risks.
* **Environment:** Reviews reports on Firebase Console, Google Play Console, and Stripe Dashboard. Focuses on runway and regulatory boundaries.

#### 🎯 Core Objectives & Metrics
* **Cost Efficiency:** Keeps Firestore read/write counts optimized via smart client-side caching (TanStack Query) to prevent massive database bills.
* **Regulatory Compliance:** Ensures zero-knowledge encryption prevents MRT from ever holding unencrypted sensitive medical data (protecting against data subpoena/breach liability).
* **Store Verification:** Secures DUNS registration to unblock Play Store TWA compilation ([docs/projects/26_THE_BEACON.md](file:///workspaces/MRT2/docs/projects/26_THE_BEACON.md)).

#### ⚡ Codebase Constraints & Rules
* *Rule:* All new Firestore data queries must be analyzed for read-cost impact before execution. Use local caching as the default.
* *Rule:* Never add a database write containing sensitive information (journals, workbook responses, service notes) in plaintext.
* *Rule:* Secure compilation configurations (e.g. `assetlinks.json` for Android TWA verification) must be easily maintained in the root directory.

---

### 2. "Dev / AI Partner" (The Developer / AI Co-Pilot)
> *"Clean code, strict types, and robust unit tests are the only things standing between us and chaotic regressions."*

* **System Archetype:** The Builder (Structure & Stability)
* **Core Motivation:** Maintainable, readable code, zero build-step warnings, fast test runs, and easy onboarding for future engineers.
* **Environment:** VS Code, Git branches, terminal, Vitest watch runner, ESLint logs.

#### 🎯 Core Objectives & Metrics
* **Type Safety:** Maintains a strict zero-`any` compiler check (`noImplicitAny`).
* **Test Coverage:** Enforces regression tests on all cryptographic functions, data factories, and state hooks.
* **Modularity:** Prevents "God files" by splitting heavy pages into single-responsibility subcomponents ([docs/projects/60_GOD_FILE_DECOMPOSITION.md](file:///workspaces/MRT2/docs/projects/60_GOD_FILE_DECOMPOSITION.md)).

#### ⚡ Codebase Constraints & Rules
* *Rule:* `npm run lint` must return exactly `0` warnings and errors before pushing to any branch.
* *Rule:* Every new component, hook, or schema change must include a matching test file (e.g., `*.test.tsx`).
* *Rule:* Code edits must be surgical and targeted; never rewrite entire files when a small, precise replacement suffices.

---

### 3. "Morgan" (The Growth Hacker / Marketer)
> *"If users can't easily install the app or share their milestones, our organic growth loops will fail."*

* **System Archetype:** The Catalyst (Acquisition & Virality)
* **Core Motivation:** Optimizing the PWA onboarding funnel, increasing user referrals, and improving SEO ranking.
* **Environment:** PostHog telemetry dashboards, Google Search Console, App Store optimization (ASO) tools.

#### 🎯 Core Objectives & Metrics
* **PWA Onboarding:** Ensures frictionless PWA install prompts across iOS and Android browsers ([PWAInstallBanner.tsx](file:///workspaces/MRT2/src/components/PWAInstallBanner.tsx)).
* **Virality Loops:** Maximizes the aesthetic appeal of shared milestones (e.g. Sobriety Milestone PNG generation in `SobrietyHero.tsx`).
* **Conversion Analytics:** Tracks anonymous PostHog events for user flow bottlenecks (e.g., when users drop off during the vault setup).

#### ⚡ Codebase Constraints & Rules
* *Rule:* Shared milestone images must have clean rendering (hide UI buttons during snapshot export).
* *Rule:* SEO metadata, title headers, and semantic HTML structure must be maintained on the landing page and VitePress guide sites.
* *Rule:* PostHog telemetry must remain fully anonymized, never capturing plaintext journal words, email strings, or usernames.

---

### 4. "Taylor" (The Guardian / Support Lead)
> *"When a user encounters a bug or faces harassment, they need a safe, immediate way to report it and get help."*

* **System Archetype:** The Protector (Safety & Feedback)
* **Core Motivation:** Resolving user-reported issues quickly and protecting the community from anti-personas (e.g. 13th-steppers).
* **Environment:** Admin feedback viewer, client crash logs, support inbox.

#### 🎯 Core Objectives & Metrics
* **Frictionless Support:** Monitors the admin feedback interface to review user suggestions and bug reports ([FeedbackViewer.tsx](file:///workspaces/MRT2/src/components/admin/FeedbackViewer.tsx)).
* **Security Reporting:** Resolves reports of predatory behavior or abuse of peer-to-peer sponsee invitations.
* **Crash Resolution:** Scans the `client_errors` collection to prioritize fixes for crashes affecting vulnerable users in early recovery.

#### ⚡ Codebase Constraints & Rules
* *Rule:* All user feedback submissions must automatically attach diagnostic metadata (app version, OS, browser) to speed up troubleshooting.
* *Rule:* The reporting pathway for concerning connections must be easily reachable in two taps within the settings.
* *Rule:* Support tools must never grant admin access to see decrypted user data, maintaining the Zero-Knowledge database boundary at all costs.

---

*My Recovery Toolkit · docs/governance/INTERNAL_PERSONAS.md · v1.0 · July 2026*
