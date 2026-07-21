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
        enabled: Boolean(user && db && toolType && isVaultUnlocked),
        queryFn: async () => {
            if (user?.email?.endsWith('.mock')) return [];
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
