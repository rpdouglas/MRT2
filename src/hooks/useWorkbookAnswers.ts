/**
 * PROJ-101: migrated onto useFirestoreCrud's useFirestoreQuery/useFirestoreMutation
 * primitives (PROJ-59 built this hook's shape from this exact file but never
 * migrated it). This hook owns both the read and the write for
 * `workbook_answers`, but stays on the two composable primitives rather than
 * the useFirestoreCrud() convenience wrapper — that wrapper has no
 * optimistic-update support, and this hook's optimistic entry-patching is
 * exactly the behavior this migration must preserve.
 */
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { getWorkbookAnswers, saveWorkbookAnswer } from '../lib/workbookAnswers';
import type { WorkbookAnswer } from '../lib/db';
import { getMockWorkbookAnswers } from '../lib/mockData';
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreCrud';

export type DecryptedWorkbookAnswer = WorkbookAnswer & { id: string };

export function useWorkbookAnswers(workbookId?: string) {
  const { user } = useAuth();
  const { encrypt, decrypt } = useEncryption();
  const queryKey = ['workbook_answers', user?.uid, workbookId ?? 'all'];

  const { data: answers = [], isLoading } = useFirestoreQuery<DecryptedWorkbookAnswer[]>(queryKey, async (uid) => {
    if (user?.email?.endsWith('.mock')) {
      const raw = getMockWorkbookAnswers(user.email);
      const filtered = workbookId ? raw.filter(a => a.workbookId === workbookId) : raw;
      return filtered.map(a => ({
        ...a,
        id: `${a.workbookId}_${a.questionId}`,
        updatedAt: a.updatedAt instanceof Date ? Timestamp.fromDate(a.updatedAt) : a.updatedAt
      } as unknown as DecryptedWorkbookAnswer));
    }

    const raw = await getWorkbookAnswers(uid, workbookId);
    return Promise.all(raw.map(async (entry) => {
      if (!entry.isEncrypted) return entry;
      try {
        return { ...entry, answer: await decrypt(entry.answer) };
      } catch {
        return { ...entry, answer: '🔒 [Error Decrypting]' };
      }
    }));
  });

  const saveMutation = useFirestoreMutation<{ sectionId: string; questionId: string; plaintext: string }>(queryKey, {
    mutationFn: async (uid, params) => {
      if (user?.email?.endsWith('.mock')) return;
      if (!workbookId) throw new Error('workbookId is required to save a workbook answer');

      const encryptedAnswer = await encrypt(params.plaintext);
      await saveWorkbookAnswer(uid, {
        uid,
        workbookId,
        sectionId: params.sectionId,
        questionId: params.questionId,
        answer: encryptedAnswer,
        isEncrypted: true,
      });
    },
    optimisticUpdate: (previous, params) => {
      const prev = previous as DecryptedWorkbookAnswer[] | undefined;
      if (!prev || !user || !workbookId) return prev;

      const id = `${workbookId}_${params.questionId}`;
      const optimisticEntry: DecryptedWorkbookAnswer = {
        id,
        uid: user.uid,
        workbookId,
        sectionId: params.sectionId,
        questionId: params.questionId,
        answer: params.plaintext,
        isEncrypted: true,
        updatedAt: Timestamp.now(),
      };
      const existingIndex = prev.findIndex(a => a.id === id);
      return existingIndex >= 0
        ? prev.map((a, i) => (i === existingIndex ? optimisticEntry : a))
        : [...prev, optimisticEntry];
    },
  });

  return {
    answers,
    isLoading,
    saveAnswer: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
