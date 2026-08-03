import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, Timestamp, collection, getDocs, query, orderBy, limit, where, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { createROSCAssessment, getROSCAssessments } from '../lib/rosc';
import { generateROSCAnalysis } from '../lib/gemini';
import { processInChunks } from '../lib/utils';
import { format, subDays, isSameMonth } from 'date-fns';
import type { ROSCAssessment, ROSCCheckInAnswers, ROSCScore, ROSCTrajectory } from '../lib/types/rosc';

const CHECKIN_KEY = () => `roscCheckIn_${format(new Date(), 'yyyy-MM')}`;
const CHECKIN_STARTED_KEY = () => `roscCheckInStarted_${format(new Date(), 'yyyy-MM')}`;

export function useROSCAssessments() {
    const { user, userTier } = useAuth();
    const { encrypt, decrypt, isVaultUnlocked } = useEncryption();
    const queryClient = useQueryClient();

    const [createProgress, setCreateProgress] = useState(0);
    const [createError, setCreateError] = useState<string | null>(null);

    const { data: assessments = [], isLoading } = useQuery<ROSCAssessment[]>({
        queryKey: ['rosc_assessments', user?.uid],
        queryFn: () => getROSCAssessments(user!.uid),
        enabled: !!user,
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 7 * 24 * 60 * 60 * 1000,
    });

    const canCreateThisMonth = (() => {
        if (!assessments.length) return true;
        const latest = assessments[0];
        if (!latest.createdAt) return true;
        const latestDate = latest.createdAt.toDate ? latest.createdAt.toDate() : new Date(latest.createdAt as unknown as string);
        return !isSameMonth(latestDate, new Date());
    })();

    const savedCheckIn = (() => {
        try {
            const raw = sessionStorage.getItem(CHECKIN_KEY());
            return raw ? (JSON.parse(raw) as ROSCCheckInAnswers) : null;
        } catch {
            return null;
        }
    })();

    const hasStartedCheckIn = !!localStorage.getItem(CHECKIN_STARTED_KEY());

    // Called before the AI mutation so answers survive a failure and can be retried
    const saveCheckInProgress = useCallback((answers: ROSCCheckInAnswers) => {
        sessionStorage.setItem(CHECKIN_KEY(), JSON.stringify(answers));
    }, []);

    const clearCheckInProgress = useCallback(() => {
        sessionStorage.removeItem(CHECKIN_KEY());
        localStorage.removeItem(CHECKIN_STARTED_KEY());
    }, []);

    const mutation = useMutation({
        mutationFn: async (checkIn: ROSCCheckInAnswers) => {
            if (!user || !db) throw new Error('Not authenticated');
            setCreateError(null);
            setCreateProgress(5);

            const isPremium = userTier === 'premium';
            const now = new Date();
            const periodStart = Timestamp.fromDate(subDays(now, 30));
            const periodEnd = Timestamp.fromDate(now);

            let scores: ROSCScore;
            let trajectory: ROSCTrajectory = 'Insufficient Data';
            let journalEntriesAnalysed = 0;
            let encryptedAIContext = '';

            if (isPremium && isVaultUnlocked) {
                // --- PREMIUM: AI-powered analysis ---
                const database = db as Firestore;
                const q = query(
                    collection(database, 'journals'),
                    where('uid', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(30)
                );
                const snapshot = await getDocs(q);
                setCreateProgress(20);

                const rawDocs = snapshot.docs.map(d => d.data());
                journalEntriesAnalysed = rawDocs.length;

                const decryptedEntries = await processInChunks(
                    rawDocs,
                    5,
                    async (docData) => {
                        let content = docData.content || '';
                        if (docData.isEncrypted) {
                            try { content = await decrypt(docData.content); } catch { content = '[Skipped]'; }
                        }
                        const date = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date();
                        const tags = Array.isArray(docData.tags) ? (docData.tags as string[]).join(', ') : '';
                        return `[${format(date, 'MMM dd')}] Mood: ${docData.moodScore}/10 | Tags: ${tags} | Entry: ${content}`;
                    },
                    (pct) => setCreateProgress(20 + Math.floor(pct * 0.5))
                );

                const journalSummary = decryptedEntries.join('\n\n---\n\n');
                setCreateProgress(75);

                const aiResult = await generateROSCAnalysis(checkIn, journalSummary, journalEntriesAnalysed);
                setCreateProgress(85);

                scores = {
                    health: { score: aiResult.scores.health.score, selfReportedScore: checkIn.health, evidenceCount: aiResult.scores.health.evidence.length },
                    home: { score: aiResult.scores.home.score, selfReportedScore: checkIn.home, evidenceCount: aiResult.scores.home.evidence.length },
                    purpose: { score: aiResult.scores.purpose.score, selfReportedScore: checkIn.purpose, evidenceCount: aiResult.scores.purpose.evidence.length },
                    community: { score: aiResult.scores.community.score, selfReportedScore: checkIn.community, evidenceCount: aiResult.scores.community.evidence.length },
                };
                trajectory = aiResult.trajectory;

                const aiContextBlob = JSON.stringify({
                    narrative: aiResult.narrative,
                    strengths: aiResult.strengths,
                    growth_areas: aiResult.growth_areas,
                    evidence: {
                        health: aiResult.scores.health.evidence,
                        home: aiResult.scores.home.evidence,
                        purpose: aiResult.scores.purpose.evidence,
                        community: aiResult.scores.community.evidence,
                    },
                    actions: {
                        health: aiResult.scores.health.action,
                        home: aiResult.scores.home.action,
                        purpose: aiResult.scores.purpose.action,
                        community: aiResult.scores.community.action,
                    },
                });
                encryptedAIContext = await encrypt(aiContextBlob);
            } else {
                // --- FREE TIER: self-report only ---
                // Linear map: 1-5 → 2-10
                const toScore = (n: number) => Math.round(n * 2);
                scores = {
                    health: { score: toScore(checkIn.health), selfReportedScore: checkIn.health, evidenceCount: 0 },
                    home: { score: toScore(checkIn.home), selfReportedScore: checkIn.home, evidenceCount: 0 },
                    purpose: { score: toScore(checkIn.purpose), selfReportedScore: checkIn.purpose, evidenceCount: 0 },
                    community: { score: toScore(checkIn.community), selfReportedScore: checkIn.community, evidenceCount: 0 },
                };
                trajectory = 'Insufficient Data';
            }

            const totalScore = scores.health.score + scores.home.score + scores.purpose.score + scores.community.score;

            await createROSCAssessment(user.uid, {
                periodStart,
                periodEnd,
                scores,
                totalScore,
                trajectory,
                journalEntriesAnalysed,
                encryptedAIContext,
            });

            setCreateProgress(95);

            await updateDoc(doc(db, 'users', user.uid), {
                'usage_limits.lastROSCAssessment': Timestamp.now(),
            });

            setCreateProgress(100);
        },
        onSuccess: () => {
            clearCheckInProgress();
            queryClient.invalidateQueries({ queryKey: ['rosc_assessments', user?.uid] });
            queryClient.invalidateQueries({ queryKey: ['rosc_count', user?.uid] });
        },
        onError: (err: Error) => {
            setCreateError(err.message || 'Assessment failed. Your check-in answers are saved — try again.');
        },
    });

    return {
        assessments,
        isLoading,
        canCreateThisMonth,
        hasStartedCheckIn,
        savedCheckIn,
        saveCheckInProgress,
        createAssessment: mutation.mutateAsync,
        isCreating: mutation.isPending,
        createProgress,
        createError,
    };
}
