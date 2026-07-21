/**
 * src/lib/toolHistorySummary.ts
 * PROJ-50 §5: Tools Hub Redesign
 * Small helpers for presenting a decrypted SMART Tool journal payload as a
 * readable list — no per-tool renderer, just enough structure to pick a
 * one-line headline and humanize field labels generically.
 */
import type { SmartToolType } from './types/smart';

/** The single field (when one exists) that best summarizes a completion at a glance. Tools with no natural single-string field (arrays, scores) are omitted — callers fall back to the entry's date. */
export const HEADLINE_FIELD: Partial<Record<SmartToolType, string>> = {
    CBA: 'behavior',
    ABC: 'activatingEvent',
    DENTS: 'scenario',
    THOUGHT_RECORD: 'situation',
    FIVE_QUESTIONS: 'thought',
    SMART_GOAL: 'specific',
};

/** camelCase / PascalCase field name -> "Title Case" label, e.g. "activatingEvent" -> "Activating Event". */
export function humanizeKey(key: string): string {
    const spaced = key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type LabelResolver = string | ((data: Record<string, unknown>) => string);

/**
 * The real question/prompt text behind each guided tool's field — copied verbatim from each
 * tool's `Step.question` (and intro-phase label), so a saved answer can be shown next to what
 * was actually asked instead of just a humanized version of the field's variable name. Dynamic
 * entries reproduce the tool's own template + empty-value fallback (see CBATool.tsx:41,
 * DentsTool.tsx:31, FiveQuestionsTool.tsx:36). PERSONIFY's entries label a `personas[]` item's
 * own fields (name/action/result), not top-level payload keys — reused by the object-array
 * renderer in PayloadSummaryList. SMART_GOAL/BOUNDARIES/SELF_COMPASSION have no shipped UI yet,
 * so they're intentionally absent — unmapped fields fall back to `humanizeKey` below.
 */
const QUESTION_LABELS: Partial<Record<SmartToolType, Record<string, LabelResolver>>> = {
    CBA: {
        behavior: 'What behavior are we analyzing?',
        advantagesDoing: (d) => `What does ${d.behavior || 'this behavior'} actually give you?`,
        disadvantagesDoing: (d) => `What has ${d.behavior || 'this behavior'} cost you?`,
        advantagesStopping: (d) => `What would you gain by stopping ${d.behavior || 'this behavior'}?`,
        disadvantagesStopping: (d) => `What feels hard or scary about stopping ${d.behavior || 'this behavior'}?`,
    },
    ABC: {
        activatingEvent: 'What happened? Describe just the facts — what you saw, heard, or experienced.',
        beliefs: 'What thought went through your mind? What did that event mean to you?',
        consequences: 'How did that belief make you feel? What did you do (or want to do) as a result?',
        dispute: 'Is this belief actually true? What evidence contradicts it? What would you say to a friend who had this thought?',
        effectiveBelief: 'Write a more balanced, realistic version of the original belief.',
    },
    DENTS: {
        scenario: "What's the high-risk situation you're planning for?",
        deny: (d) => `If ${d.scenario || 'this situation'} happens, how exactly will you Deny it? What words will you say?`,
        escape: (d) => `If ${d.scenario || 'this situation'} gets too risky, what's your exact escape plan?`,
        neutralize: (d) => `Who will you call to neutralize the craving if ${d.scenario || 'this situation'} happens?`,
        tasks: (d) => `What specific task will keep your hands and mind busy during ${d.scenario || 'this situation'}?`,
        swap: (d) => `What healthy alternative will you swap in during ${d.scenario || 'this situation'}?`,
    },
    FIVE_QUESTIONS: {
        thought: "What's the thought or belief you want to examine?",
        q1Explanation: (d) => `Is the thought "${d.thought || 'this thought'}" true?`,
        q1IsTrue: 'Is It True?',
        q2Explanation: (d) => `Can you absolutely know that "${d.thought || 'this thought'}" is true?`,
        q2CanKnow: 'Can You Know For Certain?',
        q3Reaction: (d) => `How do you react — what happens — when you believe "${d.thought || 'this thought'}"?`,
        q4WithoutThought: (d) => `Who would you be without the thought "${d.thought || 'this thought'}"?`,
        turnaround: (d) => `Write the turnaround — the opposite of "${d.thought || 'this thought'}." Then rate how true it feels.`,
        turnaroundRating: 'How True Does the Turnaround Feel? (1-5)',
    },
    THOUGHT_RECORD: {
        situation: 'What were you doing? Where were you? When did this happen?',
        automaticThoughts: 'What went through your mind? What images or memories came up?',
        emotions: 'What are you feeling right now, and how strong is it?',
        evidenceFor: 'What facts actually support this thought?',
        evidenceAgainst: 'What facts contradict this thought? What would a reasonable person say?',
        balancedThought: 'Write a more balanced thought that takes all the evidence into account.',
        outcomeEmotions: "Re-rate the same emotions now that you've worked through this thought.",
        distortionType: 'Thinking Pattern Noticed',
    },
    LIFESTYLE_BALANCE: {
        physical: 'Physical (exercise, sleep, diet, medical care)',
        mental: 'Mental (stress management, emotional regulation)',
        relationships: 'Relationships (family, friends, community support)',
        work: 'Work/Purpose (career, education, meaningful duties)',
        spiritual: 'Spiritual (values, connection to a higher purpose)',
        leisure: 'Leisure (hobbies, fun, relaxation without substances)',
    },
    PERSONIFY: {
        name: "Rogue's Name",
        action: 'The Lie It Tells',
        result: 'The Truth (Disarm)',
    },
};

/** Resolves the real question/label for a payload field, falling back to a humanized version of the key itself when the (type, key) pair has no entry above — always safe to call, even for legacy/unmapped fields. */
export function getFieldLabel(type: SmartToolType | undefined, key: string, data: Record<string, unknown>): string {
    const resolver = type ? QUESTION_LABELS[type]?.[key] : undefined;
    if (typeof resolver === 'function') return resolver(data);
    if (typeof resolver === 'string') return resolver;
    return humanizeKey(key);
}

export function isEmotionArray(value: unknown): value is Array<{ emotion: string; intensity: number }> {
    return Array.isArray(value) && value.length > 0 &&
        typeof value[0] === 'object' && value[0] !== null &&
        'emotion' in value[0] && 'intensity' in value[0];
}

/** An array of plain objects that ISN'T the emotion-intensity shape above — e.g. PERSONIFY's `personas`. */
export function isObjectArray(value: unknown): value is Record<string, unknown>[] {
    return Array.isArray(value) && value.length > 0 &&
        typeof value[0] === 'object' && value[0] !== null &&
        !isEmotionArray(value);
}

export function isPresent(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/** Plain-text rendering of a field value for non-JSX contexts (Share text, AI analysis prompts). */
export function formatFieldValueText(type: SmartToolType | undefined, value: unknown): string {
    if (isEmotionArray(value)) return value.map(e => `${e.emotion} ${e.intensity}%`).join(', ');
    if (isObjectArray(value)) {
        return value.map(item =>
            Object.entries(item).filter(([k, v]) => k !== 'id' && isPresent(v))
                .map(([k, v]) => `${getFieldLabel(type, k, item)}: ${v}`).join(', ')
        ).join(' | ');
    }
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
}
