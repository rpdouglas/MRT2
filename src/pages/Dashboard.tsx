import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Confetti from 'react-confetti';
import { 
  calculateJournalStats, 
  calculateTaskStats, 
  calculateWorkbookStats, 
  calculateVitalityStats,
  calculateUserLevel
} from '../lib/gamification';
import { getMilestone } from '../lib/milestones';
import VibrantHeader from '../components/VibrantHeader';
import SobrietyHero from '../components/SobrietyHero';
import NotificationBanner from '../components/NotificationBanner';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  HeartIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  PuzzlePieceIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';
import { RECOVERY_SLOGANS } from '../data/slogans';
import type { UserProfile } from '../lib/db';
import { useBuildInfo } from '../lib/versioning';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user, driveAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const meta = useBuildInfo();
  
  // Evaluate current time purely once on mount to satisfy react-hooks/purity
  const [nowMs] = useState(() => Date.now());
  
  const [slogan] = useState(() => {
      const randomIndex = Math.floor(Math.random() * RECOVERY_SLOGANS.length);
      return RECOVERY_SLOGANS[randomIndex];
  });

  const [showChangelogToast, setShowChangelogToast] = useState(false);
  
  // Confetti State
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycleConfetti, setRecycleConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Handle window resize for Confetti
  useEffect(() => {
      const handleResize = () => {
          setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
        if (!user || !db) return null;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as UserProfile) : null;
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  // Changelog Beacon Logic
  useEffect(() => {
      if (userProfile && db && user) {
          if (!userProfile.lastSeenBuildHash) {
              updateDoc(doc(db, 'users', user.uid), { lastSeenBuildHash: meta.globalHash });
              queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
          } else if (userProfile.lastSeenBuildHash !== meta.globalHash) {
              // FIX: Wrap in setTimeout to avoid synchronous setState inside useEffect
              setTimeout(() => setShowChangelogToast(true), 0);
              updateDoc(doc(db, 'users', user.uid), { lastSeenBuildHash: meta.globalHash });
              queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
          }
      }
  }, [userProfile, meta.globalHash, user, queryClient]);

  const { data: journals = [], isLoading: journalLoading } = useQuery({
    queryKey: ['journals', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(
            collection(database, 'journals'), 
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            ...d.data(),
            createdAt: d.data().createdAt
        }));
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  const { data: tasks = [], isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(collection(database, 'tasks'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  const { data: workbookCount = 0, isLoading: workbookLoading } = useQuery({
    queryKey: ['workbooks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return 0;
        const database: Firestore = db;
        const q = query(collection(database, 'users', user.uid, 'workbook_answers'));
        const snap = await getDocs(q);
        return snap.size;
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  const stats = useMemo(() => {
    if (journalLoading || taskLoading || workbookLoading || profileLoading) return null;

    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate as unknown as string);
        const diffTime = Math.abs(nowMs - start.getTime());
        daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const jStats = calculateJournalStats(journals as any);
    const tStats = calculateTaskStats(tasks as any);
    const wStats = calculateWorkbookStats(workbookCount, TOTAL_WORKBOOK_QUESTIONS);
    const vStats = calculateVitalityStats(journals as any);
    const level = calculateUserLevel(journals as any, tasks as any, workbookCount, daysClean);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const lastExport = userProfile?.lastExportAt as Timestamp | undefined;
    const showBackup = !driveAccessToken && (!lastExport || lastExport.toMillis() < nowMs - (7 * 24 * 60 * 60 * 1000));

    return {
        journal: { streak: jStats.journalStreak, consistency: jStats.consistencyRate },
        task: { rate: tStats.completionRate, fire: tStats.habitFire },
        workbook: { wisdom: wStats.wisdomScore, completion: wStats.masterCompletion },
        vitality: { bioStreak: vStats.bioStreak, totalLogs: vStats.totalLogs },
        level,
        showBackup,
        daysClean
    };
  }, [journals, tasks, workbookCount, userProfile, journalLoading, taskLoading, workbookLoading, profileLoading, driveAccessToken, nowMs]);

  // Milestone Confetti Logic
  useEffect(() => {
      if (stats?.daysClean) {
          const milestone = getMilestone(stats.daysClean);
          if (milestone) {
              const playedKey = `mrt_milestone_${stats.daysClean}_played`;
              if (!sessionStorage.getItem(playedKey)) {
                  // FIX: Wrap in setTimeout to avoid synchronous setState inside useEffect
                  setTimeout(() => setShowConfetti(true), 0);
                  sessionStorage.setItem(playedKey, 'true');
                  setTimeout(() => setRecycleConfetti(false), 5000);
                  setTimeout(() => setShowConfetti(false), 10000);
              }
          }
      }
  }, [stats?.daysClean]);

  const loading = journalLoading || taskLoading || workbookLoading || profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page} relative`}>
      
      {/* CONFETTI LAYER */}
      {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100]">
              <Confetti width={windowSize.width} height={windowSize.height} recycle={recycleConfetti} numberOfPieces={400} gravity={0.15} />
          </div>
      )}

      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Dashboard" 
            subtitle={slogan}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING HERO */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero 
            date={userProfile?.sobrietyDate} 
            levelData={stats.level.levelData}
            archetype={stats.level.archetype}
            userProfile={userProfile as UserProfile}
         />
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">

        {/* PUSH NOTIFICATION OPT-IN (PROJ-26) */}
        <NotificationBanner />

        {/* CHANGELOG TOAST BEACON */}
        {showChangelogToast && (
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-slideDown">
                <div className="flex items-center gap-3">
                    <div className="bg-fuchsia-100 p-2 rounded-full text-fuchsia-700 shrink-0">
                        <InformationCircleIcon className="h-5 w-5" />
                    </div>
                    <div className="text-xs text-fuchsia-900 leading-tight">
                        <strong>Update Released!</strong> Tap to see what's new.
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href="https://rpdouglas.github.io/MRT2/support/changelog" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-700 whitespace-nowrap transition-colors">
                        View
                    </a>
                    <button onClick={() => setShowChangelogToast(false)} className="p-1 text-fuchsia-400 hover:text-fuchsia-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        )}
        
        {/* Backup Alert */}
        {stats.showBackup && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
              <div className="text-xs text-amber-900">
                <strong>Backup Needed:</strong> It's been a week since your last save.
              </div>
            </div>
            <Link to="/profile" className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Go</Link>
          </div>
        )}

        {/* 6-TILE BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            <Link to="/journal" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <ChartBarIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><ChartBarIcon className="h-4 w-4 text-white" /></div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Journal</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.journal.streak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Days</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Consistency</span>
                        <span className="text-base font-bold">{stats.journal.consistency}/wk</span>
                    </div>
                </div>
            </Link>

            <Link to="/tasks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><FireIcon className="h-4 w-4 text-white" /></div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Habits</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.task.fire}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Fire</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Rate</span>
                        <span className="text-base font-bold">{stats.task.rate}%</span>
                    </div>
                </div>
            </Link>

            <Link to="/vitality" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <HeartIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><HeartIcon className="h-4 w-4 text-white" /></div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Vitality</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.vitality.bioStreak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Rhythm</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Logs</span>
                        <span className="text-base font-bold">{stats.vitality.totalLogs}</span>
                    </div>
                </div>
            </Link>

            <Link to="/workbooks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <SparklesIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><SparklesIcon className="h-4 w-4 text-white" /></div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Wisdom</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.workbook.completion}%</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Done</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Score</span>
                        <span className="text-base font-bold">{stats.workbook.wisdom}</span>
                    </div>
                </div>
            </Link>

            <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed">
                <div className="absolute right-0 top-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                    <UserGroupIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-300/50 rounded-lg"><UserGroupIcon className="h-4 w-4 text-slate-500" /></div>
                        <span className="text-sm font-bold uppercase tracking-wider">Service</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-slate-500">Coming Soon</div>
                    <p className="text-[10px] leading-tight pr-2">Encrypted sponsee management.</p>
                </div>
            </div>

            <Link to="/tools" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-200 transition-transform active:scale-95 hover:shadow-xl group">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2 group-hover:rotate-12 transition-transform">
                    <PuzzlePieceIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><PuzzlePieceIcon className="h-4 w-4 text-white" /></div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Tools</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-sky-100 flex items-center gap-1">
                        <SparklesIcon className="h-3 w-3" /> Active
                    </div>
                    <p className="text-[10px] leading-tight pr-2 font-medium text-sky-50">CBT & Grounding Exercises</p>
                </div>
            </Link>

        </div>
      </div>
    </div>
  );
}
