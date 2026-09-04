/**
 * src/hooks/useToolHistory.ts
 * PROJ-50 §5: Tools Hub Redesign
 * Fetches every completed (non-DRAFT) journal entry for one SmartToolType,
 * decrypted, newest first — backs the "View History" entry point. Decryption
 * only happens here (the history view itself), not from ToolsHub's card list.
 */
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, type Firestore } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { db } from '../lib/firebase';
import { getMockJournals } from '../lib/mockData';
import { parseSmartToolPayload } from '../lib/smartToolPayload';
import { DRAFT_TAG, type SmartToolType } from '../lib/types/smart';

export interface ToolHistoryEntry {
    id: string;
    createdAt: Date;
    data: Record<string, unknown>;
}

export function useToolHistory(toolType: SmartToolType | undefined) {
    const { user } = useAuth();
    const { decrypt, isVaultUnlocked } = useEncryption();

    return useQuery<ToolHistoryEntry[]>({
        queryKey: ['toolHistory', user?.uid, toolType, isVaultUnlocked],
        // TD-31: `db` can be falsy in a dev environment with no Firebase config (e.g.
        // the screenshot pipeline) — a mock user doesn't need `db` at all, so don't let
        // its absence disable the query for them; real users still require it.
        enabled: Boolean(user && toolType && isVaultUnlocked && (user.email?.endsWith('.mock') || db)),
        queryFn: async () => {
            if (user?.email?.endsWith('.mock')) {
                if (!toolType) return [];
                // TD-31: mirrors the real query below (array-contains tag, DRAFT
                // excluded, parsed via parseSmartToolPayload) against mock journals
                // instead of Firestore — was hardcoded to [] before, which meant
                // /tools/:toolType/history always rendered empty in mock mode.
                return getMockJournals(user.email)
                    .filter((entry) => entry.id && entry.tags.includes(toolType) && !entry.tags.includes(DRAFT_TAG))
                    .map((entry): ToolHistoryEntry | null => {
                        const parsed = parseSmartToolPayload(entry.content);
                        if (!parsed) return null;
                        const createdAt = typeof entry.createdAt?.toDate === 'function' ? entry.createdAt.toDate() : new Date();
                        return { id: entry.id as string, createdAt, data: parsed.data };
                    })
                    .filter((entry): entry is ToolHistoryEntry => entry !== null);
            }
            if (!user || !db || !toolType) return [];
            const database: Firestore = db;
            const q = query(
                collection(database, 'journals'),
                where('uid', '==', user.uid),
                where('tags', 'array-contains', toolType),
                orderBy('createdAt', 'desc'),
            );
            const snapshot = await getDocs(q);

            const entries: ToolHistoryEntry[] = [];
            for (const docSnap of snapshot.docs) {
                const raw = docSnap.data();
                const tags = (raw.tags as string[] | undefined) ?? [];
                if (tags.includes(DRAFT_TAG)) continue;
                if (!raw.isEncrypted || !raw.content) continue;

                try {
                    const plainText = await decrypt(raw.content);
                    const parsed = parseSmartToolPayload(plainText);
                    if (parsed) {
                        entries.push({
                            id: docSnap.id,
                            createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate() : new Date(),
                            data: parsed.data,
                        });
                    }
                } catch (err) {
                    console.error(`[useToolHistory] Failed to decrypt/parse entry ${docSnap.id}:`, err);
                }
            }
            return entries;
        },
    });
}
