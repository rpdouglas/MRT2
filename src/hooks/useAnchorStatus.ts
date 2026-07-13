import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from './useUserProfile';
import { useTimeOfDay } from './useTimeOfDay';
import { type JournalEntry } from '../lib/db';
import { isToday } from 'date-fns';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, type Firestore } from 'firebase/firestore';
import { getMockJournals } from '../lib/mockData';

export function useAnchorStatus() {
  const { user } = useAuth();
  const timeOfDay = useTimeOfDay();
  const { profile } = useUserProfile();

  const { data: journals } = useQuery<JournalEntry[]>({
    queryKey: ['journals', user?.uid],
    queryFn: async () => {
        if (!user) return [];
        if (user.email?.endsWith('.mock')) {
            return getMockJournals(user.email);
        }
        if (!db) return [];
        const database: Firestore = db;
        const q = query(
            collection(database, 'journals'),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            ...d.data(),
            createdAt: d.data().createdAt
        })) as JournalEntry[];
    },
    enabled: !!user,
  });

  if (!user || !profile || !journals) {
    return {
      needsCheckIn: false,
      needsReading: false,
    };
  }

  // Check-In: Does an entry exist today with tags: ['Anchor', currentTimeOfDay]?
  const hasCheckIn = journals.some(entry => {
    if (!entry.createdAt) return false;
    const date = entry.createdAt.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt as unknown as string);
    if (!isToday(date)) return false;

    const tags = entry.tags || [];
    return tags.includes('Anchor') && tags.includes(timeOfDay);
  });

  // Reading: Does userProfile.anchorSettings.lastReadingDate equal today?
  const lastReading = profile.anchorSettings?.lastReadingDate;
  const hasReading = lastReading ? isToday(new Date(lastReading)) : false;

  const settings = profile.anchorSettings || {
    notifyCheckIn: true,
    notifyReading: true,
  };

  return {
    needsCheckIn: settings.notifyCheckIn !== false && !hasCheckIn,
    needsReading: settings.notifyReading !== false && !hasReading,
  };
}
