import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { encrypt } from '../lib/crypto';
import { triggerHaptic } from '../lib/haptics';
import { trackVitalityLogged } from '../lib/telemetry';
import { calculateBioBalance, inferMoodFromRecentEntries, type MoodCacheEntry } from '../lib/vitalityScoring';
import { useJournalOperations } from './useJournalOperations';
import { useTodaysVitalityLogs } from './useTodaysVitalityLogs';

// Composes the Vitality data layer: today's tag-filtered log feed, the
// derived bio-balance score, and the single write path every tab (Move/Fuel/
// Breath) shares. Content is encrypted client-side before it reaches
// useJournalOperations — per CLAUDE.md's Zero-Knowledge boundary, journal
// content must never land in Firestore as plaintext, and prior to this hook
// Vitality's raw addDoc() call skipped encrypt() entirely.
export function useVitalityEntries() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { addJournal, isSaving } = useJournalOperations();
    const todaysLogs = useTodaysVitalityLogs();

    const bioBalance = useMemo(() => calculateBioBalance(todaysLogs), [todaysLogs]);

    const saveVitalityEntry = useCallback(async (category: string, title: string, contentDetails: string, note: string, tags: string[]) => {
        if (!user) return;

        const fullContent = `**${title}**\n${contentDetails}\n\n**Somatic Check-in:**\n${note || "No specific notes recorded."}`;
        const cache = queryClient.getQueryData<MoodCacheEntry[]>(['journals', user.uid]);
        const smartMood = inferMoodFromRecentEntries(cache ?? []);

        try {
            const ciphertext = await encrypt(fullContent);
            await addJournal({
                content: ciphertext,
                moodScore: smartMood,
                sentiment: 'Pending',
                weather: null,
                tags: ['Vitality', category, ...tags],
                isEncrypted: true,
            });
            trackVitalityLogged(category);
            triggerHaptic('hold'); // Celebration buzz
            toast.success('Vitality entry logged.');
        } catch (e) {
            console.error(e);
            alert("Failed to save entry.");
        }
    }, [user, queryClient, addJournal]);

    return { todaysLogs, bioBalance, saveVitalityEntry, isSaving };
}
