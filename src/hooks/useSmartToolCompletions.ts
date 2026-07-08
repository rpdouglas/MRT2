/**
 * src/hooks/useSmartToolCompletions.ts
 * PROJ-50 §5: Tools Hub Redesign
 * One lightweight query serving every redesigned ToolsHub card at once: how many
 * completed (non-DRAFT) entries exist per SmartToolType, and whether a DRAFT
 * entry exists per type (the cross-session "Resume" signal, on top of the
 * same-session sessionStorage check in useGuidedDraft). No decryption needed —
 * tags are plaintext (see CLAUDE.md's zero-knowledge boundary table).
 */
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, type Firestore } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { DRAFT_TAG, type SmartToolType } from '../lib/types/smart';

const SMART_TOOL_TAG = 'SMART Tool';

export interface SmartToolCompletions {
    counts: Partial<Record<SmartToolType, number>>;
    hasDraftDoc: Partial<Record<SmartToolType, boolean>>;
}

export function useSmartToolCompletions() {
    const { user } = useAuth();

    return useQuery<SmartToolCompletions>({
        queryKey: ['smartToolCompletions', user?.uid],
        enabled: Boolean(user && db),
        queryFn: async () => {
            const counts: Partial<Record<SmartToolType, number>> = {};
            const hasDraftDoc: Partial<Record<SmartToolType, boolean>> = {};
            if (!user || !db) return { counts, hasDraftDoc };

            const database: Firestore = db;
            const q = query(
                collection(database, 'journals'),
                where('uid', '==', user.uid),
                where('tags', 'array-contains', SMART_TOOL_TAG),
            );
            const snapshot = await getDocs(q);

            snapshot.docs.forEach((docSnap) => {
                const tags = (docSnap.data().tags as string[] | undefined) ?? [];
                const toolType = tags.find(t => t !== SMART_TOOL_TAG && t !== DRAFT_TAG) as SmartToolType | undefined;
                if (!toolType) return;

                if (tags.includes(DRAFT_TAG)) {
                    hasDraftDoc[toolType] = true;
                } else {
                    counts[toolType] = (counts[toolType] ?? 0) + 1;
                }
            });

            return { counts, hasDraftDoc };
        },
    });
}
