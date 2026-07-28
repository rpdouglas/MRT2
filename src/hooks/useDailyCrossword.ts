// src/hooks/useDailyCrossword.ts
// PROJ-79 (Daily Crossword). Reads today's shared, unencrypted
// crossword_puzzles/{date} doc — no user data involved, so unlike every
// other Recovery Games hook there's nothing to decrypt here (see
// docs/projects/79_DAILY_CROSSWORD.md §2/§3). Uses the UTC calendar date
// (matching functions/src/index.ts's utcDateString(), the doc-ID convention
// the nightly generator writes with) rather than useDailyReading.ts's local
// date, so a user near UTC midnight can't land on a mismatched "today".
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getUtcDateString } from '../lib/dateUtils';
import type { CrosswordPuzzleRecord } from '../lib/db';

async function fetchCrossword(date: string): Promise<CrosswordPuzzleRecord | null> {
  if (!db) return null;
  const ref = doc(db as Firestore, 'crossword_puzzles', date);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as CrosswordPuzzleRecord) : null;
}

// PROJ-63 mock mode (?mockUser=...): every other screenshot hook falls back
// to a canned payload in src/lib/mockData.ts, but a puzzle is generated
// server-side nightly (functions/src/index.ts's generateDailyCrossword) with
// no local equivalent to reuse. This static puzzle exists solely so
// mock-mode renders — screenshots, local dev without Firebase — show real
// grid/clue content instead of the "isn't ready yet" empty state.
const MOCK_PUZZLE: CrosswordPuzzleRecord = {
  date: 'mock',
  theme: 'Everyday Recovery Language',
  themeIntro: 'A short set of words that show up again and again in recovery conversations.',
  generatorVersion: 'mock',
  promptVersion: 'mock',
  grid: { rows: 6, cols: 4 },
  words: [
    { number: 1, row: 0, col: 0, direction: 'across', answer: 'HOPE', clue: 'What carries you through the hardest days', clueStyle: 'reflective', hint: 'Four letters, starts strong', themed: true, difficulty: 'easy' },
    { number: 2, row: 0, col: 1, direction: 'down', answer: 'OPEN', clue: 'Being ___ at a meeting means sharing honestly', clueStyle: 'recovery', hint: 'Opposite of closed', themed: true, difficulty: 'easy' },
    { number: 3, row: 2, col: 0, direction: 'across', answer: 'MEET', clue: 'Where you gather with your fellowship', clueStyle: 'recovery', hint: 'Sounds like a verb for gathering', themed: true, difficulty: 'easy' },
    { number: 4, row: 2, col: 3, direction: 'down', answer: 'TEAM', clue: "Recovery isn't a solo sport — it's a ___ effort", clueStyle: 'metaphor', hint: 'A group working toward one goal', themed: true, difficulty: 'mid' },
  ],
  insightCard: {
    text: 'Small, ordinary words — hope, open, meet, team — carry a lot of weight in recovery. Noticing them in your own vocabulary is its own kind of progress.',
    frameworkTags: ['language', 'community'],
  },
};

export function useDailyCrossword() {
  const { user } = useAuth();
  const today = getUtcDateString();
  const isMock = !!user?.email?.endsWith('.mock');

  const query = useQuery<CrosswordPuzzleRecord | null>({
    queryKey: ['crossword_puzzles', today],
    queryFn: () => fetchCrossword(today),
    staleTime: 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
    enabled: !isMock,
  });

  if (isMock) {
    return { puzzle: MOCK_PUZZLE, isLoading: false, isError: false };
  }

  return { puzzle: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}
