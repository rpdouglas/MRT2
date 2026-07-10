/**
 * src/data/journalTemplates.ts
 * Default templates for the Journal Editor.
 *
 * Two shapes are supported:
 *  - `content`: a single pre-formatted Markdown block (legacy shape, used by
 *    the original 4 templates). Selecting these drops the block straight
 *    into the free-write textarea.
 *  - `prompts`: an array of individual prompt strings (richer shape, shared
 *    with user-created custom templates in `src/lib/db.ts`). Selecting these
 *    renders one labeled textarea per prompt in the guided form view.
 *
 * `group` drives the modality section a template appears under in the
 * Journal Editor's template picker (see GROUP_ORDER below).
 */

export interface StaticJournalTemplate {
  id: string;
  name: string;
  tags: string[];
  group: string;
  content?: string;
  prompts?: string[];
}

/** Display order for template picker optgroups. Any group not listed here
 * falls back to the end, sorted alphabetically. */
export const GROUP_ORDER = [
  'Twelve-Step',
  'CBT / SMART',
  'DBT',
  'Mindfulness',
  'Harm Reduction',
  'Reset',
  'Trauma-Informed',
  'ACT',
  'Motivational',
  'MAT',
  'General',
];

export const DEFAULT_TEMPLATES: StaticJournalTemplate[] = [
    {
        id: 'morning_intention',
        name: 'Morning Intention',
        group: 'Twelve-Step',
        content: `### Morning Intention ☀️

**Just for today, I will...**


**I am surrendering control of:**


**My top priority is:**
`,
        tags: ['Morning', 'Intention']
    },
    {
        id: 'nightly_inventory',
        name: 'Nightly Inventory',
        group: 'Twelve-Step',
        content: `### Nightly Inventory 🌙

**Was I resentful, selfish, dishonest, or afraid?**


**Do I owe an apology?**


**What did I do well today?**
`,
        tags: ['Nightly', 'Inventory']
    },
    {
        id: 'urge_log',
        name: 'Urge Log (SOS)',
        group: 'Twelve-Step',
        content: `### Urge Log 🚨

**Trigger:**


**HALT Check:**
- [ ] Hungry
- [ ] Angry
- [ ] Lonely
- [ ] Tired

**Play the tape forward (If I use, what happens next?):**


**Coping Strategy:**
`,
        tags: ['Urge', 'SOS']
    },
    {
        id: 'meeting_reflection',
        name: 'Meeting Reflection',
        group: 'Twelve-Step',
        content: `### Meeting Reflection 🪑

**Meeting Topic/Group:**


**Key Takeaway (One thing that resonated):**


**Action Item (How will I apply this?):**
`,
        tags: ['Meeting', 'Service']
    },

    // ---------------------------------------------------------------------
    // CBT / SMART Recovery
    // ---------------------------------------------------------------------
    {
        id: 'thought_check_in',
        name: 'Thought Check-In',
        group: 'CBT / SMART',
        prompts: [
            'Situation:',
            'Automatic thought:',
            'Feeling (0-10 intensity):',
            'Evidence for / against this thought:',
            'More balanced thought:'
        ],
        tags: ['CBT', 'Thoughts']
    },
    {
        id: 'cost_benefit_check',
        name: 'Cost-Benefit Check (ABC Model)',
        group: 'CBT / SMART',
        prompts: [
            'Activating event (what happened):',
            'Belief (what I told myself about it):',
            'Consequence (how I felt/reacted):',
            'Short-term benefit of using:',
            'Long-term cost of using:',
            "What I'll do instead:"
        ],
        tags: ['SMART', 'Urge']
    },

    // ---------------------------------------------------------------------
    // DBT / Distress Tolerance
    // ---------------------------------------------------------------------
    {
        id: 'distress_tolerance',
        name: 'Ride the Wave (TIPP)',
        group: 'DBT',
        prompts: [
            "What's the distress, 0-10?",
            'TIPP tried (Temperature / Intense exercise / Paced breathing / Paired muscle relaxation):',
            'Distress now, 0-10?',
            'One wise-mind thought to hold onto:'
        ],
        tags: ['DBT', 'Crisis']
    },

    // ---------------------------------------------------------------------
    // Mindfulness-Based Relapse Prevention
    // ---------------------------------------------------------------------
    {
        id: 'urge_surfing',
        name: 'Urge Surfing',
        group: 'Mindfulness',
        prompts: [
            'Where do I feel the urge in my body?',
            'Intensity right now (0-10):',
            'Urges are temporary — what does it feel like 5 minutes from now if I just watch it?',
            'What was true right before the urge showed up?'
        ],
        tags: ['Mindfulness', 'Urge']
    },

    // ---------------------------------------------------------------------
    // Harm Reduction
    // ---------------------------------------------------------------------
    {
        id: 'safer_choices',
        name: 'Safer Choices Check-In',
        group: 'Harm Reduction',
        prompts: [
            'My goal today (abstinence, reduction, or something else):',
            'If I do use, my safety plan:',
            'Who knows where I am / can check on me:',
            'One thing I did today to take care of myself, regardless of use:'
        ],
        tags: ['Harm Reduction', 'Planning']
    },

    // ---------------------------------------------------------------------
    // Lapse / Relapse Debrief
    // ---------------------------------------------------------------------
    {
        id: 'after_a_slip',
        name: 'After a Slip',
        group: 'Reset',
        prompts: [
            'What happened (just the facts):',
            'What need was I trying to meet?',
            "One thing I'm learning, not judging:",
            'My very next step:'
        ],
        tags: ['Reset', 'Compassion']
    },

    // ---------------------------------------------------------------------
    // Trauma-Informed / Somatic
    // ---------------------------------------------------------------------
    {
        id: 'body_check',
        name: 'Body Check',
        group: 'Trauma-Informed',
        prompts: [
            'Right now my body feels:',
            'Am I in fight, flight, freeze, or settled?',
            'One grounding thing I can do in the next 5 minutes:',
            'Do I feel safe? If not, who can I reach out to?'
        ],
        tags: ['Trauma-Informed', 'Grounding']
    },

    // ---------------------------------------------------------------------
    // Values / ACT
    // ---------------------------------------------------------------------
    {
        id: 'values_compass',
        name: 'Values Compass',
        group: 'ACT',
        prompts: [
            'A value that matters to me:',
            'Did today move me toward or away from it?',
            'One small action tomorrow that lines up with this value:'
        ],
        tags: ['ACT', 'Values']
    },

    // ---------------------------------------------------------------------
    // Motivational Interviewing / Readiness
    // ---------------------------------------------------------------------
    {
        id: 'readiness_ruler',
        name: 'Readiness Ruler',
        group: 'Motivational',
        prompts: [
            'How important is change to me right now (0-10)?',
            'How confident am I I can do it (0-10)?',
            'Why not a lower number?',
            'What would move my confidence up by one point?'
        ],
        tags: ['Motivation', 'Reflection']
    },

    // ---------------------------------------------------------------------
    // Medication-Assisted Treatment
    // ---------------------------------------------------------------------
    {
        id: 'mat_check_in',
        name: 'MAT Check-In',
        group: 'MAT',
        prompts: [
            'Took my medication as prescribed today? (Yes / No)',
            'Any side effects or cravings to flag for my provider:',
            "How I'm feeling about my treatment plan today:"
        ],
        tags: ['MAT', 'Wellness']
    },

    // ---------------------------------------------------------------------
    // General / Secular Daily Reflection
    // ---------------------------------------------------------------------
    {
        id: 'daily_check_in',
        name: 'Daily Check-In (No Program)',
        group: 'General',
        prompts: [
            "Sleep, food, movement — how'd I do?",
            'One win today:',
            'One thing weighing on me:',
            'What I need tomorrow:'
        ],
        tags: ['General', 'Wellbeing']
    }
];
