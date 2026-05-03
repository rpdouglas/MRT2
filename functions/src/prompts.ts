/**
 * PROJ-42: Daily Readings — modality configs for Gemini generation.
 * System prompts and theme banks per recovery tradition.
 */

export type ReadingModality =
    | "twelve-step-aa"
    | "twelve-step-na"
    | "twelve-step-ca"
    | "recovery-dharma"
    | "smart-recovery"
    | "secular-stoic"
    | "mindfulness-buddhist";

export interface ModalityConfig {
    label: string;
    systemPrompt: string;
    themes: readonly string[];
    requiresAttribution: boolean;
}

export const READING_MODALITIES: readonly ReadingModality[] = [
    "twelve-step-aa",
    "twelve-step-na",
    "twelve-step-ca",
    "recovery-dharma",
    "smart-recovery",
    "secular-stoic",
    "mindfulness-buddhist",
];

export const MODALITY_CONFIGS: Record<ReadingModality, ModalityConfig> = {
    "twelve-step-aa": {
        label: "12-Step (AA-inspired)",
        systemPrompt: `You write daily recovery readings for someone in a 12-Step programme \
inspired by Alcoholics Anonymous. Ground the reading in 12-Step principles: \
powerlessness, Higher Power, honest self-examination, making amends, and service.
RULES:
- Do NOT reproduce any text from AA publications
- Do NOT use the trademarked name "Alcoholics Anonymous" or "AA" in the reading body
- Write in warm, first-person plural ("we", "us", "our")
- 200-300 words for body
- Tone: hopeful, non-preachy, grounded in lived recovery experience
- Never describe substance use in vivid detail
- No shame or guilt language`,
        themes: [
            "Surrender", "Gratitude", "Service", "Honesty", "Hope", "Willingness",
            "Humility", "Acceptance", "Courage", "Faith", "Serenity",
            "Step 1", "Step 2", "Step 3", "Amends", "Sponsorship", "Fellowship",
            "One Day at a Time", "Higher Power", "Character Defects", "Inventory",
            "Prayer", "Meditation", "Promises", "Powerlessness", "Spiritual Awakening",
            "Rigorous Honesty", "Turning It Over", "Community", "Letting Go",
        ],
        requiresAttribution: false,
    },

    "twelve-step-na": {
        label: "12-Step (NA-inspired)",
        systemPrompt: `You write daily recovery readings for someone in a 12-Step programme \
inspired by Narcotics Anonymous. Ground the reading in 12-Step spiritual principles \
applied broadly to addiction recovery.
RULES:
- Do NOT reproduce any text from NA publications
- Do NOT use the trademarked name "Narcotics Anonymous" or "NA" in the reading body
- Write in warm, first-person plural
- 200-300 words. Tone: hopeful, non-preachy, no shame`,
        themes: [
            "Surrender", "Gratitude", "Clean Living", "Service", "Fellowship",
            "Powerlessness", "Higher Power", "Step 4", "Amends", "Spiritual Growth",
            "Freedom", "One Day at a Time", "Unity", "Recovery", "Trust",
            "Self-acceptance", "Healing", "Step 9", "Honesty", "Courage",
            "Connection", "Letting Go", "New Beginnings", "Sponsorship", "Progress",
        ],
        requiresAttribution: false,
    },

    "twelve-step-ca": {
        label: "12-Step (CA-inspired)",
        systemPrompt: `You write daily recovery readings for someone in a 12-Step programme \
inspired by Cocaine Anonymous. Focus on stimulant and cocaine recovery through 12-Step \
principles of powerlessness, surrender, and service.
RULES:
- Do NOT reproduce any text from Cocaine Anonymous World Services publications
- Do NOT use the trademarked name "Cocaine Anonymous" or "CA" in the reading body
- 200-300 words. Warm, first-person plural, hopeful, no shame`,
        themes: [
            "Willingness", "Powerlessness", "Service", "Step 1", "Gratitude",
            "Acceptance", "Courage", "Higher Power", "Amends", "Serenity",
            "Honesty", "Humility", "Trust", "Letting Go", "Fellowship",
            "One Day at a Time", "Surrender", "Healing", "Freedom", "Hope",
        ],
        requiresAttribution: false,
    },

    "recovery-dharma": {
        label: "Recovery Dharma",
        systemPrompt: `You write daily recovery readings for someone in the Recovery Dharma \
programme, which combines Buddhist principles with a peer-support recovery model.
RULES:
- Ground the reading in Buddhist concepts: impermanence, compassion, the Noble Eightfold Path, \
non-attachment, interbeing
- 200-300 words. Warm, inclusive, no shame
- You MUST include this exact attribution at the end of the body field: \
"Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org"`,
        themes: [
            "Impermanence", "Compassion", "Non-attachment", "Wise Effort", "Mindfulness",
            "The Noble Eightfold Path", "Interbeing", "Loving-kindness", "The Second Arrow",
            "Refuge", "Craving", "Forgiveness", "Equanimity", "Right Speech",
            "Community (Sangha)", "Wise Action", "Wise Intention", "The Middle Way",
            "The Four Noble Truths", "Acceptance", "Beginner's Mind",
        ],
        requiresAttribution: true,
    },

    "smart-recovery": {
        label: "SMART Recovery",
        systemPrompt: `You write daily recovery readings grounded in SMART Recovery's CBT and \
REBT-based approach to addiction. Focus on rational thinking, self-empowerment, and practical \
behaviour change.
RULES:
- Do NOT use "SMART Recovery" as a trademarked brand in the reading body
- Ground the reading in rational emotive behaviour therapy (REBT) principles
- 200-300 words. Empowering, secular, evidence-based tone`,
        themes: [
            "Self-efficacy", "Rational Thinking", "Urge Surfing", "Cost-Benefit Analysis",
            "Motivation", "Lifestyle Balance", "Problem Solving", "Emotional Regulation",
            "Cognitive Distortions", "Values", "Goals", "Acceptance", "Self-compassion",
            "The ABCDE Model", "Building a Good Life", "Thinking Traps", "Resilience",
            "Self-management", "Mindful Awareness", "Change",
        ],
        requiresAttribution: false,
    },

    "secular-stoic": {
        label: "Secular / Stoic",
        systemPrompt: `You write daily recovery readings grounded in Stoic philosophy \
(Marcus Aurelius, Epictetus, Seneca) applied to addiction recovery and sobriety.
RULES:
- You may quote public domain Stoic texts (pre-1928) in the body
- 200-300 words. Grounded, practical, secular, no religious language
- Apply Stoic principles directly to the challenges of recovery`,
        themes: [
            "Discipline", "The Present Moment", "What We Control", "Virtue", "Resilience",
            "Memento Mori", "Negative Visualisation", "Amor Fati", "Equanimity",
            "Service", "Marcus Aurelius", "Epictetus", "Dichotomy of Control",
            "Progress", "Reflection", "The Inner Citadel", "Indifferents",
            "Living According to Nature", "Patience", "Right Action",
        ],
        requiresAttribution: false,
    },

    "mindfulness-buddhist": {
        label: "Mindfulness / Buddhist",
        systemPrompt: `You write daily recovery readings grounded in Buddhist mindfulness \
and the Pali Canon (Dhammapada, Sutta Nipata), applied to recovery from addiction.
RULES:
- You may reference and lightly quote public domain Pali Canon texts
- 200-300 words. Compassionate, mindful, non-dogmatic tone
- Ground the reading in mindfulness practice and recovery`,
        themes: [
            "Presence", "The Breath", "Impermanence", "Compassion", "Non-judgement",
            "The Middle Way", "Mindful Awareness", "Beginner's Mind", "Loving-kindness",
            "Equanimity", "Letting Go", "Gratitude", "The Dhammapada",
            "Suffering and Its End", "Right Mindfulness", "Interbeing",
            "Self-compassion", "Grounding", "Acceptance", "Awakening",
        ],
        requiresAttribution: false,
    },
};
