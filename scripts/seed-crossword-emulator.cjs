/**
 * PROJ-79: Daily Crossword — Emulator Seed Script
 *
 * The nightly `generateDailyCrossword` Cloud Function only ever writes
 * *tomorrow's* puzzle (functions/src/index.ts), and the Firestore emulator
 * starts empty on every run — so a fresh local dev session never has a
 * `crossword_puzzles/{today}` doc for useDailyCrossword to find. This script
 * writes one directly into the running emulator, using the same theme pool,
 * two-stage Gemini prompts, and crossword-layout-generator call as the real
 * Cloud Function (functions/src/index.ts + functions/src/crosswordPrompts.ts),
 * duplicated here the same way scripts/seed-readings.cjs duplicates its own
 * prompt banks rather than importing compiled functions/lib output.
 *
 * Prerequisites:
 *   - Firebase emulators running (npm run dev:emulators, or
 *     firebase emulators:start --only auth,firestore,functions)
 *   - GEMINI_API_KEY env var (or VITE_GEMINI_API_KEY in .env)
 *   - npm install --no-save firebase-admin @google/generative-ai (project root)
 *     — functions/node_modules already has crossword-layout-generator, reused
 *     via a relative require below.
 *
 * Usage (run from project root, with emulators already running):
 *   GEMINI_API_KEY=... node scripts/seed-crossword-emulator.cjs [--date YYYY-MM-DD] [--force]
 *
 * Defaults to today (UTC). --force overwrites an existing doc for that date.
 */

const fs = require('fs');
const path = require('path');

// Load .env from project root (Node doesn't auto-load it)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=["']?(.+?)["']?\s*$/);
    if (match) process.env[match[1]] = match[2];
  }
}

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'mrt2-app-dev';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateLayout } = require(path.resolve(__dirname, '../functions/node_modules/crossword-layout-generator'));

// ── Theme pool + prompts, ported from functions/src/crosswordPrompts.ts ───────

const CROSSWORD_THEME_POOL = [
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
];

const CROSSWORDESE_DENYLIST = [
  "ETUI", "OAST", "ERNE", "ANOA", "ESNE", "ORLE", "ULNA", "OLIO", "ETAS",
  "ERGO", "ELHI", "ENOL", "EPEE", "ESES", "ANOAS", "AALII", "ADIT",
  "AGIO", "AKELA", "ALOD", "AMIE", "ANIL", "ARLES", "ARNA", "ASEA",
  "AUNE", "AWNS", "BRAE", "CUIF", "EYRA", "IAMB", "OAKUM", "OBOL",
];

const CROSSWORD_MIN_PLACED_WORDS = 8;
const CROSSWORD_GENERATOR_VERSION = "1.0.0";
const CROSSWORD_PROMPT_VERSION = "1";

function pickTheme(excludeThemes) {
  const excludeSet = new Set(excludeThemes.map((t) => t.toLowerCase()));
  const eligible = CROSSWORD_THEME_POOL.filter((t) => !excludeSet.has(t.toLowerCase()));
  const pool = eligible.length > 0 ? eligible : CROSSWORD_THEME_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildWordSelectionPrompt(theme, excludeWords) {
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

function buildCluePolishPrompt(theme, candidates) {
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

function stripCodeFence(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function validateCrosswordCandidates(candidates, excludeWords) {
  const excludeSet = new Set(excludeWords.map((w) => w.toUpperCase()));
  const denylistSet = new Set(CROSSWORDESE_DENYLIST.map((w) => w.toUpperCase()));
  const seen = new Set();
  const valid = [];

  for (const c of candidates) {
    const answer = (c.answer ?? "").toUpperCase().trim();
    if (!/^[A-Z]{3,12}$/.test(answer)) continue;
    if (denylistSet.has(answer)) continue;
    if (excludeSet.has(answer)) continue;
    if (seen.has(answer)) continue;
    seen.add(answer);
    valid.push({ ...c, answer });
  }
  return valid;
}

function hasDuplicateClues(words) {
  const seen = new Set();
  for (const w of words) {
    const key = w.clue.trim().toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function utcDateString(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const date = args.includes('--date')
    ? args[args.indexOf('--date') + 1]
    : utcDateString(new Date());

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('--date must be YYYY-MM-DD.');
    process.exit(1);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY (or VITE_GEMINI_API_KEY) not set.');
    process.exit(1);
  }

  initializeApp({ projectId: process.env.GCLOUD_PROJECT });
  const db = getFirestore();

  console.log(`\nPROJ-79 Crossword Emulator Seed`);
  console.log(`Target: Firestore emulator @ ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Date: ${date}\n`);

  const ref = db.collection('crossword_puzzles').doc(date);
  const existing = await ref.get();
  if (existing.exists && !force) {
    console.log(`crossword_puzzles/${date} already exists — use --force to overwrite.`);
    return;
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const theme = pickTheme([]);
  console.log(`Theme: ${theme}`);

  const selectionResult = await model.generateContent(buildWordSelectionPrompt(theme, []));
  const candidates = JSON.parse(stripCodeFence(selectionResult.response.text()));
  if (!Array.isArray(candidates)) {
    console.error('Non-array word-selection response — aborting.');
    process.exit(1);
  }

  const validCandidates = validateCrosswordCandidates(candidates, []);
  if (validCandidates.length < CROSSWORD_MIN_PLACED_WORDS) {
    console.error(`Only ${validCandidates.length} valid candidates — aborting.`);
    process.exit(1);
  }

  const polishResult = await model.generateContent(buildCluePolishPrompt(theme, validCandidates));
  const polished = JSON.parse(stripCodeFence(polishResult.response.text()));
  if (!Array.isArray(polished.words) || hasDuplicateClues(polished.words)) {
    console.error('Invalid or duplicate-clue polish response — aborting.');
    process.exit(1);
  }

  const layout = generateLayout(polished.words.map((w) => ({ answer: w.answer, clue: w.clue })));
  const placed = layout.result.filter((w) => w.orientation !== 'none');
  if (placed.length < CROSSWORD_MIN_PLACED_WORDS) {
    console.error(`Layout only placed ${placed.length} words — aborting.`);
    process.exit(1);
  }

  const words = placed.map((p) => {
    const source = polished.words.find((w) => w.answer === p.answer);
    return {
      answer: p.answer,
      clue: p.clue,
      clueStyle: source?.clueStyle ?? 'dictionary',
      hint: source?.hint ?? null,
      themed: source?.themed ?? false,
      difficulty: source?.difficulty ?? 'mid',
      number: p.position ?? 0,
      row: (p.starty ?? 1) - 1,
      col: (p.startx ?? 1) - 1,
      direction: p.orientation,
    };
  });

  await ref.set({
    date,
    theme,
    themeIntro: polished.theme_intro,
    generatorVersion: CROSSWORD_GENERATOR_VERSION,
    promptVersion: CROSSWORD_PROMPT_VERSION,
    words,
    insightCard: {
      text: polished.insight_card?.text ?? '',
      frameworkTags: polished.insight_card?.framework_tags ?? [],
    },
    grid: { rows: layout.rows, cols: layout.cols },
    generatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`\nWrote crossword_puzzles/${date} — ${words.length} words placed.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
