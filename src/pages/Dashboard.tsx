import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { calculateJournalStats, calculateTaskStats, calculateWorkbookStats, calculateVitalityStats } from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import { HomeIcon, FireIcon, ChartBarIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';
import { Link } from 'react-router-dom';

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
    // FIX: h-[100dvh] locks the container to the viewport height. 
    // flex-col allows the header to be fixed and the content to scroll independently.
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
        
        {/* Main Stats Card (Sobriety) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Clean Time</div>
            <div className="text-5xl font-extrabold text-slate-900 mb-1">{daysClean}</div>
            <div className="text-sm text-slate-400 font-medium">Days of Freedom</div>
        </div>

        {/* Compact Grid (2x2) */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* Journal Stat */}
            <Link to="/journal" className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 active:scale-95 transition-transform">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                    <ChartBarIcon className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase">Journal</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{journalStats.streak}</div>
                <div className="text-xs text-slate-400">Day Streak</div>
            </Link>

            {/* Tasks Stat */}
            <Link to="/tasks" className="bg-white p-4 rounded-xl shadow-sm border border-cyan-100 active:scale-95 transition-transform">
                <div className="flex items-center gap-2 mb-2 text-cyan-600">
                    <FireIcon className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase">Habits</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{taskStats.fire}</div>
                <div className="text-xs text-slate-400">Day Streak</div>
            </Link>

            {/* Workbook Stat */}
            <Link to="/workbooks" className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 active:scale-95 transition-transform">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <SparklesIcon className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase">Wisdom</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{workbookStats.completion}%</div>
                <div className="text-xs text-slate-400">Mastery</div>
            </Link>

            {/* Vitality Stat */}
            <Link to="/vitality" className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 active:scale-95 transition-transform">
                <div className="flex items-center gap-2 mb-2 text-orange-600">
                    <HeartIcon className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase">Vitality</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{vitalityStats.bioStreak}</div>
                <div className="text-xs text-slate-400">Bio Streak</div>
            </Link>

        </div>
      </div>
    </div>
  );
}