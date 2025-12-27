/**
 * GITHUB COMMENT:
 * [Dashboard.tsx]
 * CLEANUP: Removed unused 'no-console' eslint-disable directive.
 */
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
  calculateVitalityStats 
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

  useEffect(() => {
    if (!user || !db) {
        if (!user) setLoading(false);
        return;
    }

    const database: Firestore = db;

    const loadDashboardData = async () => {
        try {
            const userDocRef = doc(database, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
              
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                if (userData.sobrietyDate) {
                    const start = userData.sobrietyDate.toDate ? userData.sobrietyDate.toDate() : new Date(userData.sobrietyDate);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    setDaysClean(diffDays);
                }

                const lastExport = userData.lastExportAt as Timestamp | undefined;
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                if (!lastExport || lastExport.toMillis() < sevenDaysAgo) {
                    setShowBackupBanner(true);
                }
            }

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

            const taskQ = query(collection(database, 'tasks'), where('uid', '==', user.uid));
            const taskSnap = await getDocs(taskQ);
            const tasks = taskSnap.docs.map(d => d.data());
            const tStats = calculateTaskStats(tasks);
            setTaskStats({ rate: tStats.completionRate, fire: tStats.habitFire });

            const wbQ = query(collection(database, 'users', user.uid, 'workbook_answers'));
            const wbSnap = await getDocs(wbQ);
            const wStats = calculateWorkbookStats(wbSnap.size, TOTAL_WORKBOOK_QUESTIONS);
            setWorkbookStats({ wisdom: wStats.wisdomScore, completion: wStats.masterCompletion });

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