/**
 * src/hooks/useJournalOperations.ts
 * GITHUB COMMENT:
 * [useJournalOperations.ts]
 * FEAT: Centralized Journal CRUD operations with automatic React Query cache invalidation (Ticket 3.1).
 * PROJ-101: migrated onto useFirestoreCrud's useFirestoreMutation primitive
 * (PROJ-59 built this hook's shape from this exact file but never migrated
 * it). No optimistic update here — this hook was already invalidate-only, so
 * there's no optimisticUpdate spec to pass. One deliberate side effect of the
 * migration: onError's trackMutationFailed domain tag changes from the
 * hand-picked 'journal' to the shared wrapper's `queryKey[0]` ('journals') —
 * cosmetic telemetry-label drift, not a behavior change, and the same
 * convention every other hook migrated under this ticket now uses.
 */
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { useFirestoreMutation } from './useFirestoreCrud';

export function useJournalOperations() {
    const { user } = useAuth();

    // Must match every reader's key (Dashboard.tsx, useAnchorStatus.ts, JournalHistory.tsx)
    // or invalidation silently no-ops against a cache entry nothing reads from.
    const queryKey = ['journals', user?.uid];

    const addJournalMutation = useFirestoreMutation<
        {
            content: string;
            moodScore: number;
            sentiment: string;
            weather: { temp: number; condition: string } | null;
            tags: string[];
            isEncrypted: boolean;
            // PROJ-113 (Daily Inspirational Image) — only set when journaling
            // from a daily image; plaintext, see JournalEntry.linkedImageId.
            linkedImageId?: string;
        },
        DocumentReference
    >(queryKey, {
        mutationFn: async (uid, params) => {
            if (user?.email?.endsWith('.mock')) return {} as unknown as DocumentReference;
            if (!db) throw new Error("Not authenticated");
            return await addDoc(collection(db, 'journals'), {
                uid,
                content: params.content,
                moodScore: params.moodScore,
                sentiment: params.sentiment,
                weather: params.weather,
                tags: params.tags,
                createdAt: Timestamp.now(),
                isEncrypted: params.isEncrypted,
                ...(params.linkedImageId ? { linkedImageId: params.linkedImageId } : {}),
            });
        },
    });

    const updateJournalMutation = useFirestoreMutation<{
        id: string;
        content: string;
        moodScore: number;
        tags: string[];
        isEncrypted: boolean;
    }>(queryKey, {
        mutationFn: async (_uid, params) => {
            if (user?.email?.endsWith('.mock')) return;
            if (!db) throw new Error("DB not initialized");
            const docRef = doc(db, 'journals', params.id);
            await updateDoc(docRef, {
                content: params.content,
                moodScore: params.moodScore,
                tags: params.tags,
                isEncrypted: params.isEncrypted
            });
        },
    });

    const deleteJournalMutation = useFirestoreMutation<string>(queryKey, {
        mutationFn: async (_uid, id) => {
            if (user?.email?.endsWith('.mock')) return;
            if (!db) throw new Error("DB not initialized");
            await deleteDoc(doc(db, 'journals', id));
        },
    });

    return {
        addJournal: addJournalMutation.mutateAsync,
        updateJournal: updateJournalMutation.mutateAsync,
        deleteJournal: deleteJournalMutation.mutateAsync,
        isSaving: addJournalMutation.isPending || updateJournalMutation.isPending,
        isDeleting: deleteJournalMutation.isPending
    };
}
