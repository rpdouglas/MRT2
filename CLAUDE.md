# MRT — My Recovery Toolkit

Zero-knowledge, offline-first PWA for 12-Step and Buddhist-inspired recovery. All sensitive user data is encrypted client-side with AES-GCM before Firestore storage — the server never sees unencrypted content.

---

## Commands

```bash
npm run dev          # Vite dev server (port 5175)
npm run build        # TypeScript check + Vite build → dist/
npm run lint         # ESLint — zero warnings allowed
npm run lint:fix     # Auto-fix lint issues
npm run check        # Full QA pipeline: lint + spec-quality + test + build
npm run docs:check-specs  # Validate docs/projects/*.md against 00_TEMPLATE.md's required sections
npm run test         # Vitest watch mode
npm run test:once    # Single run (CI)
npx vitest run src/__tests__/someFile.test.ts  # Single test file
```

> Cloud Functions (run from `functions/` directory):
> `npm run build` · `npm run serve` (emulator) · `npm run deploy`

---

## Stack

- **React 19 + Vite 7 + TypeScript 5.9**
- **Tailwind CSS 3.4** — utility classes only; no tailwind.config.js changes without approval
- **TanStack Query 5** — ALL Firestore reads/writes go through useQuery/useMutation; no direct Firestore calls
- **React Router 7** — SPA routing
- **Firebase 12** — Auth, Firestore, Hosting, Cloud Functions
- **Gemini 2.5** — AI analysis via `src/lib/gemini.ts`
- **Vitest 4 + React Testing Library** — testing

---

## Key Directories

```
src/
  lib/          # crypto.ts, db.ts, firebase.ts, gamification.ts
  contexts/     # AuthContext, EncryptionContext, LayoutContext
  hooks/        # useTaskOperations, useJournalOperations, etc.
  components/   # UI components by domain
  pages/        # Route-level components (lazy-loaded heavy routes)
  data/         # Static: workbooks, journal templates, slogans
  __tests__/    # Unit tests
functions/      # Firebase Cloud Functions (The Beacon — daily cron)
docs/specs/     # Feature specs — READ BEFORE implementing anything new
```

---

## Zero-Knowledge Encryption Boundary — NEVER VIOLATE

**Key derivation:** 4-digit PIN + 16-byte salt → PBKDF2 (100k iterations, `deriveLocalBits`) combined via `HMAC-SHA256` with a rate-limited server pepper (`verifyVaultPin` Cloud Function, PROJ-65) → 256-bit AES-GCM key. New vaults and any account that has rotated its PIN since PROJ-65 use this peppered scheme (`usesPepperV2: true`); accounts that haven't rotated their PIN yet still use the direct PBKDF2-only derivation until they do — see `docs/projects/65_VAULT_KEY_HARDENING.md`.  
**Storage format:** `IV:Ciphertext` (base64) in Firestore  
**Session:** PIN cached in `sessionStorage` only — cleared on tab close. The server pepper response is cached alongside it (`mrt_vault_pepper`), same lifetime, so only the first unlock of a session needs network.  
**Boundary rule:** Decrypt only at UI render time — never in global state, logs, or persisted server-side in plaintext.

| Collection | Encrypted? | Notes |
|---|---|---|
| `users/{uid}` | ❌ No | Profile metadata only. Includes `fcmTokens`, `fcmSwVersion`, `timezone`, `pushNotificationsEnabled` (push device/preference metadata, PROJ-26) and `anchorSettings` (dashboard badge preferences, PROJ-41) — none of it recovery content, so it's correctly unencrypted |
| `journals/{id}` | ✅ Yes (content) | mood/tags/timestamps are plaintext |
| `workbook_answers/{id}` | ✅ Yes | |
| `service/{id}` | ✅ Yes | Sponsee notes |
| `tasks/{id}` | ❌ No | Needed for streak evaluation |
| `insights/{id}` | ❌ No | |
| `rosc_assessments/{id}` | ✅ Partial | `scores.*score`, `totalScore`, `trajectory`, `journalEntriesAnalysed` are plaintext; `encryptedAIContext` is AES-GCM |
| `users/{uid}/templates/{id}` | ❌ No | User-authored journal template scaffolding (name/content/tags) — structural prompt text, not personal disclosure. Flagged during PROJ-59 as a pre-existing gap in this table, not a new decision; revisit if custom templates start carrying more personal content than prompt structure. |
| `game_progress/{id}` | ✅ Partial | PROJ-72 (Recovery Games). `encryptedStats`/`encryptedReflection` are AES-GCM; `score`, `gameId`, `personaTarget`, `createdAt` are plaintext (same partial-encryption precedent as `rosc_assessments`, so streak/XP math never needs a decrypt). Included in `executePinRotation`/`executeCryptoShredding`. |
| `game_saves/{id}` | ✅ Yes (fully) | PROJ-72 Phase 4. A resumable, continuously-updated save-slot for multi-session games (e.g. Fast Lane) — one doc per `(uid, gameId)`, doc ID `${uid}_${gameId}`, upserted via `setDoc`. Distinct from `game_progress`'s append-only completed-play log: this is live in-progress state, so the whole blob is encrypted (no plaintext fields needed for streak/XP math). Included in `executePinRotation`/`executeCryptoShredding`. |
| `crossword_puzzles/{date}` | ❌ No | PROJ-79 (Daily Crossword, Recovery Games #8). Nightly-generated, server-write-only editorial content — theme, words/clues, grid layout, insight card — identical for every user on a given date. No user data of any kind, so nothing to encrypt (unlike every other Recovery Games collection); same read-any-authenticated/write-admin-only shape as `daily_readings`. Solve completions persist to `game_progress` as normal (`gameId: 'daily-crossword'`), partially-encrypted per that row above, but are explicitly excluded from XP (`AchievementsTab.tsx` filters them out of `gameProgressCount`) — the source spec frames the puzzle as reward-free by design. |

**Before ANY Firestore write:** confirm user-generated content passes through `encryptData()` in `src/lib/crypto.ts`.  
**Never:** log decrypted data, store plaintext sensitive content server-side, or send decrypted content to Gemini **outside the nine approved AI-analysis flows below**.

**Approved Gemini exception — decrypted journal/workbook content, scoped to exactly these nine flows:**
`useDeepPatternAnalysis.ts`, `useROSCAssessments.ts` (→ `generateROSCAnalysis`), `JournalAnalysisWizard.tsx` (→ `generateComparativeAnalysis`), `WorkbookDetail.tsx` (→ `analyzeWorkbookContent`), `GuidedWorkflowEngine.tsx` (→ `generateCBTCoachingPrompt`, PROJ-50), `CBATool.tsx` (→ `generateCBAReflection`, PROJ-50 Phase 3), `WorkbookSession.tsx` (→ `getGeminiCoaching`, PROJ-98 — sends live, unsaved workbook-answer text for in-progress AI coaching, distinct from `WorkbookDetail.tsx`'s saved-and-committed-content flow), `AudioRecorder.tsx` (→ `generateAudioAnalysis`, PROJ-98 — sends raw base64 voice-journal audio for transcription/analysis; the one flow here whose payload isn't text), and `ErrorLogViewer.tsx` (→ `analyzeSystemHealth`, PROJ-98 — admin-only surface; sends aggregated client error logs/stack traces, not personal recovery content) — the nine functions called are defined in `src/lib/gemini.ts`. **Note:** these calls route through the `generateAIInsights` Cloud Functions proxy (PROJ-64), not directly to Gemini from the client — the proxy hop doesn't log or persist `dataPayload` (verified during the PROJ-64 backfill audit), so the zero-knowledge guarantee described below still holds. These flows decrypt content **client-side only** and never persist the raw content server-side or in `ai_logs` (metadata only). This is a deliberate, load-bearing product decision (the AI Insights / Recovery Compass feature set), not an oversight — treat it as the *only* carve-out to the "never send sensitive content to Gemini" rule. Any **new** call site that wants to send decrypted content to Gemini must be added here explicitly before shipping, not assumed to inherit this exception. **Governance note:** the last three flows above shipped before being added to this list — a 2026-08-02 production-readiness audit found them already live and undocumented; the product owner reviewed and approved all three retroactively (`docs/projects/98_AUDIT_QUICK_WINS.md` Phase 3), rather than restricting or removing any of them. Treat their presence here as the closing of that gap, not evidence the approved-flow-list rule is optional in practice.

**Approved server-side-only Gemini call (PROJ-79):** the nightly `generateDailyCrossword` Cloud Function (`functions/src/index.ts`) calls Gemini to write crossword theme/word/clue content. This is **not** a carve-out of the nine-flow list above — that list governs client-side flows that decrypt and send *user* content; this call sends zero user data (only a theme name and a recent-word exclusion list) and never runs client-side. Documented here per this file's own rule that any new Gemini call site must be recorded explicitly, not assumed exempt.

**Approved vault-PIN exception (PROJ-65):** `computePinHash(pin, salt)` — a SHA-256 hash, **never the raw PIN** — transits to the `verifyVaultPin` Cloud Function over HTTPS to obtain a rate-limited server pepper used in vault-key derivation. The function does not log the hash and never persists the pepper to Firestore; only a per-uid attempt counter/lockout timestamp (`pinAttempts`, server-write-only per `firestore.rules`) is stored. This is the *only* carve-out to "the server never sees unencrypted content" for the PIN itself — see `docs/projects/65_VAULT_KEY_HARDENING.md` §2 for the accepted scope boundary (an attacker with both a Firestore breach *and* separate Auth-token-minting capability could crack the still-fast `pinVerifier` offline to skip to a single correct guess, but still cannot bypass the rate limiter or reach the pepper without a live authenticated call).

---

## Premium Tier & Billing

MRT is a freemium product — a $3.99/mo "Supporter" subscription (`users/{uid}.tier: 'free' | 'premium'`) gates a subset of features. **Any new feature, especially one that calls Gemini, should ask whether it needs a tier check or a rate limit — this is not automatic and has been missed before (see below).**

**Mechanism:**
- `tier`/`tierSource` (`src/lib/db.ts`) are the source of truth. Client-writable only at account creation (forced to `'free'`); after that, `firestore.rules` blocks any client write to `tier`/`tierSource`/`role` for non-admins — **only** `syncStripeSubscription` (Cloud Function, `functions/src/index.ts`, admin SDK) or an admin (`FriendsDirectory.tsx`'s manual VIP grant, `tierSource: 'manual'`) can set them. Never add a client-side path that writes these fields.
- `tierSource` values in practice: the Stripe-sync Cloud Function writes the literal string `"Stripe-Managed"` (not `'stripe'`, despite the TS union in `db.ts` saying `'stripe'` — a known, minor drift, not a bug to silently "fix" by assuming the union is authoritative).
- `usage_limits` (`users/{uid}`) is a real, server-enforced (defense-in-depth: client `useRateLimits.ts` + authoritative check in the `generateAIInsights` proxy, `functions/src/index.ts`) cooldown store for free-tier AI usage (weekly/monthly/deep-dive scans, ROSC assessments) — not every gate is binary hide/show; several are "immediate for premium, cooldown-limited for free."
- `<PremiumGate>` (`src/components/PremiumGate.tsx`) is the shared UI wrapper (`hide` / `button_swap` / `lock_overlay` modes) — reuse it rather than hand-rolling a new tier-check pattern.

**A gate must be enforced where the data/action actually happens, not just in the UI entry point.** `JournalEditor.tsx`'s custom-templates button is tier-gated, but the `/templates` route and `TemplateEditor.tsx` itself have no tier check at all — any authenticated free user can reach it directly by URL. Don't repeat this pattern: gating the button that links to a feature is not the same as gating the feature.

**Known live gap, not yet fixed (flag if you touch these files):** `WorkbookDetail.tsx` (`analyzeWorkbookContent`), `WorkbookSession.tsx` (`getGeminiCoaching`), and `AudioRecorder.tsx` (`generateAudioAnalysis`) — three of the nine approved Gemini flows above — have **no tier check and no rate limit at all**. This is a live, uncapped Gemini API cost exposure (any free user can call these without limit), independent of whether they should also be premium-gated as a product decision. Don't extend these call sites without also considering this gap; don't assume "it's been like this a while" means it's intentional.

**Platform-specific billing:** Web/iOS-PWA purchases go through Stripe (`src/pages/PremiumUpgrade.tsx`, `handleSubscribe` → `checkout_sessions` → the Stripe Firebase Extension). The Android TWA cannot use this flow (Play Payments policy) — see `docs/projects/68_STRIPE_TWA_GATING.md` and `docs/projects/105_PLAY_BILLING_TWA.md` for the in-progress Google Play Billing integration (Digital Goods API + Payment Request API, the TWA-specific bridge — not the native Android Billing Library, since there is no native Android code in a TWA).

**Never gate crisis/safety features.** SOS, Urge Surfer, Craving Buster, sponsor/hotline contact, the sobriety counter, and core journaling/task tracking must stay free and frictionless — this isn't a style preference, it's David's crisis-first design floor (see Personas below). Don't propose or implement premium-gating for anything crisis-adjacent.

---

## Critical Rules

### Type Safety (CI-failing if violated)
- **NO `any` types.** Use `unknown` and cast via interfaces.
- Use `import type { }` for type-only imports.
- Delete all unused imports immediately.
- Prefix intentionally unused callback args with `_` (e.g., `_index`, `_snapshot`).

### Data & Date Safety
- **TanStack Query wraps ALL Firestore ops** — check `src/hooks/` before creating a new hook.
- JS `Date` for UI/logic. Firestore `Timestamp` for storage. Always convert with `.toDate()`.
- Fallbacks for optional/legacy fields: `entry.moodScore ?? 0`, never assume a field exists.
- Guard clauses before Firebase calls: `if (!user) return;` · `if (!db) return;`

### Code Quality
- **Read `docs/specs/` before implementing any new feature.**
- Reuse existing hooks, utilities, and context providers — don't reinvent.
- All mutations must be idempotent and safe to rollback (offline-first).
- **Targeted patching only** — never rewrite an entire file from memory. Use surgical edits.
- No `console.log` of decrypted or sensitive data.

### Icons
- `@heroicons/react/24/outline` for outline variants
- `@heroicons/react/24/solid` for solid variants
- Verify icon name exists before using it — don't guess.

### AI (Gemini)
- Only non-sensitive metadata or explicitly approved content goes to Gemini requests — see the "Approved Gemini exception" list under Zero-Knowledge Encryption Boundary for the nine flows permitted to send decrypted content.
- Sanitise before every AI call — treat Gemini as an untrusted boundary. Never send raw content to Gemini from a call site not on the approved list; never persist decrypted content server-side (`ai_logs` stays metadata-only).

---

## AI Image Generation (Dev Tooling)

Claude Code has the `media-pipeline` plugin (`guinacio/claude-image-gen`) installed for generating placeholder/concept/marketing imagery via natural-language requests during a session (e.g. "generate a hero image for X"). **This is a developer-authoring tool, not a runtime feature of the app** — it has nothing to do with `src/lib/gemini.ts` or the nine approved AI-analysis flows in the Zero-Knowledge Encryption Boundary section above. Don't conflate the two, and don't treat this plugin's existence as license to add a new client-side Gemini call site — that approval list is unchanged.

- **Output dir:** `./generated-images/` (repo root, gitignored — draft/iterative output, never committed directly). Curate a chosen image, then promote it into `public/raw_assets/` and run `scripts/optimize_assets.py` (or an equivalent crop/compress pass) before it ships as a real asset — same staging pattern the existing externally-sourced marketing images already follow.
- **Trigger:** natural-language image requests. The skill also self-triggers on placeholder-image/empty-hero-section patterns it detects in code — treat that as a suggestion, not an auto-execute; confirm before spending API credit.
- **Model:** Gemini, `gemini-3-pro-image-preview` by default (`GEMINI_DEFAULT_MODEL` in `.claude/settings.json`). Requires `GEMINI_API_KEY` in the shell environment — never hardcode it in a file or commit it.
- **Do NOT use for:** final production-polish art shipped to users without a human/design review pass. MRT's persona and marketing imagery sets tone for a recovery product — David's crisis-safety floor applies to imagery too (no shame-coded, punitive, or clinically-alarming visuals). Treat AI-generated output as a draft or reference sheet, not a direct-to-`public/` asset. Never use it to depict a real, identifiable person, or to fabricate app-screenshot-style UI imagery (Play Store listing screenshots must be real captures).
- **MCP server:** the plugin also registers an MCP server (`media-pipeline` / `create_asset`); the skill uses its own bundled CLI and doesn't need it. This Claude Code build has no per-component disable for a plugin's MCP server — only whole-plugin enable/disable, which would remove the skill too — so it's left enabled. It costs a local Node subprocess per session, not context tokens.

---

## React Patterns

- `VaultGate.tsx` — PIN entry & encryption gate; wraps the entire app
- `PrivateRoute` — Auth guard for protected routes
- `AppShell.tsx` — Main layout (sidebar, mobile nav)
- Lazy loading + Suspense for heavy routes (Vitality, Insights, Admin)
- `ErrorBoundary.tsx` — Top-level error catch

---

## Personas — Reference for Every UX Decision

Full detail, journey arcs, anti-personas, and overlap resolution: `docs/PERSONAS.md`. Internal stakeholder personas (Alex/Dev/Morgan/Taylor — code & business concerns, not UX): `docs/governance/INTERNAL_PERSONAS.md`.

- **David** — High anxiety, acute crisis, Day 1-30 (CA). Max 3 taps per flow. Zero cognitive load. Crisis-first design. Primary Safety Anchor — his worst case sets the UX floor for the whole product.
- **Ned** — Early sobriety, motivated, Pink Cloud phase, Day 30-90 (NA). Wants gamification and streaks. Watch the Day 90 Pink Cloud Crash — streak breaks must never feel punishing.
- **Lisa** — Sponsor (AA) managing 3-6 sponsees. Needs Service Module, urgency-sorted rolodex, anonymity compliance. Primary Viral Driver.
- **Walt** — Long-term (35+ yrs, AA-origin/Recovery Dharma), analytical, reflection-mode. Wants depth, exports, traceable AI insights, zero gamification in his flows.
- **Maya** — Systematiser, 6-18 months (Secular/CBT/SMART), completion-mode. Wants linear workbook progress, completion %, auditable AI insights. Mirror-opposite UX posture from Walt on the same features (see overlap register).
- **Jordan** — Stabiliser, Day 1-12mo+ on MAT (Buprenorphine/Naltrexone) + MARA/SMART. Needs non-judgmental, discreet tooling: custom counter labels, one-tap dose logging, no drug names on lock-screen notifications.

When reviewing any UI change: ask "how does this feel for David in an acute crisis state?" For depth/export features, also run the Walt Sovereignty Test and Maya's traceability check. For any social/connection feature, run the surveillance test (§0 of `docs/PERSONAS.md`).

---

## Deployment

Branch naming drives environment in `.github/workflows/deploy.yml`:
- `feature/*` → DEV (`mrt2-app-dev`)
- `release/*` → UAT (`mrt2-app-uat`)
- `main` → PROD (`mrt2-app-prod`)

---

## Workflow

- **Developer & AI Governance Guide:** Refer to [docs/governance/DEVELOPER_GUIDE.md](file:///workspaces/MRT2/docs/governance/DEVELOPER_GUIDE.md) for detailed AI coding workflows, the 4-phase Recursive Build Protocol, and bi-weekly maintenance protocols.
- **Starting a session:** Clear old context before starting any major new feature or bug fix.
- **Closing a ticket:** Use the `ticket-close` protocol (schema/spec/guide drift audits and `sync_ticket_docs.py`).

> [!IMPORTANT]
> **Do not proceed with any feature that lacks a `docs/projects/XX_FEATURE.md` spec file.** Ask for one to be created before planning begins.