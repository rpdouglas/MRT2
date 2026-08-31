# MRT — My Recovery Toolkit (Gemini & Antigravity CLI Directives)

Zero-knowledge, offline-first PWA for 12-Step and Buddhist-inspired recovery. All sensitive user data is encrypted client-side with AES-GCM before Firestore storage — the server never sees unencrypted content.

These instructions are foundational mandates for Gemini / Antigravity CLI (`agy`). They take absolute precedence over general workflows and establish the constraints for all AI operations within this workspace.

---

## Core Directives

1. **Strictly adhere to the existing codebase.** Do not pull patterns, file names, or architectural decisions from outside this repository.
2. **Spec-Driven Development:** Read the `/docs/specs` and `/docs/projects` directories for feature requirements before implementing changes. Never proceed with any feature that lacks a spec file. Ask for one to be created before planning begins.
3. **Ask Before Acting:** If required context, files, or patterns are unclear or missing, STOP and ask for clarification before writing code.
4. **Developer & AI Governance Guide:** Refer to [docs/governance/DEVELOPER_GUIDE.md](file:///workspaces/MRT2/docs/governance/DEVELOPER_GUIDE.md) for detailed AI coding workflows, the 4-phase Recursive Build Protocol, and bi-weekly maintenance protocols.

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

## Security & Zero-Knowledge Encryption Boundary (CRITICAL — NEVER VIOLATE)

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
| `users/{uid}/templates/{id}` | ❌ No | User-authored journal template scaffolding (name/content/tags) — structural prompt text, not personal disclosure. |
| `game_progress/{id}` | ✅ Partial | PROJ-72 (Recovery Games). `encryptedStats`/`encryptedReflection` are AES-GCM; `score`, `gameId`, `personaTarget`, `createdAt` are plaintext |
| `game_saves/{id}` | ✅ Yes (fully) | PROJ-72 Phase 4. Live in-progress state, whole blob is encrypted |
| `crossword_puzzles/{date}` | ❌ No | PROJ-79 (Daily Crossword). Nightly-generated, server-write-only editorial content |

**Before ANY Firestore write:** confirm user-generated content passes through `encryptData()` in `src/lib/crypto.ts`.  
**Never:** log decrypted data, store plaintext sensitive content server-side, or send decrypted content to Gemini **outside the ten approved AI-analysis flows below**.

### Approved Gemini Exceptions
1. **Nine client-side flows (decrypted journal/workbook content):**
   - `useDeepPatternAnalysis.ts`
   - `useROSCAssessments.ts` (→ `generateROSCAnalysis`)
   - `JournalAnalysisWizard.tsx` (→ `generateComparativeAnalysis`)
   - `WorkbookDetail.tsx` (→ `analyzeWorkbookContent`)
   - `GuidedWorkflowEngine.tsx` (→ `generateCBTCoachingPrompt`, PROJ-50)
   - `CBATool.tsx` (→ `generateCBAReflection`, PROJ-50 Phase 3)
   - `WorkbookSession.tsx` (→ `getGeminiCoaching`, PROJ-98 — live unsaved workbook-answer text, distinct from `WorkbookDetail.tsx`'s saved-content flow)
   - `AudioRecorder.tsx` (→ `generateAudioAnalysis`, PROJ-98 — raw base64 voice-journal audio, not text)
   - `ErrorLogViewer.tsx` (→ `analyzeSystemHealth`, PROJ-98 — admin-only; aggregated error logs, not recovery content)  
   All routed through the `generateAIInsights` Cloud Functions proxy (PROJ-64). The last three shipped before being added to this list; retroactively reviewed and approved 2026-08-02 (`docs/projects/98_AUDIT_QUICK_WINS.md` Phase 3) — see CLAUDE.md's copy of this section for the full governance note.
2. **Server-side-only flow (PROJ-79):**
   - `generateDailyCrossword` Cloud Function (`functions/src/index.ts`) for crossword theme/clue generation (zero user data sent).

**Sanitize before every AI call — treat Gemini as an untrusted boundary.** Never send raw content to Gemini from a call site not on the approved list above; never persist decrypted content server-side (`ai_logs` stays metadata-only).

**Approved vault-PIN exception (PROJ-65) — not a Gemini exception, a separate carve-out:** `computePinHash(pin, salt)` — a SHA-256 hash, **never the raw PIN** — transits to the `verifyVaultPin` Cloud Function over HTTPS to obtain a rate-limited server pepper used in vault-key derivation. Not logged, never persisted to Firestore (only a per-uid attempt counter/lockout timestamp is stored). The only carve-out to "the server never sees unencrypted content" for the PIN itself — see `docs/projects/65_VAULT_KEY_HARDENING.md` §2.

---

## Coding Standards & Code Quality

- **Type Safety (CI-failing if violated):**
  - ZERO `any` types. Use `unknown` and cast via interfaces.
  - Use `import type { }` for type-only imports.
  - Delete all unused imports immediately.
  - Prefix intentionally unused callback args with `_` (e.g., `_index`, `_snapshot`).
- **Data & Date Safety:**
  - TanStack Query wraps ALL Firestore operations (`src/hooks/`). All server state MUST flow through TanStack Query (`useQuery`/`useMutation`).
  - Offline-first: All writes must succeed without network connectivity. Mutations must support optimistic updates, handle rollback on failure, and sync safely when connection resumes.
  - JS `Date` for UI/logic. Firestore `Timestamp` for storage. Always convert using `.toDate()`.
  - Fallbacks for optional/legacy fields: `entry.moodScore ?? 0`.
  - Guard clauses before Firebase calls: `if (!user) return;` · `if (!db) return;`
- **Code Quality:**
  - Reuse existing hooks, utilities, and context providers — don't reinvent.
  - Targeted patching only — never rewrite an entire file from memory. Use surgical edits.
  - No `console.log` of decrypted or sensitive data.
- **Icons:** `@heroicons/react/24/outline` for outline variants, `@heroicons/react/24/solid` for solid variants. Verify an icon name exists before using it — don't guess.

---

## UX & Personas

Full detail: `docs/PERSONAS.md`. Stakeholder personas: `docs/governance/INTERNAL_PERSONAS.md`.

- **David** — High anxiety, acute crisis, Day 1-30 (CA). Max 3 taps per flow. Zero cognitive load. Crisis-first design. Primary Safety Anchor.
- **Ned** — Early sobriety, motivated, Pink Cloud phase, Day 30-90 (NA). Wants gamification and streaks. Watch the Day 90 Pink Cloud Crash.
- **Lisa** — Sponsor (AA) managing 3-6 sponsees. Needs Service Module, urgency-sorted rolodex, anonymity compliance.
- **Walt** — Long-term (35+ yrs), analytical, reflection-mode. Wants depth, exports, traceable AI insights, zero gamification.
- **Maya** — Systematiser, 6-18 months, completion-mode. Wants linear workbook progress, completion %, auditable AI insights.
- **Jordan** — Stabiliser, Day 1-12mo+ on MAT. Needs non-judgmental, discreet tooling: custom counter labels, one-tap dose logging.

When reviewing any UI change: ask "how does this feel for David in an acute crisis state?" For depth/export features, run the Walt Sovereignty Test and Maya's traceability check. For social features, run the surveillance test.

---

## Deployment & Workflow

Branch naming drives environment in `.github/workflows/deploy.yml`:
- `feature/*` → DEV (`mrt2-app-dev`)
- `release/*` → UAT (`mrt2-app-uat`)
- `main` → PROD (`mrt2-app-prod`)

- **Closing a ticket:** Use the `ticket-close` protocol (schema/spec/guide drift audits and `sync_ticket_docs.py`).

