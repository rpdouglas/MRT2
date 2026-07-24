# MRT — Personas & Design System Reference

> **Purpose:** A single, self-contained reference to who My Recovery Toolkit (MRT) is designed for and how it is designed to look, feel, and behave. Intended for upload to an LLM (or a new designer/engineer) so it can reason about persona-driven UX decisions without needing the rest of the codebase. Compiled from `docs/PERSONAS.md` (v2.2), `docs/governance/INTERNAL_PERSONAS.md` (v1.0), `.claude/skills/design/SKILL.md` (the design system actually enforced day-to-day), `docs/design/mrt_design_system.md` ("Momentum Kinetic v3.0" — an aspirational, largely **not-yet-implemented** target spec), and direct verification against the live source (`src/lib/theme.ts`, `src/lib/heroColors.ts`, `index.html`) as of **2026-07-24**.
>
> Where a document describes something the code doesn't actually do, this reference says so explicitly rather than presenting it as fact.

---

## Part 1 — User-Facing Personas

### 1.0 How These Are Used

Every module in MRT is built to serve at least one of six primary user archetypes. For every new feature or spec, MRT's process requires:

1. **Identify the primary persona** — who is this feature primarily for?
2. **Apply their UX constraints as acceptance criteria**, not soft guidelines.
3. **Run the David Safety Test** — could this UI harm or overwhelm someone in acute crisis? If yes, redesign before shipping.
4. **Run the Walt Sovereignty Test** — does this respect data ownership and exportability?
5. **Check the Ned Transition** — does this account for the Day-90 "Pink Cloud Crash"? Does gamification serve or harm Ned at that inflection point?
6. **Run the surveillance test** (any social/connection feature) — would a reasonable person in early recovery feel watched or controlled? If yes, redesign.

**The primary persona rule:** design decisions are optimized for *the* primary persona of a given feature; secondary personas are accommodated without compromising that primary experience. Never design for an "average" of all personas — that produces a mediocre experience for everyone.

### 1.1 Persona Hierarchy

| Role | Persona | Why |
|---|---|---|
| **Primary Safety Anchor** | David | Any feature that could harm someone in acute crisis must be redesigned before shipping. His worst-case state sets the UX floor for the entire product. |
| **Primary Engagement Driver** | Ned | Daily retention, task completion, and gamification are optimized for him — his metrics determine whether the product builds habit. |
| **Primary Depth Driver** | Walt + Maya | AI analysis, journaling depth, workbook completion, and exports are optimized for these two. Their engagement justifies the Premium tier. |
| **Primary Viral Driver** | Lisa | The (currently paused) sponsor-invite flow is intended to be MRT's most important organic growth loop. |
| **Primary Stabilization Driver** | Jordan | Medical-behavioral integration, craving management, and harm-reduction tracking are optimized for Jordan — keeps MRT non-stigmatizing. |

### 1.2 The Recovery Journey Arc

Users are not static — the same person moves through multiple persona stages over time, or regresses. MRT must adapt as they evolve:

```
Day 1-30      → David   (Survival, crisis-first design)
Day 1-365+    → Jordan  (Parallel track — medical integration, MAT compliance)
Day 30-90     → Ned     (Momentum, gamification, habit building)
Day 90+       → Pink Cloud Crash — the highest design-risk transition point
Month 3-18    → Maya    (Systematic learning, CBT, workbook completion)
Year 1+       → Walt    (Deep reflection, long-term patterns, data sovereignty)
Year 7+       → Lisa    (Service, sponsorship, giving back — Step 12)
```

**Stage-transition design rules:**
- **Day 30 (David → Ned):** shift visual emphasis from crisis tools to progress indicators; introduce gamification; never remove SOS access.
- **Day 90 (Pink Cloud Crash — highest-risk moment):** reduce streak-count prominence; shift quantity metrics (tasks completed) to quality metrics (journal depth, step progress); surface CBT tools and deeper AI analysis; the app must never feel "empty" when a streak breaks.
- **Month 6 (Ned → Maya/Walt):** introduce structured workbook pathways; offer deeper AI comparative analysis; reduce onboarding prompts.
- **Year 1+ (Any → Lisa):** surface service features and sponsor tooling once sobriety milestones suggest readiness.
- **Day 1+ (Jordan's parallel MAT track):** surface discrete medication-compliance logs and craving-correlation indicators in Vitality/Insights if MAT mode is enabled.

### 1.3 The Personas

#### 1. David — "The Survivor"
> *"I just need the noise to stop right now."*

| Attribute | Profile |
|---|---|
| Recovery stage | Day 1–30 (relapsed after 2 years) |
| Recovery path | CA (Cocaine Anonymous) |
| Archetype | The Survivor — High Urgency |
| Core motivation | De-escalate immediate urges and survive the night |
| Tech literacy | High, but currently cognitively overloaded |
| Environment | Alone in his bedroom, 2 AM, low screen brightness, one hand, portrait mode |
| Fellowship notes | CA — stimulant-specific culture; step language differs from AA/NA; smaller, less geographically dense community |

**Bio:** 32 years old, tech-literate but in acute distress after losing two years of clean time. Cognitive load is maxed out — cannot handle complex navigation, long text, or multi-step decisions. Found his sponsor three weeks ago; calling at 2AM feels like admitting defeat. Meeting attendance is least reliable in the first two weeks.

**Emotional spectrum:**
| State | Context | Design response |
|---|---|---|
| Best case | Mild urge, daytime, some cognitive capacity | One-tap logging, brief prompts, visual confirmation |
| Typical case | Evening anxiety, moderate distress, phone in one hand | Large touch targets, no multi-step flows, immediate SOS access |
| Worst case | 4AM after a relapse, shame spiral, phone nearly dead | Single-screen intervention, zero navigation, sponsor-call button visible without vault unlock, no text input required |

> **Design rule:** all David-facing features are designed for the *worst* case, never the typical case.

**Goals:** immediate grounding access; rapid logging without typing paragraphs; instant one-tap support (sponsor or crisis line) — available even with the vault locked.

**Frustrations:** anything requiring >1 tap; chart-heavy/option-heavy dashboards; any UI language implying failure/shame; isolation at 2AM with no one to call.

**UX rules (acceptance criteria, not suggestions):**
- Primary constraint: **Zero Friction**.
- SOS/Urge button visible in <1 second from app launch.
- "Urge Log" and Voice-to-Vault reachable in exactly 1 tap.
- Sponsor call button works **without** vault PIN entry (pulled from unencrypted connection metadata).
- No red "failure" states, no "overdue" labels, no shame language, anywhere in David-facing flows.
- Maximum 3 taps for any crisis-mode action — count them; if it's 4, cut one.

**Key feature alignment:** Urge Surfer, Voice-to-Vault, SOS Modal's one-tap sponsor call, CA-appropriate Daily Reading.

**Stage transition:** at Day 30, gradually introduce Ned-style progress indicators while keeping (but visually de-emphasizing) SOS access, and introduce the first gamification elements without overwhelming a still-fragile foundation.

**Success metrics:** intervention speed (launch → SOS/Urge tap); crisis conversion (completed Urge Surfing session); Day 7 retention (most critical window for this cohort).

---

#### 2. Ned — "The Pink Cloud"
> *"I'm going to crush it today! Let's get that streak!"*

| Attribute | Profile |
|---|---|
| Recovery stage | Day 30–90 |
| Recovery path | NA (Narcotics Anonymous) |
| Archetype | The Achiever — High Energy |
| Core motivation | Momentum, clean-time tracking, external validation |
| Tech literacy | Digital native — expects high-fidelity UI and gamification |
| Environment | Phone, portrait, one thumb, background noise (gym/commute), 30–90s attention windows, tap-only interactions |
| Fellowship notes | NA — Basic Text, "We Do Recover" culture, skews younger/more urban than AA |

**Bio:** 24, digital native, riding the "Pink Cloud" optimism of early recovery. Treats recovery like a fitness app — wants stats, daily goals, constant forward momentum. NA meetings 3x/week, calls his sponsor every morning, enthusiastic about step work (an enthusiasm that will be tested).

**Emotional spectrum:**
| State | Context | Design response |
|---|---|---|
| Best case | Morning, high energy, just completed daily pledge | Full gamification, confetti, prominent streak counter, social sharing |
| Typical case | Evening check-in, moderate energy | Quick log, task completion, streak update |
| Worst case — **the Pink Cloud Crash (Day 90)** | Euphoria fades; tasks feel like obligations; a broken streak feels catastrophic; highest relapse risk since Day 1 | Shift quantity → quality metrics; surface CBT/journaling; reduce streak prominence; never let the app feel empty when a streak breaks |

> **Design rule:** every Ned-facing gamification feature must be stress-tested against the Pink Cloud Crash. If it would make Day-90 Ned feel like a failure, redesign before shipping.

**Goals:** streaks/badges/progress rings; structured daily task lists; clean time front-and-center; sponsor recognition when he completes a step (opt-in).

**Frustrations:** static/clinical interfaces; task completion with no visual reward; feeling stagnant; the "Day 90 Void" when gamification suddenly feels hollow.

**UX rules:**
- Primary constraint: **Visual Reward**.
- Dashboard must prominently show clean time + daily streaks.
- Positive reinforcement (confetti/haptics) on task completion is essential.
- At Day 90, auto-surface a "Going Deeper" prompt (CBT tools, longer prompts, step depth) without fully removing gamification.
- Streak-break UI is never punishing — Smart Reset silently moves missed tasks to today; no red states, no failure language.

**Key feature alignment:** Daily Beacon/Tasks, Gamification Engine (milestones/streaks), NA-appropriate Daily Reading, opt-in step-completion notification to sponsor.

**Stage transition:** at Day 90, shift emphasis from streak counts to milestone badges (more durable/less fragile), auto-surface the first workbook sections, introduce AI Pattern Analysis for the first time ("You've logged 90 days — here's what your data shows"), and reduce daily task-count pressure.

**Success metrics:** Daily Active Usage in the first 90 days; task completion rate; Day 90 + Day 120 retention (the Pink Cloud Crash window).

---

#### 3. Lisa — "The Service Superstar"
> *"I have five sponsees and a full-time job. I need to stay organized so I don't burn out."*

| Attribute | Profile |
|---|---|
| Recovery stage | Maintenance (7 years) |
| Recovery path | AA |
| Archetype | The Guide — High Output |
| Core motivation | Giving back (Step 12) without burning out |
| Tech literacy | Moderate–High, phone primarily for communication |
| Environment | In her car right after chairing a meeting, one hand, parking lot, ~5 minutes before the next commitment |
| Fellowship notes | Follows the Big Book/12 Traditions closely; takes anonymity seriously; AA's gender-specific sponsor model (women sponsor women); her 5 sponsees are all women from her home group |

**Bio:** 45, high-stress professional, sponsors 3–6 women (currently 5 — near her stated capacity). Uses MRT as a management tool for her service commitments, not just her own recovery. Highly susceptible to neglecting her own self-care — a pattern her own sponsor calls out.

**Emotional spectrum:**
| State | Context | Design response |
|---|---|---|
| Best case | Sunday morning, organized, ahead of commitments | Full Rolodex management, step-progress updates, planning mode |
| Typical case | In her car, 5 minutes, one hand | Quick dashboard scan (who needs contact?), one-tap log |
| Worst case — burnout | Overcommitted, neglecting her own program, resentful | Vitality self-care prompts surface; amber tones; gentle, non-intrusive boundary reminder |

**Goals:** private/encrypted tracking of sponsees' step work; easy, anonymous resource sharing; boundary maintenance for her own mental health; at-a-glance urgency (who needs attention *now*).

**Frustrations:** the mental load of remembering who texted what and when (her #1 problem); losing track of her own program; app clutter; any privacy risk exposing a sponsee's identity.

**UX rules:**
- Primary constraint: **Boundary Management**.
- Service dashboard sorts by urgency (days since last contact) — Lisa must know who needs attention in <10 seconds, without reading individual notes.
- Gentle, non-intrusive self-care check-ins (Vitality) — never guilt-inducing.
- All sponsee data encrypted — Lisa must never worry her private observations about a vulnerable person are readable by anyone else.
- Anonymity compliance: no feature surfaces a sponsee's full name/real photo/identifying detail in any shareable format.
- The "5 sponsees" figure is a design anchor (card layouts, sort thresholds), not a hard fact — range is 3–6.

**Key feature alignment:** Service Module — Encrypted Rolodex (**PROJ-05, currently paused — not implemented**, see Part 3 of the main app knowledge base for status); a planned text-only, anonymous Reading Share button; the Vitality module as her own self-care counterbalance; a planned QR Handshake for in-person step-work sharing.

**Stage transition:** Lisa's arc is sustainable depth, not forward progression. MRT should never add features that raise her mental load without reducing manual effort elsewhere, and should surface the Service Module once a user's sobriety data suggests sponsorship readiness (Year 2+).

**Success metrics:** Service Dashboard/Rolodex usage frequency; consistent self-care logging; viral coefficient (sponsee invite activations per Lisa-cohort user — MRT's primary intended organic growth metric).

---

#### 4. Walt — "The Zen Master"
> *"Recovery is a lifelong practice of mindfulness and reflection."*

| Attribute | Profile |
|---|---|
| Recovery stage | Long-term (35+ years) |
| Recovery path | AA (original) → Recovery Dharma (current) |
| Archetype | The Observer — High Reflection |
| Core motivation | Deep journaling, long-term pattern analysis, data sovereignty |
| Tech literacy | Moderate — prefers desktop/tablet, comfortable touch + keyboard |
| Environment | Home office, morning coffee, Chrome on iPad (occasionally macOS desktop) — expects a native-tablet feel, not a stretched mobile layout |

**Bio:** 68, Vietnam veteran, 35+ years stable recovery. Began in AA (late 1980s), worked all 12 Steps under multiple sponsors, and in the last decade has found Recovery Dharma's Buddhist framework better aligned with his mature mindfulness practice. Maintains ties to both — monthly AA Big Book meeting, weekly Recovery Dharma group. Sponsors two men in his AA home group. Extremely protective of privacy, forged by decades of watching anonymity fail in smaller fellowships.

**Emotional spectrum:**
| State | Context | Design response |
|---|---|---|
| Best case | Morning ritual, coffee, no interruptions | Full-screen journal editor, no notifications, word count visible, export tools readily accessible |
| Typical case | Evening reflection after a meeting/sponsee call | Shorter entry, pattern analysis, checking sponsee step progress |
| Worst case | A rare hard day — difficult memories or a sponsee relapse | Does **not** need crisis tools; needs the journal fast and available. **The SOS modal is not designed for Walt.** |

**Goals:** distraction-free long-form writing with no character limits; absolute data ownership (JSON/PDF exports that work perfectly — he backs up monthly); high legibility, 44px+ touch targets; an encrypted view of his two sponsees' progress; year-over-year AI pattern comparison.

**Frustrations:** tiny touch targets/low contrast/phone-only assumptions; walled-garden apps without exports (he will leave); gamification/gimmicks that distract from deep work (no interest in streaks/badges); AI insights that don't cite their source data.

**UX rules:**
- Primary constraint: **Data Sovereignty & Accessibility**.
- 44px+ touch targets; 16px+ body text, high contrast.
- Export tools must work perfectly and include *all* data (including any future service-friends records).
- No character limits anywhere — Walt writes 800-word entries.
- AI insights must cite source data (which entries, which date range) — he won't trust an untraceable claim.
- Gamification (streaks/badges/XP) must not appear in his primary navigation paths.

**Key feature alignment:** The Vault (long-form journaling), Data Exports, AI Pattern Analysis in Deep Mode (multi-month/year comparison), the Service Module (for his two sponsees), the Recovery Dharma workbook.

**Journey arc:** Walt has no further stage to transition to — he's the apex of the arc. Product health for him is measured in 12-month retention, not 30-day. New features must not clutter his clean, depth-focused experience in service of newer users.

**Success metrics:** average journal word count; export frequency (monthly is the expected pattern); 6-month and 12-month retention (his most important product-health signal).

---

#### 5. Maya — "The Systematiser"
> *"I want to understand the mechanics of my brain so I can upgrade my operating system."*

| Attribute | Profile |
|---|---|
| Recovery stage | Early-to-mid (6–18 months) |
| Recovery path | Secular / CBT / SMART Recovery |
| Archetype | The Systematiser — High Completion Drive |
| Core motivation | Completing the curriculum; mastering the psychological mechanics of her addiction |
| Tech literacy | High — heavy user of exports, AI insights, structured content |
| Environment | Evening desktop sessions (second monitor) or weekend laptop mornings; full cognitive capacity — never in crisis when opening MRT; comfortable with information density |

**Bio:** 28, works in a data-driven field. Tried traditional 12-Step, found the spiritual framework a poor fit, moved to SMART Recovery and Recovery Dharma; 8 months in structured recovery. Doesn't just want to "stay sober" — wants to master the psychological mechanics of her behavior. Treats recovery like a curriculum: linear workbook progression, tracked completion %, AI comparative analysis to spot her own blind spots. Weekly Recovery Dharma group; a wise-friend 1:1 peer relationship she values over an open community feed.

**Differentiation from Walt (important — a documented overlap resolution):** Maya is in *completion mode* — recovery as a course to finish. Walt is in *reflection mode* — recovery as an open-ended practice with no destination. Maya wants progress bars and linear navigation; Walt wants an open journal and long-horizon charts. Same underlying features, different UX posture.

**Emotional spectrum:**
| State | Context | Design response |
|---|---|---|
| Best case | Weekend morning, dedicated study session | Full workbook depth, AI analysis, export tools |
| Typical case | Weekday evening, 30–60 min | One workbook section, journal entry, quick pattern check |
| Lowest engagement | Busy week, too tired for deep work | Quick daily reading, brief log — must not feel like failure; progress bar shows what's *completed*, not what's pending |

> **Note:** Maya has no crisis state in MRT — she's never in acute distress when she opens the app. The David safety test still applies to any feature she encounters (e.g. community), but her primary flows don't need crisis-first design.

**Goals:** systematic linear workbook completion with visible tracking; 90-day Deep Pattern Analysis correlating mood to triggers; traceable AI insights (auditable source data); a structured 1:1 accountability relationship (not an open feed); breadth across multiple secular/CBT modalities.

**Frustrations:** vague "one-size-fits-all" slogans (she prefers rigorous CBT tools like CBA/DENTS); an empty-feeling dashboard with no progress indicators; workbook progress missing from PDF exports; untraceable AI outputs (she assumes they're wrong and stops using the feature); open social feeds (distracting from the curriculum).

**UX rules:**
- Primary constraint: **Structured Progression**.
- Workbook completion % always visible — she tracks it like a syllabus.
- Linear navigation through sections is the default — never randomize or suggest out-of-sequence.
- AI insights must explicitly cite source data (entries, date range, mood samples) — no black boxes.
- Data visualizations must be exact and exportable — no rounded/estimated figures.
- Progress indicators frame completion, not deficit.

**Key feature alignment:** the Workbook Compass (SMART/CBT/Recovery Dharma/Secular-Stoic — linear completion is her primary engagement pattern), AI Comparative Analysis, multi-modality Daily Readings, PDF export with workbook progress included, a planned structured 1:1 Accountability Partner feature.

**Stage transition:** at Month 18, once available curricula are complete, her systematic drive risks turning to frustration. MRT should surface multi-year AI comparison once workbook completion hits 80%+, introduce mentoring/community features (she may be ready to give back with a secular/CBT approach), and offer service tools (wise-friend mentorship in the RD model).

**Success metrics:** Wisdom Score (total workbook questions answered — her primary signal); curriculum completion rate; insight frequency (how often she triggers Deep Pattern Recognition and marks results useful); export engagement.

---

#### 6. Jordan — "The Stabiliser"
> *"My recovery combines medicine and behavior. I need tools that support my physical stability without judgment."*

| Attribute | Profile |
|---|---|
| Recovery stage | Early-to-mid (Day 1–Month 12+, on active MAT) |
| Recovery path | MAT (Buprenorphine/Suboxone or Naltrexone) + MARA / SMART Recovery |
| Archetype | The Stabiliser — High Compliance Drive |
| Core motivation | Physical stabilization, craving management, rebuilding life/routine |
| Tech literacy | Moderate–High — expects automated reminders and correlation stats |
| Environment | On-the-go daily routine, mobile-primary, needs discreet visual alerts to avoid disclosing medical status |
| Fellowship notes | MARA (Medication-Assisted Recovery Anonymous) or SMART Recovery — faces stigma in traditional 12-Step rooms where MAT can be labeled "not clean"; needs non-spiritual, science-backed tools and customizable counters |

**Bio:** 35, recovering from severe opioid use disorder. After repeated painful relapse cycles in abstinence-only settings (and the shame that came with them), transitioned to a Buprenorphine (Suboxone) MAT program under an addiction specialist. Now stable, employed, rebuilding family relationships. Highly sensitive to preachy language or rigid counters that exclude a medical recovery path. Attends MARA meetings online, practices secular SMART techniques.

**Emotional spectrum:**
| State | Context | Design response |
|---|---|---|
| Best case | Stable routine, medication taken, low craving | Simple check-in, positive reinforcement of stability streak, calendar view |
| Typical case | Busy work day, mild craving, tracking a side effect | Single-tap dose logging, craving-intensity slider, quick note |
| Worst case | Withdrawal, intense craving, or severe side effects | Immediate grounding exercises, craving tracker, emergency clinician-contact shortcut |

**Goals:** secure automated daily-dose logging; AI correlation of cravings/mood/medication timing; custom counters ("Days of Stability" instead of absolute abstinence language); discreet lock-screen privacy.

**Frustrations:** language implying prescribed medication is "cheating"; multi-screen friction to log one dose; lock-screen notifications naming drugs ("Suboxone"/"Opioid"); craving spikes with no way to correlate against dose timing/sleep.

**UX rules:**
- Primary constraint: **Non-Judgmental Stability**.
- Reminders are discreet and generic ("Time for your morning routine check-in") — never a drug name.
- The main counter supports custom text labels ("Days of Stability," "Active Recovery Days") to accommodate MAT.
- Logging a dose is exactly one tap from the dashboard widget or a notification tap.
- Never show an "abstinence broken" state for a logged, prescribed recovery medication.

**Key feature alignment:** discreet dose reminders; a side-effect correlation matrix in Insights (sleep/headaches vs. mood/cravings); a MARA modality selector in guided journaling; a custom/renamable sobriety counter.

**Stage transition:** around Month 12, Jordan may begin a clinically-supervised taper. MRT should transition tracking language from "Medication Compliance" to "Somatic Baseline Tracking" (anxiety, heart rate, sleep), let the user keep their stability counters without a forced app reset, and introduce advanced CBT modules for tapering-related anxiety.

**Success metrics:** medication compliance rate; correlation-tracking frequency; 90-day retention through the critical first quarter.

---

### 1.4 Anti-Personas

Documented users MRT should **not** be optimized to serve, or who could be actively harmed by a feature — these are risks to design against, particularly for any social/connection surface.

**A. "The 13th-Stepper"** — someone using a sponsor role to exploit newcomers rather than support them.
- **Risk:** the (currently paused) Service Module's sponsor-invite/connection feature could be misused by someone with predatory intent toward vulnerable early-recovery users — a real, documented problem in AA/NA communities.
- **Design responses already specified:** a friend-consent screen requiring explicit sponsee opt-in; a sponsor can only see the sobriety date, never encrypted vault content; a connection can be revoked at any time.
- **Additional safeguards specified but not yet built:** an in-Profile "report this connection as concerning" path routing to admin review (not just disconnect); invite links that expire in 7 days and are single-use.

**B. "The Active User"** — someone currently in active addiction opening MRT out of curiosity, guilt, or to manage appearances rather than genuine recovery intent.
- **Risk:** not harmful in itself, but features built for David (genuine crisis + recovery intent) may not serve this person well, and could inadvertently create a false sense of progress.
- **Design response:** MRT makes no judgment about intent — the app is simply available. Features must never be built specifically to detect or convert this anti-persona, since that would require surveillance incompatible with the product's values.

**C. "The Dual-Diagnosis Crisis"** — someone whose mental-health crisis exceeds what a peer-support recovery app can address (acute suicidality, psychosis, severe dissociation).
- **Risk:** SOS/Urge Surfer tools are built for addiction-related urges and anxiety, not acute psychiatric emergencies. Using MRT's Urge Surfer *instead of* calling 911/a crisis line in a true psychiatric emergency is a real clinical risk.
- **Design responses:** the SOS modal always surfaces professional crisis lines (988, local equivalents) alongside peer tools — never buried below MRT's own features; MRT never positions itself as a clinical tool or substitute for professional care; the app's positioning language ("Sidekick," "Companion Tool") is deliberately chosen to avoid implying clinical capability.

### 1.5 Persona Overlap Register

Maintained to resolve conflicting needs on the same feature without design paralysis.

| Pair | Overlap | Resolution |
|---|---|---|
| Walt ↔ Maya | Both analytical, data-focused, secular recovery, AI insights | Different UX posture: Walt = open-ended reflection (no destination, open journal, long-horizon charts, no completion pressure). Maya = linear curriculum completion (progress bars, linear nav, completion %). |
| David ↔ Ned | Both early recovery, both phone-primary | Opposite emotional state: David needs zero friction in crisis; Ned wants reward while energized. Same feature (e.g. daily pledge) is a survival tool for one, a gamification element for the other — resolved via stage-based UI adaptation, not separate UIs. |
| Lisa ↔ Walt | Both long-term, both sponsor others | Different job-to-be-done: Lisa manages others (service-outward, primary destination); Walt reflects inward (introspection-first, service is secondary). |
| Maya ↔ Ned | Both early-to-mid recovery | Opposite motivation: Ned wants momentum/external validation; Maya wants systematic mastery/internal curriculum. Same workbook feature reads as a completion-tracker for Maya and a progress badge for Ned. |
| Jordan ↔ Ned | Both early-to-mid recovery | Different visibility preference: Ned wants gamified streaks and public milestone sharing; Jordan wants private stability tracking, custom counters, discreet notifications. |
| Jordan ↔ David | Both manage cravings | Different temporal focus: David is in acute 2AM crisis needing instant de-escalation; Jordan is focused on daily stabilization, dose compliance, and side-effect correlation. |

---

## Part 2 — Internal Stakeholder Personas

> These do **not** govern UX or copy — they govern **code architecture, business strategy, marketing, and support operations**. (`docs/governance/INTERNAL_PERSONAS.md`)

| Role | Persona | Key concern |
|---|---|---|
| CEO / Product Owner | **Alex** | Firestore read/write cost, legal/compliance, App Store verification, business viability |
| Developer / AI Partner | **Dev / AI** | TypeScript compile safety, zero-warning linting, Vitest coverage, CI/CD speed, modularity |
| Growth & Marketing | **Morgan** | PostHog telemetry, SEO, PWA install funnel, social-share card formatting |
| Support & Moderation | **Taylor** | Admin feedback dashboards, bug-report triage, anti-predator reporting flows |

**Alex (CEO / Product Owner)** — *"We must build a highly scalable, compliant business that respects absolute privacy without draining our runway."* Optimizes Firestore cost via TanStack Query caching; ensures zero-knowledge encryption keeps MRT from ever holding unencrypted sensitive medical data (breach/subpoena liability); secures DUNS registration for Play Store TWA compilation.
- *Codebase rules:* every new Firestore query is analyzed for read-cost impact before shipping (cache by default); never add a plaintext write of sensitive content (journals, workbook answers, service notes); TWA verification config (`assetlinks.json`) stays easy to maintain at the repo root.

**Dev / AI Partner (Developer / AI Co-Pilot)** — *"Clean code, strict types, and robust unit tests are the only things standing between us and chaotic regressions."* Maintains a strict zero-`any` compiler check, enforces regression tests on crypto functions/data factories/state hooks, and prevents "God files" by splitting heavy pages into single-responsibility subcomponents (PROJ-60).
- *Codebase rules:* `npm run lint` must return exactly 0 warnings/errors before any push; every new component/hook/schema change ships with a matching test file; edits are surgical and targeted — never a full-file rewrite when a precise replacement will do.

**Morgan (Growth Hacker / Marketer)** — *"If users can't easily install the app or share their milestones, our organic growth loops will fail."* Owns the PWA install funnel (iOS/Android), the aesthetic appeal of shareable milestone images, and PostHog conversion analytics (e.g. drop-off during vault setup).
- *Codebase rules:* shared milestone images render cleanly (UI chrome hidden during snapshot export); SEO metadata/semantic HTML maintained on the landing page and the VitePress guide; PostHog telemetry stays fully anonymized — never plaintext journal words, emails, or usernames.

**Taylor (Guardian / Support Lead)** — *"When a user encounters a bug or faces harassment, they need a safe, immediate way to report it and get help."* Monitors the admin Feedback Inbox, resolves reports of predatory behavior in peer-to-peer sponsee invites, and triages `client_errors` prioritizing crashes that affect vulnerable early-recovery users.
- *Codebase rules:* every feedback submission auto-attaches diagnostic metadata (app version, OS, browser); the "report a concerning connection" path stays reachable within two taps of Profile settings; support tooling must never grant admins access to decrypted user data — the zero-knowledge boundary holds even for internal support.

---

## Part 3 — Design System

MRT has **two** design-system documents in the repo, and they are not the same maturity level. This section is explicit about which one is actually enforced in the running app.

- **`.claude/skills/design/SKILL.md` — "Vibrant Momentum."** This is the **live, implemented, actually-enforced** design system. It is loaded automatically before any UI work and is corroborated by the real theme code (`src/lib/theme.ts`, `src/lib/heroColors.ts`) and by references to "Vibrant Momentum" scattered through actual specs and component code (e.g. `src/components/journal/JournalInsights.tsx`).
- **`docs/design/mrt_design_system.md` — "Momentum Kinetic v3.0."** This is a much more elaborate, aspirational **target-state** document (custom fonts, CSS-variable design tokens, an "Adaptive Recovery Rendering Engine," community/social features). Verified against the source: **none of its typography, color-token, or ARRE specification is implemented.** Treat it as a design *aspiration/roadmap*, not a description of the current app. Concrete, verified gaps are called out in §3.3.

### 3.1 Vibrant Momentum — the implemented design system

**Core philosophy:** Recovery is a return to life, not a punishment — reject gloomy health-app aesthetics.
- **Alive & forward-moving:** color, space, and motion signal hope.
- **Frictionless:** minimalist layouts for cognitively overloaded users (especially David in crisis).
- **Persona-adaptive:** the UI shifts vibe depending on recovery stage.

**Global UI architecture:**
- Layout uses `100dvh` (dynamic viewport height) for a perfect mobile fit at all times.
- Materiality: glassmorphism — translucent cards with `backdrop-blur`, layered depth.
- Navigation: sidebar on desktop, bottom-weighted on mobile, for one-handed use.
- Touch targets: 44px minimum on every interactive element — non-negotiable accessibility floor.
- Images: WebP only, referenced exclusively through the typed `ASSETS` dictionary in `src/data/assets.ts` — never a hardcoded path.

**Module color system** (as actually coded in `src/lib/theme.ts` — this table supersedes the shorter one in the skill file, which predates a few modules):

| Module | Page background | Header gradient | Vibe / psychological goal |
|---|---|---|---|
| Dashboard | `bg-slate-200` | sky-500 → blue-600 → indigo-600 | Hope & clarity, open horizons |
| Journal | `bg-indigo-200` | indigo-600 → purple-600 → violet-600 | Quiet reflection & focus |
| Tasks | `bg-cyan-200` | cyan-500 → teal-500 → emerald-500 | Energy & action, momentum |
| Workbooks | `bg-emerald-200` | emerald-600 → green-600 → lime-600 | Systematic growth & literature |
| Insights | `bg-fuchsia-200` | fuchsia-600 → pink-600 → rose-500 | Mystical & AI, deep pattern-finding |
| Vitality | `bg-orange-200` | rose-500 → orange-500 → amber-500 | Somatic grounding, vital energy |
| Tools | `bg-blue-200` | blue-600 → blue-500 → sky-500 | Bright clarity — matches the Dashboard's Tools tile |
| Profile | `bg-zinc-300` | slate-700 → gray-800 → zinc-900 | Identity & security settings |
| Service *(planned, unbuilt)* | — | Rose → Amber (spec only) | Warmth & human-to-human empathy |

**Rule:** high-saturation gradients throughout; no flat, muted, or grey-dominant palettes for feature modules (Profile is the deliberate, cooler exception, matching its "settings" role).

**Sobriety Hero Color themes (`src/lib/heroColors.ts`, PROJ-56):** 5 user-selectable presets applied to the Dashboard's Identity Card and shared milestone images — **Amber** (default; amber→orange→yellow), **Sky** (sky→blue→indigo), **Emerald** (emerald→green→teal), **Violet** (violet→purple→fuchsia), **Rose** (rose→pink→red). Stored unencrypted as `heroColor` on the user profile.

**Persona design constraints (condensed — full detail in Part 1):**
- **David (Day 1, crisis):** zero friction, large SOS buttons, "Skip for Now" always available, grounding tools never more than 2 taps away, PIN-lock screen visually reinforces Vault security, never a red "overdue"/failure state.
- **Ned (30–90 days, Pink Cloud):** visual reward first — prominent clean-time counter, XP bars, streak visualizations, high-energy dashboard, gamification immediately visible (never buried).
- **Lisa (7+ years, Service):** boundary management, clean sponsee-list organization, amber calming tones (anti-burnout), proactive self-care check-ins.
- **Walt (35+ years, Zen Master):** data sovereignty, high-legibility text (never sacrificed for style), deep-dive pattern charts, structured export views, density acceptable but never clutter.

**The "No-Guilt" Engine (applies everywhere, not just to David):**
- Never red "Overdue" text or failure language, anywhere in the app.
- Missed tasks are silently moved to "Today" via Smart Reset logic.
- No shame spirals — every state gets a compassionate reframing.

**Security UI rules:**
- Encrypted/locked content always falls back to a **blurred overlay** when the vault is locked.
- Encrypted content is visually distinct from plaintext content at all times.
- PIN-entry screens visually reinforce the vault's security and privacy.

**AI integration UI:**
- AI-generated suggestions carry a **purple sparkle icon (✦)** and (for tasks) a `+7 Days` badge — visually distinct from user-created content.
- AI output is never presented as authoritative — always framed as a "suggestion."

**Asset protocol:**
- WebP images only, referenced exclusively via the typed `ASSETS` dictionary (`src/data/assets.ts`) — no hardcoded paths anywhere in components.
- Avatars/personas only, never real names or real faces (anonymity compliance).

**Marketing & public-facing rules:**
- Never black-and-white or shadowy "depressed person" imagery.
- Show, don't tell — stylized app-UI mockups on modern devices.
- Positioning language: "Sidekick" or "Companion Tool" — never a clinical medical device.
- Anonymity: avatars/personas only in marketing, never real names/photos.
- Neutrality: avoid trademarked fellowship names/logos (AA/NA/CA) in public-facing material.

**Pre-implementation checklist (run before building any UI component):**
1. Which module is this? Apply that module's color/gradient.
2. Which persona uses this most? Apply their design constraint.
3. Are touch targets ≥44px on every interactive element?
4. Does it pass the David test — completable in ≤3 taps during acute crisis?
5. Is glassmorphism applied consistently with the rest of the module?
6. Are there guilt/shame/failure states that need compassionate reframing?
7. If AI-generated content is shown, is the purple sparkle + badge present?

### 3.2 Momentum Kinetic v3.0 — the aspirational target system

`docs/design/mrt_design_system.md` frames itself as graduating MRT "from a visual style guide into ... a behavioral interface architecture" — an interface that adapts its own density, motion, and tone to the user's detected emotional state, not just to which page they're on. It is a rich, well-thought-out spec, but as of this writing it describes a **future** version of MRT, not the current one. Summarized for reference (flagged, not verified in code):

- **Three governing pillars:** Somatic Safety First (nervous system before aesthetics), Adaptive Presence (UI density/motion/hierarchy shifts with detected emotional state), Earned Trust (every privacy/AI/community interaction must reinforce, not assume, trust).
- **Typography system (not implemented — see §3.3):** DM Sans (prose/emotional UI), JetBrains Mono (data — counters, streaks, timestamps), Playfair Display (milestone/celebration moments only).
- **Kinetic color token system (not implemented — see §3.3):** semantic tokens like `somatic-action-primary` (cyan/teal — tasks, grounding, primary CTAs) and `analytical-insight-primary` (purple/violet — AI, Vault, macro-data), plus semantic state colors (`state-milestone` amber, `state-neutral` slate-gray, `state-risk-gentle` orange, `state-grounding` mint) with hard rules: no red for failure states, no stark black backgrounds, amber reserved for celebration only.
- **Data visualization rules:** kinetic gradient lines, translucent area-chart fills (15%→0%), micro-tick markers instead of heavy dots, max 5–8% grid opacity, non-volatile Y-axes, smoothed/rolling-average trend lines, long-term view as the default.
- **Motion vocabulary:** a duration/easing table per interaction type (120ms micro-confirm, 300ms spring modal entrance, 600ms×3 celebration pulse, etc.), always respecting `prefers-reduced-motion`.
- **The Adaptive Recovery Rendering Engine (ARRE) — not implemented:** a proposed system that would detect a "state" (Stabilization/David, Momentum/Ned, Reflection/Walt, Analytical/Maya) from signals (self-report, journal sentiment, check-in response, time of day, AI pattern detection, streak status) and silently reshape navigation depth, chart visibility, touch-target size, motion, and AI tone in real time — David-state always wins ties, transitions are never abrupt, and the detected state itself is invisible to the user.
- **AI interaction standards:** a confidence-visualization table (solid border = high confidence, dashed border = low-confidence/uncertain, pulsing orange = crisis-language detection) and per-persona AI verbosity limits (David: 10–30 words grounding tone; Walt: 30+ words reflective; Maya: 50–300 words structured).
- **Trust & privacy "ritual" design:** vault entry as a deliberately slowed (500ms), haptic-heavy, interface-darkening ritual; an escalating trust-language table for share/export/clinical-view actions.
- **Empty/failure-state psychology:** a table of banned vs. preferred copy (e.g. never "No journal entries found," always "Every journey starts with a first reflection"); a "recovery reentry" rule that a streak never resurfaces with guilt copy after 14+ days away, and only resurfaces after 7 days of renewed engagement.
- **Notification ethics — "The Non-Manipulation Commitment":** explicitly rejects artificial scarcity, social pressure, loss-framed reminders, and dopamine-trigger badge systems.
- **Accessibility & neurodivergence standards:** WCAG 2.1 AA baseline (4.5:1 contrast, full keyboard nav, visible focus, 44px targets) plus proposed cognitive-load modes (Minimal / Focus / Grounding) and a motion-sensitivity table.
- **Community emotional safety patterns (not implemented — MRT has no social/community feed today):** pseudonyms by default, city-level location only, collapsible sensitive content, compassionate relapse handling, explicit sponsor/sponsee boundaries.
- **Clinical vs. consumer UI boundary:** consumer UI stays vibrant/celebratory; a hypothetical "Clinical Partner UI" would use a restrained palette, grid-first layouts, outcome metrics, audit-friendly exports, default anonymization, and no celebration animations.
- **Design token governance:** a 3-tier token hierarchy (primitive → semantic → component, e.g. `--color-cyan-500` → `--somatic-action-primary` → `--btn-primary-background`), with a 2-sprint deprecation-warning policy.

### 3.3 Verified gap between the two documents (as of 2026-07-24)

Direct inspection of the source confirms Momentum Kinetic v3.0 is not yet built:

| Momentum Kinetic v3.0 claims | What the code actually does |
|---|---|
| Custom fonts: DM Sans, JetBrains Mono, Playfair Display | No `font-family` declaration anywhere in `index.html`, `tailwind.config.js`, or `src/index.css` — the app renders in the browser's default system font stack |
| CSS custom-property design tokens (`--somatic-action-primary`, etc.) | `src/lib/theme.ts` and `src/lib/heroColors.ts` use literal Tailwind utility-class strings (`from-sky-500`, `bg-gradient-to-br from-amber-400...`), not CSS variables or a token layer |
| An Adaptive Recovery Rendering Engine that detects emotional state and reshapes the UI in real time | No such runtime state-detection/reshaping system exists; the persona-adaptive behavior that *does* exist today is the manual, page-level module color system in §3.1, not a live per-session adaptive engine |
| Community/social features, pseudonym defaults, sponsor/sponsee content-safety UI | MRT currently has no social feed, posts, or community surface at all (confirmed via `src/App.tsx` routing) — the Service Module these patterns would apply to is itself paused/unbuilt (see Part 1, §1.3 Lisa, and the main app knowledge base) |
| A "Clinical Partner UI" | No clinical/partner-facing view exists; the only non-consumer surface is the internal Admin Dashboard (`/admin`), which is an ops tool, not a clinical-outcomes UI |

**Practical guidance for anyone using this document:** when asked "what does MRT's design system say," answer from **Vibrant Momentum (§3.1)** — that's what's built and what `npm run check`/code review actually holds contributions to. Treat **Momentum Kinetic v3.0 (§3.2)** as a roadmap/inspiration document worth citing only when the question is explicitly about future direction, not current behavior.
