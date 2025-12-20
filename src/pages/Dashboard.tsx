import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
    ClipboardDocumentCheckIcon,
    SparklesIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { calculateJournalStats, calculateTaskStats, calculateWorkbookStats } from '../lib/gamification';
import RecoveryHero from '../components/RecoveryHero';

// Estimated Total Questions across all workbooks for gamification calc
const TOTAL_WORKBOOK_QUESTIONS = 45; 

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [daysClean, setDaysClean] = useState<number>(0);
  const [journalStats, setJournalStats] = useState({ streak: 0, consistency: 0 });
  const [taskStats, setTaskStats] = useState({ rate: 0, fire: 0 });
  const [workbookStats, setWorkbookStats] = useState({ wisdom: 0, completion: 0 });
  
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [latestInsight, setLatestInsight] = useState<any>(null);

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

            // 1. Fetch Journals for Stats
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

            // 2. Fetch Tasks
            const taskQ = query(collection(db, 'tasks'), where('uid', '==', user.uid));
            const taskSnap = await getDocs(taskQ);
            const tasks = taskSnap.docs.map(d => d.data());
            const tStats = calculateTaskStats(tasks);
            setTaskStats({ rate: tStats.completionRate, fire: tStats.habitFire });

            // Get top 3 pending tasks
            const pendingTasks = taskSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(t => !t.completed)
                .sort((_a, b) => (b.priority === 'High' ? 1 : -1)) 
                .slice(0, 3);
            setRecentTasks(pendingTasks);

            // 3. Fetch Workbook Answers
            const wbQ = query(collection(db, 'users', user.uid, 'workbook_answers'));
            const wbSnap = await getDocs(wbQ);
            const wStats = calculateWorkbookStats(wbSnap.size, TOTAL_WORKBOOK_QUESTIONS);
            setWorkbookStats({ wisdom: wStats.wisdomScore, completion: wStats.masterCompletion });

            // 4. Fetch Latest Insight
            if (journals.length > 0) {
                const last = journals[0] as any;
                if (last.sentiment) {
                    setLatestInsight({
                        date: last.createdAt.toDate(),
                        sentiment: last.sentiment,
                        snippet: last.content.substring(0, 80) + "..."
                    });
                }
            }

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
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* 1. RECOVERY HERO COMPONENT */}
      <RecoveryHero 
         userName={user?.displayName?.split(' ')[0] || 'Friend'}
         daysClean={daysClean}
         journalStats={journalStats}
         taskStats={taskStats}
         workbookStats={workbookStats}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 2. PRIORITIES WIDGET */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
                      Priority Focus
                  </h3>
                  <Link to="/tasks" className="text-sm text-blue-600 hover:underline">View All</Link>
              </div>
              
              {recentTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                      <p>All clear! No pending tasks.</p>
                      <Link to="/tasks" className="text-sm text-blue-600 font-medium mt-2 inline-block">Add a Habit +</Link>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {recentTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div className={`h-3 w-3 rounded-full ${task.priority === 'High' ? 'bg-red-500' : 'bg-blue-400'}`} />
                              <span className="flex-1 font-medium text-gray-700 truncate">{task.title}</span>
                              <Link to="/tasks" className="text-gray-400 hover:text-blue-600">
                                  <ArrowRightIcon className="h-4 w-4" />
                              </Link>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* 3. LATEST INSIGHT */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-purple-600" />
                      Latest Insight
                  </h3>
                  <Link to="/journal" className="text-sm text-purple-600 hover:underline">View Journal</Link>
              </div>

              {latestInsight ? (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">{latestInsight.sentiment} Sentiment</span>
                           <span className="text-xs text-purple-400">{latestInsight.date.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 italic mb-3">"{latestInsight.snippet}"</p>
                      <Link to="/journal" className="w-full block text-center bg-white text-purple-600 text-sm font-bold py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors">
                          Analyze Deeply
                      </Link>
                  </div>
              ) : (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                      <p>No recent analysis found.</p>
                      <Link to="/journal" className="text-sm text-purple-600 font-medium mt-2 inline-block">Write Entry +</Link>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}