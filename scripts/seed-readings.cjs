/**
 * PROJ-42: Daily Readings Seed Script
 *
 * Generates and writes 90 days of readings per modality to Firestore.
 * Run from project root: node scripts/seed-readings.js
 *
 * Prerequisites:
 *   - GEMINI_API_KEY env var (or VITE_GEMINI_API_KEY in .env)
 *   - service-account-dev.json or service-account-prod.json in project root
 *   - npm install @google/generative-ai firebase-admin (in project root or globally)
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/seed-readings.cjs [--env dev|prod] [--modality twelve-step-aa] [--days 90] [--dry-run]
 *
 * Defaults to --env dev. Use --env prod to target mrt2-app-prod.
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

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Config ────────────────────────────────────────────────────────────────────

const MODALITIES = [
  'twelve-step-aa',
  'twelve-step-na',
  'twelve-step-ca',
  'recovery-dharma',
  'smart-recovery',
  'secular-stoic',
  'mindfulness-buddhist',
];

const MODALITY_LABELS = {
  'twelve-step-aa':       '12-Step (AA-inspired)',
  'twelve-step-na':       '12-Step (NA-inspired)',
  'twelve-step-ca':       '12-Step (CA-inspired)',
  'recovery-dharma':      'Recovery Dharma',
  'smart-recovery':       'SMART Recovery',
  'secular-stoic':        'Secular / Stoic',
  'mindfulness-buddhist': 'Mindfulness / Buddhist',
};

const COPYRIGHT_TRIGGERS = [
  'Daily Reflections', 'Just for Today', 'Hope Faith and Courage',
  'Cocaine Anonymous World Services', 'NA World Services',
  'AA World Services', 'AAWS',
];

// ── System prompts per modality ────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  'twelve-step-aa': `You write daily recovery readings for someone in a 12-Step programme inspired by Alcoholics Anonymous. Ground the reading in 12-Step principles: powerlessness, Higher Power, honest self-examination, making amends, and service.
RULES:
- Do NOT reproduce any text from AA publications
- Do NOT use the trademarked name "Alcoholics Anonymous" or "AA" in the reading body
- Write in warm, first-person plural ("we", "us", "our")
- 200-300 words for body
- End with a short reflection question and a one-sentence affirmation
- Tone: hopeful, non-preachy, grounded in lived recovery experience
- Never describe substance use in vivid detail
- No shame or guilt language`,

  'twelve-step-na': `You write daily recovery readings for someone in a 12-Step programme inspired by Narcotics Anonymous. Ground the reading in NA's spiritual principles applied to addiction generally.
RULES:
- Do NOT reproduce any text from NA publications
- Do NOT use the trademarked name "Narcotics Anonymous" or "NA" in the reading body
- Write in warm, first-person plural
- 200-300 words. Reflection question. One-sentence affirmation.
- No shame, no using-detail, hopeful only`,

  'twelve-step-ca': `You write daily recovery readings for someone in a 12-Step programme inspired by Cocaine Anonymous. Focus on stimulant and cocaine recovery through 12-Step principles.
RULES:
- Do NOT reproduce any text from Cocaine Anonymous World Services publications
- Do NOT use the trademarked name "Cocaine Anonymous" or "CA" in the reading body
- 200-300 words. Reflection question. One-sentence affirmation.
- Warm, first-person plural, hopeful, no shame`,

  'recovery-dharma': `You write daily recovery readings for someone in the Recovery Dharma programme, which combines Buddhist principles with the 12-Step recovery framework.
RULES:
- Ground the reading in Buddhist concepts: impermanence, compassion, the Noble Eightfold Path, non-attachment
- 200-300 words. Reflection question. One-sentence affirmation.
- ALWAYS end the reading with this exact attribution line: "Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org"
- Warm, inclusive, no shame`,

  'smart-recovery': `You write daily recovery readings grounded in SMART Recovery's CBT and REBT-based approach to addiction. Focus on rational thinking, self-empowerment, and behaviour change.
RULES:
- Do NOT use SMART Recovery's trademarked name in the reading body
- Ground the reading in rational emotive behaviour therapy (REBT) principles
- 200-300 words. Reflection question. One-sentence affirmation.
- Empowering, secular, evidence-based tone`,

  'secular-stoic': `You write daily recovery readings grounded in Stoic philosophy (Marcus Aurelius, Epictetus, Seneca) applied to addiction recovery and sobriety.
RULES:
- You may quote public domain Stoic texts (pre-1928)
- 200-300 words. Reflection question. One-sentence affirmation.
- Grounded, practical, secular, no religious language`,

  'mindfulness-buddhist': `You write daily recovery readings grounded in Buddhist mindfulness and the Pali Canon (Dhammapada, Sutta Nipata), applied to recovery from addiction.
RULES:
- You may reference public domain Pali Canon texts
- 200-300 words. Reflection question. One-sentence affirmation.
- Compassionate, mindful, non-dogmatic tone`,
};

const THEME_BANKS = {
  'twelve-step-aa':       ['Surrender', 'Gratitude', 'Service', 'Honesty', 'Hope', 'Willingness', 'Humility', 'Acceptance', 'Courage', 'Faith', 'Serenity', 'Step 1', 'Step 2', 'Step 3', 'Amends', 'Sponsorship', 'Fellowship', 'One Day at a Time', 'Higher Power', 'Character Defects', 'Inventory', 'Prayer', 'Meditation', 'Promises', 'Slips', 'Powerlessness', 'Spiritual Awakening', 'Rigorous Honesty'],
  'twelve-step-na':       ['Surrender', 'Gratitude', 'Clean Living', 'Service', 'Fellowship', 'Powerlessness', 'Higher Power', 'Step 4', 'Amends', 'Spiritual Growth', 'Freedom', 'One Day at a Time', 'Unity', 'Recovery', 'Trust'],
  'twelve-step-ca':       ['Willingness', 'Powerlessness', 'Service', 'Step 1', 'Gratitude', 'Acceptance', 'Courage', 'Higher Power', 'Amends', 'Serenity', 'Honesty', 'Humility'],
  'recovery-dharma':      ['Impermanence', 'Compassion', 'Non-attachment', 'Wise Effort', 'Mindfulness', 'The Noble Eightfold Path', 'Interbeing', 'Loving-kindness', 'The Second Arrow', 'Refuge', 'Craving', 'Forgiveness', 'Equanimity', 'Right Speech', 'Community (Sangha)'],
  'smart-recovery':       ['Self-efficacy', 'Rational Thinking', 'Urge Surfing', 'Cost-Benefit Analysis', 'Motivation', 'Lifestyle Balance', 'Problem Solving', 'Emotional Regulation', 'Cognitive Distortions', 'Values', 'Goals', 'Acceptance', 'Self-compassion'],
  'secular-stoic':        ['Discipline', 'The Present Moment', 'What We Control', 'Virtue', 'Resilience', 'Memento Mori', 'Negative Visualisation', 'Amor Fati', 'Equanimity', 'Service', 'Marcus Aurelius', 'Epictetus', 'Dichotomy of Control', 'Progress', 'Reflection'],
  'mindfulness-buddhist': ['Presence', 'The Breath', 'Impermanence', 'Compassion', 'Non-judgement', 'The Middle Way', 'Mindful Awareness', 'Beginner\'s Mind', 'Loving-kindness', 'Equanimity', 'Letting Go', 'Gratitude', 'The Dhammapada', 'Suffering and Its End'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dateString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function pickTheme(themeBank, index) {
  return themeBank[index % themeBank.length];
}

function checkCopyright(text) {
  return COPYRIGHT_TRIGGERS.filter(trigger =>
    text.toLowerCase().includes(trigger.toLowerCase())
  );
}

function parseReading(raw, modality, date, theme, bufferBatch) {
  // Gemini 2.5 Flash uses markdown bold labels e.g. "**Reflection Question:**"
  const reflectionMatch = raw.match(/\*{0,2}Reflection[^:\n*]*\*{0,2}[:\s]+(.+?)(?=\*{0,2}Affirmation|$)/is);
  const affirmationMatch = raw.match(/\*{0,2}Affirmation[^:\n*]*\*{0,2}[:\s]+(.+?)$/is);
  const attributionMatch = modality === 'recovery-dharma'
    ? raw.match(/(Adapted from the Recovery Dharma book.*)/i)
    : null;

  let reflection = reflectionMatch?.[1]?.trim().replace(/\*+/g, '') ?? '';
  let affirmation = affirmationMatch?.[1]?.trim().replace(/\*+/g, '') ?? '';

  // Body = everything before the Reflection label
  let bodyEnd = raw.search(/\*{0,2}Reflection/i);
  let body = bodyEnd > 0 ? raw.slice(0, bodyEnd).trim() : raw.trim();

  // Fallback: if labels absent, treat last "?"-ending line as reflection,
  // last non-empty line as affirmation, everything before as body
  if (!reflection || !affirmation) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const lastQuestionIdx = lines.map((l, i) => l.endsWith('?') ? i : -1).filter(i => i >= 0).pop();
    if (lastQuestionIdx !== undefined) {
      reflection = reflection || lines[lastQuestionIdx];
      affirmation = affirmation || lines[lines.length - 1];
      body = body.length > 50 ? body : lines.slice(0, lastQuestionIdx).join('\n\n');
    }
  }

  // Derive title from first sentence of body
  const firstSentence = body.split(/[.!?]/)[0]?.trim() ?? theme;
  const title = firstSentence.length > 60
    ? firstSentence.slice(0, 57) + '...'
    : firstSentence;

  const id = `${modality}_${date}`;

  return {
    id,
    modality,
    date,
    theme,
    title,
    body,
    reflection,
    affirmation,
    attribution: attributionMatch?.[1]?.trim() ?? (modality === 'recovery-dharma'
      ? 'Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org'
      : null),
    generatedAt: Timestamp.now(),
    bufferBatch,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const debug = args.includes('--debug');
  const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'dev';
  const modalityFilter = args.includes('--modality')
    ? args[args.indexOf('--modality') + 1]
    : null;
  const days = args.includes('--days')
    ? parseInt(args[args.indexOf('--days') + 1], 10)
    : 90;
  const startOffset = args.includes('--start-offset')
    ? parseInt(args[args.indexOf('--start-offset') + 1], 10)
    : 0;

  if (env !== 'dev' && env !== 'prod') {
    console.error('--env must be "dev" or "prod".');
    process.exit(1);
  }

  const serviceAccountPath = `./service-account-${env}.json`;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY (or VITE_GEMINI_API_KEY) not set.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Service account file not found: ${resolvedPath}`);
    process.exit(1);
  }

  initializeApp({ credential: cert(resolvedPath) });
  const db = getFirestore();
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const modalitiesToProcess = modalityFilter
    ? [modalityFilter]
    : MODALITIES;

  const batchNumber = Math.floor(Date.now() / 1000);
  const startDate = addDays(new Date(), startOffset);

  console.log(`\nPROJ-42 Seed Script`);
  console.log(`Environment: ${env.toUpperCase()} (${serviceAccountPath})`);
  console.log(`Modalities: ${modalitiesToProcess.join(', ')}`);
  console.log(`Days: ${days} starting ${dateString(startDate)}`);
  console.log(`Dry run: ${dryRun}\n`);

  for (const modality of modalitiesToProcess) {
    console.log(`\n── ${MODALITY_LABELS[modality]} ──`);
    const themeBank = THEME_BANKS[modality];
    const systemPrompt = SYSTEM_PROMPTS[modality];
    let written = 0;
    let skipped = 0;
    let rejected = 0;

    for (let i = 0; i < days; i++) {
      const date = dateString(addDays(startDate, i));
      const theme = pickTheme(themeBank, i);
      const docId = `${modality}_${date}`;
      const ref = db.collection('daily_readings').doc(docId);

      // Skip if already exists
      if (!dryRun) {
        const existing = await ref.get();
        if (existing.exists) {
          skipped++;
          continue;
        }
      }

      const userPrompt = `Today's theme: ${theme}\nToday's date: ${date}\n\nWrite the daily recovery reading now.\n\nYou MUST end your response with these two lines exactly (plain text, no markdown bold):\nReflection: [your reflection question]\nAffirmation: [your one-sentence affirmation]`;
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      let attempts = 0;
      let success = false;

      while (attempts < 3 && !success) {
        attempts++;
        try {
          const result = await model.generateContent(fullPrompt);
          const raw = result.response.text();

          const violations = checkCopyright(raw);
          if (violations.length > 0) {
            console.warn(`  [${date}] Copyright violation (attempt ${attempts}): ${violations.join(', ')}`);
            rejected++;
            continue;
          }

          const reading = parseReading(raw, modality, date, theme, batchNumber);

          if (!reading.reflection || !reading.affirmation || reading.body.length < 100) {
            console.warn(`  [${date}] Incomplete reading (attempt ${attempts})`);
            if (debug) console.log(`\n--- RAW (${date} attempt ${attempts}) ---\n${raw}\n---\n`);
            continue;
          }

          if (!dryRun) {
            await ref.set(reading);
          }

          written++;
          success = true;
          process.stdout.write('.');
        } catch (err) {
          console.warn(`  [${date}] Error (attempt ${attempts}):`, err.message);
        }
      }

      if (!success) {
        console.error(`\n  [${date}] FAILED after ${attempts} attempts — skipping`);
      }

      // Rate limit: ~10 req/s Flash tier
      await new Promise(r => setTimeout(r, 120));
    }

    // Update buffer_status
    if (!dryRun && written > 0) {
      const lastDate = dateString(addDays(startDate, days - 1));
      await db.collection('buffer_status').doc(modality).set({
        lastGeneratedDate: lastDate,
        totalBuffered: written,
        lastBatchGeneratedAt: Timestamp.now(),
        nextBatchDue: dateString(addDays(new Date(lastDate), -30)),
      }, { merge: true });
    }

    console.log(`\n  Done: ${written} written, ${skipped} skipped, ${rejected} rejected`);
  }

  console.log('\nSeed complete.\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
