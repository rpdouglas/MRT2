import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, type Firestore } from 'firebase/firestore';
import { getDayOfYear } from 'date-fns';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { UserReadingPreferences, ReadingModality } from '../lib/db';

export const ALL_MODALITIES: ReadingModality[] = [
  'twelve-step-aa',
  'twelve-step-na',
  'twelve-step-ca',
  'recovery-dharma',
  'smart-recovery',
  'secular-stoic',
  'mindfulness-buddhist',
];

export const MODALITY_LABELS: Record<ReadingModality, string> = {
  'twelve-step-aa': '12-Step (AA-inspired)',
  'twelve-step-na': '12-Step (NA-inspired)',
  'twelve-step-ca': '12-Step (CA-inspired)',
  'recovery-dharma': 'Recovery Dharma',
  'smart-recovery': 'SMART Recovery',
  'secular-stoic': 'Secular / Stoic',
  'mindfulness-buddhist': 'Mindfulness / Buddhist',
};

function localDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function useReadingPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery<UserReadingPreferences>({
    queryKey: ['reading-preferences', user?.uid],
    queryFn: async () => {
      if (user?.email?.endsWith('.mock')) {
        return { uid: user.uid, selectedModalities: ALL_MODALITIES, lastReadDate: '', readingHistory: [] };
      }
      if (!user || !db) {
        return { uid: '', selectedModalities: ALL_MODALITIES, lastReadDate: '', readingHistory: [] };
      }
      const snap = await getDoc(doc(db as Firestore, 'user_reading_preferences', user.uid));
      if (snap.exists()) return snap.data() as UserReadingPreferences;
      return { uid: user.uid, selectedModalities: ALL_MODALITIES, lastReadDate: '', readingHistory: [] };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Day-of-year rotation across selected modalities
  const activeModality = useMemo<ReadingModality | null>(() => {
    const modalities = preferences?.selectedModalities;
    if (!modalities?.length) return null;
    const idx = getDayOfYear(new Date()) % modalities.length;
    return modalities[idx];
  }, [preferences?.selectedModalities]);

  const markAsRead = useMutation({
    mutationFn: async (readingId: string) => {
      if (!user || !db) return;
      const today = localDateString();
      const prefsRef = doc(db as Firestore, 'user_reading_preferences', user.uid);
      await setDoc(prefsRef, {
        uid: user.uid,
        lastReadDate: today,
        readingHistory: arrayUnion(readingId),
      }, { merge: true });
      // Mirror to anchorSettings for backward compat with useAnchorStatus
      await updateDoc(doc(db as Firestore, 'users', user.uid), {
        'anchorSettings.lastReadingDate': today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-preferences', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
    },
  });

  const updateModalities = useMutation({
    mutationFn: async (modalities: ReadingModality[]) => {
      if (!user || !db) return;
      await setDoc(doc(db as Firestore, 'user_reading_preferences', user.uid), {
        uid: user.uid,
        selectedModalities: modalities,
      }, { merge: true });
    },
    onMutate: async (newModalities) => {
      await queryClient.cancelQueries({ queryKey: ['reading-preferences', user?.uid] });
      const previous = queryClient.getQueryData<UserReadingPreferences>(['reading-preferences', user?.uid]);
      queryClient.setQueryData<UserReadingPreferences>(['reading-preferences', user?.uid], (old) => ({
        uid: user?.uid ?? '',
        lastReadDate: '',
        readingHistory: [],
        ...old,
        selectedModalities: newModalities,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['reading-preferences', user?.uid], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-preferences', user?.uid] });
    },
  });

  const hasReadToday = preferences?.lastReadDate === localDateString();

  return { preferences, activeModality, hasReadToday, markAsRead, updateModalities };
}
