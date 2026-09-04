/**
 * src/hooks/useMatDoseLog.ts
 * PROJ-111 (MAT Dose-Tracking & Discreet Notifications).
 *
 * One-tap daily dose log for Jordan's MAT track. Doc ID is deterministic
 * (`${uid}_${date}`) and written via setDoc/merge — same idempotent-upsert
 * shape as game_saves' `${uid}_${gameId}` precedent — so re-logging the same
 * day updates in place rather than erroring or duplicating, which is what
 * makes a split-dose regimen (log once, representing "today's regimen
 * followed") work without a second doc per day. Multi-dose/day logging is
 * explicit future scope, not built here.
 */
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { format, startOfDay } from 'date-fns';
import { encrypt } from '../lib/crypto';
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreCrud';
import { computeMatComplianceRate } from '../lib/matCompliance';
import type { MatDoseLog } from '../lib/db';

const COMPLIANCE_WINDOW_DAYS = 30; // widest window any caller needs — getComplianceRate slices down from this

export function useMatDoseLog() {
  const { user } = useAuth();
  const queryKey = ['mat_doses', user?.uid, 'recent'];

  const dosesQuery = useFirestoreQuery<MatDoseLog[]>(queryKey, async (uid) => {
    if (user?.email?.endsWith('.mock')) return [];
    if (!db) return [];
    const database: Firestore = db;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (COMPLIANCE_WINDOW_DAYS - 1));
    const cutoffStr = format(startOfDay(cutoff), 'yyyy-MM-dd');
    const q = query(
      collection(database, 'mat_doses'),
      where('uid', '==', uid),
      where('date', '>=', cutoffStr),
      orderBy('date', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MatDoseLog[];
  });

  const doses = useMemo(() => dosesQuery.data ?? [], [dosesQuery.data]);

  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const todaysDose = useMemo(() => doses.find((d) => d.date === todayStr) ?? null, [doses, todayStr]);

  const logDoseMutation = useFirestoreMutation<{ note?: string }, void>(queryKey, {
    mutationFn: async (uid, { note }) => {
      if (user?.email?.endsWith('.mock')) return;
      if (!db) throw new Error('Not authenticated');
      const date = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const docRef = doc(db, 'mat_doses', `${uid}_${date}`);
      const payload: Record<string, unknown> = {
        uid,
        loggedAt: Timestamp.now(),
        date,
        isEncrypted: !!note,
      };
      if (note) {
        payload.encryptedNote = await encrypt(note);
      }
      await setDoc(docRef, payload, { merge: true });
    },
  });

  return {
    doses,
    isLoading: dosesQuery.isLoading,
    todaysDose,
    logDose: (note?: string) => logDoseMutation.mutateAsync({ note }),
    isLogging: logDoseMutation.isPending,
    getComplianceRate: (days: number) => computeMatComplianceRate(doses, days),
  };
}
