import os

dashboard_tsx_content = r'''/**
 * src/pages/Dashboard.tsx
 * GITHUB COMMENT:
 * [Dashboard.tsx]
 * UX: Moved recovery slogan into VibrantHeader subtitle. Cleaned up unused variables (Ticket 2.3).
 */
import { useMemo, useState } from 'react';
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
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateJournalStats, 
  calculateTaskStats, 
  calculateWorkbookStats, 
  calculateVitalityStats,
  calculateUserLevel
} from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import SobrietyHero from '../components/SobrietyHero';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  HeartIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';
import { RECOVERY_SLOGANS } from '../data/slogans';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  
  // Lazy init the daily slogan
  const [slogan] = useState(() => {
      const randomIndex = Math.floor(Math.random() * RECOVERY_SLOGANS.length);
      return RECOVERY_SLOGANS[randomIndex];
  });

  // --- QUERY 1: USER PROFILE ---
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
        if (!user || !db) return null;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  // --- QUERY 2: JOURNALS ---
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

  // --- QUERY 3: TASKS ---
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

  // --- QUERY 4: WORKBOOKS ---
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

  // --- CALCULATE STATS ---
  const stats = useMemo(() => {
    if (journalLoading || taskLoading || workbookLoading || profileLoading) return null;

    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate);
        const diffTime = Math.abs(new Date().getTime() - start.getTime());
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
    
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now(); 
    const showBackup = !lastExport || lastExport.toMillis() < nowMs - (7 * 24 * 60 * 60 * 1000);

    return {
        journal: { streak: jStats.journalStreak, consistency: jStats.consistencyRate },
        task: { rate: tStats.completionRate, fire: tStats.habitFire },
        workbook: { wisdom: wStats.wisdomScore, completion: wStats.masterCompletion },
        vitality: { bioStreak: vStats.bioStreak, totalLogs: vStats.totalLogs },
        level,
        showBackup
    };
  }, [journals, tasks, workbookCount, userProfile, journalLoading, taskLoading, workbookLoading, profileLoading]);

  const loading = journalLoading || taskLoading || workbookLoading || profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page}`}>
      
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

      {/* 2. FLOATING HERO: Clean Time + Gamification Unified */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero 
            date={userProfile?.sobrietyDate} 
            levelData={stats.level.levelData}
            archetype={stats.level.archetype}
         />
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        
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
            
            {/* 1. JOURNAL */}
            <Link to="/journal" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <ChartBarIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <ChartBarIcon className="h-4 w-4 text-white" />
                        </div>
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

            {/* 2. HABITS */}
            <Link to="/tasks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <FireIcon className="h-4 w-4 text-white" />
                        </div>
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

            {/* 3. VITALITY */}
            <Link to="/vitality" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <HeartIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <HeartIcon className="h-4 w-4 text-white" />
                        </div>
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

            {/* 4. WISDOM */}
            <Link to="/workbooks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <SparklesIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
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

            {/* 5. SERVICE PORTAL (Placeholder) */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed">
                <div className="absolute right-0 top-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                    <UserGroupIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-300/50 rounded-lg">
                            <UserGroupIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Service</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-slate-500">
                        Coming Soon
                    </div>
                    <p className="text-[10px] leading-tight pr-2">Encrypted sponsee management.</p>
                </div>
            </div>

            {/* 6. RECOVERY GAMES (Placeholder) */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed">
                <div className="absolute right-0 top-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                    <PuzzlePieceIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-300/50 rounded-lg">
                            <PuzzlePieceIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Games</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-slate-500">
                        Coming Soon
                    </div>
                    <p className="text-[10px] leading-tight pr-2">Map triggers & rewire pathways.</p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
'''

sobriety_hero_tsx_content = r'''/**
 * src/components/SobrietyHero.tsx
 * GITHUB COMMENT:
 * [SobrietyHero.tsx]
 * UX: Condensed Gamification layout for tighter vertical rhythm (Ticket 2.3).
 */
import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';

interface SobrietyHeroProps {
    date?: Timestamp | Date | null;
    levelData?: {
        level: number;
        currentXP: number;
        nextLevelXP: number;
        progressPercent: number;
    };
    archetype?: string;
}

export default function SobrietyHero({ date, levelData, archetype }: SobrietyHeroProps) {
    // Calculate Time Stats
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-[2rem] p-6 text-center text-white shadow-xl shadow-orange-500/20 border border-white/20">
                <div className="opacity-90 mb-2 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-[2rem] p-4 sm:p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group border border-white/20">
            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Main Counters */}
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/30 pt-2 pb-2">
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{stats.years}</div>
                        <div className="text-xs sm:text-sm font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Years</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{stats.months}</div>
                        <div className="text-xs sm:text-sm font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Months</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{stats.days}</div>
                        <div className="text-xs sm:text-sm font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Days</div>
                    </div>
                </div>

                {/* Unified Footer: Gamification & Total Days */}
                {levelData && archetype && (
                    <div className="mt-5 pt-4 border-t border-white/20 space-y-3">
                        
                        {/* Rank & Level Line */}
                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest drop-shadow-sm opacity-95">
                            <span>Rank: {archetype}</span>
                            <span>LVL: {levelData.level}</span>
                        </div>
                        
                        {/* Progress & XP Line */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest drop-shadow-sm opacity-90">
                                <span>Progress</span>
                                <span className="font-mono">{levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP</span>
                            </div>
                            
                            {/* Shimmer Progress Bar */}
                            <div className="relative h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-white transition-all duration-1000 ease-out relative"
                                    style={{ width: `${levelData.progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/50 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Total Days */}
                        <div className="pt-2 flex items-center justify-center gap-2 text-xs font-medium drop-shadow-sm opacity-90">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated UI: {path}")

if __name__ == "__main__":
    write_file("src/pages/Dashboard.tsx", dashboard_tsx_content)
    write_file("src/components/SobrietyHero.tsx", sobriety_hero_tsx_content)
    print("✨ Dashboard vertical rhythm optimized successfully.")