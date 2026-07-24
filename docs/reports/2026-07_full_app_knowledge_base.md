# My Recovery Toolkit (MRT) — Complete Application Knowledge Base

> **Purpose of this document:** This is a single, self-contained reference intended to be fed into an LLM (or a new team member) so it can answer detailed questions about what MRT is, how it is built, and exactly what every feature and sub-feature does. It was compiled by cross-referencing the published user guide (`docs-site/`), the internal architecture docs (`docs/SYSTEM_OVERVIEW.md`, `docs/SECURITY_ZERO_KNOWLEDGE.md`), every feature spec in `docs/specs/`, and the actual source code (`src/`, `functions/src/`) as of **2026-07-24**.
>
> Where the source code and the docs disagreed, this document follows the source code and notes the discrepancy.

---

## 1. What MRT Is

**My Recovery Toolkit (MRT)** is a zero-knowledge, offline-first Progressive Web App (PWA) for people in 12-Step, CBT/SMART, DBT, and Buddhist-inspired (Recovery Dharma) recovery. It combines:

- A private, encrypted **journal** and **structured workbook** system,
- A forgiving **habit/task tracker**,
- A **somatic wellness** module (movement, nutrition, breathwork),
- On-demand **AI coaching** (Google Gemini) that reads decrypted content only in the browser,
- A set of interactive **CBT/SMART Recovery tools**,
- A library of **daily readings** across seven recovery traditions,
- A set of anti-shame **mini-games**,
- Monthly **Recovery Capital (ROSC)** self-assessment,
- Crisis-first **SOS / Urge Surfer** tools that work even with the vault locked,
- And full **data portability** (export, Google Drive auto-sync, account deletion).

**Core philosophy:** *"We cannot leak what we cannot read."* Sensitive personal content (journals, workbook answers, sponsee notes, CBT tool sessions) is encrypted client-side with AES-GCM before it ever reaches Firestore. The server — and MRT's own developers — cannot read it.

**Product philosophy pillars** (from `docs/SYSTEM_OVERVIEW.md`):
- *Recovery as a high-performance lifestyle* — energetic design, gamification (streaks, XP, Rhythm Score) instead of clinical/somber UI.
- *Offline-first resilience* — the app must work fully in a basement meeting room with no signal.
- *Anti-shame mechanics* — no red "failed" states; missed days are absorbed gracefully (Smart Reset, Forgiveness Tap, Rhythm Score instead of streak-only counters).

**Live site:** `https://www.myrecoverytoolkit.ca` · **Published user guide:** `https://rpdouglas.github.io/MRT2/` (built from `docs-site/`, VitePress).

---

## 2. Personas (design north star)

Every UI decision is validated against four personas (`docs/PERSONAS.md`, referenced throughout `CLAUDE.md`):

| Persona | Profile | Design implication |
|---|---|---|
| **David** | High anxiety, acute crisis, Day 1–30 | Max 3 taps per flow, zero cognitive load, crisis tools bypass the vault entirely |
| **Ned** | Early sobriety, "Pink Cloud" phase, motivated | Wants gamification, streaks, visible momentum |
| **Walt** | Long-term, analytical, data-driven | Wants depth: AI insights, exports, trend charts |
| **Lisa** | Sponsor managing multiple sponsees | Needs the (currently paused) Service Module |

Other personas referenced in screenshots/specs: **Maya** (structured/CBT-focused), **Jordan** (MAT — Medication-Assisted Treatment).

---

## 3. Technology Stack

- **React 19 + Vite 7 + TypeScript 5.9** — strict typing; `any` is banned (CI-failing), `unknown` + interfaces instead.
- **Tailwind CSS 3.4** — utility classes only, no config changes without approval.
- **TanStack Query 5** — the *only* path for Firestore reads/writes. No component calls `getDocs`/`setDoc` directly; everything goes through a hook in `src/hooks/`.
- **React Router 7** — SPA routing, lazy-loaded heavy routes.
- **Firebase 12** — Auth, Firestore, Hosting, Cloud Functions, Cloud Messaging (FCM).
- **Google Gemini 2.5** (`gemini-2.5-flash` / `gemini-2.5-flash-lite`) — AI analysis, proxied through a Cloud Function.
- **Vitest 4 + React Testing Library** — unit/component tests.
- **Vite PWA + Workbox** — offline service worker, `autoUpdate` strategy.
- **Stripe** — subscription billing, synced to Firestore via a Cloud Function trigger.
- **PostHog** — product analytics (also used to capture decryption-failure telemetry).
- **jsPDF / jspdf-autotable** — PDF export generation.
- **recharts** — charts (mood velocity, Lifestyle Balance wheel, ROSC pill capsules).
- **@use-gesture/react v10** — swipe gestures on task rows.

### Commands
```bash
npm run dev                # Vite dev server, port 5175
npm run build               # TypeScript check + Vite build → dist/
npm run lint                 # ESLint, zero warnings allowed
npm run check                # Full QA: lint + spec-quality + test + build
npm run test:once            # Vitest single run (CI)
```
Cloud Functions live in `functions/` with their own `npm run build` / `serve` (emulator) / `deploy`.

---

## 4. Directory Map

```
src/
  contexts/     AuthContext, EncryptionContext, LayoutContext (global providers)
  hooks/        TanStack Query hooks — the only sanctioned Firestore access path
  lib/          crypto.ts, db.ts, firebase.ts, gamification.ts, and ~30 other stateless modules
  components/   UI grouped by domain: admin/, dashboard/, journal/, games/, profile/,
                readings/, smart_tools/, tasks/, tools/, ui/, vitality/
  pages/        Route-level views (Dashboard, Journal, Tasks, Vitality, Workbooks, ...)
  data/         Static content: workbooks.ts, journalTemplates.ts, fellowships.ts, slogans.ts, assets.ts
  test/         Vitest mocks and shared test setup
functions/src/   Cloud Functions: index.ts (Beacon, Readings buffer, Stripe sync, AI proxy, vault-PIN pepper), prompts.ts
docs/            Architecture docs, governance, feature specs (docs/specs/), project logs (docs/projects/)
docs-site/       Published VitePress user guide (the external, public-facing documentation site)
```

---

## 5. The Zero-Knowledge Encryption Model (critical — read first)

This is the single most important architectural constraint in the app. It is enforced by `src/lib/crypto.ts`, `src/contexts/EncryptionContext.tsx`, and `src/lib/vaultAuth.ts`, and it gates the AI features, the export system, and the whole "vault" concept.

### 5.1 Key derivation (current scheme — "PROJ-65", peppered)

1. User sets a **4-digit PIN**.
2. The app generates a random 16-byte **Salt**, stored in plaintext in `users/{uid}.encryptionSalt`.
3. `deriveLocalBits(pin, salt)` runs **PBKDF2 (100,000 iterations, SHA-256)** client-side to derive local key material — but this is *not* used directly as the encryption key.
4. The client sends a **hash** of the PIN (`computePinHash` — SHA-256(PIN + Salt), never the raw PIN) to the `verifyVaultPin` Cloud Function.
5. That function checks the hash against the stored `pinVerifier` under a **per-uid rate limiter**, and if correct, returns a server-issued **pepper**: `HMAC-SHA256(VAULT_PEPPER_secret, pinHash)`.
6. The client combines its local PBKDF2 bits with the pepper via `deriveVaultKeyWithPepper()` (HMAC-SHA256, then imported as an AES-GCM key) to produce the actual **256-bit AES-GCM vault key**.

**Why this matters:** a Firestore-only data breach exposes the salt and the verifier, but *not* the pepper — the pepper only exists in a secret bound to the Cloud Function and is only released after a rate-limited, authenticated call with a correct PIN hash. This means an attacker with a full database dump alone cannot brute-force the 10,000-combination PIN space offline; they would also need live, authenticated calls to `verifyVaultPin`, which lock out after repeated failures.

**Rate limiting (`computeLockoutSeconds`, `functions/src/index.ts`):**
| Failed attempts | Lockout |
|---|---|
| < 5 | none (a few free retries for a fat-fingering, high-anxiety user) |
| 5–7 | 60 seconds |
| 8–11 | 15 minutes |
| ≥ 12 | 24 hours |

**Legacy accounts:** Accounts that predate PROJ-65 and haven't rotated their PIN since still use the older, direct PBKDF2-only derivation (`generateKey()`, no pepper) until they next rotate their PIN. `usesPepperV2: true` on the user doc marks accounts on the new scheme.

### 5.2 Storage format & pipeline
- **Format:** `IV_hex:Ciphertext_hex` string, AES-GCM, random 12-byte IV per write.
- **Encrypt (`encrypt()`):** throws if the vault is locked (no in-memory key). Random IV generated per call; never reused.
- **Decrypt (`decrypt()`):** gracefully handles three edge cases without crashing the UI —
  - No `:` separator → treated as legacy plaintext (pre-encryption data), returned as-is.
  - Corrupted/too-short ciphertext → `"[Error: Data Corrupted]"`.
  - Wrong/missing key or a genuine crypto failure → `"[Locked Content - Verify PIN]"`, and a `vault_decryption_failed` event is captured in PostHog (metadata only — never the failed payload).
- **Session cache:** the derived key lives only in a module-level variable (`globalKey`) in memory; the PIN itself (not the key) is cached in `sessionStorage` so the vault can be silently re-derived on page navigation within the same tab session, without a new network round-trip after the first unlock. Locking the vault (`clearKey()`) nulls the in-memory key and clears `sessionStorage`.
- **First unlock per session needs network** (to fetch the pepper); every unlock after that, until the vault is locked or the tab closes, is fully offline.

### 5.3 Key lifecycle operations
- **PIN rotation** (`src/lib/rotation.ts`): validate old PIN → download and decrypt all encrypted docs with the old key → derive a new key with a new PIN/salt → re-encrypt everything → write back in **chunked batches of 50** (Firestore cursor-paginated) to avoid freezing the UI thread → commits in batches of ≤450 to respect Firestore's transactional write limits. If the network drops mid-rotation, a `try/catch` rollback reverts the in-memory key to the old one so the session doesn't corrupt.
- **Crypto-shredding (Vault Reset):** if the PIN is lost, decryption is mathematically impossible. Reset permanently batch-deletes all encrypted documents (`journals`, `workbook_answers`, and other encrypted collections) and clears `encryptionSalt`/`pinVerifier`, giving the user a fresh vault. This is irreversible by design.
- **Vault Gate (`VaultGate.tsx`):** wraps every route that touches encrypted content (Journal, Workbooks, Vitality, Insights, all CBT tools except the crisis-tier ones) and prompts for the PIN if the vault is currently locked.
- **`hasDeferredVault`:** a state where the vault is temporarily unlocked without a persisted key (e.g. a brand-new user who hasn't set a PIN yet); `AppShell.tsx` shows an amber banner — *"Your vault is currently unlocked. Data is being saved unencrypted."* — with a link to secure it.

### 5.4 The one approved carve-out for third-party data: Gemini
AI analysis is the **only** sanctioned path where decrypted content leaves the browser, and it is scoped to exactly six call sites (enumerated in `CLAUDE.md` and Section 12 below). Requests route through the `generateAIInsights` Cloud Function proxy — never directly from client to Gemini — and the proxy does not log or persist the `dataPayload`. Gemini processes statelessly and does not train on this data.

### 5.5 Firestore Collection Schema

| Collection | Path | Encrypted fields | Notable plaintext fields | Purpose |
|---|---|---|---|---|
| `users` | `users/{uid}` | none | `encryptionSalt`, `pinVerifier`, `pinAttempts`, `usesPepperV2`, `sobrietyDate`, `role`, `tier`, `usage_limits`, `fcmTokens`, `fcmSwVersion`, `timezone`, `pushNotificationsEnabled`, `anchorSettings`, `heroColor`, `installedWorkbookIds`, `hasCompletedOnboarding`, `lastExportAt`, `sponsorName`, `sponsorPhone` | Profile & config; never contains recovery content |
| `journals` | `journals/{id}` | `content` (stringified JSON — journal text, mood/vitality metadata, and every CBT tool's payload) | `uid`, `isEncrypted`, `moodScore`, `tags` (`Vitality`, `Movement`, `Nutrition`, `Mindfulness`, `SMART Tool`, `DRAFT`, etc.) | Journal entries, Vitality logs, and all CBT tool saves (see §5.6) |
| `tasks` | `tasks/{id}` | none | `uid`, `title`, `source`, `status`, `isRecurring`, `recurrence`, `priority`, `category`, `currentStreak`, `dueDate`, `lastCompletedAt`, `sourceContext`, `sourceRef`, `missedCountHistory` | Habit/task ledger — unencrypted so streak evaluation can run server- and client-side without decryption |
| `insights` | `insights/{id}` | none | `uid`, `type`, `summary`, `pillars`, `suggested_actions`, `scope_context`, timestamps | AI-generated pattern analyses (the Compass), summarized text — treated as non-sensitive coaching output rather than raw disclosure |
| `workbook_answers` | `users/{uid}/workbook_answers/{workbookId_questionId}` | `answer` | `isEncrypted`, `updatedAt` | One doc per question, to avoid state conflicts |
| `rosc_assessments` | `users/{uid}/rosc_assessments/{id}` | `encryptedAIContext` | `scores.*`, `totalScore`, `trajectory`, `journalEntriesAnalysed` | Monthly Recovery Capital snapshots — scores are plaintext, AI narrative is encrypted |
| `game_progress` | — | `encryptedStats`, `encryptedReflection` | `score`, `gameId`, `personaTarget`, `createdAt` | Completed Recovery Games plays |
| `game_saves` | doc id `${uid}_${gameId}` | entire blob | — | Resumable in-progress game state (Fast Lane) |
| `users/{uid}/templates/{id}` | — | none | `name`, `content`, `prompts`, `defaultTags` | User-authored custom journal template scaffolding (structural text, not disclosure) |
| `service` | *(spec only — not implemented, see §14)* | `name`, `contact`, `notes` | `type`, `status`, `meetingTime` | Planned sponsor "Rolodex" |
| `feedback` | `feedback/{id}` | none (explicitly unencrypted) | `uid`, `category`, `comment`, `buildHash`, `environment`, `vaultUnlocked`, `route`, `userAgent` | Bug/feature reports — UI warns users not to paste sensitive content |
| `ai_logs` | — | none | model, tokens, `analysisType`, timestamps | Metadata-only cost/usage tracking for Admin Analytics — never the prompt/response content |
| `client_errors` | — | none | stack traces, route, build hash | Crash telemetry for Admin → System Health |
| `daily_readings` | `daily_readings/{modality}_{date}` | none | `theme`, `title`, `body`, `reflection`, `affirmation`, `attribution` | Publicly-sourced content, shared across all users |
| `buffer_status` | `buffer_status/{modality}` | none | `lastGeneratedDate`, `totalBuffered`, `nextBatchDue` | Tracks the daily-readings generation buffer per modality |
| `users/{uid}/subscriptions/{id}` | — | — | Stripe status | Server/Stripe-extension-write-only; `firestore.rules` blocks client writes |
| `users/{uid}/checkout_sessions/{id}` | — | — | Stripe session data | Created client-side to kick off Stripe Checkout |

### 5.6 The "Virtual Module" pattern
Several features (Vitality, all nine CBT/SMART tools) do **not** have their own Firestore collections. They are written into the `journals` collection as tagged entries whose `content` is a JSON envelope (metadata + answers), encrypted like any other journal entry. This keeps the schema small and lets the Journal History timeline, search, and AI analysis treat them uniformly. A shared parser, `parseSmartToolPayload` (`src/lib/smartToolPayload.ts`), is the single place that recognizes a decrypted entry as a tool save vs. free-write text.

---

## 6. Global App Shell, Routing, and Navigation

### 6.1 Route map (`src/App.tsx`)
**Public routes:** `/` (Welcome/landing), `/login`, `/links` (link-tree), `/delete-account` (works without opening the app first).

**Protected routes** (wrapped in `PrivateRoute`, which redirects unauthenticated users to `/login` and wraps children in `AppShell`):
- `/dashboard`
- `/journal` *(VaultGate)*
- `/tasks`
- `/workbooks`, `/workbooks/:workbookId`, `/workbooks/:workbookId/session/:sectionId` *(VaultGate)*
- `/vitality` *(VaultGate)*
- `/tools` (Tools Hub), plus one route per tool: `/tools/urge-surfer`, `/tools/resentment-burner` (no VaultGate — crisis tools), `/tools/cba`, `/tools/abc`, `/tools/dents`, `/tools/personify`, `/tools/lifestyle-balance`, `/tools/thought-record`, `/tools/five-questions`, `/tools/morning-intent` (all VaultGate), plus `/tools/:toolType/history`
- `/games`, plus one route per game: `/games/craving-buster` (no VaultGate), `/games/recovery-jeopardy`, `/games/fast-lane`, `/games/goal-ladder`, `/games/thought-challenge`, `/games/trigger-match`, `/games/knowledge-quests` (all VaultGate)
- `/insights` *(VaultGate)*
- `/templates` (custom template editor)
- `/profile` and `/profile/:tab` (deep-linkable: `general` | `security` | `data` | `achievements`)
- `/premium`
- `/admin` (renders `AdminDashboard`, which itself redirects non-admins to `/dashboard`)
- `/debug` (dev-only tools)
- Any unmatched path → redirect to `/`

Most feature routes are **lazy-loaded** (`React.lazy` + `Suspense`) to keep the initial bundle small.

### 6.2 Sidebar navigation (`AppShell.tsx`)
Fixed nav items: **My Dashboard, My Journal, My Vitality, My Tasks, My Workbooks, My Insights, My Profile**, plus **Admin** (only if `isAdmin`). The sidebar also surfaces: user avatar/name/email, **Send Feedback**, **Lock Vault** (only if unlocked), **Log out**.

Global chrome rendered by `AppShell` on every protected page: `SOSModal`, `FeedbackModal`, an offline banner (red, fixed top, when `!isOnline`), `PWAInstallBanner`, `PWAUpdateBeacon` (controlled service-worker update prompt), and the amber "vault unlocked but unsecured" banner when `hasDeferredVault`.

### 6.3 Background Google Drive auto-backup
Hosted inside `AppShell` as a `useEffect`. Fires 10 seconds after mount if `isVaultUnlocked && driveAccessToken && isOnline`, and only if `lastExportAt` is more than 7 days old. It fetches all user data, decrypts it, serializes to JSON, and uploads/overwrites `mrt_backup.json` in the user's Google Drive (scope restricted to `drive.file` — the app can only see the one file it created). See §11.3 for full detail.

---

## 7. Onboarding & Authentication

- **Landing page (`Welcome.tsx`):** asymmetrical 60/40 layout; left column has branding + a "Begin Journey" CTA + an embedded demo video; right column is an interactive persona grid (hover-to-reveal on desktop, tap-to-modal on mobile).
- **Auth (`Login.tsx`):** a single tabbed glassmorphism card toggling Sign In / Create Account (Email+Password or Google Sign-In). The Create Account tab reveals a Confirm Password field and trust badges.
- **Link tree (`/links`):** a standalone, database-free public route (bypasses `PrivateRoute`) built for social-media bio links; hardcoded data for instant load on poor connections.
- **Forced onboarding redirect:** after login/signup, if `userProfile.hasCompletedOnboarding` is falsy, the user is routed to `/profile` and the tab UI is locked to "General" until they enter a **Display Name** and **Sobriety Date** and save — this both unlocks the rest of the app and (later) drives milestone/XP math.
- **Vault setup:** the first time the user opens Journal or Workbooks, they're prompted to create a 4-digit PIN. There is no PIN-recovery flow by design (see §5).

---

## 8. Feature-by-Feature Deep Dive

### 8.1 My Dashboard (`pages/Dashboard.tsx`)
The daily command center. As of **PROJ-76**, the Rank/Level/XP display and all six bento-tile stat numbers were relocated to **Profile → Achievements** to reduce cognitive load; the Dashboard itself no longer queries `journals`/`tasks`/`workbook_answers` at all.

**What remains on the Dashboard:**
1. **Identity & Momentum Card (`SobrietyHero.tsx`):** large Years/Months/Days sobriety counter, milestone confetti + share, a **Financial Freedom** tracker (money saved since the sobriety date, if a substance cost is configured in Profile → General), and a **Hero Color** swatch picker (5 themes: amber, sky, emerald, violet, rose — stored unencrypted as `heroColor`, also applied to shared milestone images).
2. **Crisis Tools:** a red warning-triangle **SOS** button opens `SOSModal.tsx` — a full-screen overlay that bypasses the vault entirely, offering Urge Surfer, Craving Buster (a ~90-second breathing mini-game, no PIN needed), one-tap Call/WhatsApp Sponsor, and 988/911 emergency routing.
3. **The Dynamic Anchor:** a two-button quick-action bar.
   - **Left button — time-aware Check-In:** label and prompt adapt to time of day (Morning 5am–12pm / Afternoon 12pm–5pm / Evening 5pm–10pm / Night 10pm–5am), each with a different prompt focus (intention/gratitude/trigger; energy/win/grounding; best-part/challenge/wind-down; grounding/safety/release). Opens a full-screen journal editor pre-loaded with that prompt; entries are fully encrypted. A red-dot badge shows if the user hasn't checked in today; a padlock icon shows if the vault is locked.
   - **Right button — Daily Reading:** opens today's reading in-app; a chevron opens an *external* fellowship reading (AA/NA/SMART/etc.) in the browser instead.
   - Badges for check-in, reading, and "daily intent" can each be toggled independently in Profile → General → Anchor Notifications.
4. **Push notifications ("The Beacon"):** a banner offers to enable daily reminders (milestone celebrations + habit nudges). iOS requires the PWA to be installed to the home screen first (Apple's Web Push restriction).
5. **Smart alerts:** a "Backup Needed" nudge appears if it's been >7 days since the last export (suppressed if Google Drive auto-sync is active), and a "Changelog Beacon" banner surfaces new releases.
6. **The Bento Grid:** six plain entry tiles (icon + title + one-line caption, no stats since PROJ-76) → My Journal, My Tasks, My Vitality, My Workbooks, My Games, My Tools.

### 8.2 My Journal (`pages/Journal.tsx`)
Three tabs via `JournalTabs.tsx`, all gated by `VaultGate`.

**A. Write** — `JournalEditor.tsx`, a "sticky studio" layout with a persistent bottom command toolbar.
- **Templates:** 15 total, grouped into 11 modality categories (order: Twelve-Step, CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, General). Twelve-Step templates drop a Markdown block straight into free-write; the rest render a short guided form (one labeled box per prompt). Custom templates are a Premium feature (`/templates` → `TemplateEditor.tsx`), persisted per-user, unencrypted (structural scaffolding only).
- **Metadata:** 1–10 mood slider + free-text tags (e.g. `#Anxiety`, `#Meeting`) used later by AI pattern analysis and the word cloud.
- **Voice-to-Vault (`AudioRecorder.tsx`):** records audio → base64 → sent to Gemini 2.5 Flash for transcription, mood-score estimation (1–10), and tag suggestion → user reviews/edits the pre-filled entry → the *final text* is encrypted before it's written; Gemini only ever sees the raw audio for the single stateless transcription call.
- **Auto-save:** `useAutoSave.ts` debounces writes to prevent data loss.

**B. History** — a virtualized (`Virtuoso`), search-enabled timeline grouped by Year/Month (only the current month expanded by default). Search runs client-side, after in-memory decryption, and auto-expands all matching groups. Each card supports **Share** (decrypt + copy to clipboard, for a sponsor/therapist) and delete. Completed CBT/SMART tool sessions also appear here — tagged with a colored badge and a one-line summary, view-only (no edit pencil, to avoid corrupting structured answers), but still shareable/deletable. In-progress (`DRAFT`) tool sessions do **not** appear in this timeline.

**C. Insights** — `JournalAnalysisWizard.tsx`'s underlying visualizations, always available (distinct from the AI Analysis Wizard below):
- **Emotional Velocity:** 14-day area chart, mood (purple) vs. local temperature (orange).
- **Weekly Rhythm:** current-30-days solid bar vs. previous-30-days dotted line, by day-of-week — shows whether the user is improving relative to their own baseline.
- **Recurring Themes (word cloud):** filters out common template boilerplate; a user-managed ignore-list (localStorage) can hide names/places; clicking a word searches the journal history for it.

**AI Analysis Wizard (The Compass)** — `JournalAnalysisWizard.tsx`. Reads decrypted history and returns a `ComparativeAnalysisResult` or `DeepPatternResult`, saved to `insights`. Rate-limited server-side (see §12.4): Free tier gets 1 weekly / 1 monthly / 1 deep-pattern (90-day) scan per period, each requiring a minimum entry count (7 for weekly, 30 for monthly/deep). Premium is unlimited. Deep Pattern scans use `processInChunks` to decrypt 90 days of entries in batches of 5, yielding to the main thread between batches so mobile UI doesn't freeze.

**Recovery Capital Matrix (ROSC)** — lives on the Insights *page* (its own sidebar destination), described fully in §8.6.

### 8.3 My Tasks (`pages/Tasks.tsx`)
A habit/task ledger designed around **anti-shame mechanics** — no red "failed" states anywhere.

**Smart Tabs:**
- **Today** (default): everything due today *or* overdue from any prior day (overdue sorted oldest-first, then today's items by priority High→Medium→Low). Badge = pending count.
- **Later:** everything with `dueDate > today`, sorted ascending. No badge.
- **Log:** completed history, grouped by Year/Month. No badge.

AI-suggested tasks (purple sparkle icon, `source: 'ai'`) route into Today/Later by the same `dueDate` logic as manual tasks — there is no separate "Action Plan" tab (removed in PROJ-47).

**Completing a task:** tap the leading circle, *or* **swipe right** (≥80px + ≥0.3px/ms velocity via `@use-gesture/react`; green reveal layer, `navigator.vibrate([40])`, card slides off). Both paths hit the same completion logic, including a **Future Task safety check** — completing a task whose due date is strictly in the future triggers a confirmation modal (tap or swipe).

**Skipping a task — "Forgiveness Tap":** swipe left opens an amber "Let today go" bottom sheet with two choices: **Move to Tomorrow** (no streak penalty) or **Keep for Today** (no-op). Copy is streak-aware ("Your streak is safe — this is just one day" vs. "Recovery continues tomorrow"). Under the hood this writes the *identical* Firestore update as the silent Smart Reset — only the UX differs.

**Quick Capture:** pull-down gesture at the top of the (already-scrolled-to-top) task list opens a bottom sheet: one auto-focused text field, priority chips (🔴🟡🟢, Medium default), date chips (Today/Tomorrow/This week, Today default). Defaults to a one-time, Medium-priority task due today; "More options →" opens the full form. The floating **+** button still opens the full `TaskFormModal` directly.

**The Rhythm Score (`src/lib/rhythmScore.ts`):** a 0–100 ring above the list — `round((distinct days with ≥1 completion in last 14) / 14 × 100)`. Not stored in Firestore; computed client-side. Green ≥70, amber 40–69, muted <40 (hidden entirely at 0). One missed day out of 14 scores ~93, not 0 — deliberately more forgiving than a bare streak counter.

**AI Context Cards:** on `source: 'ai'` tasks with a `sourceContext` string, tapping the card expands a one-sentence explanation of *why* the task was suggested plus a "See insight →" deep-link (routes to `/workbooks/{id}` if `sourceRef` starts with `workbook:`, else to `/insights`; "Source no longer available" if the reference was deleted).

**The Smart Reset system (lazy evaluation):** there is no background cron moving tasks around at midnight. Instead, `getUserTasks()` evaluates overdue recurring tasks the moment the app is opened and data is fetched — so a missed habit never piles up multiple overdue copies; there's always exactly one instance due "today," however many days have passed. A **2-hour trailing grace window** (`graceWindowStart = subHours(startOfDay(today), 2)`) protects a user who completes a habit at, say, 11:45 PM from a silent streak reset the next morning.

**Streak math:**
| Situation | Effect |
|---|---|
| Completed | streak +1 |
| Missed, streak was > 0 | streak resets to 0 |
| Missed again, streak already ≤ 0 | streak decrements further (tracks consecutive misses) |

**Recurrence types:** Once, Daily (with interval), Weekly (specific weekdays), Bi-weekly, Monthly (fixed calendar date, restoring the *original* day-of-month after short months via `originalDayOfMonth`), Monthly (relative — e.g. "1st Monday", "Last Friday").

### 8.4 My Vitality (`pages/Vitality.tsx`)
Not a separate collection — Vitality entries are `journals` documents with specific tag signatures (`#Vitality` + `#Movement` / `#Nutrition` / `#Mindfulness`+`#Somatic`+`#Regulation`). This lets them flow through the same encryption, timeline, and AI-analysis pipeline as regular entries, while a **Smart Mood Integration** step (`inferMoodFromRecentEntries`) infers a plausible mood score from recent journal history instead of defaulting to a neutral 5, so vitality logs don't skew mood charts.

- **Bio-Rhythm Score:** a daily 0–100% ring, resetting at local midnight; +33.3% for a Movement log today, +33.3% for a Nutrition log, +33.3% for a Mindfulness (breathwork) log.
- **Movement tab:** log activity name, duration, intensity (Low/Mod/High).
- **Fuel tab:** meal logging with hunger-type classification (Physical / Emotional / Boredom / Habit) plus a rapid-tap hydration counter.
- **Breathwork tab (the "Somatic Anchor"):** a clinical-grade pacer combining a mutable-`useRef` timer (bypasses React's setState batching so the interval never drifts from real seconds), an "Organic Halo" CSS morphing visualization, haptic pulses (`navigator.vibrate`) on phase boundaries (single pulse for inhale/exhale, double-tap for hold), and `useWakeLock` (`navigator.wakeLock.request('screen')`) to keep the screen from sleeping mid-session. Presets: **4-7-8** (sleep/severe anxiety), **Box Breathing 4-4-4-4** (focus/clarity), or a **Custom** pattern (persisted in `localStorage`). A session must run ≥5 seconds to log; on completion it's saved to the encrypted Journal.

### 8.5 My Workbooks (`pages/Workbooks.tsx`, `WorkbookDetail.tsx`, `WorkbookSession.tsx`)
Interactive, structured literature-based step-work. Answers stored one-document-per-question at `users/{uid}/workbook_answers/{workbookId_questionId}`, exclusively through `useWorkbookAnswers.ts` (TanStack Query wrapping `src/lib/workbookAnswers.ts`; optimistic-rollback mutations).

**Catalog (`src/data/workbooks.ts`):**
| Workbook | id | Structure |
|---|---|---|
| General Recovery Workbook | `general_recovery` | 25 general reflection questions, single section |
| 12-Step Workbook | `12_steps` | All 12 AA-style steps, hand-authored (Steps 2–11 rewritten under PROJ-55 with 15 unique literature-grounded context strings each, replacing an earlier generated placeholder) |
| Recovery Dharma | `recovery_dharma` | Buddhist-inspired secular recovery path (Four Truths, Eightfold Path sections) |
| Women for Recovery Workbook | `womens_recovery` | Fully populated specialty workbook |

**The Workbooks Hub** has three tabs:
- **Workbooks:** shows only what's currently in the user's library (`UserProfile.installedWorkbookIds`).
- **Marketplace (PROJ-75):** browse/add/remove the full catalog with one tap; removing only hides the workbook from the Workbooks tab, existing answers are preserved and reappear if re-added.
- **Fellowships:** outbound links to official AA/NA/SMART/Recovery Dharma/WFS sites and literature.

**Reading experience:** "Zen Mode" (distraction-free, `@tailwindcss/typography`), the question stays pinned to the top of the screen even when a mobile keyboard is open (strict flexbox: `flex-1 min-h-0` parent, `shrink-0` question, `flex-1 resize-none` textarea). `useAutoSave` debounces at 2 seconds before delegating to the encrypted-write mutation.

**AI Integration:** per-question "AI Insight" coaching via `getGeminiCoaching` (flash-lite, fast/cheap), and a whole-section/whole-workbook "Consult Compass" via `analyzeFullWorkbook`, producing Strengths/Blind Spots/a 3-step Action Plan — each action item has a `+` to instantly push it into Tasks (tagged `source: 'ai'`).

The Dashboard's "Wisdom" denominator (`TOTAL_WORKBOOK_QUESTIONS`) is computed dynamically from `WORKBOOKS`, not hardcoded, so it stays correct as content is added.

### 8.6 My Insights & Recovery Capital (`pages/InsightsLog.tsx`)
Combines two things on one page: the **ROSC Recovery Capital Matrix** and the full **AI Insights Log**.

**Recovery Capital Matrix (ROSC):** measures four SAMHSA domains — **Health, Home, Purpose, Community** — once per calendar month.
- A 5-question guided self-report (~60–90 seconds), 1–5 strength-based scale ("Thriving" at top, no failure state), auto-advancing with no back button; the last answer triggers analysis. If the AI call fails mid-flow, answers are temporarily cached so the user doesn't have to redo the check-in.
- Rate-limited to once per calendar month, matching clinical ROSC methodology and preventing compulsive reassessment.
- Results render as animated **"Pill Capsules"** — four segmented bars (1–10 each) with month-over-month trend arrows (`▲ +2`) and a prominent total (e.g. "31/40"). Once ≥2 monthly snapshots exist, the *previous* month's pills "ghost" behind the current ones for an at-a-glance momentum view.
- History is a list of expandable monthly cards.
- **Vault-locked behavior is a deliberate split:** domain scores and the total are plaintext and *always* visible (even locked); the AI narrative/strengths/growth-suggestions are AES-GCM encrypted and blur behind "Unlock vault to read your recovery story" when locked; the check-in CTA itself is hidden when locked, since starting an analysis requires decrypting journals first.
- **Free vs. Premium:** both tiers get the monthly check-in and self-report domain scores. Only Premium gets Gemini reading the last 30 journal entries alongside the check-in to produce blended AI scores, a personalized narrative, and strengths/growth suggestions (all encrypted before storage).

**AI Insights Log:** a chronological, Year/Month-grouped, filterable (All / Journal / Workbook) accordion timeline of every Compass output ever generated — journal pattern reports, workbook Wisdom Reports, deep pattern scans. Each row uses a `@headlessui/react` `<Disclosure>`; expanding reveals a "Bento Grid" of Strengths/Risks/Key Themes/Hidden Links in the Vibrant Momentum color system. "Add to Task" buttons convert AI advice into a 7-day-due `source: 'ai'` task, and self-disable after one click to prevent duplicate creation.

### 8.7 Tools Hub — the CBT/SMART Engine (`pages/ToolsHub.tsx`, `src/components/smart_tools/`, `src/components/tools/`)
Nine real, journal-persisted tools plus two ungated crisis tools, organized into four moment-based, collapsible sections (`right-now` / `before` / `after` / `big-picture`, defined in `src/lib/toolsRegistry.ts`):

- **Right Now** (expanded by default): **Urge Surfer**, **The Resentment Burner**.
- **Before It Happens** (collapsed by default): **D.E.N.T.S. Strategy**, **Cost Benefit Analysis (CBA)**, **Morning Intent**.
- **After a Hard Moment** (collapsed): **ABC Coping Tool**, **Personify & Disarm**, **Thought Record**, **Five Questions**.
- **Big Picture** (collapsed): **Lifestyle Balance (Wheel of Life)**, **SMART Goal** (disabled "Coming Soon" placeholder — no component exists yet).

Each real tool card shows a time estimate, a "Best for" persona tag, and (once used) a completion count (from `useSmartToolCompletions`), plus up to three entry points: **Start Fresh**, **Resume** (only if a draft exists), **History** (only after ≥1 completion, at `/tools/:toolType/history`).

**Architecture (PROJ-50):**
- **`SmartToolContainer<T>`** — a generic HOC/render-prop wrapper handling the vault-lock gate, session rehydration (`resumeSession`), and idempotent saves (`addJournal` for new, `updateJournal` for resumed sessions, to avoid DB bloat).
- **`GuidedWorkflowEngine`** — sits above the container for the six step-locked tools (ABCDE, CBA, DENTS, Thought Record, Five Questions, Morning Intent). Owns step navigation, `minLength`-gated "Next" enabling, `sessionStorage` draft autosave/resume (key `guidedDraft_${toolType}`), and optional debounced AI coaching prompts (`generateCBTCoachingPrompt`, Premium-only). Three tools (CBA, DENTS, Five Questions) add an `intro` phase to capture a scenario/behavior/thought that later steps dynamically reference.
- A **`DRAFT`** journal tag marks an in-progress guided save; only the tool's true completion (its dedicated summary screen's "Save to Journal") drops it.

**The nine tools, in detail:**
1. **Cost Benefit Analysis (CBA)** — name the behavior → guided 2×2 quadrant (Advantages/Disadvantages of Doing/Stopping, clinically-mandated order) → editable summary grid + Premium AI reflection.
2. **ABC Coping Tool** — guided A→B→C→D→E (Activating event, Belief, Consequence, Disputation, Effect); Disputation offers Socratic prompts, an optional ephemeral cognitive-distortion picker, and an AI prompt.
3. **D.E.N.T.S. Strategy** — "Scenario Mode": name a specific high-risk situation, then Deny/Escape/Neutralize/Tasks/Swap steps are dynamically worded against that scenario; editable color-coded summary.
4. **Morning Intent** — forward-looking (not retrospective): Terrain → Automatic Story → Reframe → Intention, planning for a day's likely challenges before they hit.
5. **Thought Record** — the classic 7-column CBT record: Situation → Automatic Thought → Emotions (rate up to 3, 0–100%) → Evidence For → Evidence Against (+ optional distortion picker) → Balanced Thought (+ AI prompt) → Emotions re-rated; summary screen "The Shift" shows the before/after delta.
6. **Five Questions** — Byron Katie's "The Work": name a thought → Q1/Q2 (Yes/No + explanation) → Q3/Q4 → Q5 (turnaround statement + 1–5 star rating, the tool's one AI prompt).
7. **Personify & Disarm** — single-page (not step-locked). Narrative Therapy "Rogue's Gallery" card grid to externalize/name addictive urges, record their lies, and write a disarming truth; auto-loads the previous session for updating over time.
8. **Lifestyle Balance (Wheel of Life)** — single-page radar chart (recharts) across 6 categories (Physical, Mental, Relationships, Work, Spiritual, Leisure); visually exposes a lopsided "flat tire."
9. **The Resentment Burner** — bypasses `SmartToolContainer` and Firestore *entirely*. Purely client-side, ephemeral: type a resentment on a notebook-paper UI, click "Burn," a hardware-accelerated SVG combustion animation destroys the text. Zero sync, zero storage, zero traces — designed for content the user never wants persisted anywhere, even encrypted.
10. **Urge Surfer** — the crisis-tier grounding tool, also reachable from the SOS modal; a 5-minute 5-4-3-2-1 somatic-method timer.

**Privacy note common to all tools:** in-progress answers live on-device as you work (so a refresh doesn't lose progress); "Save Progress"/"Exit & save draft" encrypts and persists a `DRAFT`; the final screen's "Save to Journal" is what marks completion. Every save, draft or final, goes through the same AES-GCM pipeline as a normal journal entry.

**Tool History (`/tools/:toolType/history`):** lists every completed (non-`DRAFT`) entry for one tool type, decrypted only when opened, rendered by a shared generic `PayloadSummaryList` component (humanized field labels) — no bespoke per-tool history UI needed.

### 8.8 Urge Surfer & SOS (crisis path)
Designed to be reachable in the fewest possible taps, and to work **even with the vault locked** (a deliberate exception to the "gate everything encrypted" rule, since crisis tools cannot be blocked by a PIN prompt).
- **SOS Modal:** one tap from the Dashboard header (red warning triangle). Offers Urge Surfer, Craving Buster, one-tap Call/WhatsApp Sponsor (from Profile-configured `sponsorPhone`), and 988/911 routing.
- **Urge Surfer page (`pages/UrgeSurfer.tsx`):** the 5-minute 5-4-3-2-1 grounding timer, also listed as a Tools Hub card.
- **Craving Buster (`components/games/CravingBuster.tsx`):** a ~90-second breathing-rhythm tap mini-game, reachable without unlocking the vault; if the vault happens to be locked when it finishes, the game still completes normally — the score just isn't saved to history until the vault is later unlocked (best-effort, no-op persistence).

### 8.9 Daily Readings
Shared, publicly-sourced, **unencrypted** content — one reading per day per modality, deterministically selected by day-of-year (same date → same reading for a given modality, every year — no manual curation needed client-side).

**Seven modalities** (user enables any combination in Profile → General): 12-Step (AA-inspired), 12-Step (NA-inspired), 12-Step (CA-inspired), Recovery Dharma, SMART Recovery, Secular/Stoic, Mindfulness/Buddhist. If multiple are enabled, the reading modal opens on the day's active modality and lets the user swipe between the others.

Each reading has: Theme, Body, a guided Reflection question, a closing Affirmation, and an optional "Go Deeper" link. "Journal on this" seeds a pre-filled, fully-encrypted journal entry from the reflection prompt. "Share reading" copies theme/body/reflection/affirmation (plus the MRT URL) to the clipboard or native share sheet — explicitly *never* including personal data.

**Content pipeline (server side, `functions/src/index.ts`):** a 90-day rolling buffer per modality is maintained by two scheduled Cloud Functions:
- `checkBufferHealth` (daily) — warns if a modality has <30 days of buffer remaining, flags **critical** below 14 days, and triggers regeneration for anything low.
- `generateForModality` — batches of 10 readings per Gemini call (`gemini-2.5-flash`, JSON-mode), with a copyright-trigger filter (`checkCopyright`) that rejects any generated text matching known copyrighted program-literature phrases (e.g. "Daily Reflections", "Just for Today", "AAWS"), and a Recovery Dharma-specific CC BY-SA 4.0 attribution string appended automatically where required.
- `generateReadingsAdmin` — an admin-only on-demand callable for manual buffer topping-up.

### 8.10 My Recovery Games (`pages/GamesHub.tsx`, PROJ-72)
A set of short, zero-knowledge, **anti-shame** mini-games — explicitly designed to avoid the visible-streak/shame mechanics of competitor apps ("I Am Sober," "Reframe," "Sober Grid"). Every game except Craving Buster requires the vault unlocked, since completions save to the same encrypted history as journals.

| Game | Component | What it is |
|---|---|---|
| **Craving Buster** | `CravingBuster.tsx` | ~90s breathing-rhythm tap game; the one game reachable straight from SOS without unlocking the vault |
| **Recovery Jeopardy** | `jeopardy/RecoveryJeopardy.tsx` | Pass-the-device trivia, 1–3 players/teams, two rounds + Final Jeopardy wagering — a group/sponsor activity |
| **Fast Lane** | `fastLane/FastLane.tsx` | Multi-week life-simulation: build financial/personal stability (work, study, housing, self-care) turn by turn against an AI companion pursuing the same goals. The only game with true **cross-session persistence** — autosaves to `game_saves` (`${uid}_${gameId}`) so a session can be closed and resumed later. |
| **Goal Ladder** | `goalLadder/GoalLadder.tsx` | 8-prompt momentum check-in, one rung at a time; no in-game streak/reset to break |
| **Thought Challenge** | `thoughtChallenge/ThoughtChallenge.tsx` | CBT-style matching game — match a thought to its unhelpful thinking pattern, with an optional written reframe saved to encrypted history |
| **Trigger Match** | `triggerMatch/TriggerMatch.tsx` | Pattern-recognition: match situations to trigger categories (Hungry, Angry, Lonely, Tired, Social, Environmental) |
| **Knowledge Quests** | `knowledgeQuests/KnowledgeQuests.tsx` | Bite-sized quiz packs on stress physiology, habit science, sleep, etc. — more packs added over time |

Completions write to `game_progress` (score/gameId/persona plaintext for streak/XP math, `encryptedStats`/`encryptedReflection` for any written content). Fast Lane and Recovery Jeopardy support **"Share this milestone/win"** — renders a shareable image client-side and opens the native share sheet (or downloads directly). Recovery Games data is included in JSON/PDF exports and is purged on account deletion.

### 8.11 Service Module — **planned, not implemented** (Lisa's "Digital Rolodex")
`docs/projects/05_SERVICE_MODULE.md` status: **⏸️ Paused** (paused to focus on Wave 1 Onboarding per `docs/ACTIVE_CYCLE.md`). There is **no `/service` route, no `Service.tsx` page, and no `service` Firestore collection in the current codebase** — the Dashboard's old "Service — Coming Soon" placeholder tile was reassigned to Recovery Games (PROJ-72) instead. The freemium guide (`docs-site/guide/freemium.md`) still lists it under Premium as *"Coming Soon."*

**Planned design** (from the spec, for when this resumes): a sponsor's private list of sponsees (Active/Alumni tabs) and service commitments. Sponsee `name`, `contact`, and `notes` would be encrypted with the *sponsor's* PIN — the sponsee, even if they use MRT themselves, would have no access to the sponsor's notes about them. If the sponsor loses their PIN, sponsee data is lost with it, same as any other encrypted content.

The only currently-live thing with a similar name is `src/components/admin/FriendsDirectory.tsx` — an **Admin Dashboard** sub-feature (a searchable list of all app users, called "Friends" in the UI per fellowship tradition), which is unrelated to the sponsor/sponsee Service Module.

### 8.12 My Profile (`pages/Profile.tsx`)
Four tabs (`general` / `security` / `data` / `achievements`, deep-linkable via `/profile/:tab`); during onboarding, only `general` is shown until the user saves a Display Name + Sobriety Date.

- **General:** Display Name, Sobriety Date, Sponsor contact (`sponsorName`/`sponsorPhone`, unencrypted, powers the SOS modal's one-tap call/WhatsApp), substance-cost config (drives the Dashboard's Financial Freedom tracker), Hero Color picker, Anchor Notification badge toggles, Daily Reading modality preferences, and the outbound link to the published User Guide.
- **Security:** PIN management — **Change PIN** (runs the full rotation flow, §5.3, with a progress bar the user is warned not to interrupt) and **Reset Vault** (crypto-shredding, §5.3, for a lost PIN).
- **Data:** Google Drive Auto-Sync status/toggle, Manual JSON export, PDF export, Legacy JSON import, and the **Danger Zone** → Account Deletion.
- **Achievements (PROJ-76):** the relocated Rank/Level/XP/Archetype display and the six bento-tile stat numbers (Journal streak, Habit Fire, Vitality Rhythm, Workbook Wisdom, etc.) that used to live on the Dashboard.

### 8.13 Data Export, Cloud Sync & Account Deletion
- **Google Drive Auto-Sync:** opt-in via Google Sign-In with the restricted `drive.file` OAuth scope (the app can only see/modify the one backup file it creates). Every 7 days, while the vault is unlocked and online, a silent background export decrypts all data and PATCH/POSTs `mrt_backup.json` to the user's Drive. **This backup file is intentionally unencrypted plaintext** — a deliberate tradeoff so the user retains a readable copy of their history even if they permanently forget their MRT PIN.
- **Manual export (`src/lib/exporter.ts`):**
  - **JSON:** all collections (journals, tasks, workbooks, Recovery Games), fully decrypted client-side (including `game_progress`'s `encryptedStats`/`encryptedReflection`, via the same `processInChunks` helper used elsewhere), warned in the UI to be stored securely.
  - **PDF (`jsPDF`/`jspdf-autotable`):** a formatted, printable report of Journals, Tasks, and (if present) Recovery Games history — for therapy/sponsorship sessions.
- **Import (`src/lib/importer.ts`):** parses legacy and current-schema JSON backups, auto-maps older structures, and flags imported entries `isEncrypted: false` — they get encrypted the next time the user edits and saves them.
- **Account deletion (`src/lib/deletion.ts` → `executeTotalAccountAnnihilation`):** click "Request Account Deletion" in the Danger Zone → forced re-authentication (Firebase throws `auth/requires-recent-login` for destructive actions on a stale session, so the modal collects password or Google re-auth) → recursive, chunked `batch.delete()` across `journals`, `tasks`, `insights`, `ai_logs`, `feedback`, `game_progress`, `game_saves`, and all subcollections → `deleteUser()` destroys the Auth record. Also reachable **without opening the app** at `myrecoverytoolkit.ca/delete-account` (a standalone public route), sign in and confirm, same cryptographic shredding runs immediately.

### 8.14 Admin Dashboard (`pages/AdminDashboard.tsx`, `/admin`)
Restricted via a **split-authority RBAC model**: the `role` field on `users/{uid}` grants *UI* access to the Admin nav item/route immediately, but *database* access requires `request.auth.token.admin == true` (a Firebase custom claim), which must be granted out-of-band by the server-side script `scripts/set_admin_role.cjs`. A non-admin hitting `/admin` is redirected to `/dashboard`.

Five tabs:
1. **Analytics** — `AnalyticsCharts.tsx`, reads `ai_logs` (model distribution, token usage) for Gemini cost monitoring.
2. **Users → Friends Directory** — `FriendsDirectory.tsx`, searchable `users` list; toggling `role` here only changes UI access (see above).
3. **Health** — `ErrorLogViewer.tsx`, reads `client_errors`; can run a Gemini-powered "System Health Report" (`system_health_analysis`) that triages/groups raw error logs into root causes and suggested fixes.
4. **Feedback** — `FeedbackViewer.tsx`, reads the `feedback` collection; shows `buildHash`/`route` to help reproduce bugs.
5. **Maintenance** — `DeduplicationTool.tsx` (scans/cleans duplicate journal entries from bad imports) and `SchemaMigration.tsx` (upgrades legacy documents to current type shapes).

### 8.15 Feedback (`FeedbackModal.tsx`)
Reachable from the sidebar on every page. Writes to the unencrypted root `feedback` collection (the UI explicitly warns users not to include PII/recovery content — admins need to triage bugs without needing the user's PIN). Auto-attaches `buildHash`, `environment` (DEV/UAT/PROD), `vaultUnlocked`, `route`, and `userAgent` for reproducibility.

---

## 9. Gamification Engine (`src/lib/gamification.ts`)

XP economy:
| Action | XP |
|---|---|
| Journal entry | 25 (+10 bonus if >50 words) |
| Task completion | 10 (Low) / 25 (Medium) / 50 (High) |
| Workbook question answered | 15 |
| Vitality log | 15 |
| ROSC monthly check-in | 25 |
| SMART/CBT tool completion (guided, non-draft) | 25 |
| Recovery Game completion | 20 |
| Clean-time milestone | 500 per 30 days |

**Level curve:** `level = floor(0.07 × sqrt(totalXP)) + 1` (an inverse-square RPG curve, tuned so Level 10 ≈ 20,000 XP). Titles by level: Seeker (1–9) → Initiate (10–19) → Warrior (20–29) → Architect (30–39) → Guide (40–49) → Elder/Sponsor (50+).

**Archetype:** whichever XP "bucket" (wisdom = workbooks, action = tasks + games + SMART tools, vitality = vitality logs, reflection = journal entries) is largest determines the user's persona label: **Scholar**, **Doer**, **Monk**, or **Philosopher** (or "Balanced" if no bucket dominates).

**Display location:** since **PROJ-76**, none of this renders on the Dashboard anymore — it lives entirely in **Profile → Achievements**.

**Milestone assets:** a 12-medallion pipeline (30/60/90 days, 4–11 months, 1 year, then every additional year) rendered on `SobrietyHero.tsx`.

---

## 10. AI Integration & Intelligence Layer

**Privacy boundary:** AI analysis is strictly opt-in and stateless. Content is decrypted only in-browser, sent to the `generateAIInsights` Cloud Function proxy (never directly from client to Gemini), processed once, and discarded — Google does not train public models on this data.

**The six approved call sites for decrypted content** (per `CLAUDE.md`; the *only* carve-out to "never send sensitive content to Gemini"):
1. `useDeepPatternAnalysis.ts` → 90-day journal deep-pattern scans
2. `useROSCAssessments.ts` → `generateROSCAnalysis`
3. `JournalAnalysisWizard.tsx` → `generateComparativeAnalysis`
4. `WorkbookDetail.tsx` → `analyzeWorkbookContent`
5. `GuidedWorkflowEngine.tsx` → `generateCBTCoachingPrompt` (PROJ-50)
6. `CBATool.tsx` → `generateCBAReflection` (PROJ-50 Phase 3)

**Model selection (`getModelForType`, server-side, `functions/src/index.ts`)** — a single switch statement, no cascade/fallback:
- **`gemini-2.5-flash`** (default, deep reasoning): `deep_pattern_analysis`, `comparative_analysis`, `system_health_analysis`, `workbook_analysis`, `rosc_assessment`.
- **`gemini-2.5-flash-lite`** (fast/cheap): `journal_analysis`, `workbook_coach`, `cbt_coaching_prompt`, `cba_reflection`, `audio_analysis`.

There is no automatic fallback on model failure — errors propagate to the client as a toast.

**Strict JSON enforcement:** every system prompt specifies an exact JSON schema and appends *"Return ONLY raw JSON. No Markdown."*; responses pass through a `cleanJSON()` helper to strip stray code fences.

**Rate limiting (Free tier, enforced server-side against `usage_limits` timestamps on the user doc — not just client-side UI hiding):**
| Analysis | Free-tier limit |
|---|---|
| Deep Pattern Analysis (90-day) | 1 per 30 days |
| ROSC Assessment (AI-blended) | 1 per 30 days |
| Comparative Analysis — weekly | 1 per 7 days |
| Comparative Analysis — monthly / all-time | 1 per 30 days |

Premium bypasses all of the above.

**Analysis types and what each returns:** journal sentiment/mood/summary/next-steps (`journal_analysis`); 90-day pattern summary + core triggers + emotional velocity + hidden correlations + relapse risk level + 3 pieces of long-term advice with contexts (`deep_pattern_analysis`); trajectory/themes/wins/blind-spots/advice (`comparative_analysis`); triaged error report with suggested fixes (`system_health_analysis`); workbook Strengths/Blind-Spots/Action-Plan (`workbook_analysis`); blended 4-domain ROSC scores + narrative + strengths + growth areas (`rosc_assessment`); one-line workbook-question coaching (`workbook_coach`); one 15-word Socratic follow-up (`cbt_coaching_prompt`); one 30-word CBA reflection (`cba_reflection`); verbatim transcription + sentiment + mood + tags from audio (`audio_analysis`).

---

## 11. Network Resilience, Offline Support & Notifications

- **Offline-first Firestore:** local IndexedDB persistence lets users create tasks, journal, and answer workbook questions with zero connectivity; writes sync automatically on reconnect. `LayoutContext.tsx` tracks `isOnline` via `online`/`offline` window events; `AppShell` shows a persistent red banner when offline.
- **PWA / Service Worker:** Vite PWA + Workbox, `autoUpdate` strategy (a `PWAUpdateBeacon` component controls when the update actually applies to avoid yanking content mid-session). Caching: Google Fonts `CacheFirst` (1-year), Firebase Storage `StaleWhileRevalidate`; Firebase Auth endpoints (`/__/auth`) are explicitly excluded from caching to prevent login-loop bugs.
- **Installation:** iOS requires manual "Add to Home Screen" via Safari's Share sheet (Apple restriction, also the gate for push notifications); Android/desktop use the native `beforeinstallprompt` flow, or manual "Install app" from the browser menu. `PWAInstallBanner.tsx` remembers a dismissal permanently via `localStorage`.
- **The Beacon (`dailyBeacon`, scheduled Cloud Function, daily at 12:00 UTC):** paginated (300 users/batch) over all `users` with `fcmTokens`, sends a milestone-celebration push if today is a tracked clean-time milestone (1, 7, 30, 60, 90, 120...365-day steps, then every 365), else a habit-nudge push if there are pending tasks due today. Prunes dead FCM tokens automatically on send failure (`messaging/invalid-registration-token` etc.).

---

## 12. Billing / Premium Tiers

**Free (Standard):** unlimited journaling, tasks/habits with Smart Reset, full Dashboard, unlimited Vitality tracking + 4-7-8 breathwork, metered AI (1 weekly / 1 monthly / 1 deep-pattern scan per period), 1 ROSC self-report check-in/month (no AI journal analysis).

**Premium ("Supporter"):** unlimited on-demand AI Compass, full AI-blended ROSC (Gemini reads the last 30 journal entries), custom Markdown journal templates, Cloud Auto-Sync, PDF exports, and (once un-paused) the Service Module.

**Upgrade flow:** clicking a Premium-gated feature or `/premium` (`PremiumUpgrade.tsx`) creates a Firestore doc in `users/{uid}/checkout_sessions`, which a Stripe Firebase Extension picks up and writes back a Stripe Checkout `url` (listened for via `onSnapshot`, with a 10s timeout) — `window.location.assign()`s the user to Stripe. On the **Android TWA build**, purchases are redirected to the web (`isAndroidTWA()` check) since Play Store policy requires web-based billing for this app's model; existing Premium users can still manage/cancel from inside the app.

**Server-side sync (`syncStripeSubscription`, Firestore-triggered Cloud Function):** listens to `users/{userId}/subscriptions/{subscriptionId}` writes (a collection whose `firestore.rules` deny *all* client writes — only the Stripe extension/Admin SDK can write there); on a status change to `active`/`trialing` it sets `users/{uid}.tier = 'premium'` and a matching `premium: true` Auth custom claim; anything else sets `tier = 'free'`.

---

## 13. Infrastructure, Build & Deployment

- **Dev environment:** Codespaces container (`mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye`); `setup.sh` installs `firebase-tools` + npm deps; secrets materialize into `.env` on boot. Ports: 5175 (Vite), 9099 (Auth emulator), 8080 (Firestore emulator).
- **Build (`vite.config.ts`):** manual chunk splitting — `firebase`, `gemini` (`@google/generative-ai`), `recharts`, and a catch-all `vendor` chunk — to keep initial load small on low-end mobile devices.
- **CI/CD (GitHub Actions):** the "Nuclear" secrets strategy — secrets are never passed as shell env vars; the workflow writes a physical `.env` file to the ephemeral runner's disk immediately before `npm run build`, and the runner (and file) is destroyed after.
- **Branch → environment mapping:** `feature/*` → DEV (`mrt2-app-dev`), `release/*` → UAT (`mrt2-app-uat`), `main` → PROD (`mrt2-app-prod`).
- **Firestore:** `firestore.rules` enforces per-user tenancy (`resource.data.uid == request.auth.uid`) plus admin custom-claim RBAC; `firestore.indexes.json` defines composite indexes (e.g. `journals` by `uid`+`createdAt desc` for the timeline).
- **Automated versioning:** `scripts/generate-build-info.js` MD5-hashes `src/` pre-build and injects the hash into `src/build-info.json`, surfaced by `VersionBadge.tsx` and cross-referenced in feedback reports.
- **Persona seeding:** `scripts/seed-personas.js` resets a demo environment with 4 persona accounts, including valid PBKDF2 salts/keys so encrypted features work out of the box in demos.
- **Cloud Functions region:** all functions in `functions/src/index.ts` are pinned to `northamerica-northeast1`.

---

## 14. Documentation & Governance

- **`docs/SYSTEM_OVERVIEW.md`** — the internal living architecture doc (component/hook/schema map).
- **`docs/SECURITY_ZERO_KNOWLEDGE.md`** — the canonical encryption-lifecycle writeup.
- **`docs/specs/*.md`** — one spec per feature domain (18 files as of this writing), each following `docs/projects/00_TEMPLATE.md`'s required sections; validated by `npm run docs:check-specs`.
- **`docs/projects/*.md`** — per-project (PROJ-NN) build logs; `docs/projects/archive/` holds superseded ones.
- **`docs-site/`** — the *published*, external VitePress user guide (`guide/01-getting-started.md` through `11-recovery-games.md`, plus `freemium.md`, `installation.md`, `support/faq.md`, `support/changelog.md`), linked from Profile ("View User Guide") and Links ("Install App Guide"). **There is no in-app guide component** — `UserGuide.tsx` does not exist in `src/pages/`; the app always links out to the published site in a new tab.
- **Dev workflow — the Recursive Build Protocol** (`docs/governance/DEVELOPER_GUIDE.md`): Ingestion → Definition → Execution → Crystallization. Crystallization requires updating `docs/specs/`, running `npm run export:llm` if files were added/removed, and updating `SYSTEM_OVERVIEW.md`.
- **Governing rule for new features:** `CLAUDE.md` requires a `docs/projects/XX_FEATURE.md` spec to exist *before* any implementation planning begins.

---

## 15. Quick-Reference: "Is this data encrypted?"

| If it's... | Then... |
|---|---|
| Journal text, mood notes, Vitality log details, any CBT/SMART tool's answers | **Encrypted** (part of `journals.content`) |
| Workbook step-work answers | **Encrypted** (`workbook_answers.answer`) |
| ROSC AI narrative/strengths/growth-suggestions | **Encrypted** (`encryptedAIContext`); the numeric scores themselves are plaintext |
| Recovery Games written reflections | **Encrypted** (`encryptedReflection`); score/gameId are plaintext |
| Fast Lane in-progress save state | **Encrypted**, whole blob (`game_saves`) |
| Sponsor's planned sponsee names/notes | Would be **encrypted** (spec only — feature is paused, not built) |
| Tasks, streaks, priorities, categories | **Not encrypted** (needed for streak/reset logic without decryption) |
| AI Insights summaries (`insights` collection) | **Not encrypted** (treated as coaching output, not raw disclosure) |
| Sponsor phone/name, hero color, sobriety date, financial-savings config | **Not encrypted** (profile metadata, not recovery content) |
| Feedback/bug reports | **Not encrypted**, by explicit design (admin triage without needing the user's PIN) |
| Daily Readings | **Not encrypted** (shared, publicly-sourced content) |
| Google Drive auto-backup file | **Not encrypted** (deliberate — the user's readable safety net if they forget their PIN) |
