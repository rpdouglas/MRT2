# 💳 Premium Tier Gating Audit

**Date:** 2026-09-01
**Trigger:** Surfaced while scoping `docs/projects/105_PLAY_BILLING_TWA.md` (Android Play Billing) — before building a second payment platform, audited whether the existing premium-gating model (governance awareness, current gates, doc accuracy, and further gating candidates) is actually correct and complete.
**Result:** Governance docs (`CLAUDE.md`/`GEMINI.md`) had zero mention of the premium/billing model at all — fixed. Two internal-doc inaccuracies found and fixed. One user-facing marketing-copy inaccuracy found, **not fixed — needs your call, see §4**. One urgent, pre-existing cost-control gap found — **not fixed, needs your call, see §3**.

---

## 1. Governance gap (fixed)

`CLAUDE.md` and `GEMINI.md` — the two files every AI coding session in this repo reads first — had **zero** mentions of `tier`, `premium`, or `billing` before today, despite the app having a live Stripe-based freemium model since before this session started. Any AI agent building a new feature had no structural nudge to ask "should this be tier-gated or rate-limited," which is very plausibly *why* the three gaps in §3 exist. Fixed: both files now have a "Premium Tier & Billing" section (`CLAUDE.md` full version, `GEMINI.md` condensed) covering the `tier`/`tierSource`/`usage_limits` mechanism, the `<PremiumGate>` component, the "gate the feature not just the button" rule (from the real bug in §2), the known cost-control gap (§3), the crisis-features-are-never-gated rule, and a pointer to `PROJ-105` for the in-progress Android billing work.

---

## 2. Current gating — verified against code, not assumed from docs

| Feature | Gate mechanism | Free-user experience |
|---|---|---|
| PDF export | `<PremiumGate fallbackMode="button_swap">` (`DataExportPanel.tsx:123`) | Locked CTA, real gate |
| JSON export | *(ungated, by design)* | Free — matches Walt's data-sovereignty story |
| Custom journal templates | Entry button only (`JournalEditor.tsx:295-299`) | **Bypassable** — `/templates` route and `TemplateEditor.tsx` have zero tier checks; any free user typing the URL gets full access. Not a policy choice, a real bug. |
| CBA Tool AI reflection | `userTier !== 'premium'` guard (`CBATool.tsx:107,207-221`) | Real gate |
| In-workbook AI coaching micro-prompts | `step.aiPromptEnabled && userTier === 'premium'` (`GuidedWorkflowEngine.tsx:132`) | Real gate — rest of the workbook flow works normally, just no AI prompt |
| AI Compass scans (weekly/monthly/deep-dive) | `usage_limits` cooldown, server-enforced (`functions/src/index.ts:1360-1418`), premium bypasses it entirely (`useRateLimits.ts:12,34`) | **Not binary** — free users get scans too, just cooldown-limited (7d/30d/30d). "Unlimited" is the premium perk, not "any access at all." |
| ROSC/Recovery Capital AI insight narrative | `isPremium && isVaultUnlocked` (`useROSCAssessments.ts:86`) | Scores always free; AI narrative gated |
| Admin manual override | `FriendsDirectory.tsx` `handleGrantVIP`/`handleRevokeVIP`, `tierSource: 'manual'` | Independently enforced server-side — verified `firestore.rules:91-94` blocks `tier`/`tierSource`/`role` writes for any non-admin, so this only works because the caller is an admin, not because the UI happens to hide the button. No gap here. |

**Type drift, not a bug but worth knowing:** `src/lib/db.ts:30` declares `tierSource?: 'stripe' | 'manual'`, but `syncStripeSubscription` actually writes the literal string `"Stripe-Managed"` — the type union has never matched the real Stripe-path value. Harmless today (nothing compares `=== 'stripe'`), but worth fixing in the same change that adds `PROJ-105`'s `'play-billing'` value, rather than adding a third mismatched string.

---

## 3. Urgent, pre-existing gap: three AI flows with zero cap — needs your decision

Independent of any new monetization idea, these three of the nine approved Gemini flows have **no tier check and no rate limit at all** — a free (or premium) user can call them without any bound today:

- **`WorkbookDetail.tsx` → `analyzeWorkbookContent`** (`src/pages/WorkbookDetail.tsx:83`) — per-section, whole-workbook, *and* "Global Recovery Review" (all workbooks combined) analysis, uncapped.
- **`WorkbookSession.tsx` → `getGeminiCoaching`** (`src/pages/WorkbookSession.tsx:107`) — inline per-question AI coaching, callable once per question, no limit on how many questions/sessions.
- **`AudioRecorder.tsx` → `generateAudioAnalysis`** (`src/components/journal/AudioRecorder.tsx:82`) — voice-journal transcription/analysis, uncapped.

This is a live cost-control problem, not a "could we monetize this" question — every call to these hits the real `generateAIInsights` Cloud Functions proxy → Gemini API, with real per-call cost, and nothing stops one user from calling them thousands of times. **This should get a fix regardless of whether you also decide to premium-gate them** — at minimum, the same `usage_limits`-style cooldown the other AI flows already use. Not fixed in this pass — flagging for a decision on priority (this is arguably more urgent than `PROJ-105` itself, since it's an active cost exposure, not a missed-revenue opportunity).

---

## 4. User-facing marketing inaccuracy — needs your decision, not fixed

`PremiumUpgrade.tsx`'s Premium-tier marketing copy lists **"Service Network Access"** as a paid perk. There is no such feature anywhere in the codebase — `PROJ-05` (The Service Network / sponsee rolodex) is paused with no UI built (`docs/ROADMAP.md`). This means **current paying subscribers may be looking for a feature that doesn't exist**, based on the app's own upsell page. This is more than a docs-accuracy issue — it's live, user-facing copy on a paid product. Two honest options, both requiring a product call:
- **Remove the line** from the marketing copy now, so the app stops promising something it doesn't deliver.
- **Keep it, but only if `PROJ-05` is genuinely near-term** — otherwise it's a standing overpromise.

Not touched in this pass. Let me know which way to take it and I'll make the edit.

---

## 5. Further gating candidates — grounded in what's actually built, not speculative

- **Fast Lane** (`docs/projects/72_RECOVERY_GAMES.md:78`) — the one genuinely differentiated game in the 8-game suite: a multi-week persistent simulation with its own save-slot collection (`game_saves`), explicitly built for the Walt persona. The most plausible "this specific game is premium" candidate — the other 7 are short, static-content, single-sitting quizzes with low differentiation value per-game, so a blanket games paywall isn't well-supported by what the games actually are. **Craving Buster is explicitly crisis/SOS-adjacent (hooked to the 1-tap SOS button, matching `UrgeSurfer`'s crisis-tool exemption) — correctly off-limits, not a candidate.**
- **Unlimited insight history** (`InsightsLog.tsx`, `src/lib/insights.ts:58`'s `getInsightHistory()`) — every AI insight ever generated is visible forever, free or premium, no limit param at all. Since this only *displays* already-generated, already-encrypted content (no fresh Gemini call), it's cheap to serve either way — but a "recent-N free, full history premium" model would fit the same Walt-persona "depth/export" story `CLAUDE.md`'s Personas section already uses to justify the PDF-export gate, without needing new infrastructure.
- **Fix, don't just gate, custom templates** (§2) — this is really a bug-fix, not a new opportunity: enforce the existing intent (premium-only templates) at the `/templates` route and `TemplateEditor.tsx` level, not just the entry button.

**Explicitly not candidates, confirmed correctly free:** SOS, Urge Surfer, Craving Buster, sponsor/hotline contact, the sobriety counter, core journaling, core task tracking. None of these were found to have any tier check — as expected, and not a gap.

---

## 6. Recommended next steps

1. Decide the priority of §3 (uncapped AI cost exposure) — likely worth fixing before or alongside `PROJ-105`, independent of the Play Billing timeline.
2. Decide §4 (fictional "Service Network Access" marketing line) — remove or keep-as-planned.
3. If interested in §5's candidates, each would need its own spec per `CLAUDE.md`'s spec-first rule before implementation — none built or scoped in this pass, this is a findings report only.
