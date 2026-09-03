// PROJ-79 ledger gap ("Add Daily Crossword to the Subway Test"): the real
// puzzle content is generated server-side by generateDailyCrossword, a
// Gemini-backed Cloud Function — not something a deterministic CI e2e test
// can or should call. This seeds crossword_puzzles/{today} directly via the
// Firestore Admin SDK (bypassing both security rules, since the collection
// is admin-write-only, and Gemini entirely) with the exact same fixture
// shape/content useDailyCrossword.ts's own MOCK_PUZZLE already uses for
// mock-mode screenshots — a known-solvable, known-consistent grid, reused
// here rather than inventing a second fixture to keep in sync.
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function utcDateString(d: Date = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Cell -> answer letter, derived from the words[] below, for the test to
// drive letter-by-letter grid entry without needing to reimplement
// crosswordLogic.ts's word/direction resolution.
export const CROSSWORD_FIXTURE_CELLS: { row: number; col: number; letter: string }[] = [
  { row: 0, col: 0, letter: 'H' }, { row: 0, col: 1, letter: 'O' }, { row: 0, col: 2, letter: 'P' }, { row: 0, col: 3, letter: 'E' },
  { row: 1, col: 1, letter: 'P' },
  { row: 2, col: 0, letter: 'M' }, { row: 2, col: 1, letter: 'E' }, { row: 2, col: 2, letter: 'E' }, { row: 2, col: 3, letter: 'T' },
  { row: 3, col: 1, letter: 'N' },
  { row: 3, col: 3, letter: 'E' },
  { row: 4, col: 3, letter: 'A' },
  { row: 5, col: 3, letter: 'M' },
];

const CROSSWORD_FIXTURE = {
  theme: 'Everyday Recovery Language',
  themeIntro: 'A short set of words that show up again and again in recovery conversations.',
  generatorVersion: 'e2e-fixture',
  promptVersion: 'e2e-fixture',
  grid: { rows: 6, cols: 4 },
  words: [
    { number: 1, row: 0, col: 0, direction: 'across', answer: 'HOPE', clue: 'What carries you through the hardest days', clueStyle: 'reflective', hint: 'Four letters, starts strong', themed: true, difficulty: 'easy' },
    { number: 2, row: 0, col: 1, direction: 'down', answer: 'OPEN', clue: 'Being ___ at a meeting means sharing honestly', clueStyle: 'recovery', hint: 'Opposite of closed', themed: true, difficulty: 'easy' },
    { number: 3, row: 2, col: 0, direction: 'across', answer: 'MEET', clue: 'Where you gather with your fellowship', clueStyle: 'recovery', hint: 'Sounds like a verb for gathering', themed: true, difficulty: 'easy' },
    { number: 4, row: 2, col: 3, direction: 'down', answer: 'TEAM', clue: "Recovery isn't a solo sport — it's a ___ effort", clueStyle: 'metaphor', hint: 'A group working toward one goal', themed: true, difficulty: 'mid' },
  ],
  insightCard: {
    text: 'Small, ordinary words — hope, open, meet, team — carry a lot of weight in recovery.',
    frameworkTags: ['language', 'community'],
  },
};

let adminAppInitialized = false;

function ensureAdminApp() {
  if (!adminAppInitialized) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
    if (getApps().length === 0) {
      initializeApp({ projectId: 'mrt2-app-dev' });
    }
    adminAppInitialized = true;
  }
}

/** Writes today's (UTC) crossword puzzle doc. Returns the doc-ID date string. */
export async function seedTodaysCrossword(): Promise<string> {
  ensureAdminApp();
  const date = utcDateString();
  await getFirestore().collection('crossword_puzzles').doc(date).set({
    ...CROSSWORD_FIXTURE,
    date,
    generatedAt: new Date(),
  });
  return date;
}

/** Reads back the uid for an e2e-created user by email, for a direct Admin SDK verification read after a test's flow completes. */
export async function getUidByEmail(email: string): Promise<string> {
  ensureAdminApp();
  const user = await getAuth().getUserByEmail(email);
  return user.uid;
}

/** Direct Admin SDK read — bypasses client decrypt entirely, for asserting a completion genuinely reached the server as real ciphertext, not just the local cache. */
export async function findGameProgress(uid: string, gameId: string) {
  ensureAdminApp();
  const snap = await getFirestore()
    .collection('game_progress')
    .where('uid', '==', uid)
    .where('gameId', '==', gameId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].data();
}
