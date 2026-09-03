# Insights → Recovery Capital → Snapshot — `/insights/rosc` (tab: snapshot)

**Source:** `src/pages/RecoveryCapital.tsx` (tab logic + check-in trigger) + `src/components/insights/{ROSCLatestCard,ROSCPillCapsules,ROSCCheckIn}.tsx` + `src/hooks/useROSCAssessments.ts`
**Personas:** Lisa (the check-in as a self-care practice — her palette, per `docs/projects/49_ROSC_MATRIC.md`); Maya (exact segmented scores, month-over-month deltas); relevant to Walt only as the entry point into Trends/History, where his interest actually lives.
**Tier:** Free — self-report-only scores, monthly cadence. Premium — AI-augmented scores (reads decrypted journal history) plus a full narrative, weekly cadence. Both tiers land on this tab and see a populated card; the free/premium difference is in how the score was computed and what unlocks on expansion, not whether the tab renders.
**Zero-knowledge status:** Writes and reads `users/{uid}/rosc_assessments/{id}` — `scores.*.score`/`.selfReportedScore`/`.evidenceCount`, `totalScore`, `trajectory`, `journalEntriesAnalysed` are plaintext; `encryptedAIContext` (narrative/strengths/growth_areas/evidence/actions) is AES-GCM, populated only on the premium path. Premium's score computation is one of CLAUDE.md's nine approved Gemini flows (`generateROSCAnalysis`, called from `useROSCAssessments.ts`).

## What it does

The default tab on `/insights/rosc`: a single glassmorphic card showing the user's most recent Recovery Capital check-in — a total score out of 40 and four animated "pill capsule" bars (Health/Home/Purpose/Community, each 0–10), plus the delta from the previous assessment. This is also where a new check-in is launched — a CTA button above the tab strip ("Start this week's/month's check-in" or "Continue your check-in") swaps the whole page into `ROSCCheckIn.tsx`'s full-screen 5-question flow rather than opening a modal.

## How it works

### Tab mechanics (verified against code)
`RecoveryCapital.tsx` defines `type Tab = 'snapshot' | 'trends' | 'history'` and seeds `useState<Tab>` from `searchParams.get('tab')` (defaulting to `'snapshot'`) — so a deep link like `/insights/rosc?tab=trends` (used by `ROSCSummaryCard`'s "View trends & history" link) opens on the right tab on load. **However**, unlike Journal's `?tab=` pattern, clicking a tab button here only calls `setTab(t)` — it never calls `setSearchParams`. The URL is not kept in sync after the initial read: switching tabs client-side does not update the address bar, so a mid-session refresh reloads whatever tab the URL originally named (usually `snapshot`), not the tab the user was last looking at. This is a one-way, read-on-mount-only version of the URL-param pattern, distinct from both Journal's fully-synced `?tab=` and Vitality's fully-local `useState` with no URL involvement at all.

The tab content is conditionally rendered (`{tab === 'snapshot' && ...}`) inside one component instance — there's no per-tab unmount/remount cost like Vitality's fully separate tab components, since all three tabs read from the same `useROSCAssessments()` call already made at the top of `RecoveryCapital.tsx`.

### Score computation (`useROSCAssessments.ts`'s mutation)
Triggered by completing `ROSCCheckIn.tsx`'s 5-question flow (Health/Home/Purpose/Community/Resilience, each 1–5, strength-based language, no back-navigation once started per question). On submit:
- **Free tier, or premium with a locked vault:** linear self-report mapping only — `score = selfReport * 2` (1–5 → 2–10) per domain, `trajectory` fixed to `'Insufficient Data'`, `encryptedAIContext` left `''`.
- **Premium with an unlocked vault:** fetches the last N days of `journals` (7 for weekly cadence, 30 for monthly/free — see Gating & limits), decrypts each in chunks of 5 (`processInChunks`), formats as `[date] Mood: x/10 | Tags: ... | Entry: ...` strings, and calls `generateROSCAnalysis()` (`src/lib/gemini.ts` → the `rosc_assessment` proxy type in the `generateAIInsights` Cloud Function). The AI returns a 1–10 score, an evidence list, and a per-domain suggested `action` for each of the four domains, plus `trajectory` and a narrative/strengths/growth_areas set. **Sparse-window guard:** if a weekly-cadence query returns fewer than 3 journal entries, the hook silently re-queries with the 30-day fallback window rather than sending Gemini a near-empty corpus — `periodStart`/`periodEnd` on the saved document reflect the actual window used, not the nominal cadence.

`totalScore` is the plain sum of the four domain scores (4–40 range, not the individually-scaled 40 alone as the UI's "/ 40" suggests being the max — a domain score is capped at 10 so 40 is in fact the true max). The mutation writes the assessment via `createROSCAssessment()` (`src/lib/rosc.ts`, a plain `addDoc` to the subcollection) and stamps `usage_limits.lastROSCAssessment` client-side immediately after (the server also stamps this same field independently — see Gating & limits).

### The pill capsules
`ROSCPillCapsules.tsx` renders four horizontal 10-segment bars per domain, each segment filling with a staggered CSS-timed reveal (`useSegReveal`, per-domain 60ms stagger, per-segment ~55ms). When a `previous` assessment exists, unfilled-but-previously-filled segments render as a dim "ghost" fill so the visual delta between this and last period is legible at a glance, and a `+N`/`-N` badge appears next to each domain's number.

### Check-in draft persistence
`saveCheckInProgress()` writes answers to `sessionStorage` (keyed `roscCheckIn_{cadence-scoped period}`, via `roscPeriodKey()` — ISO week-year/week for weekly cadence, `yyyy-MM` for monthly, chosen specifically so two different years' same-numbered week don't collide) *before* the AI mutation runs, so a failed/interrupted assessment doesn't lose the user's five answers. `handleCheckInStart` (called on the first question answered) separately sets a `localStorage` flag (`checkInStartedKey`) so the CTA copy changes to "Continue your check-in" on a later visit within the same period, without needing the full draft to still be present.

## Data model

`users/{uid}/rosc_assessments/{id}` (confirmed as a **subcollection**, not the top-level `rosc_assessments` collection CLAUDE.md's table name might suggest — see `firestore.rules`'s `match /users/{userId}/rosc_assessments/{assessmentId}` and `src/lib/rosc.ts`'s `collection(database, 'users', uid, 'rosc_assessments')`):

| Field | Encrypted? | Notes |
|---|---|---|
| `uid`, `createdAt` | ❌ Plaintext | |
| `periodStart`, `periodEnd` | ❌ Plaintext | The *actual* window analyzed, including any sparse-window widening |
| `scores.{health,home,purpose,community}.score` | ❌ Plaintext | 2–10 (self-report path) or 1–10 (AI path) |
| `scores.{...}.selfReportedScore` | ❌ Plaintext | The raw 1–5 check-in answer, always stored regardless of tier |
| `scores.{...}.evidenceCount` | ❌ Plaintext | 0 on the self-report path; AI evidence-array length on the premium path |
| `totalScore` | ❌ Plaintext | Sum of the four domain scores, 4–40 |
| `trajectory` | ❌ Plaintext | `'Improving' \| 'Stable' \| 'Declining' \| 'Insufficient Data'` |
| `journalEntriesAnalysed` | ❌ Plaintext | 0 on the self-report path |
| `encryptedAIContext` | ✅ AES-GCM | JSON blob: `narrative`, `strengths[]`, `growth_areas[]`, `evidence` (per domain), `actions` (per domain) — `''` on the self-report path |

This matches CLAUDE.md's table exactly (`scores.*score`, `totalScore`, `trajectory`, `journalEntriesAnalysed` plaintext; `encryptedAIContext` AES-GCM) — confirmed field-for-field against `useROSCAssessments.ts`'s mutation and `src/lib/types/rosc.ts`.

## Gating & limits

- **Cadence:** free tier — once per calendar month (`!isSameMonth(latest, now)`). Premium — rolling 7 days (`differenceInDays >= 7`), enforced client-side (`src/lib/roscCadence.ts`'s `canCreateForCadence`) plus an all-tier 24-hour floor server-side in the `generateAIInsights` proxy (`functions/src/index.ts`) as a defense-in-depth backstop against a scripted bypass — not a real limit any legitimate weekly user could hit. The free tier additionally gets its own 30-day server-side check (independent of the client's monthly-boundary logic, slightly different math but the same intent).
- **Vault state:** the CTA is disabled with "Unlock vault to begin" if `!isVaultUnlocked`; disabled with "Connect to complete your check-in" if `!navigator.onLine`. A locked vault on the premium tier silently falls back to the self-report-only scoring path rather than blocking the check-in outright.
- **XP:** each ROSC assessment is worth 25 XP (`XP_VALUES.ROSC_ASSESSMENT`, `src/lib/gamification.ts`), counted via a separate `rosc_count` query in `AchievementsTab.tsx` (Profile screen) — this tab itself shows no XP feedback.

## Known gaps / debt

- Tab selection isn't written back to the URL (see How it works) — this is a narrower version of the gap Vitality's README documents for its own tabs, but here it's partial: the *first* load respects `?tab=`, only subsequent in-session switches are unsynced.
- The "/ 40" denominator shown next to the total score is the true max (4 domains × 10), but nothing on this tab states that domain scores cap at 10 — a Maya-persona user comparing this screen's math to `ROSCTrendChart.tsx`'s Y-axis (which does label `[0, 40]` and `[0, 10]` explicitly) has to infer the cap from the chart, not from this tab.
- `usage_limits.lastROSCAssessment` is stamped twice per successful assessment — once client-side in `useROSCAssessments.ts`, once server-side in the Cloud Function — which the PROJ-49 spec addendum documents as intentional redundancy, not a bug.

## Related docs

- `docs/screens/insights/README.md` — parent index, shared `useROSCAssessments()` data layer.
- `docs/screens/insights/recovery-capital-trends.md`, `-history.md` — the other two tabs.
- `docs/screens/insights/log.md` — `ROSCSummaryCard`'s host screen and the check-in's `?start=1` deep-link entry point.
- `docs/projects/49_ROSC_MATRIC.md` §§1–3 (research grounding, ZK audit, schema) and its Addendum §9 (Monthly Action Items) and §10 (full-screen route, premium weekly cadence — supersedes §Phase 1/2's original monthly-only claims).
- `docs/projects/53_ROSC_PILL_CAPSULE.md` — the pill-capsule visual replacing the spec's originally-planned (never-shipped) radar chart.
