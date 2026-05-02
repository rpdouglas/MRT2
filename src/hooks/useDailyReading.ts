import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DailyReading, ReadingModality } from '../lib/db';

// Flat document ID: "{modality}_{YYYY-MM-DD}"
// Path: daily_readings/{modality}_{date}
function readingDocId(modality: ReadingModality, date: string): string {
  return `${modality}_${date}`;
}

function localDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function useDailyReading(modality: ReadingModality | null) {
  const today = localDateString();

  return useQuery<DailyReading | null>({
    queryKey: ['daily-reading', modality, today],
    queryFn: async () => {
      if (!modality || !db) return null;
      const ref = doc(db as Firestore, 'daily_readings', readingDocId(modality, today));
      const snap = await getDoc(ref);
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as DailyReading) : null;
    },
    enabled: !!modality,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
  });
}
