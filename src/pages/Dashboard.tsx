// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
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
  type Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { 
  calculateJournalStats, 
  calculateTaskStats, 
  calculateWorkbookStats, 
  calculateVitalityStats,
  calculateUserLevel,
  type UserStats
} from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  //XMarkIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showBackupBanner, setShowBackupBanner] = useState(false);

  const [daysClean, setDaysClean] = useState<number>(0);
  const [journalStats, setJournalStats] = useState({ streak: 0, consistency: 0 });
  const [taskStats, setTaskStats] = useState({ rate: 0, fire: 0 });
  const [workbookStats, setWorkbookStats] = useState({ wisdom: 0, completion: 0 });
  const [vitalityStats, setVitalityStats] = useState({ bioStreak: 0, totalLogs: 0 });
  
  const [userLevel, setUserLevel] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user || !db) {
        if (!user) setLoading(false);
        return;
    }

    const database: Firestore = db;

    const loadDashboardData = async () => {
        try {
            // 1. Profile Data
            const userDocRef = doc(database, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
              
            let currentCleanDays = 0;

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                if (userData.sobrietyDate) {
                    const start = userData.sobrietyDate.toDate ? userData.sobrietyDate.toDate() : new Date(userData.sobrietyDate);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - start.getTime());
                    currentCleanDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    setDaysClean(currentCleanDays);
                }

                const lastExport = userData.lastExportAt as Timestamp | undefined;
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                if (!lastExport || lastExport.toMillis() < sevenDaysAgo) {
                    setShowBackupBanner(true);
                }
            }

            // 2. Journal Data
            const journalQ = query(
                collection(database, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const journalSnap = await getDocs(journalQ);
            const journals = journalSnap.docs.map(d => ({...d.data(), createdAt: d.data().createdAt}));

            const jStats = calculateJournalStats(journals);
            setJournalStats({ 
                streak: jStats.journalStreak, 
                consistency: jStats.consistencyRate
            });

            const vStats = calculateVitalityStats(journals);
            setVitalityStats(vStats);

            // 3. Task Data
            const taskQ = query(collection(database, 'tasks'), where('uid', '==', user.uid));
            const taskSnap = await getDocs(taskQ);
            const tasks = taskSnap.docs.map(d => d.data());
            const tStats = calculateTaskStats(tasks);
            setTaskStats({ rate: tStats.completionRate, fire: tStats.habitFire });

            // 4. Workbook Data
            const wbQ = query(collection(database, 'users', user.uid, 'workbook_answers'));
            const wbSnap = await getDocs(wbQ);
            const wStats = calculateWorkbookStats(wbSnap.size, TOTAL_WORKBOOK_QUESTIONS);
            setWorkbookStats({ wisdom: wStats.wisdomScore, completion: wStats.masterCompletion });

            // 5. XP Calculation
            const levelStats = calculateUserLevel(journals, tasks, wbSnap.size, currentCleanDays);
            setUserLevel(levelStats);

        } catch (error) {
            console.error("Dashboard load error:", error);
        } finally {
            setLoading(false);
        }
    };

    loadDashboardData();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Dashboard"
            subtitle={`Welcome back, ${user?.displayName?.split(' ')[0] || 'Friend'}`}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING XP BAR (The Rank Card) */}
      {userLevel && (
        <div className="px-4 -mt-10 relative z-30 flex-shrink-0 animate-slideUp">
            <div className="bg-white rounded-3xl p-5 shadow-xl border border-white/50 backdrop-blur-sm relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                
                <div className="flex justify-between items-end mb-3 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">Rank</span>
                            <span className="text-[10px] font-bold text-gray-400">Archetype: {userLevel.archetype}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 leading-none">{userLevel.levelData.title}</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            {userLevel.levelData.level}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Current Level</div>
                    </div>
                </div>
                
                {/* XP Progress Bar */}
                <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${userLevel.levelData.progressPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-900/50 mix-blend-overlay">
                        {userLevel.levelData.currentXP} / {userLevel.levelData.nextLevelXP} XP
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 3. SCROLLABLE CONTENT (BENTO GRID) */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        
        {showBackupBanner && (
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

        {/* HERO CARD: Clean Time */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-xl border border-slate-700 group">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2 opacity-60">
                    <TrophyIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Freedom Count</span>
                </div>
                <div className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl mb-1">
                    {daysClean}
                </div>
                <div className="text-sm font-medium text-slate-400">Days of Sobriety</div>
            </div>
        </div>

        {/* 2x2 BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* 1. JOURNAL (Indigo/Violet) */}
            <Link to="/journal" className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <ChartBarIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                            <ChartBarIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">Journal</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{journalStats.streak}</div>
                    <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Day Streak</div>
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                        <span className="text-[10px] opacity-75">Consistency</span>
                        <span className="text-xs font-bold">{journalStats.consistency}/wk</span>
                    </div>
                </div>
            </Link>

            {/* 2. HABITS (Cyan/Teal) */}
            <Link to="/tasks" className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                            <FireIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">Quests</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{taskStats.fire}</div>
                    <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Quest Fire</div>
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                        <span className="text-[10px] opacity-75">Rate</span>
                        <span className="text-xs font-bold">{taskStats.rate}%</span>
                    </div>
                </div>
            </Link>

            {/* 3. VITALITY (Orange/Rose) */}
            <Link to="/vitality" className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <HeartIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                            <HeartIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">Vitality</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{vitalityStats.bioStreak}</div>
                    <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Bio-Rhythm</div>
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                        <span className="text-[10px] opacity-75">Total Logs</span>
                        <span className="text-xs font-bold">{vitalityStats.totalLogs}</span>
                    </div>
                </div>
            </Link>

            {/* 4. WISDOM (Emerald/Lime) */}
            <Link to="/workbooks" className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <SparklesIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                            <SparklesIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">Wisdom</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{workbookStats.completion}%</div>
                    <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Mastery</div>
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                        <span className="text-[10px] opacity-75">Score</span>
                        <span className="text-xs font-bold">{workbookStats.wisdom}</span>
                    </div>
                </div>
            </Link>

        </div>
      </div>
    </div>
  );
}