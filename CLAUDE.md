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

**Key derivation:** 4-digit PIN + 16-byte salt → PBKDF2 (100k iterations) → 256-bit AES-GCM key  
**Storage format:** `IV:Ciphertext` (base64) in Firestore  
**Session:** PIN cached in `sessionStorage` only — cleared on tab close  
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

**Before ANY Firestore write:** confirm user-generated content passes through `encryptData()` in `src/lib/crypto.ts`.  
**Never:** log decrypted data, store plaintext sensitive content server-side, or send decrypted content to Gemini **outside the four approved AI-analysis flows below**.

**Approved Gemini exception — decrypted journal/workbook content, scoped to exactly these six flows:**
`useDeepPatternAnalysis.ts`, `useROSCAssessments.ts` (→ `generateROSCAnalysis`), `JournalAnalysisWizard.tsx` (→ `generateComparativeAnalysis`), `WorkbookDetail.tsx` (→ `analyzeWorkbookContent`), `GuidedWorkflowEngine.tsx` (→ `generateCBTCoachingPrompt`, PROJ-50), and `CBATool.tsx` (→ `generateCBAReflection`, PROJ-50 Phase 3) — the six functions called are defined in `src/lib/gemini.ts`. These flows decrypt content **client-side only**, send it to Gemini directly over HTTPS for a single stateless inference call, and never persist the raw content server-side or in `ai_logs` (metadata only). This is a deliberate, load-bearing product decision (the AI Insights / Recovery Compass feature set), not an oversight — treat it as the *only* carve-out to the "never send sensitive content to Gemini" rule. Any **new** call site that wants to send decrypted content to Gemini must be added here explicitly before shipping, not assumed to inherit this exception.

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
- Only non-sensitive metadata or explicitly approved content goes to Gemini requests — see the "Approved Gemini exception" list under Zero-Knowledge Encryption Boundary for the six flows permitted to send decrypted content.
- Sanitise before every AI call — treat Gemini as an untrusted boundary. Never send raw content to Gemini from a call site not on the approved list; never persist decrypted content server-side (`ai_logs` stays metadata-only).

---

## React Patterns

- `VaultGate.tsx` — PIN entry & encryption gate; wraps the entire app
- `PrivateRoute` — Auth guard for protected routes
- `AppShell.tsx` — Main layout (sidebar, mobile nav)
- Lazy loading + Suspense for heavy routes (Vitality, Insights, Admin)
- `ErrorBoundary.tsx` — Top-level error catch

---

## Personas — Reference for Every UX Decision

- **David** — High anxiety, acute crisis, Day 1-30. Max 3 taps per flow. Zero cognitive load. Crisis-first design.
- **Ned** — Early sobriety, motivated, Pink Cloud phase. Wants gamification and streaks.
- **Walt** — Long-term, analytical, data-driven. Wants depth, exports, AI insights.
- **Lisa** — Sponsor managing multiple sponsees. Needs Service Module.

When reviewing any UI change: ask "how does this feel for David in an acute crisis state?"

---

## Deployment

Branch naming drives environment in `.github/workflows/deploy.yml`:
- `feature/*` → DEV (`mrt2-app-dev`)
- `release/*` → UAT (`mrt2-app-uat`)
- `main` → PROD (`mrt2-app-prod`)

---

## Workflow

**Starting a session:** Use `/clear` before every new feature task — don't carry old context in.  
**Planning a feature:** Switch to `/model opus` → invoke `/planning` skill. Return to `/model sonnet` for implementation.  
**Long sessions:** Use `/compact` when context grows long; tell it what to preserve.  
**Bug/type error:** Use `/fix` skill — paste the error, Claude reads the file from disk.  
**Closing a ticket:** Use `/ticket-close` skill — checks schema, spec, and guide drift.

> **Do not proceed with any feature that lacks a `docs/projects/XX_FEATURE.md` spec file.**  
> Ask me to create one before planning begins.