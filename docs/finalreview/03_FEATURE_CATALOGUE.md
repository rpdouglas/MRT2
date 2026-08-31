# MRT2 — Complete Feature Catalogue

*Compiled from `src/App.tsx`'s full route table, every page/component file it references, and cross-referenced against 72 numbered specs in `docs/projects/`. All features listed were confirmed to exist in code — nothing here is inferred from marketing copy alone.*

## Legend
- **Route:** `PrivateRoute` = auth required. `+VaultGate` = additionally requires the ZK vault PIN unlocked.
- **Maturity:** 🟢 Polished/complete · 🟡 Built but soft-hidden/de-emphasized · 🔴 Stub/not built

---

## 1. Public / Onboarding Surface

| Feature | Route | Purpose | Maturity |
|---|---|---|---|
| Welcome (marketing splash) | `/` | Persona-driven marketing + inline auth | 🟢 |
| Login | `/login` | Combined login/signup, Google OAuth + email/password | 🟢 |
| Links | `/links` | Link-in-bio style landing page | 🟢 |
| Delete Account (public portal) | `/delete-account` | Google Play Data Safety-mandated deletion path | 🟢 |

## 2. Core Recovery Tools

| Feature | Route | Purpose | Primary Persona(s) | Maturity |
|---|---|---|---|---|
| Dashboard | `/dashboard` | Sobriety-day hero, 6-tile bento nav, milestone confetti | All (David: max-3-tap floor) | 🟢 |
| Dynamic Anchor Widget | embedded | Time-of-day nudge: daily reading + journal check-in | David, Ned | 🟢 |
| Journal | `/journal` +Vault | Write/History/Insights, mood/tags/weather/voice-AI | All, esp. Walt | 🟢 |
| Journal Analysis Wizard (AI) | modal | Comparative AI analysis over journal history | Walt, Maya, Ned | 🟢 |
| Template Editor | `/templates` | Custom journal template CRUD | Maya, Walt | 🟢 |
| Tasks ("The Ledger") | `/tasks` | Recurring/one-off task manager, streak-safe by design | Ned, David, Jordan | 🟢 |
| Workbooks (library) | `/workbooks` +Vault | Installed library + marketplace + fellowship links | Maya, Walt | 🟢 |
| Workbook Detail + AI review | `/workbooks/:id` | Section list, mastery %, scoped AI analysis | Maya, Walt | 🟢 |
| Workbook Session (zen-mode) | `/workbooks/:id/session/:id` | One-question-at-a-time flow, live AI coaching | Maya, David | 🟢 |
| Vitality (Move/Fuel/Breath) | `/vitality` +Vault | Somatic wellness tracking, "Bio Balance" ring | Lisa, all | 🟢 |

## 3. AI / Insights ("Recovery Compass")

All 9 flows below are the exact set explicitly approved in `CLAUDE.md` for sending decrypted content to Gemini — confirmed to match, with no undocumented 10th flow found.

| Feature | Trigger point | Gemini function | Maturity |
|---|---|---|---|
| Insights Log (Wisdom Log) | `/insights` +Vault | (archive of saved insights) | 🟢 |
| Deep Pattern Analysis | hook-driven | `generateDeepPatternAnalysis` (90-day window) | 🟢 |
| Recovery Capital / ROSC Assessments | `/insights/rosc` +Vault | `generateROSCAnalysis` | 🟢 |
| Journal Analysis Wizard | `/journal` → Insights | `generateComparativeAnalysis` | 🟢 |
| Workbook AI Review | `/workbooks/:id` | `analyzeWorkbookContent` | 🟢 |
| Guided CBT Coaching | CBA/ABC tools | `generateCBTCoachingPrompt` | 🟢 |
| CBA Reflection | `/tools/cba` | `generateCBAReflection` | 🟢 |
| Live Workbook Coaching | `/workbooks/:id/session/:id` | `getGeminiCoaching` | 🟢 |
| Voice Journal Transcription | Journal → Write | `generateAudioAnalysis` | 🟢 |
| System Health AI (admin-only) | `/admin` → Health | `analyzeSystemHealth` | 🟢 |

## 4. SMART/CBT Tools Hub (`/tools`)

10 guided tools across 4 moment-based categories (Right Now / Before It Happens / After a Hard Moment / Big Picture) + 2 crisis tools that bypass the vault gate entirely.

| Tool | Type | Crisis-safe (no VaultGate)? | Maturity |
|---|---|---|---|
| Urge Surfer | Guided timer | ✅ Yes — plaintext fallback if vault locked | 🟢 |
| Resentment Burner | Cathartic ritual (not persisted) | ✅ Yes | 🟢 |
| CBA Tool | Guided 2×2 cost/benefit | No | 🟢 |
| ABC(DE) Tool | REBT flow | No | 🟢 |
| D.E.N.T.S. Tool | High-risk scenario planning | No | 🟢 |
| Personify & Disarm | Narrative externalization | No | 🟢 |
| Lifestyle Balance | Wheel-of-Life radar chart | No | 🟢 |
| Thought Record | 7-column CBT record | No | 🟢 |
| Five Questions | Byron Katie's "The Work" | No | 🟢 |
| Morning Intent | Forward-looking daily planning | No | 🟢 |
| Tool History | Cross-tool readable history | No | 🟢 |
| "SMART Goal" tool | — | — | 🔴 **Stub** — `status: 'coming_soon'`, greyed, no backing component |

## 5. Recovery Games (`/games`)

A genuinely distinctive feature: explicitly anti-shame ("no timer, no streak, no score kept" is the hub's own copy).

| Game | Type | Persona | Maturity |
|---|---|---|---|
| Craving Buster | Scored breathing-rhythm tap game | David (SOS-reachable) | 🟡 Built, `active: false` (soft-hidden, still reachable via SOS) |
| Recovery Jeopardy | Pass-the-device group trivia | Lisa / groups | 🟢 |
| Fast Lane | Multi-week economic sim vs. AI rival | Walt | 🟢 The most complex game; only resumable multi-session save |
| Goal Ladder | Momentum-building tap-through | Ned | 🟢 |
| Thought Challenge | CBT reframing quiz | Lisa (sponsor burnout) | 🟡 Built, `active: false` (soft-hidden) |
| Trigger Match | H.A.L.T. pattern-recognition quiz | Walt | 🟢 |
| Knowledge Quests | Psycho-education quiz packs | All | 🟢 |
| Daily Crossword | Nightly Gemini-generated puzzle | All | 🟢 Excluded from XP by design |

## 6. Service Module — Sponsor Tools ⚠️

| Feature | Status |
|---|---|
| Digital sponsor "rolodex" (PROJ-05) | 🔴 **Not built.** Zero route, zero page file exists. Spec explicitly marked "⏸️ Paused... to focus on Wave 1 Onboarding." Its originally-reserved Dashboard entry point was since reassigned to Recovery Games — resuming now requires new UX design work, not just resumed coding. **This is the single largest gap relative to a named persona's (Lisa's) core stated need**, and Lisa is documented as the "Primary Viral Driver." |

## 7. Admin Panel (`/admin`, hard `isAdmin` server-verified gate)

| Tab | Purpose | Maturity |
|---|---|---|
| Analytics | Gemini usage metrics (model mix, token usage) | 🟢 |
| Users (Friends Directory) | User directory, role/tier management | 🟢 |
| Health | Client error log viewer + AI root-cause analysis | 🟢 |
| Inbox | Live feedback triage workflow | 🟢 |
| Tools | Deduplication + one-off schema migration utilities | 🟢 |

## 8. Account / Settings (`/profile`)

| Feature | Maturity |
|---|---|
| Profile (identity, financial calc, notification prefs, PIN rotation, vault reset) | 🟢 (largest single page file at 50KB) |
| Achievements Tab (XP, streaks, level — deliberately opt-in, off the main Dashboard for Walt's "zero gamification" need) | 🟢 |
| Data Management (Export JSON/PDF, Import legacy JSON, Account Deletion) | 🟢 |
| Daily Readings modality preferences | 🟢 |

## 9. Notifications / PWA / Platform

| Feature | Maturity |
|---|---|
| SOS Modal (crisis quick-access, global overlay) | 🟢 |
| Push Notifications ("The Beacon" daily cron) | 🟢 |
| PWA Install Banner | 🟢 |
| PWA Update Beacon (controlled SW update) | 🟢 |
| Changelog Beacon (in-app release notes toast) | 🟢 |
| Feedback Modal (user-facing submission) | 🟢 |
| Google Drive Auto-Backup (silent, weekly) | 🟢 |
| Vault Gate / PIN system | 🟢 The most security-critical UI in the app |

## 10. Premium / Monetization

| Feature | Maturity |
|---|---|
| Premium Upgrade (Stripe Checkout + Billing Portal, TWA-gated for Play Store compliance) | 🟢 |
| Premium Gate (reusable feature-lock wrapper, e.g. PDF export) | 🟢 |

---

## Cross-Cutting Findings

1. **~30 substantive features, ~68 mapped specs, 1 genuine stub, 1 unbuilt module, 2 soft-hidden games.** This is a high spec-to-code ratio — the large majority of user-facing surface area has a matching, CI-enforced `docs/projects/*.md` spec.
2. **The single most significant product gap is the Service Module.** It is the only fully-unbuilt feature tied to a *named, high-priority persona* (Lisa, "Primary Viral Driver" per `CLAUDE.md`). See `07_GAP_ANALYSIS.md` and `12_ROADMAP.md` for prioritization.
3. **Minor doc/code drift found (low severity):** two in-code comments reference project numbers (`PROJ-28` for Resentment Burner, `PROJ-19` for PWAUpdateBeacon) with no corresponding spec file currently in `docs/projects/` — both features are fully built; only spec traceability is missing (likely archived/renumbered).
4. **`/debug` (Time Travel Debugger) is reachable by any authenticated user**, not just admins — flagged in the Architecture and Security reviews as a posture inconsistency worth closing before wider distribution.
