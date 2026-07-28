// src/hooks/useGameProgress.ts
// PROJ-72 (Recovery Games), Phase 1. Reads/writes the encrypted `game_progress`
// root collection — mirrors useJournalOperations.ts (root collection, uid
// query) combined with useWorkbookAnswers.ts's encrypt-before-write idiom.
// See docs/projects/72_RECOVERY_GAMES.md §2/§3: stats/reflection are the only
// ciphertext fields, everything else (score/gameId/personaTarget/createdAt)
// stays plaintext so streak/XP math never needs a decrypt.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { db } from '../lib/firebase';
import type { GamePersonaTarget, GameProgressRecord } from '../lib/db';
import { trackGameCompleted } from '../lib/telemetry';

export type DecryptedGameProgress = {
  id: string;
  uid: string;
  gameId: string;
  personaTarget: GamePersonaTarget;
  score: number;
  stats: Record<string, unknown>;
  reflection?: string;
  createdAt: Timestamp | Date;
};

export interface RecordGameProgressParams {
  gameId: string;
  personaTarget: GamePersonaTarget;
  score: number;
  stats: Record<string, unknown>;
  reflection?: string;
}

export function useGameProgress() {
  const { user } = useAuth();
  const { encrypt, decrypt } = useEncryption();
  const queryClient = useQueryClient();
  const queryKey = ['game_progress', user?.uid];

  const { data: history = [], isLoading } = useQuery<DecryptedGameProgress[]>({
    queryKey,
    queryFn: async () => {
      if (!db || !user) return [];

      const q = query(
        collection(db, 'game_progress'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
      );
      const snapshot = await getDocs(q);

      return Promise.all(snapshot.docs.map(async (docSnap) => {
        const raw = docSnap.data() as GameProgressRecord;
        let stats: Record<string, unknown> = {};
        try {
          stats = JSON.parse(await decrypt(raw.encryptedStats)) as Record<string, unknown>;
        } catch {
          stats = {};
        }

        let reflection: string | undefined;
        if (raw.encryptedReflection) {
          try {
            reflection = await decrypt(raw.encryptedReflection);
          } catch {
            reflection = '[Error Decrypting]';
          }
        }

        return {
          id: docSnap.id,
          uid: raw.uid,
          gameId: raw.gameId,
          personaTarget: raw.personaTarget,
          score: raw.score,
          stats,
          reflection,
          createdAt: raw.createdAt,
        };
      }));
    },
    enabled: !!user,
  });

  const recordProgressMutation = useMutation({
    mutationFn: async (params: RecordGameProgressParams) => {
      if (!user) throw new Error('Not authenticated');
      if (user.email?.endsWith('.mock')) return;
      if (!db) throw new Error('Database not initialized');

      const encryptedStats = await encrypt(JSON.stringify(params.stats));
      const encryptedReflection = params.reflection ? await encrypt(params.reflection) : undefined;

      const record: Omit<GameProgressRecord, 'id'> = {
        uid: user.uid,
        gameId: params.gameId,
        personaTarget: params.personaTarget,
        score: params.score,
        encryptedStats,
        ...(encryptedReflection ? { encryptedReflection } : {}),
        createdAt: Timestamp.now(),
        isEncrypted: true,
      };

      await addDoc(collection(db, 'game_progress'), record);
      trackGameCompleted(params.gameId, params.score, params.personaTarget);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    history,
    isLoading,
    recordProgress: recordProgressMutation.mutateAsync,
    isRecording: recordProgressMutation.isPending,
  };
}
