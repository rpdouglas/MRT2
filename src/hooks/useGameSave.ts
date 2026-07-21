// src/hooks/useGameSave.ts
// PROJ-72 (Recovery Games), Phase 4. Reads/writes the encrypted `game_saves`
// root collection — a resumable, continuously-updated save-slot per
// (uid, gameId), distinct from useGameProgress's append-only completed-play
// log. Doc ID is `${uid}_${gameId}` so writes are a clean setDoc upsert
// rather than an addDoc + tracked-ID dance. Mirrors useGameProgress.ts's
// auth/db guard clauses and `.mock` email early-return convention.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { db } from '../lib/firebase';
import type { GameSaveRecord } from '../lib/db';

export interface SaveGameParams {
  gameId: string;
  state: Record<string, unknown>;
}

function saveDocId(uid: string, gameId: string): string {
  return `${uid}_${gameId}`;
}

export function useGameSave(gameId: string) {
  const { user } = useAuth();
  const { encrypt, decrypt } = useEncryption();
  const queryClient = useQueryClient();
  const queryKey = ['game_saves', user?.uid, gameId];

  const { data: save = null, isLoading } = useQuery<Record<string, unknown> | null>({
    queryKey,
    queryFn: async () => {
      if (!db || !user) return null;

      const snap = await getDoc(doc(db, 'game_saves', saveDocId(user.uid, gameId)));
      if (!snap.exists()) return null;

      const raw = snap.data() as GameSaveRecord;
      try {
        return JSON.parse(await decrypt(raw.encryptedState)) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const saveGameMutation = useMutation({
    mutationFn: async (params: SaveGameParams) => {
      if (!user) throw new Error('Not authenticated');
      if (user.email?.endsWith('.mock')) return;
      if (!db) throw new Error('Database not initialized');

      const encryptedState = await encrypt(JSON.stringify(params.state));
      const record: Omit<GameSaveRecord, 'id'> = {
        uid: user.uid,
        gameId: params.gameId,
        encryptedState,
        updatedAt: Timestamp.now(),
        isEncrypted: true,
      };

      await setDoc(doc(db, 'game_saves', saveDocId(user.uid, params.gameId)), record);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const clearSaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (user.email?.endsWith('.mock')) return;
      if (!db) throw new Error('Database not initialized');

      await deleteDoc(doc(db, 'game_saves', saveDocId(user.uid, gameId)));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    save,
    isLoading,
    saveGame: saveGameMutation.mutateAsync,
    isSaving: saveGameMutation.isPending,
    clearSave: clearSaveMutation.mutateAsync,
  };
}
