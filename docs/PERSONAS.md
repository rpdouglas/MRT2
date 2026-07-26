# 👥 Persona-Based Development Model

**Version:** 2.2 · **Last Updated:** July 2026 · **Next Review:** November 2026

**Change Log:**
- v1.0 — Original four personas (David, Ned, Lisa, Walt)
- v2.0 — Added Maya (The Systematiser)
- v2.1 — Full audit pass: added §0 Usage Guide, §1 Persona Hierarchy, Journey Arc per persona, emotional state spectrums, fellowship-specific notes, anti-personas, Walt bio correction, Maya archetype differentiation, version control
- v2.2 — Added Jordan (The Stabiliser), MAT/harm-reduction persona (Day 1-365+, MARA/SMART); updated Persona Hierarchy, Journey Arc, and Overlap Register accordingly

---

## §0 How to Use This Document in Development

Features must pass the "Persona Check" based on the user's emotional state, stage of recovery, fellowship culture, and technical environment. Every module in My Recovery Toolkit (MRT) is designed to serve at least one of these primary user archetypes.

**For every new feature or spec:**

1. **Identify the primary persona** this feature serves — who is it primarily designed for?
2. **Apply their UX Constraints** as acceptance criteria, not guidelines.
3. **Run the David Safety Test** — could this UI harm or overwhelm someone in acute crisis? If yes, redesign before shipping.
4. **Run the Walt Sovereignty Test** — does this feature respect data ownership and exportability?
5. **Check the Ned Transition** — does this feature account for the Pink Cloud crash at Day 90? Does gamification serve or harm Ned at that inflection point?
6. **Check the surveillance test** (for any social or connection feature) — would a reasonable person in early recovery feel watched or controlled by this? If yes, redesign.

**The primary persona rule:** Design decisions are optimised for the primary persona. Secondary personas are tested against the result — their needs are accommodated without compromising the primary. Never design for an average of all personas; this produces a mediocre experience for everyone.

---

## §1 Persona Hierarchy

| Role | Persona | Why |
| :--- | :--- | :--- |
| **Primary Safety Anchor** | David | Any feature that could harm a person in acute crisis must be redesigned before shipping. David's worst-case state sets the minimum acceptable UX floor for the entire product. |
| **Primary Engagement Driver** | Ned | Daily retention, task completion, and gamification features are optimised for Ned. His metrics determine whether the product builds habit. |
| **Primary Depth Driver** | Walt + Maya | AI analysis, journaling depth, workbook completion, and data export features are optimised for these two. Their engagement justifies the Premium tier. |
| **Primary Viral Driver** | Lisa | The sponsor invite flow is the primary mechanism for organic user acquisition. Lisa bringing her sponsees into MRT is MRT's most important growth loop. |
| **Primary Stabilization Driver** | Jordan | Medical-behavioral integration, craving management, and harm reduction tracking are optimized for Jordan. Ensures MRT remains a non-stigmatizing partner. |

---

## §2 Recovery Journey Arc

Users are not static. The same person may move through multiple persona stages over time — or regress. MRT must adapt as users evolve.

```
Day 1-30      → David (Survival, crisis-first design)
Day 1-365+    → Jordan (Parallel track - Medical integration, craving management, MAT compliance)
Day 30-90     → Ned (Momentum, gamification, habit building)
Day 90+       → Pink Cloud Crash transition point — highest design risk
Month 3-18    → Maya (Systematic learning, CBT, workbook completion)
Year 1+       → Walt (Deep reflection, long-term patterns, data sovereignty)
Year 7+       → Lisa (Service, sponsorship, giving back — Step 12)
```

**Stage transition design rules:**
- **Day 30 (David → Ned):** Shift visual emphasis from crisis tools to progress indicators. Introduce gamification. Do not remove SOS access — early Ned still needs it.
- **Day 90 (Pink Cloud Crash):** The highest-risk design moment. Reduce streak-count prominence. Shift from quantity metrics (tasks completed) to quality metrics (journal depth, step progress). Surface CBT tools and deeper AI analysis. Do not let the app feel "empty" when streaks break.
- **Month 6 (Ned → Maya/Walt):** Introduce structured workbook pathways. Offer deeper AI comparative analysis. Reduce onboarding prompts.
- **Year 1+ (Any → Lisa):** Surface service features and sponsor tooling when sobriety milestones suggest readiness.
- **Day 1+ (Parallel MAT Track):** Surface the discrete medication compliance logs and craving-correlation indicators in the Vitality and Insights tabs if MAT mode is enabled.

---

## §3 The Personas

---

### 1. "David" (The Survivor)
> *"I just need the noise to stop right now."*

| Attribute | Profile |
| :--- | :--- |
| **Recovery Stage** | Day 1 to 30 (Relapsed after 2 years) |
| **Recovery Path** | CA (Cocaine Anonymous) |
| **System Archetype** | **The Survivor** (High Urgency) |
| **Core Motivation** | De-escalate immediate urges and survive the night. |
| **Tech Literacy** | High, but currently cognitively overloaded. |
| **Environment** | Alone in his bedroom at 2 AM. Screen brightness is low. One hand. Portrait mode. |
| **Fellowship Notes** | CA (Cocaine Anonymous) — stimulant-specific recovery culture. Step language and literature differs from AA/NA. Sponsor relationship follows the same 12-Step model but the community is smaller and meetings are less geographically dense. CA-specific content must be used when referencing David's fellowship context. |

#### 📖 Bio & Narrative
David is 32 years old and tech-literate, but currently in a state of acute distress and high anxiety after losing two years of clean time. His cognitive load is maxed out. He cannot handle complex navigation, reading long blocks of text, or making multi-step decisions. He needs immediate, frictionless intervention to prevent a downward spiral. He found his sponsor through a CA meeting three weeks ago and has their number saved — but calling feels like admitting defeat at 2AM. He attends meetings sporadically; his attendance is least reliable in the first two weeks of a new attempt.

#### 🌡️ Emotional State Spectrum
| State | Context | Design Response |
| :--- | :--- | :--- |
| **Best case** | Mild urge, daytime, some cognitive capacity. Wants to log quickly and move on. | One-tap logging, brief prompts, visual confirmation. |
| **Typical case** | Evening anxiety, moderate distress, phone in one hand. | Large touch targets, no multi-step flows, immediate SOS access. |
| **Worst case** | 4AM after a relapse. Cognitively overwhelmed, shame spiral, phone nearly dead. | Single-screen intervention. Zero navigation. Sponsor call button visible without vault unlock. No text input required. |

> **Design rule:** All David-facing features must be designed for the worst case, not the typical case.

#### 🎯 Goals & Needs
* **De-escalation:** Immediate access to grounding techniques.
* **Rapid Logging:** Ability to record what he is feeling without typing paragraphs.
* **Instant Support:** One-tap access to his sponsor's phone number or crisis lines — available even when vault is locked.

#### 🚧 Frustrations & Pain Points
* **Friction:** Anything that takes more than a single tap to access.
* **Overwhelm:** Dashboards with too many charts, text, or options.
* **Shame:** Dealing with the heavy emotional toll of a recent relapse. Any UI language that implies failure makes this worse.
* **Isolation:** At 2AM there is no one to call who won't worry. He needs MRT to be that bridge.

#### ⚡ UX Constraints & Rules
* **Primary Constraint: Zero Friction.**
* *Rule:* No complex navigation. The SOS/Urge button must be visible in < 1 second from app launch.
* *Rule:* "Urge Log" and Voice-to-Vault must be accessible with exactly 1 tap.
* *Rule:* Sponsor call button must be functional without vault PIN entry — pulled from connection metadata, not the encrypted vault.
* *Rule:* No red "failure" states, no "overdue" labels, no shame-inducing language anywhere in David-facing flows.
* *Rule:* Maximum 3 taps to complete any crisis-mode action. Count taps. If it's 4, cut one.

#### 🛠️ Key Feature Alignment
* **Urge Surfer:** For immediate crisis de-escalation.
* **Voice-to-Vault:** To quickly vent feelings without typing.
* **SOS Modal — Sponsor Call Button:** One-tap access to sponsor (active sponsor connection required; works without vault unlock).
* **CA Daily Reading:** Fellowship-appropriate daily content.

#### 🔄 Journey Arc — Stage Transition
At Day 30, David's crisis intensity typically reduces. MRT should respond by:
- Gradually introducing Ned-style progress indicators (sobriety counter becomes more prominent)
- Keeping SOS access but reducing its visual dominance
- Introducing the first gamification elements (streaks, daily pledge) without overwhelming the still-fragile recovery foundation

#### 🏆 Success Metrics
* **Intervention Speed:** Time from app launch to SOS/Urge button tap.
* **Crisis Conversion:** Successful completion of an Urge Surfing session.
* **Day 7 Retention:** % of David-cohort users (Day 1-7) still active at Day 30 — the most critical retention window.

#### 🖼️ Asset Metadata
> All paths reference entries in `src/data/assets.ts` ASSETS dictionary. Do not hardcode paths in components.
* `ASSETS.personas.david.headshot`
* `ASSETS.personas.david.bio_feature`
* `ASSETS.personas.david.full_body`
* `ASSETS.personas.david.looking_left`

---

### 2. "Ned" (The Pink Cloud)
> *"I'm going to crush it today! Let's get that streak!"*

| Attribute | Profile |
| :--- | :--- |
| **Recovery Stage** | 30 to 90 Days |
| **Recovery Path** | NA (Narcotics Anonymous) |
| **System Archetype** | **The Achiever** (High Energy) |
| **Core Motivation** | Building momentum, tracking clean time, external validation. |
| **Tech Literacy** | Digital Native (Expects high-fidelity UI and gamification). |
| **Environment** | On his phone in portrait mode, one thumb, often with background noise (gym, commute). Short attention windows of 30–90 seconds. Tap-based interactions only — no text input in the flow. |
| **Fellowship Notes** | NA (Narcotics Anonymous) — the NA Basic Text, NA-specific step language, and NA's "We Do Recover" culture differ meaningfully from AA. The NA community tends to skew younger and more urban. NA-specific daily readings and step language should be used in Ned's context. His sponsor relationship follows NA norms. |

#### 📖 Bio & Narrative
Ned is 24, a digital native, and currently riding the optimistic, manic energy often called the "Pink Cloud" of early recovery. He treats recovery like a fitness app — he wants to see his stats, hit his daily goals, and feel a constant sense of forward momentum. He attends NA meetings three times a week and has a sponsor he calls every morning. He's enthusiastic about step work right now, though that enthusiasm will be tested.

#### 🌡️ Emotional State Spectrum
| State | Context | Design Response |
| :--- | :--- | :--- |
| **Best case** | Morning, energy high, just completed his daily pledge. | Full gamification, confetti, prominent streak counter, social sharing. |
| **Typical case** | Evening check-in, moderate energy. | Quick log, task completion, streak update. |
| **Worst case — The Pink Cloud Crash (Day 90)** | The initial euphoria fades. Daily tasks feel like obligations. Streaks breaking feels catastrophic. Highest relapse risk since Day 1. | Shift from quantity to quality metrics. Surface deeper tools (CBT, journaling). Reduce streak-count prominence. Do not let the app feel empty when streaks break. |

> **Design rule:** All Ned-facing gamification features must be stress-tested against the Pink Cloud Crash. If a feature would make Day 90 Ned feel like a failure, redesign it before shipping.

#### 🎯 Goals & Needs
* **Gamification:** Wants to see streaks, badges, and progress rings.
* **Habit Building:** Needs structured daily task lists.
* **Visual Affirmation:** Thrives on seeing his clean time front-and-center.
* **Recognition:** Wants his sponsor to know when he completes a step (opt-in step completion notification).

#### 🚧 Frustrations & Pain Points
* **Boredom:** Static, dry, or overly clinical interfaces.
* **Lack of Feedback:** Completing a task and getting no visual reward.
* **Stagnation:** Feeling like he isn't making measurable "progress."
* **Day 90 Void:** When the Pink Cloud lifts and the gamification that sustained him suddenly feels hollow — MRT must have something deeper waiting for him.

#### ⚡ UX Constraints & Rules
* **Primary Constraint: Visual Reward.**
* *Rule:* Dashboard must prominently display clean time and daily streaks.
* *Rule:* Positive reinforcement (confetti/haptics) on task completion is essential.
* *Rule:* At Day 90, automatically surface a "Going Deeper" prompt — introduce CBT tools, longer journal prompts, step work depth — without removing the gamification layer entirely.
* *Rule:* Streak-break UI must never be punishing. "Smart Reset" logic silently moves missed tasks to today. No red states, no failure language.

#### 🛠️ Key Feature Alignment
* **Daily Beacon/Tasks:** Keeping him engaged with recurring actions.
* **Gamification Engine:** Milestone badges and streak tracking.
* **NA Daily Reading:** Fellowship-appropriate content for his tradition.
* **Step Completion Notification (opt-in):** Signals his sponsor when he completes a step — feeds his need for recognition.

#### 🔄 Journey Arc — Stage Transition
At Day 90, Ned is at his highest post-early-recovery relapse risk. MRT should respond by:
- Shifting visual emphasis from streak counts to milestone badges (more durable, less fragile)
- Automatically surfacing the first workbook sections as the next challenge
- Introducing the AI Pattern Analysis feature for the first time ("You've logged 90 days — here's what your data shows")
- Reducing daily task count pressure — quality over quantity

#### 🏆 Success Metrics
* **Daily Active Usage (DAU):** Consistent daily logins, particularly in the first 90 days.
* **Task Completion Rate:** Percentage of daily habits checked off.
* **Day 90 Retention:** % of Ned-cohort users still active at Day 90 and Day 120 — the Pink Cloud Crash window.

#### 🖼️ Asset Metadata
> All paths reference entries in `src/data/assets.ts` ASSETS dictionary. Do not hardcode paths in components.
* `ASSETS.personas.ned.headshot`
* `ASSETS.personas.ned.bio_feature`
* `ASSETS.personas.ned.full_body`
* `ASSETS.personas.ned.looking_left`

---

### 3. "Lisa" (The Service Superstar)
> *"I have five sponsees and a full-time job. I need to stay organized so I don't burn out."*

| Attribute | Profile |
| :--- | :--- |
| **Recovery Stage** | Maintenance (7 Years) |
| **Recovery Path** | AA (Alcoholics Anonymous) |
| **System Archetype** | **The Guide** (High Output) |
| **Core Motivation** | Giving back (Step 12) without burning out. |
| **Tech Literacy** | Moderate-High (Uses phone primarily for communication). |
| **Environment** | In her car immediately after chairing a meeting. Phone only, one hand, parking lot. Time-pressured — she has 5 minutes before the next thing. |
| **Fellowship Notes** | AA (Alcoholics Anonymous) — Lisa follows the AA Big Book and 12 Traditions closely. She takes anonymity seriously; she will not use features that risk exposing her sponsees' identities or her own full name in any public context. She uses AA's gender-specific sponsor model (women sponsor women). Her five sponsees are all women she met at her home group. |

#### 📖 Bio & Narrative
Lisa is a 45-year-old working professional with a high-stress life. She is heavily involved in service work and currently sponsors 3–6 women (currently at 5, which is near her capacity limit). She uses MRT not just for her own recovery, but as a management tool to keep her service commitments organised. She is highly susceptible to neglecting her own self-care — a pattern her own sponsor regularly calls out. In her car after a meeting, she has five minutes to check in on who needs attention before she drives home.

#### 🌡️ Emotional State Spectrum
| State | Context | Design Response |
| :--- | :--- | :--- |
| **Best case** | Sunday morning, organised, ahead of her commitments. | Full Rolodex management, step progress updates, planning mode. |
| **Typical case** | In her car after a meeting. 5 minutes. One hand. | Quick dashboard scan — who needs contact? One-tap log contact. |
| **Worst case — Burnout** | Overcommitted, neglecting her own program. Resentful. | Vitality module self-care prompts surface. Amber tones. Gentle, non-intrusive boundary reminder. |

#### 🎯 Goals & Needs
* **Organisation:** Keep track of where her sponsees are in their step work, encrypted and private.
* **Resource Sharing:** Easily send readings or workbook content to sponsees — text only, anonymous.
* **Boundary Maintenance:** Ensure she is taking time for her own mental health, not just serving others.
* **At-a-Glance Urgency:** Know immediately who among her sponsees needs attention without reading through notes.

#### 🚧 Frustrations & Pain Points
* **Mental Load:** Trying to remember who texted her what, and when. This is her primary problem.
* **Boundary Blurring:** Losing track of her own programme while helping others.
* **Clutter:** Apps that make it hard to find specific tools quickly.
* **Privacy Risk:** Any feature that could expose a sponsee's identity or recovery status to others.

#### ⚡ UX Constraints & Rules
* **Primary Constraint: Boundary Management.**
* *Rule:* Service dashboard must sort friends by urgency (days since last contact) — Lisa must know who needs attention in under 10 seconds without reading individual profiles.
* *Rule:* Needs gentle, non-intrusive "Self-Care Check-ins" (Vitality Module) — surfaced proactively, never as a guilt-inducing alert.
* *Rule:* All sponsee data must be encrypted. Lisa must never worry that her private observations about a vulnerable person could be read by anyone else.
* *Rule:* Anonymity compliance — no feature should surface a sponsee's full name, real photo, or identifying details in any shareable format.
* *Rule:* The sponsee count (currently 5) is a design anchor for card layouts, sort algorithms, and notification thresholds — not a static fact. Range is 3–6.

#### 🛠️ Key Feature Alignment
* **Service Module — Encrypted Rolodex (PROJ-05):** Her primary daily tool. Sorted by urgency. Encrypted notes and step tracking per sponsee.
* **📋 Reading Share Button (planned — Daily Readings Engine, PROJ-40):** Text-only, anonymous exports for sponsees. No MRT branding that would violate AA anonymity tradition.
* **Vitality Module:** Tracking her own self-care metrics — the counterbalance to her service work.
* **QR Handshake:** Secure in-person step work sharing with sponsees.

#### 🔄 Journey Arc — Stage Transition
Lisa is at the maintenance stage. Her journey arc is not forward progression but sustainable depth. MRT should:
- Never add features that increase Lisa's mental load without providing a corresponding reduction in manual effort
- Surface the Service Module as a primary navigation item as soon as user sobriety milestone data suggests readiness for sponsorship (Year 2+)
- Provide periodic "sponsor health" prompts: "You have 5 active sponsees. Your capacity note says 5 is your limit."

#### 🏆 Success Metrics
* **Feature Utility:** Frequency of using the Service Dashboard and Rolodex.
* **Self-Care Logging:** Consistent use of her personal daily anchor in the Vitality module.
* **Viral Coefficient:** Number of successful sponsee invite activations per Lisa-cohort user — this is MRT's primary organic growth metric.

#### 🖼️ Asset Metadata
> All paths reference entries in `src/data/assets.ts` ASSETS dictionary. Do not hardcode paths in components.
* `ASSETS.personas.lisa.headshot`
* `ASSETS.personas.lisa.bio_feature`
* `ASSETS.personas.lisa.full_body`
* `ASSETS.personas.lisa.looking_left`

---

### 4. "Walt" (The Zen Master)
> *"Recovery is a lifelong practice of mindfulness and reflection."*

| Attribute | Profile |
| :--- | :--- |
| **Recovery Stage** | Long-Term (35+ Years) |
| **Recovery Path** | AA (original) · Recovery Dharma (current practice) |
| **System Archetype** | **The Observer** (High Reflection) |
| **Core Motivation** | Deep journaling, analysing long-term patterns, data sovereignty. |
| **Tech Literacy** | Moderate (Prefers desktop/tablet, comfortable with both touch and keyboard). |
| **Environment** | Home office, morning coffee, Chrome on iPad primarily, occasionally macOS desktop browser. Expects the app to behave like a native tablet application — not a stretched mobile layout. |

#### 📖 Bio & Narrative
Walt is a 68-year-old Vietnam Veteran with 35+ years of stable recovery. He began his recovery through AA in the late 1980s, worked all 12 Steps under multiple sponsors over the years, and in the last decade has found Recovery Dharma's Buddhist framework more aligned with his mature mindfulness practice. He maintains ties to both traditions — he still attends an AA Big Book meeting monthly and a Recovery Dharma group weekly. He sponsors two men in his AA home group.

He uses MRT primarily for deep introspection: writing long journal entries, tracking macro-patterns over years rather than days, and managing his service work with the quiet precision of someone who has seen what happens when boundaries fail. He is extremely protective of his privacy — a posture forged over decades of watching anonymity be violated in smaller fellowships.

#### 🌡️ Emotional State Spectrum
| State | Context | Design Response |
| :--- | :--- | :--- |
| **Best case** | Morning ritual, coffee, no interruptions. Deep writing mode. | Full-screen journal editor. No notifications. Word count visible. Export tools readily accessible. |
| **Typical case** | Evening reflection after a meeting or call with a sponsee. | Shorter journal entry. Pattern analysis. Checking on step progress of sponsees. |
| **Worst case** | A rare difficult day — difficult memories surface or a sponsee relapses. | Does not need crisis intervention tools. Needs the journal to be available and fast. SOS modal is not designed for Walt. |

#### 🎯 Goals & Needs
* **Deep Introspection:** A clean, distraction-free environment for long-form writing. No character limits anywhere.
* **Data Ownership:** Absolute control over his personal data. JSON and PDF exports must work perfectly. He backs up monthly.
* **Accessibility:** High-legibility text, 44px+ touch targets, no cluttered mobile UI. He uses a tablet.
* **Service Management:** An organised, encrypted view of his two sponsees' step progress and his private notes about their work together.
* **Long-term Pattern Analysis:** AI insights that compare this year's data against previous years — not just last week.

#### 🚧 Frustrations & Pain Points
* **Accessibility:** Tiny touch targets, low-contrast text, or features that assume a phone rather than a tablet.
* **Walled Gardens:** Apps that lock his data in and do not allow easy exports. He will leave any app that does this.
* **Superficiality:** Gamification or "gimmicks" that distract from deep work. Walt does not want streaks or badges.
* **Unreferenced AI:** AI insights that do not show their source data. Walt wants to know which journal entries generated a pattern claim.

#### ⚡ UX Constraints & Rules
* **Primary Constraint: Data Sovereignty & Accessibility.**
* *Rule:* Touch targets must be 44px+ minimum. Text must be highly legible — minimum 16px body, high contrast.
* *Rule:* Export tools (PDF/JSON) must work perfectly and include all data, including `service_friends` encrypted records.
* *Rule:* No character limits on any notes or journal fields. Walt writes 800-word entries.
* *Rule:* AI insights must reference their source data (which journal entries, which date range). Walt will not trust an insight he cannot trace.
* *Rule:* Gamification elements (streaks, badges, XP) must not appear in Walt's primary navigation paths. They may exist in the system but must not interrupt his workflow.

#### 🛠️ Key Feature Alignment
* **The Vault:** Zero-knowledge encrypted long-form journaling. His primary daily tool.
* **Data Exports:** Local backups and PDF generation — must include service data.
* **AI Pattern Analysis (Deep Mode):** Comparative analysis across months and years, not just weeks.
* **Service Module:** Manages his two sponsees' step progress and encrypted notes.
* **Recovery Dharma Workbook:** His current programme's structured inquiry path.

#### 🔄 Journey Arc
Walt has no further stage to transition to — he is at the apex of the recovery journey arc. MRT must serve him as a long-term user for years, not months. The product health metric for Walt is 12-month retention, not 30-day retention. Features must not become cluttered with additions that serve newer users at the cost of Walt's clean, depth-focused experience.

#### 🏆 Success Metrics
* **Content Depth:** Average word count per journal entry.
* **Export Frequency:** Regular use of the data backup tools (monthly is the expected pattern).
* **Long-term Retention:** % of Walt-cohort users (35+ days active, high journal word count) still active at 6 months and 12 months. This is the most important product health indicator for this persona.

#### 🖼️ Asset Metadata
> All paths reference entries in `src/data/assets.ts` ASSETS dictionary. Do not hardcode paths in components.
* `ASSETS.personas.walt.headshot`
* `ASSETS.personas.walt.bio_feature`
* `ASSETS.personas.walt.full_body`
* `ASSETS.personas.walt.looking_left`

---

### 5. "Maya" (The Systematiser)
> *"I want to understand the mechanics of my brain so I can upgrade my operating system."*

| Attribute | Profile |
| :--- | :--- |
| **Recovery Stage** | Early-to-Mid (6–18 months) |
| **Recovery Path** | Secular / CBT / SMART Recovery |
| **System Archetype** | **The Systematiser** (High Completion Drive) |
| **Core Motivation** | Completing the curriculum. Mastering the psychological mechanics of her addiction. |
| **Tech Literacy** | High (Heavy user of data exports, AI insights, structured content). |
| **Environment** | Evening sessions at a desktop with a second monitor, or weekend mornings on a laptop with coffee. Full cognitive capacity — she is never in a crisis state when she opens MRT. Comfortable with information density. No accessibility constraints. |

#### 📖 Bio & Narrative
Maya is 28 years old and works in a data-driven field. She initially tried traditional 12-Step programs but found the spiritual framework a poor fit for how she thinks. She moved to SMART Recovery and Recovery Dharma, and has been in structured recovery for eight months.

She doesn't just want to "stay sober" — she wants to master the psychological mechanics of her behaviour. She treats her recovery like a curriculum, moving systematically through workbooks in linear order, tracking her completion percentage, and using AI comparative analysis to spot patterns she can't see herself. She attends a Recovery Dharma group online weekly and has a wise-friend relationship with one other member — she values this structured 1:1 peer accountability over open community feeds.

**Differentiation from Walt:** Maya is in *completion mode* — she approaches recovery as a course to finish and master, moving chapter by chapter toward understanding. Walt is in *reflection mode* — he approaches recovery as an open-ended lifelong practice with no destination. These are meaningfully different UX postures that generate different design decisions on the same features. Maya wants progress bars and linear navigation; Walt wants an open journal and long-term pattern charts.

#### 🌡️ Emotional State Spectrum
| State | Context | Design Response |
| :--- | :--- | :--- |
| **Best case** | Weekend morning, dedicated study session, full focus. | Full workbook depth, AI analysis, export tools. |
| **Typical case** | Weekday evening, 30-60 minutes. | One workbook section, journal entry, quick pattern check. |
| **Lowest engagement** | Busy week, too tired for deep work. | Quick daily reading, brief log. Must not feel like failure — progress bar should show what she's completed, not what's pending. |

> **Note:** Maya does not have a crisis state in MRT. She is never in acute distress when she opens the app. The David safety test applies to features she encounters (e.g., community features) but her primary flows do not need crisis-first design.

#### 🎯 Goals & Needs
* **Systematic Learning:** Complete every workbook section in linear order with visible completion tracking.
* **Data Correlation:** Deep Pattern Analysis across 90-day windows — moods correlated with specific triggers.
* **Traceable Insights:** AI analysis that references source data. She will not trust an output she cannot audit.
* **Peer Accountability:** A structured 1:1 wise-friend relationship — not an open social feed.
* **Modality Breadth:** Access to multiple recovery philosophies (SMART, Recovery Dharma, CBT, Secular/Stoic) to build a comprehensive personal framework.

#### 🚧 Frustrations & Pain Points
* **Vague Advice:** Frustrated by "one-size-fits-all" recovery slogans. Prefers rigorous CBT toolsets like CBA and DENTS.
* **Lack of Structure:** Dislikes a dashboard that feels empty. Needs clear progress indicators for workbook completion — not a blank "add a journal entry" prompt.
* **Data Silos:** Wants workbook progress visible alongside journal entries in PDF exports.
* **Untraceable AI:** If an AI insight doesn't show its source data, Maya assumes it's wrong and stops using the feature.
* **Open Social Feeds:** Not interested in a general community feed. Finds it distracting from the curriculum.

#### ⚡ UX Constraints & Rules
* **Primary Constraint: Structured Progression.**
* *Rule:* Workbook completion percentage must be visible at all times in the workbook module — Maya tracks her progress like a course syllabus.
* *Rule:* Linear navigation through workbook sections is the default — do not randomise or suggest sections out of sequence.
* *Rule:* AI insights must explicitly reference source data (which journal entries, which date range, which mood samples). No black-box outputs.
* *Rule:* Data visualisations must be mathematically exact and exportable. No rounded or estimated figures.
* *Rule:* Progress indicators should show what she has completed, not what remains — framing completion, not deficit.

#### 🛠️ Key Feature Alignment
* **The Workbook Compass:** Core user for SMART Recovery, CBT, Recovery Dharma, and Secular/Stoic workbooks. Linear completion is her primary engagement pattern.
* **AI Comparative Analysis:** Compares current weekly patterns against previous months with full data references.
* **Multi-Modality Daily Readings:** Frequently switches between SMART, Recovery Dharma, Secular/Stoic to gather broad philosophical perspective.
* **PDF Export with Workbook Progress:** Must include workbook completion data alongside journal entries.
* **Accountability Partner (planned):** A structured 1:1 connection with her wise friend — not an open community feed.

#### 🔄 Journey Arc — Stage Transition
At Month 18, Maya faces a transition: she has completed the available curricula and her systematic drive may turn to frustration if there is nothing left to complete. MRT must anticipate this by:
- Surfacing the advanced AI Pattern Analysis features (multi-year comparison) when workbook completion reaches 80%+
- Introducing the community features — she may now be ready to give back and mentor others with a similar secular/CBT approach
- Offering the service tools (wise-friend mentorship in RD model) as the next structured relationship to manage

#### 🏆 Success Metrics
* **Wisdom Score:** Total workbook questions answered and completed. This is Maya's primary engagement signal.
* **Curriculum Completion Rate:** Percentage of available recovery literature consumed within her selected modalities.
* **Insight Frequency:** How often she triggers the Deep Pattern Recognition engine and marks insights as "useful."
* **Export Engagement:** Regular generation of workbook-inclusive PDF exports.

* `ASSETS.personas.maya.looking_left`

---

### 6. "Jordan" (The Stabiliser)
> *"My recovery combines medicine and behavior. I need tools that support my physical stability without judgment."*

| Attribute | Profile |
| :--- | :--- |
| **Recovery Stage** | Early-to-Mid (Day 1 to Month 12+, on active MAT) |
| **Recovery Path** | MAT (Buprenorphine/Suboxone or Naltrexone) + MARA / SMART Recovery |
| **System Archetype** | **The Stabiliser** (High Compliance Drive) |
| **Core Motivation** | Physical stabilization, craving management, and rebuilding life/routine. |
| **Tech Literacy** | Moderate-High (Expects automated reminders and correlation stats). |
| **Environment** | Daily routine on the go. Mobile-primary. Needs discrete visual alerts to avoid sharing medical status. |
| **Fellowship Notes** | MARA (Medication-Assisted Recovery Anonymous) or SMART Recovery. Jordan faces systemic stigma in traditional 12-Step rooms where peers or sponsors might declare they are "not clean" due to taking recovery medications. Jordan needs non-spiritual, science-backed behavioral tools and customizable counters. |

#### 📖 Bio & Narrative
Jordan is 35 years old and recovering from severe opioid use disorder. After experiencing multiple painful relapse cycles in traditional abstinence-only settings (leaving them with intense shame), they transitioned to a Buprenorphine (Suboxone) MAT program managed by an addiction specialist. Jordan is now stable, employed, and rebuilding family relationships. They use MRT as a behavioral tracker, but are highly sensitive to preachy language or rigid counters that exclude their medical path. They attend MARA meetings online and practice secular SMART techniques.

#### 🌡️ Emotional State Spectrum
| State | Context | Design Response |
| :--- | :--- | :--- |
| **Best case** | Stable daily routine, medication taken, craving level low. | Simple check-in, positive reinforcement of stability streak, calendar view. |
| **Typical case** | Busy work day, mild cravings, needs to track a side effect. | Single-tap dose logging, craving intensity slider, quick note entry. |
| **Worst case** | Experiencing withdrawal, intense cravings, or severe side effects. | Immediate grounding exercises, craving tracker, emergency clinician contact shortcut. |

#### 🎯 Goals & Needs
* **Medication Adherence:** A secure, automated log to track daily doses without fail.
* **Craving/Side-Effect Correlation:** AI insights correlating craving peaks, mood, and medication timing.
* **Custom Counters:** Sobriety dates that celebrate "Days of Stability" or "Harm-Free Days" instead of absolute chemical abstinence.
* **Discrete Privacy:** Notifications that protect their medical privacy on lock screens.

#### 🚧 Frustrations & Pain Points
* **Rigid Dogmatism:** App language or metrics implying that taking prescribed recovery medication is "cheating."
* **Cluttered Inputs:** Having to navigate multiple screens to record a simple daily dose.
* **Public Alerts:** Reminder notifications that show terms like "Suboxone" or "Opioid" on the lock screen.
* **Uncorrelated Data:** Cravings spiking without the ability to analyze if it's tied to dose timing or sleep quality.

#### ⚡ UX Constraints & Rules
* **Primary Constraint: Non-Judgmental Stability.**
* *Rule:* Daily reminders must be discrete and generic (e.g. "Time for your morning routine check-in"). No drug names.
* *Rule:* The main counter must support custom text labels (e.g. "Days of Stability" or "Active Recovery Days") to accommodate MAT.
* *Rule:* Logging a dose must take exactly one tap from the dashboard widget or notification tap.
* *Rule:* Never show "abstinence broken" states if a user logs an approved prescribed recovery medication.

#### 🛠️ Key Feature Alignment
* **Discreet Dose Reminders:** Generates push notifications for compliance without exposing medical details.
* **Side-Effect Correlation Matrix (Insights):** Maps physical symptoms (sleep, headaches) against mood and cravings.
* **MARA Modality Selector:** Integrates MARA and SMART Recovery templates into the guided journaling tool.
* **Custom Sobriety Counter:** Allows users to rename their recovery metrics.

#### 🔄 Journey Arc — Stage Transition
At Month 12, Jordan may begin tapering off medication under clinical supervision. MRT must support this by:
- Transitioning tracking metrics from "Medication Compliance" to "Somatic Baseline Tracking" (monitoring anxiety, heart rate, sleep).
- Keeping the option to continue tracking stability counters without forcing an app reset.
- Introducing advanced CBT modules to cope with tapering-related anxiety.

#### 🏆 Success Metrics
* **Medication Compliance Rate:** Percentage of scheduled doses logged.
* **Correlation Rating:** Frequency of tracking side-effects and cravings.
* **90-Day Retention:** Percentage of MAT-track users who maintain stability logging through the critical first quarter.

#### 🖼️ Asset Metadata
* `ASSETS.personas.jordan.headshot`
* `ASSETS.personas.jordan.bio_feature`
* `ASSETS.personas.jordan.full_body`
* `ASSETS.personas.jordan.looking_left`

---

## §4 Anti-Personas

Anti-personas document users who should NOT be served by MRT features, or who could be harmed by them. These are not edge cases — they are documented risks that must be designed against, particularly for social and connection features.

---

### Anti-Persona A — "The 13th-Stepper"
> A person using the sponsor role to exploit newcomers rather than support them.

**Risk:** The Service Module's sponsor invite and connection features could be misused by someone with predatory intent toward vulnerable users in early recovery. The "13th-stepper" is a documented real-world problem in AA/NA communities.

**Design responses already implemented:**
- Friend consent screen requires explicit opt-in — the sponsee must accept the connection
- Lisa can only see sobriety date — no access to encrypted vault content
- Friend can revoke connection at any time

**Additional safeguards needed:**
- Friends should be able to report a connection as concerning from within the Profile settings — this should route to an admin review, not just disconnect
- Connection invite links expire in 7 days and are single-use — cannot be mass-distributed

---

### Anti-Persona B — "The Active User"
> A person currently in active addiction who opens MRT out of curiosity, guilt, or to manage appearances rather than with genuine recovery intent.

**Risk:** Not harmful in itself — but features designed for David (crisis, genuine intent to recover) may not serve this user well, and may inadvertently provide a false sense of progress without real engagement.

**Design response:** MRT makes no judgment about intent. The app is available. The design for David assumes genuine crisis intent. Features should not be built specifically to convert or detect this anti-persona — that would require surveillance that violates the product's values.

---

### Anti-Persona C — "The Dual-Diagnosis Crisis"
> A person whose mental health crisis exceeds what a peer-support recovery app is designed to address — acute suicidality, psychosis, severe dissociation.

**Risk:** MRT's SOS modal and grounding tools are designed for addiction-related urges and anxiety, not for acute psychiatric emergencies. A user in a true psychiatric crisis using MRT's Urge Surfer instead of calling 911 or a crisis line represents a real clinical risk.

**Design responses:**
- SOS modal always surfaces professional crisis lines (988 in the US, local equivalents) alongside peer tools — these are never buried below MRT's own features
- MRT must never position itself as a clinical tool or substitute for professional mental health care
- The app's positioning language ("Sidekick," "Companion Tool") is specifically chosen to avoid implying clinical capability

---

## §5 Persona Overlap Register

Maintained to prevent design paralysis when two personas have conflicting needs on the same feature.

| Pair | Overlap | Resolution |
| :--- | :--- | :--- |
| Walt ↔ Maya | Both analytical, data-focused, secular recovery, AI insights | **UX posture is different:** Walt = open-ended reflection (no destination). Maya = linear curriculum completion (wants to finish). Design for Maya uses progress bars, linear navigation, completion %. Design for Walt uses open journal, long-horizon pattern charts, no completion pressure. |
| David ↔ Ned | Both early recovery, both phone-primary | **Emotional state is opposite:** David is in crisis and needs zero friction. Ned is energised and wants reward. The same feature (daily pledge) should be a survival tool for David and a gamification element for Ned — these are handled by stage-based UI adaptation, not separate UIs. |
| Lisa ↔ Walt | Both long-term, both sponsor others | **Job-to-be-done is different:** Lisa = manage others (service-outward). Walt = reflect inward (introspection-first). Service features are Lisa's primary destination; a secondary one for Walt. |
| Maya ↔ Ned | Both early-to-mid recovery | **Motivation is opposite:** Ned = momentum and gamification (external validation). Maya = systematic mastery (internal curriculum). The same workbook feature is a completion-tracking tool for Maya and a progress badge for Ned. |
| Jordan ↔ Ned | Both early-to-mid recovery | **Visibility preferences differ:** Ned wants gamified streaks and public milestone sharing. Jordan wants private medical stability, customized counters, and discreet notifications. |
| Jordan ↔ David | Both manage cravings | **Temporal focus differs:** David is in acute crisis at 2 AM and needs instant de-escalation. Jordan is focused on daily stabilization, dose compliance, and side-effect correlations. |

---

*My Recovery Toolkit · docs/PERSONAS.md · v2.2 · July 2026*
