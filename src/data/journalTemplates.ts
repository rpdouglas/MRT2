/**
 * src/data/journalTemplates.ts
 * Default templates for the Journal Editor.
 * Content is formatted in Markdown.
 */

export interface StaticJournalTemplate {
    id: string;
    name: string;
    content: string;
    tags: string[];
}

export const DEFAULT_TEMPLATES: StaticJournalTemplate[] = [
    {
        id: 'morning_intention',
        name: 'Morning Intention',
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
        content: `### Meeting Reflection 🪑

**Meeting Topic/Group:**


**Key Takeaway (One thing that resonated):**


**Action Item (How will I apply this?):**
`,
        tags: ['Meeting', 'Service']
    }
];
