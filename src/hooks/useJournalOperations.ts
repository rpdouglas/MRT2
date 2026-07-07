/**
 * src/hooks/useJournalOperations.ts
 * GITHUB COMMENT:
 * [useJournalOperations.ts]
 * FEAT: Centralized Journal CRUD operations with automatic React Query cache invalidation (Ticket 3.1).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export function useJournalOperations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Base query key used by JournalHistory.tsx
    const queryKey = ['journals'];

    const addJournalMutation = useMutation({
        mutationFn: async (params: {
            content: string;
            moodScore: number;
            sentiment: string;
            weather: { temp: number; condition: string } | null;
            tags: string[];
            isEncrypted: boolean;
        }) => {
            if (!user || !db) throw new Error("Not authenticated");
            return await addDoc(collection(db, 'journals'), {
                uid: user.uid,
                content: params.content,
                moodScore: params.moodScore,
                sentiment: params.sentiment,
                weather: params.weather,
                tags: params.tags,
                createdAt: Timestamp.now(),
                isEncrypted: params.isEncrypted
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const updateJournalMutation = useMutation({
        mutationFn: async (params: {
            id: string;
            content: string;
            moodScore: number;
            tags: string[];
            isEncrypted: boolean;
        }) => {
            if (!db) throw new Error("DB not initialized");
            const docRef = doc(db, 'journals', params.id);
            await updateDoc(docRef, {
                content: params.content,
                moodScore: params.moodScore,
                tags: params.tags,
                isEncrypted: params.isEncrypted
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const deleteJournalMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!db) throw new Error("DB not initialized");
            await deleteDoc(doc(db, 'journals', id));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return {
        addJournal: addJournalMutation.mutateAsync,
        updateJournal: updateJournalMutation.mutateAsync,
        deleteJournal: deleteJournalMutation.mutateAsync,
        isSaving: addJournalMutation.isPending || updateJournalMutation.isPending,
        isDeleting: deleteJournalMutation.isPending
    };
}
