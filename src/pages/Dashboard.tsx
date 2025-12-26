import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { calculateJournalStats, calculateTaskStats, calculateWorkbookStats, calculateVitalityStats } from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  HeartIcon 
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Data State
  const [daysClean, setDaysClean] = useState<number>(0);
  const [journalStats, setJournalStats] = useState({ streak: 0, consistency: 0 });
  const [taskStats, setTaskStats] = useState({ rate: 0, fire: 0 });
  const [workbookStats, setWorkbookStats] = useState({ wisdom: 0, completion: 0 });
  const [vitalityStats, setVitalityStats] = useState({ bioStreak: 0, totalLogs: 0 });

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
        if (!db) return;

        try {
            // 0. Fetch User Profile for Sobriety Date
            const userDocRef = doc(db, 'users', user.uid);
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
            }

            // 1. Fetch Journals
            const journalQ = query(
                collection(db, 'journals'), 
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

            // 2. Fetch Tasks
            const taskQ = query(collection(db, 'tasks'), where('uid', '==', user.uid));
            const taskSnap = await getDocs(taskQ);
            const tasks = taskSnap.docs.map(d => d.data());
            const tStats = calculateTaskStats(tasks);
            setTaskStats({ rate: tStats.completionRate, fire: tStats.habitFire });

            // 3. Fetch Workbook Answers
            const wbQ = query(collection(db, 'users', user.uid, 'workbook_answers'));
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
    // Fixed Viewport Layout
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

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-6">
        
        {/* --- HERO: Sobriety Counter --- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"></div>
            
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clean Time</div>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 drop-shadow-sm mb-2">
                {daysClean}
            </div>
            <div className="text-sm font-medium text-slate-500">Days of Freedom</div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* Journal Card */}
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

            {/* Habits Card */}
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

            {/* Wisdom Card */}
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

            {/* Vitality Card */}
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