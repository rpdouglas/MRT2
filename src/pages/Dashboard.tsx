import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { calculateJournalStats, calculateTaskStats, calculateWorkbookStats, calculateVitalityStats } from '../lib/gamification';
import RecoveryHero from '../components/RecoveryHero';
import VibrantHeader from '../components/VibrantHeader';
import { HomeIcon } from '@heroicons/react/24/outline';

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
    <div className="pb-24 bg-slate-50 min-h-screen">
      
      {/* IMMERSIVE HEADER: The Horizon */}
      <VibrantHeader 
        title="Dashboard"
        subtitle={`Welcome back, ${user?.displayName?.split(' ')[0] || 'Friend'}`}
        icon={HomeIcon}
        fromColor="from-sky-500"
        viaColor="via-blue-600"
        toColor="to-indigo-600"
      />

      <div className="max-w-7xl mx-auto space-y-6 px-4 -mt-10 relative z-30">
        <RecoveryHero 
           userName={user?.displayName?.split(' ')[0] || 'Friend'}
           daysClean={daysClean}
           journalStats={journalStats}
           taskStats={taskStats}
           workbookStats={workbookStats}
           vitalityStats={vitalityStats}
        />
      </div>
    </div>
  );
}