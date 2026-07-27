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
import { getUtcDateString } from '../lib/dateUtils';
import type { CrosswordPuzzleRecord } from '../lib/db';

async function fetchCrossword(date: string): Promise<CrosswordPuzzleRecord | null> {
  if (!db) return null;
  const ref = doc(db as Firestore, 'crossword_puzzles', date);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as CrosswordPuzzleRecord) : null;
}

export function useDailyCrossword() {
  const today = getUtcDateString();
  const query = useQuery<CrosswordPuzzleRecord | null>({
    queryKey: ['crossword_puzzles', today],
    queryFn: () => fetchCrossword(today),
    staleTime: 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
  });

  return { puzzle: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}
