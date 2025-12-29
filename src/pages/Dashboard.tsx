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
  XMarkIcon
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
  
  // NEW: Leveling State
  const [userLevel, setUserLevel] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user || !db) {
        if (!user) setLoading(false);
        return;
    }

    const database: Firestore = db;

    const loadDashboardData = async () => {
        try {
            // 1. Profile Data (Clean Time & Backup Status)
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

            // 5. XP & Level Calculation (The Aggregator)
            // We pass the raw(ish) data into the new calculator
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

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-6">
        
        {/* NEW: XP & RANK BAR */}
        {userLevel && (
            <div className="mx-2 -mt-12 mb-6 relative z-20 bg-white rounded-2xl p-4 shadow-lg border border-slate-100 animate-slideUp">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Rank</span>
                        <h3 className="text-xl font-black text-slate-800 leading-none">{userLevel.levelData.title}</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">Lvl {userLevel.levelData.level}</div>
                        <div className="text-[10px] font-bold text-indigo-400">
                            {userLevel.levelData.currentXP} / {userLevel.levelData.nextLevelXP} XP
                        </div>
                    </div>
                </div>
                
                {/* XP Progress Bar */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                        style={{ width: `${userLevel.levelData.progressPercent}%` }}
                    />
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">
                        Archetype: {userLevel.archetype}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        To Next Level: {userLevel.levelData.nextLevelXP - userLevel.levelData.currentXP} XP
                    </span>
                </div>
            </div>
        )}

        {showBackupBanner && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Secure Your Progress</p>
                <p className="text-xs text-amber-700">It's been a week since your last backup.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/profile" className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Backup</Link>
              <button onClick={() => setShowBackupBanner(false)} className="text-amber-400 hover:text-amber-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"></div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clean Time</div>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 drop-shadow-sm mb-2">
                {daysClean}
            </div>
            <div className="text-sm font-medium text-slate-500">Days of Freedom</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Link to="/journal" className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 active:scale-95 transition-all hover:border-indigo-300 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                    <ChartBarIcon className="h-12 w-12 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-indigo-600">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <ChartBarIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Journal</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{journalStats.streak}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">Day Streak</div>
            </Link>

            <Link to="/tasks" className="bg-white p-5 rounded-2xl shadow-sm border border-cyan-100 active:scale-95 transition-all hover:border-cyan-300 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                    <FireIcon className="h-12 w-12 text-cyan-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-cyan-600">
                    <div className="p-1.5 bg-cyan-50 rounded-lg">
                        <FireIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Habits</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{taskStats.fire}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">Day Streak</div>
            </Link>

            <Link to="/workbooks" className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 active:scale-95 transition-all hover:border-emerald-300 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                    <SparklesIcon className="h-12 w-12 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-emerald-600">
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <SparklesIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Wisdom</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{workbookStats.completion}%</div>
                <div className="text-xs text-slate-400 font-medium mt-1">Mastery</div>
            </Link>

            <Link to="/vitality" className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 active:scale-95 transition-all hover:border-orange-300 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                    <HeartIcon className="h-12 w-12 text-orange-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-orange-600">
                    <div className="p-1.5 bg-orange-50 rounded-lg">
                        <HeartIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Vitality</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{vitalityStats.bioStreak}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">Bio Streak</div>
            </Link>
        </div>
      </div>
    </div>
  );
}