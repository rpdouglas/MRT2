# Workbooks — `/workbooks`

**Parent page:** `src/pages/Workbooks.tsx` is the library/marketplace hub (`/workbooks`). Two further routes hang off it: `src/pages/WorkbookDetail.tsx` (`/workbooks/:workbookId`, a workbook's section list + AI analysis) and `src/pages/WorkbookSession.tsx` (`/workbooks/:workbookId/session/:sectionId`, the full-screen one-question-at-a-time writing flow). Unlike Journal's `?tab=` pattern, the three Workbooks screens are three separate routes, not tabs of one shell — each is independently deep-linkable and each fully unmounts the others.

This screen has enough distinct sub-experiences to warrant its own folder — each file below is independently readable.

| Sub-screen | File | Route | Component(s) |
|---|---|---|---|
| List / Marketplace | [`list.md`](./list.md) | `/workbooks` | `Workbooks.tsx`, `useWorkbookLibrary.ts` |
| Detail | [`detail.md`](./detail.md) | `/workbooks/:workbookId` | `WorkbookDetail.tsx`, `useWorkbookAnswers.ts` |
| Session | [`session.md`](./session.md) | `/workbooks/:workbookId/session/:sectionId` | `WorkbookSession.tsx`, `useAutoSave.ts`, `useWorkbookAnswers.ts` |

## What a "workbook" is

A workbook is static, hand-authored content — not user data. All four workbooks live as one literal object literal, `WORKBOOKS: Workbook[]`, in `src/data/workbooks.ts` (no CMS, no Firestore doc for the content itself):

```ts
interface Question { id: string; text: string; context?: string; type?: 'input' | 'read_only'; helperText?: string; }
interface WorkbookSection { id: string; title: string; description?: string; questions: Question[]; }
interface Workbook { id: string; title: string; description: string; type: 'linear' | 'steps' | 'general' | 'specialty'; sections: WorkbookSection[]; estimatedTime?: string; }
```

The four installed-by-default workbooks (`getWorkbook(id)` looks up by `id`, `getDefaultInstalledWorkbookIds()` returns all four for legacy/new users):

| `id` | Title | `type` | Shape |
|---|---|---|---|
| `general_recovery` | General Recovery Workbook | `general` | 1 section (`main`), 25 flat questions, no intro slide |
| `12_steps` | 12-Step Workbook | `steps` | 12 sections, one per Step — each opens with a `read_only` intro slide (the Step text + a short framing paragraph) followed by ~15 `input` questions. The questions are grouped into 3 informal topical clusters (e.g. Step 1 = "Nature of Powerlessness" / "Unmanageability" / "Emotional Toll"), but that grouping exists only as a source-file comment — there's no sub-section data structure; all ~15 questions belong to one flat `questions` array per Step |
| `recovery_dharma` | Recovery Dharma | `steps` | 7 sections: 4 for the Four Noble Truths (`rd_truth_1`–`4`) + 3 for the Eightfold Path (`rd_path_1`–`3`, split Wisdom/Ethics/Discipline), each with its own `read_only` intro |
| `womens_recovery` | Women for Recovery Workbook | `specialty` | 9 sections (an intro + 8 themed sections — Awareness, Self-Image, Emotional Patterns, Thought Rewiring, Daily Practices, Relationships, Future Self, "Overdose & Survival Reframe"), each with a `read_only` intro |

A question's `type` defaults to `'input'` when unset; only `read_only` slides skip the answer step entirely (Session shows them as a full-bleed intro screen with just a "Begin" button — see `session.md`). Progress/mastery math throughout the feature (`Workbooks`/`WorkbookDetail`/the Dashboard's Wisdom Score, `TOTAL_WORKBOOK_QUESTIONS` in `src/lib/gamification.ts`) always excludes `read_only` questions from both numerator and denominator.

"Marketplace" (the second tab on the List screen) is not a real storefront — there's no purchase flow, no third-party content, and no server-fetched catalog. It lists the same hardcoded `WORKBOOKS` array with Add/Remove toggles against the user's `installedWorkbookIds`. See `list.md`.

## Personas

- **Maya** (Systematiser) is the primary persona for this feature per `docs/PERSONAS.md` — "Wisdom Score" (total questions answered) is named as her primary engagement signal, linear/sequential navigation through sections is called out as the required default (never randomize/suggest out of order), and workbook completion % must be visible in the module at all times. Her PDF exports must include workbook progress alongside journal entries.
- **Walt** (long-term, reflection-mode) is the other named "Primary Depth Driver" alongside Maya — `docs/PERSONAS.md` specifically calls out the Recovery Dharma workbook as "his current programme's structured inquiry path."
- **Lisa** (sponsor) — the existing spec (`docs/specs/04_WORKBOOKS.md`) singles out the Women for Recovery workbook as a GTM asset for her persona's sponsees, though nothing in these three screens is sponsor-specific (no cross-account sharing here — see the Service module for that).
- No dedicated crisis-mode (David) or MAT-stabilizer (Jordan) UX in any of the three screens — Workbooks is a deliberate-engagement, sit-down feature, not a crisis-floor one, so CLAUDE.md's "never gate crisis features" rule doesn't apply here one way or the other.

## Tier & Zero-knowledge summary

- **Tier:** All three screens are reachable by every authenticated user regardless of `tier` — there is no `<PremiumGate>` anywhere in `Workbooks.tsx`, `WorkbookDetail.tsx`, or `WorkbookSession.tsx`. The two Gemini-calling actions on Detail and Session (`analyzeWorkbookContent`/`workbook_analysis` and `getGeminiCoaching`/`workbook_coach`) are two of CLAUDE.md's nine approved decrypted-content-to-Gemini flows, and both now carry a **server-side-only** rate limit added by `docs/projects/106_AI_RATE_LIMIT_GAP.md` (workbook_analysis: 7-day free-tier cooldown; workbook_coach: 15-second all-tier floor) — see each screen's own "Gating & limits" for the exact mechanism, and "Known gaps / debt" for why CLAUDE.md's current wording ("no tier check and no rate limit at all") is now partly stale.
- **Zero-knowledge status:** User-generated content lives in one collection, `users/{uid}/workbook_answers/{workbookId}_{questionId}` (a per-user subcollection, not a top-level collection — see `firestore.rules` line ~102, owner-only read/write). `answer` is AES-GCM encrypted client-side (`encrypt()`) before every write; `isEncrypted`/`updatedAt` are plaintext. This matches CLAUDE.md's Zero-Knowledge table row for `workbook_answers/{id}` (✅ Yes). The List screen's only persisted state, `users/{uid}.installedWorkbookIds`, is plaintext profile metadata (which workbooks the user has chosen to show — not recovery content).

## Related docs

- `docs/specs/04_WORKBOOKS.md` — existing spec; broadly accurate on data shape and the two AI integration points, but calls the Compass function `analyzeFullWorkbook` (that's the internal implementation — the exported name callers actually import is `analyzeWorkbookContent`, an alias: `export const analyzeWorkbookContent = analyzeFullWorkbook;`) and doesn't mention PROJ-106's rate limits (it predates that project). See each sub-screen doc for more specific drift notes.
- `docs/projects/55_WORKBOOK_REMEDIATION.md` — history of the 12-Step content rewrite (Steps 2–11).
- `docs/projects/75_WORKBOOK_MARKETPLACE.md` — the Marketplace tab / install-library mechanism.
- `docs/projects/106_AI_RATE_LIMIT_GAP.md` — closes the uncapped-cost gap on `workbook_analysis`/`workbook_coach` (and `audio_analysis`, unrelated to this screen); status "In Progress" as of this writing.
- `docs/screens/journal/README.md` — the other Gemini-touching, ZK-encrypted content screen, for comparison.
