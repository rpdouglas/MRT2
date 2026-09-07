// PROJ-76: extracted so Profile.tsx doesn't own gamification query/calc logic directly —
// mirrors DataManagement.tsx's role as a self-contained Profile tab component. Fetches the
// same plaintext data Dashboard.tsx used to (journals/tasks/workbook_answers/rosc_assessments
// counts, game_progress via useGameProgress) purely to relocate the Rank/Level/XP, journal
// streak, habit fire, vitality rhythm, and workbook wisdom displays here — see
// docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, type Firestore } from 'firebase/firestore';
import { TrophyIcon, FireIcon, ChartBarIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useRecoveryReentry } from '../../hooks/useRecoveryReentry';
import { db } from '../../lib/firebase';
import { getMockJournals, getMockTasks, getMockWorkbookAnswers } from '../../lib/mockData';
import {
    calculateJournalStats,
    calculateTaskStats,
    calculateVitalityStats,
    calculateWorkbookStats,
    calculateUserLevel,
    type ScorableJournal,
    type ScorableTask,
} from '../../lib/gamification';

export default function AchievementsTab() {
    const { user } = useAuth();
    const { decrypt } = useEncryption();
    const { profile: userProfile, isLoading: profileLoading } = useUserProfile();
    const { history: gameHistory, isLoading: gameLoading } = useGameProgress();

    // Evaluate current time purely once on mount to satisfy react-hooks/purity
    const [nowMs] = useState(() => Date.now());

    const { data: journals = [], isLoading: journalLoading } = useQuery({
        queryKey: ['journals', user?.uid],
        queryFn: async (): Promise<ScorableJournal[]> => {
            if (!user) return [];
            if (user.email?.endsWith('.mock')) {
                return getMockJournals(user.email) as unknown as ScorableJournal[];
            }
            if (!db) return [];
            const database: Firestore = db;
            const q = query(
                collection(database, 'journals'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            // TD-21: this content feeds calculateUserLevel's word-count "depth
            // bonus" and calculateJournalStats' totalWords — both need real
            // plaintext to count words correctly, not ciphertext (which always
            // splits to length 1, so the bonus silently never fired outside
            // .mock demo accounts). Decrypt failure falls back to an empty
            // string rather than surfacing '[Error Decrypting]' as scoreable
            // "content" — under-counting a bonus is harmless; the reverse
            // (an undecryptable blob accidentally scoring as a long entry)
            // isn't a risk either way, but staying empty is the safer default.
            return Promise.all(snap.docs.map(async (d): Promise<ScorableJournal> => {
                const raw = d.data();
                if (raw.isEncrypted && typeof raw.content === 'string') {
                    try {
                        return { ...raw, content: await decrypt(raw.content), createdAt: raw.createdAt };
                    } catch {
                        return { ...raw, content: '', createdAt: raw.createdAt };
                    }
                }
                return { ...raw, createdAt: raw.createdAt };
            }));
        },
        enabled: !!user,
    });

    const { data: tasks = [], isLoading: taskLoading } = useQuery({
        queryKey: ['tasks', user?.uid],
        queryFn: async (): Promise<ScorableTask[]> => {
            if (!user) return [];
            if (user.email?.endsWith('.mock')) {
                return getMockTasks(user.email) as unknown as ScorableTask[];
            }
            if (!db) return [];
            const database: Firestore = db;
            const q = query(collection(database, 'tasks'), where('uid', '==', user.uid));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data());
        },
        enabled: !!user,
    });

    const { data: workbookCount = 0, isLoading: workbookLoading } = useQuery({
        queryKey: ['workbooks', user?.uid],
        queryFn: async () => {
            if (!user) return 0;
            if (user.email?.endsWith('.mock')) {
                return getMockWorkbookAnswers(user.email).length;
            }
            if (!db) return 0;
            const database: Firestore = db;
            const q = query(collection(database, 'users', user.uid, 'workbook_answers'));
            const snap = await getDocs(q);
            return snap.size;
        },
        enabled: !!user,
    });

    const { data: roscCount = 0 } = useQuery({
        queryKey: ['rosc_count', user?.uid],
        queryFn: async () => {
            if (!user) return 0;
            if (user.email?.endsWith('.mock')) {
                return user.email.startsWith('ned') ? 1 : 0;
            }
            if (!db) return 0;
            const database: Firestore = db;
            const snap = await getDocs(collection(database, 'users', user.uid, 'rosc_assessments'));
            return snap.size;
        },
        enabled: !!user,
        staleTime: 24 * 60 * 60 * 1000,
    });

    const stats = useMemo(() => {
        let daysClean = 0;
        if (userProfile?.sobrietyDate) {
            const start = userProfile.sobrietyDate.toDate
                ? userProfile.sobrietyDate.toDate()
                : new Date(userProfile.sobrietyDate as unknown as string);
            const diffTime = Math.abs(nowMs - start.getTime());
            daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const jStats = calculateJournalStats(journals);
        const tStats = calculateTaskStats(tasks);
        const vStats = calculateVitalityStats(journals);
        const wStats = calculateWorkbookStats(workbookCount);
        // PROJ-79: Daily Crossword is deliberately excluded from XP — the source
        // spec frames it as reward-free ("the vehicle, not the point"), which
        // conflicts with gameProgressCount's blanket count of every game_progress
        // doc. Filtering here (not by skipping persistence) keeps one completion-
        // record pattern for all 8 games — see the /planning Strategy C writeup in
        // docs/projects/79_DAILY_CROSSWORD.md.
        const xpEligibleGameCount = gameHistory.filter((g) => g.gameId !== 'daily-crossword').length;
        const level = calculateUserLevel(journals, tasks, workbookCount, daysClean, roscCount, xpEligibleGameCount);

        return { journal: jStats, task: tStats, vitality: vStats, workbook: wStats, level };
    }, [journals, tasks, workbookCount, roscCount, gameHistory, userProfile, nowMs]);

    // PROJ-112: suppresses only the 3 numbers that genuinely reset from
    // inactivity (Journal Streak / Habit Fire / Vitality Rhythm) — Rank/Level/XP
    // and Workbook Wisdom accumulate monotonically, nothing to suppress there.
    const { isReentry, streakResurfaced } = useRecoveryReentry(journals);
    const suppressStreaks = isReentry && !streakResurfaced;

    const loading = profileLoading || gameLoading || journalLoading || taskLoading || workbookLoading;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading achievements…</div>;
    }

    const { levelData, archetype } = stats.level;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Rank & Level Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-2 mb-4">
                    <TrophyIcon className="h-5 w-5" />
                    <h3 className="text-lg font-bold text-white">Rank & Level</h3>
                </div>
                <div className="flex justify-between items-end text-sm font-bold uppercase tracking-widest drop-shadow-sm opacity-95 gap-2 mb-2">
                    <div className="flex items-center gap-2 truncate">
                        <span className="truncate">Rank: {archetype}</span>
                        <span className="opacity-50">|</span>
                        <span>LVL: {levelData.level}</span>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="hidden sm:inline opacity-80 mr-1.5">Progress</span>
                        <span className="font-mono tracking-normal">{levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP</span>
                    </div>
                </div>
                <div className="relative h-2 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-white transition-all duration-1000 ease-out"
                        style={{ width: `${levelData.progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Journal Streak Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Journal Streak</h3>
                </div>
                {suppressStreaks ? (
                    <p className="text-sm font-medium text-gray-600 mb-2">Every day counts again from here — no rush.</p>
                ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black text-gray-900">{stats.journal.journalStreak}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Days</div>
                    </div>
                )}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Consistency</span>
                    <span className="text-sm font-bold text-gray-900">{stats.journal.consistencyRate}/wk</span>
                </div>
            </div>

            {/* Habit Fire Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <FireIcon className="h-5 w-5 text-cyan-600" />
                    <h3 className="text-lg font-bold text-gray-900">Habit Fire</h3>
                </div>
                {suppressStreaks ? (
                    <p className="text-sm font-medium text-gray-600 mb-2">Your habits are ready when you are.</p>
                ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black text-gray-900">{stats.task.habitFire}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Fire</div>
                    </div>
                )}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Completion Rate</span>
                    <span className="text-sm font-bold text-gray-900">{stats.task.completionRate}%</span>
                </div>
            </div>

            {/* Vitality Rhythm Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <HeartIcon className="h-5 w-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">Vitality Rhythm</h3>
                </div>
                {suppressStreaks ? (
                    <p className="text-sm font-medium text-gray-600 mb-2">Whenever you're ready to log again.</p>
                ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black text-gray-900">{stats.vitality.bioStreak}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Day Streak</div>
                    </div>
                )}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Logs</span>
                    <span className="text-sm font-bold text-gray-900">{stats.vitality.totalLogs}</span>
                </div>
            </div>

            {/* Workbook Wisdom Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-gray-900">Workbook Wisdom</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-3xl font-black text-gray-900">{stats.workbook.wisdomScore}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">/ {stats.workbook.totalQuestions} Answered</div>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Progress</span>
                    <span className="text-sm font-bold text-gray-900">{stats.workbook.masterCompletion}%</span>
                </div>
            </div>
        </div>
    );
}
