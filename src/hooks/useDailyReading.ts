import { useQuery, useQueries } from '@tanstack/react-query';
import { doc, getDoc, type Firestore, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DailyReading, ReadingModality } from '../lib/db';

function readingDocId(modality: ReadingModality, date: string): string {
  return `${modality}_${date}`;
}

// UTC, not device-local — must match the Cloud Functions' utcDateString()
// (functions/src/index.ts) exactly, since that's the date boundary the
// buffer is actually generated/checked against. A device-local boundary
// would occasionally request a date that hasn't been generated yet (or skip
// one that has) for any user not on UTC, worst right around midnight.
function utcDateString(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchReading(modality: ReadingModality, date: string): Promise<DailyReading | null> {
  if (localStorage.getItem('mrt_mock_user')) {
    return {
      id: `${modality}_${date}`,
      modality,
      date,
      theme: 'Clarity and Peace',
      title: 'One Day at a Time',
      body: 'Today, we focus only on the next 24 hours. We do not look too far ahead or behind. We stay anchored in the present moment.',
      reflection: 'What can I do today to support my recovery path?',
      affirmation: 'I am grounded, I am clear, and I am sober today.',
      generatedAt: Timestamp.now(),
      bufferBatch: 1
    };
  }
  if (!db) return null;
  const ref = doc(db as Firestore, 'daily_readings', readingDocId(modality, date));
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as DailyReading) : null;
}

export function useDailyReading(modality: ReadingModality | null) {
  const today = utcDateString();
  return useQuery<DailyReading | null>({
    queryKey: ['daily-reading', modality, today],
    queryFn: () => fetchReading(modality!, today),
    enabled: !!modality,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
  });
}

export function useAllDailyReadings(modalities: ReadingModality[]) {
  const today = utcDateString();
  return useQueries({
    queries: modalities.map(modality => ({
      queryKey: ['daily-reading', modality, today] as const,
      queryFn: () => fetchReading(modality, today),
      staleTime: 24 * 60 * 60 * 1000,
      gcTime: 48 * 60 * 60 * 1000,
      retry: 1,
    })),
  });
}
