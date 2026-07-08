import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { getWorkbookAnswers, saveWorkbookAnswer } from '../lib/workbookAnswers';
import type { WorkbookAnswer } from '../lib/db';

export type DecryptedWorkbookAnswer = WorkbookAnswer & { id: string };

export function useWorkbookAnswers(workbookId?: string) {
  const { user } = useAuth();
  const { encrypt, decrypt } = useEncryption();
  const queryClient = useQueryClient();
  const queryKey = ['workbook_answers', user?.uid, workbookId ?? 'all'];

  const { data: answers = [], isLoading } = useQuery<DecryptedWorkbookAnswer[]>({
    queryKey,
    queryFn: async () => {
      const raw = await getWorkbookAnswers(user!.uid, workbookId);
      return Promise.all(raw.map(async (entry) => {
        if (!entry.isEncrypted) return entry;
        try {
          return { ...entry, answer: await decrypt(entry.answer) };
        } catch {
          return { ...entry, answer: '🔒 [Error Decrypting]' };
        }
      }));
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (params: { sectionId: string; questionId: string; plaintext: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (!workbookId) throw new Error('workbookId is required to save a workbook answer');

      const encryptedAnswer = await encrypt(params.plaintext);
      await saveWorkbookAnswer(user.uid, {
        uid: user.uid,
        workbookId,
        sectionId: params.sectionId,
        questionId: params.questionId,
        answer: encryptedAnswer,
        isEncrypted: true,
      });
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DecryptedWorkbookAnswer[]>(queryKey);

      if (previous && user && workbookId) {
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
        const existingIndex = previous.findIndex(a => a.id === id);
        const next = existingIndex >= 0
          ? previous.map((a, i) => (i === existingIndex ? optimisticEntry : a))
          : [...previous, optimisticEntry];
        queryClient.setQueryData(queryKey, next);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    answers,
    isLoading,
    saveAnswer: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
