// src/hooks/useDailyImage.ts
// PROJ-113 (Daily Inspirational Image), Phase 1. Reads today's shared,
// unencrypted daily_images/{date} doc — no user data involved, same posture
// as useDailyCrossword.ts, which this hook is cloned from. Uses the UTC
// calendar date (matching functions/src/index.ts's utcDateString(), the
// doc-ID convention generateDailyImage writes with) rather than
// useDailyReading.ts's local date, so a user near UTC midnight can't land on
// a mismatched "today".
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getUtcDateString } from '../lib/dateUtils';
import type { DailyImageRecord } from '../lib/db';

async function fetchDailyImage(date: string): Promise<DailyImageRecord | null> {
  if (!db) return null;
  const ref = doc(db as Firestore, 'daily_images', date);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as DailyImageRecord) : null;
}

// PROJ-63 mock mode (?mockUser=...): same rationale as useDailyCrossword.ts's
// MOCK_PUZZLE — the real record is assigned server-side nightly with no
// local equivalent, so screenshots/local dev without Firebase need a canned
// payload instead of the "isn't ready yet" empty state.
const MOCK_DAILY_IMAGE: DailyImageRecord = {
  date: 'mock',
  imageId: 'mock-image',
  storagePath: 'daily-images/mock-image.jpg',
  downloadUrl: '/Marketing/Ned_The_Pink_Cloud.webp',
  caption: 'Every day clean is a day you chose yourself.',
  assignedAt: null as unknown as DailyImageRecord['assignedAt'],
};

export function useDailyImage() {
  const { user } = useAuth();
  const today = getUtcDateString();
  const isMock = !!user?.email?.endsWith('.mock');

  const query = useQuery<DailyImageRecord | null>({
    queryKey: ['daily_images', today],
    queryFn: () => fetchDailyImage(today),
    staleTime: 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
    enabled: !isMock,
  });

  if (isMock) {
    return { dailyImage: MOCK_DAILY_IMAGE, isLoading: false, isError: false };
  }

  return { dailyImage: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}
