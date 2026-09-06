# SPEC-WELCOMEPAGE-002: Welcome page redesign with embedded persona quiz

**Status:** Draft — ready for planning gate, pending open items in §9
**Supersedes:** SPEC-WELCOMEPAGE-001
**Incorporates:** SPEC-RECOVERYQUIZ-001 (quiz logic, scoring, and funnel-continuity requirements folded in below; that spec's standalone placement question is now resolved by this doc)
**Location:** `myrecoverytoolkit.ca/welcome`
**Related docs:** `docs/PERSONAS.md` v2.3

---

## 1. Summary

Restructure `/welcome` to reduce decision friction, surface core app functionality before persona storytelling, consolidate trust/legal signals, and replace passive persona storytelling with an interactive "Find Your Recovery Season" quiz as the primary persona-discovery mechanic. A trimmed, always-visible persona showcase remains as a secondary path for visitors who already recognize themselves and don't want to answer questions.

## 2. Background

The current live page leads with an encryption hook and a distinctive 6-full-persona-card section, but has duplicate CTAs, persona-bio length that works against a reader in crisis, and buried trust/legal content. Separately, a quiz was speced (SPEC-RECOVERYQUIZ-001) to replace the generic "Download the App" CTA with a persona-matching interaction — but that spec explicitly left open *where* the quiz sits relative to the existing persona cards. This document resolves that by merging both into one page structure.

## 3. Problems Being Addressed

1. Two differently-worded CTAs ("Begin Journey" vs. "Initialize Toolkit") split intent and add re-reading load for a user in crisis.
2. No feature summary exists before the persona section — a skimming visitor doesn't learn journaling/habit-tracking/AI-insight exist as concrete features until reading deep into persona bios.
3. Six full persona cards front-load a lot of reading; David's own persona bio (shame, overwhelm) implies the target reader has low tolerance for long-form skimming in the exact moment they might land on this page.
4. Trust content beyond the top-line encryption claim is thin, appearing only as a single closing footer line.
5. The medical-device disclaimer sits at the very bottom, after two CTAs — legally serviceable but not ideal on a page whose personas include MAT-related claims (Jordan).
6. Screenshot reuse (clean-time chip appears in both hero and Jordan's card) undercuts the "distinct tool per situation" message the personas are trying to make.
7. **(New)** Without a resolved placement, the quiz and the full persona-story section would compete for the same job — introducing the visitor to a persona — creating redundant reading rather than complementary paths.
8. **(New)** Per `PERSONAS.md` §0's own governance rule — *"Run the David Safety Test: could this UI harm or overwhelm someone in acute crisis?"* — a quiz-first flow adds a step between landing and help for a visitor in David's worst-case state, who may arrive at `/welcome` directly (not only via a pre-qualified ad click) and needs a way to bypass discovery entirely.

## 4. Design Resolution: Quiz + Trimmed Showcase, Not Quiz vs. Showcase

**Decision:** The quiz becomes the primary, first-encountered persona-discovery mechanic. The "Meet the Toolkit" section is retained but demoted to a secondary, always-visible trimmed showcase — for visitors who already know which persona fits them (returning visitors, people referred by a friend who said "you're a Maya," or anyone who'd rather skim than answer 4 questions) and don't want to take the quiz to get there.

This keeps the reading-load reduction from the original persona-trimming proposal, while giving the quiz the prominent placement it needs to do its job as the primary conversion mechanic from the marketing plan.

**New: Crisis bypass.** Add a low-friction, always-visible "Need help right now?" link near the hero, separate from both the quiz and the primary CTA. It routes directly to crisis-appropriate content (not the quiz, not the persona showcase) — satisfying the David Safety Test at the page level, not just within individual features. This did not exist in either source spec and is added here because the merged page's added interactivity (the quiz) is exactly the kind of new friction that rule is meant to catch before shipping.

## 5. Proposed Page Order

1. Encryption headline strip (unchanged)
2. Hero: tagline, subhead, single primary CTA, compact disclaimer, crisis-bypass link, screenshots
3. Feature-summary strip — Journal · Track habits · Find patterns (unchanged from SPEC-WELCOMEPAGE-001)
4. **"Find Your Recovery Season" quiz** (new placement — primary persona-discovery mechanic)
5. "Meet the Toolkit" — trimmed persona showcase, all 6 personas, name + archetype label + one-line pull quote only (secondary/browse path)
6. Trust statement (expanded zero-knowledge explanation)
7. Closing CTA block
8. Footer: privacy policy, ToS, full disclaimer text

## 6. CTA Unification (including quiz result)

- Single base CTA string across the page: **"Begin your toolkit."**
- Remove "Initialize Toolkit" as a separate label. "Continue with Google" and "Already have an account? Sign in" remain as secondary actions under the same primary CTA.
- **Quiz result CTA is a personalized variant of the same base string, not a separate wording pattern:** *"Begin your toolkit — built for [Persona]"* → Google Play listing. This reconciles the quiz spec's original standalone CTA ("Get the tools built for your season") with this spec's CTA-unification goal.
- **New:** Direct clicks from the trimmed persona showcase (a visitor who skips the quiz and clicks straight on, say, Lisa's card) should carry the same persona-tagged install referrer as a quiz completion would. This extends the funnel-continuity benefit to self-identifying visitors, not only quiz-takers — flagged as new scope beyond either source spec; confirm before build (§9).

## 7. Quiz Specification (from SPEC-RECOVERYQUIZ-001)

### 7.1 Persona set (6 outcomes)
David, Ned, Lisa, Walt, Maya, Jordan — per `docs/PERSONAS.md` v2.3 §1/§3.

### 7.2 Questions

**Q1 — Pacing** *("What does your mind need right now?")*
| Option | Target Persona |
|---|---|
| Calm, low friction *(wording TBD — see §9)* | David |
| Daily momentum | Ned |
| Structured study | Maya |
| Deep reflection | Walt |
| Physical stability | Jordan |
| Supporting someone else's recovery | Lisa |

**Q2 — Approach:** 12-Step · SMART Recovery · Recovery Dharma · MAT · Secular/CBT
**Q3 — Obstacle:** Shame-based streak breaks · Data privacy fears · Preachy language · Feeling overwhelmed
**Q4 — Daily Rhythm:** 30 seconds at 2 AM · 5 minutes between errands · 30 minutes of deep morning reflection

### 7.3 Scoring model — LOCKED

Q1 awards **+3 to its target persona only, 0 to all others** (primary axis — the only question with a clean 1:1 mapping across all 6 personas).

| Question | Answer | David | Ned | Lisa | Walt | Maya | Jordan |
|---|---|---|---|---|---|---|---|
| Q2 | 12-Step | 1 | 1 | 1 | 0 | 0 | 0 |
| Q2 | SMART Recovery | 0 | 0 | 0 | 0 | 2 | 1 |
| Q2 | Recovery Dharma | 0 | 0 | 0 | 2 | 1 | 0 |
| Q2 | MAT | 0 | 0 | 0 | 0 | 0 | 3 |
| Q2 | Secular / CBT | 0 | 0 | 0 | 0 | 3 | 0 |
| Q3 | Shame-based streak breaks | 1 | 3 | 0 | 0 | 0 | 0 |
| Q3 | Data privacy fears | 0 | 0 | 2 | 2 | 0 | 2 |
| Q3 | Preachy language | 0 | 0 | 0 | 0 | 1 | 3 |
| Q3 | Feeling overwhelmed | 3 | 0 | 1 | 0 | 0 | 0 |
| Q4 | 30 sec at 2 AM | 3 | 0 | 0 | 0 | 0 | 0 |
| Q4 | 5 min between errands | 0 | 2 | 3 | 0 | 0 | 2 |
| Q4 | 30 min morning reflection | 0 | 0 | 0 | 3 | 2 | 0 |

**Tie-break:** Highest Q1 score wins. If Q1 itself ties, fall back to highest combined Q3+Q4 score.

### 7.4 Result card
- Persona name + archetype tagline, portrait, 2–3 lines of core strengths, relevant modules, CTA per §6.
- **Asset source:** `/public/personas/bio_{persona}.webp` (`bio_david.webp`, `bio_ned.webp`, `bio_lisa.webp`, `bio_walt.webp`, `bio_maya.webp`, `bio_jordan.webp`). These are a marketing-site-only asset set, distinct from the in-app `PersonaBioCard` component (PROJ-108 removed pre-baked bio images from the main app in favor of that component) — add a one-line code comment at implementation noting this so a future cleanup pass doesn't mistake these for stale PROJ-108 leftovers.

### 7.5 Funnel continuity
- Persona result passed as Google Play Install Referrer, so first-run app experience greets the user by matched persona.
- UTM tagging on all quiz entry points (ads, shared links).
- Metrics instrumented at launch: quiz start rate, per-question completion/drop-off, quiz → install rate, persona distribution vs. assumptions.

## 8. Trust, Disclaimer & Screenshot Requirements (from SPEC-WELCOMEPAGE-001)

- One short trust statement (plain-language zero-knowledge explanation, e.g. "we can't see your journal, even if compelled to") appears between the persona showcase and the closing CTA — not only in the header claim.
- A compact medical-device disclaimer appears near the hero, in addition to the full-text footer version; final wording pending legal/compliance review.
- No screenshot or asset is reused across two different contexts. This audit now explicitly covers **three** asset sets that must each be distinct: (a) hero screenshots, (b) trimmed persona showcase screenshots, (c) quiz result card `bio_*.webp` portraits. Confirm whether a unique feature screenshot exists for Jordan's showcase card or needs to be produced.

## 9. Open Items Blocking Final Lock

1. **Q1 David wording** — "Calm, low friction" describes the design need, not David's actual anxious/overwhelmed state. Confirm before copy lock.
2. **Persona showcase depth** — this spec assumes all 6 personas shown in trimmed form (name/archetype/pull-quote only), with no expand-to-full-backstory, since the quiz now carries the depth job. Confirm this is acceptable, or whether an expand option should be kept for browsers who want full stories without taking the quiz.
3. **Persona-tagged referrer on direct showcase clicks** (§6) — new scope beyond both source specs; confirm before build.
4. **Crisis bypass destination** — confirm what "Need help right now?" should actually route to (a static crisis-resources view, a direct SOS-style modal, or an external line) — this spec establishes that the link must exist, not its destination content.
5. **Compact disclaimer wording** — needs sign-off from whoever handles legal/compliance review; this spec proposes placement only.
6. **Jordan showcase screenshot** — confirm a unique one exists or flag as a content gap to produce.

## 10. Out of Scope

- Changes to `docs/PERSONAS.md` persona content itself.
- Sign-in / auth flow changes.
- Visual redesign (colors, typography) beyond what's needed to support the structural changes above.

## 11. Acceptance Criteria

- [ ] Single base CTA string ("Begin your toolkit") appears in hero, closing block, and as the stem of the quiz-result variant
- [ ] Feature-summary strip renders between hero and quiz on all breakpoints
- [ ] Quiz renders after the feature strip, before the persona showcase, per §5
- [ ] Quiz scoring engine implements the exact matrix and tie-break rule in §7.3
- [ ] Quiz result resolves to one of 6 personas and links to Google Play with persona passed as install referrer
- [ ] Trimmed persona showcase (all 6, name + archetype + pull quote only) renders as a secondary section after the quiz
- [ ] Direct clicks from the showcase carry the same persona-tagged install referrer as a quiz completion (pending confirmation, item 3)
- [ ] A "Need help right now?" crisis-bypass link is visible near the hero, independent of the quiz and primary CTA
- [ ] A trust statement appears on-page outside the header and footer
- [ ] A compact medical-device disclaimer is visible near the hero, in addition to the footer's full text
- [ ] No screenshot/asset is reused across hero, showcase, and quiz result contexts
- [ ] Quiz start/completion/install funnel events are instrumented and visible in analytics before public launch

---

*Merged from SPEC-WELCOMEPAGE-001 and SPEC-RECOVERYQUIZ-001, 2026-09-05.*
