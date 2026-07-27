/**
 * functions/src/crosswordPrompts.ts
 * PROJ-79: Daily Crossword — theme pool, generation prompts, and word
 * validation denylist. Kept separate from prompts.ts (which is scoped to
 * the Daily Readings modality configs, a different feature) per
 * docs/projects/79_DAILY_CROSSWORD.md §Phase 1.
 *
 * The AI is responsible only for content selection and clue writing — never
 * grid layout (see index.ts's use of crossword-layout-generator). Two-stage
 * generation: word selection (cheap tier) → clue polish (cheap tier by
 * default). See source spec docs/reports/SPEC-crossword-001 (1).md §4.3-4.4.
 */

// 80-120+ themes so the recency-exclusion window (words/themes used in the
// last 30-60 days) is trivial to satisfy without ever feeling repetitive.
// Deliberately generic recovery/wellness language — no fellowship-specific
// or branded program names, consistent with the Tradition 6 compliance
// scrub applied to every other Recovery Games content bank.
export const CROSSWORD_THEME_POOL: readonly string[] = [
    "Acceptance", "Honesty", "Humility", "Surrender", "Hope", "HALT",
    "Relapse Prevention", "Service", "Resilience", "Forgiveness",
    "Self-Compassion", "Routine", "Sleep", "Connection", "Vulnerability",
    "Purpose", "Gratitude", "Boundaries", "Trust", "Patience", "Courage",
    "Willingness", "Accountability", "Mindfulness", "Presence", "Triggers",
    "Cravings", "Urges", "Coping Skills", "Support Systems", "Community",
    "Sponsorship", "Mentorship", "Recovery Capital", "Identity", "Self-Worth",
    "Letting Go", "Change", "Growth", "Progress Not Perfection",
    "One Day At A Time", "Structure", "Discipline", "Motivation", "Values",
    "Goals", "Balance", "Stability", "Grounding", "The Breath",
    "Body Awareness", "Rest", "Stress Management", "Emotional Regulation",
    "Grief", "Loss", "Loneliness", "Reconnection", "Repair", "Amends",
    "Self-Reflection", "Journaling", "Celebration", "Milestones",
    "Small Wins", "Momentum", "Consistency", "Habit Loops", "New Beginnings",
    "Second Chances", "Compassion", "Kindness", "Empathy", "Listening",
    "Communication", "Assertiveness", "Saying No", "Self-Care", "Play",
    "Joy", "Curiosity", "Wonder", "Nature", "Simplicity", "Slowing Down",
    "Setbacks", "Asking For Help", "Interdependence", "Belonging",
    "Chosen Family", "Safety", "Trustworthiness", "Wisdom", "Perspective",
    "Meaning", "Giving Back", "Paying It Forward", "Work-Life Balance",
    "Learning", "Skill Building", "Creativity", "Self-Expression",
    "Art As Healing", "Music As Healing", "Inner Peace", "Equanimity",
    "Non-Judgment", "Radical Acceptance", "Self-Trust", "Confidence",
    "Rebuilding Trust", "Family Healing", "Friendship", "Sober Fun",
    "Distress Tolerance", "Nervous System Regulation", "Self-Discovery",
    "Living With Intention", "Morning Routine", "Digital Boundaries",
];

// Source spec §4.9: obscure abbreviations / common crossword-filler words
// that add solving friction without adding recovery value. Checked
// case-insensitively against every generated answer.
export const CROSSWORDESE_DENYLIST: readonly string[] = [
    "ETUI", "OAST", "ERNE", "ANOA", "ESNE", "ORLE", "ULNA", "OLIO", "ETAS",
    "ERGO", "ELHI", "ENOL", "EPEE", "ESES", "ANOAS", "AALII", "ADIT",
    "AGIO", "AKELA", "ALOD", "AMIE", "ANIL", "ARLES", "ARNA", "ASEA",
    "AUNE", "AWNS", "BRAE", "CUIF", "EYRA", "IAMB", "OAKUM", "OBOL",
];

function shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Picks a theme not present in `excludeThemes` (recent-use window). */
export function pickTheme(excludeThemes: readonly string[]): string {
    const excludeSet = new Set(excludeThemes.map((t) => t.toLowerCase()));
    const eligible = CROSSWORD_THEME_POOL.filter((t) => !excludeSet.has(t.toLowerCase()));
    const pool = eligible.length > 0 ? eligible : CROSSWORD_THEME_POOL;
    return shuffle(pool)[0];
}

/** Stage 1 (cheap tier): word + dictionary-style clue selection. */
export function buildWordSelectionPrompt(theme: string, excludeWords: readonly string[]): string {
    const exclusionList = excludeWords.length > 0
        ? `\n\nDo NOT use any of these recently-used words: ${excludeWords.join(", ")}.`
        : "";

    return `You are selecting words for a daily recovery/wellness crossword puzzle themed around "${theme}".

Pick 10-12 candidate words (5-9 letters each, no spaces, no hyphens, no proper nouns) that mix:
- 2-3 words directly evocative of the theme "${theme}"
- A mix of easy (common, everyday words like CARE, HOPE, REST), mid (e.g. BOUNDARY, COURAGE), and advanced-vocabulary (e.g. AMBIVALENCE, ACCOUNTABILITY) words, so the puzzle feels solvable throughout rather than uniformly easy or hard
- No obscure abbreviations or crossword-filler words (e.g. ETUI, OAST, ERNE)${exclusionList}

Return ONLY a valid JSON array of exactly 10-12 objects, each with:
- "answer": the word, uppercase, letters only
- "clue": a direct, dictionary-style clue (not yet polished for tone)
- "themed": true for the 2-3 words directly evocative of "${theme}", false otherwise
- "difficulty": one of "easy", "mid", "advanced"

Return ONLY the JSON array — no preamble, no explanation, no code fences.`;
}

interface WordCandidate {
    answer: string;
    clue: string;
    themed: boolean;
    difficulty: "easy" | "mid" | "advanced";
}

/** Stage 2 (cheap tier by default): clue tone polish + insight card. */
export function buildCluePolishPrompt(theme: string, candidates: readonly WordCandidate[]): string {
    const list = candidates
        .map((c, i) => `${i + 1}. ${c.answer} (${c.difficulty}${c.themed ? ", themed" : ""}) — draft clue: "${c.clue}"`)
        .join("\n");

    return `You are polishing clues for a daily recovery/wellness crossword themed around "${theme}".

Words and draft clues:
${list}

For each word, write a final clue and assign a "clue_style":
- Themed words (marked "themed" above): lean into the theme's reflective/recovery language — clue_style "recovery" or "reflective"
- Non-themed words: keep clues closer to plain dictionary style — clue_style "dictionary", or occasionally "metaphor" for light variety
- Vary clue_style across the puzzle so the tone doesn't feel flat or repetitive
- For themed words only, also write a short "hint" (a gentle nudge distinct from the clue, e.g. for BOUNDARY: "A healthy limit protecting wellbeing.") — set "hint" to null for non-themed words
- No duplicate clue wording anywhere in the puzzle
- Keep every clue and hint free of markdown, under 90 characters

Also write one short "theme_intro" sentence (e.g. "Today's puzzle explores ${theme}.") and one "insight_card": a 1-2 sentence reflection tied to "${theme}", plus 1-3 "framework_tags" (choose from: CBT, ACT, DBT, 12-Step, Motivational Interviewing).

Return ONLY a valid JSON object:
{
  "theme_intro": "...",
  "words": [ { "answer": "...", "clue": "...", "clue_style": "...", "hint": "..." | null, "themed": true|false, "difficulty": "easy"|"mid"|"advanced" } ],
  "insight_card": { "text": "...", "framework_tags": ["..."] }
}

Return ONLY the JSON object — no preamble, no explanation, no code fences.`;
}
