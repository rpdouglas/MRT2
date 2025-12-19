import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
// REMOVED: unused 'limit'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
    FireIcon, 
    ClipboardDocumentCheckIcon,
    ChartBarIcon, 
    SparklesIcon,
    ArrowRightIcon,
    // REMOVED: unused 'PencilSquareIcon'
    BoltIcon,
    AcademicCapIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';
import { calculateJournalStats, calculateTaskStats, calculateWorkbookStats } from '../lib/gamification';

// Estimated Total Questions across all workbooks for gamification calc
const TOTAL_WORKBOOK_QUESTIONS = 45; 

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [journalStats, setJournalStats] = useState({ streak: 0, consistency: 0, words: 0 });
  const [taskStats, setTaskStats] = useState({ rate: 0, fire: 0 });
  const [workbookStats, setWorkbookStats] = useState({ wisdom: 0, completion: 0 });
  
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [latestInsight, setLatestInsight] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
        // ADDED: Safety check for db to satisfy TypeScript
        if (!db) return;

        try {
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
                consistency: jStats.consistencyRate,
                words: jStats.totalWords
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
                // FIXED: Removed unused 'a' argument or prefixed with _
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
      
      {/* 1. RECOVERY HERO (3-Column Matrix) */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
         
         <div className="relative z-10">
             <div className="mb-6">
                 <h1 className="text-3xl font-bold">Welcome back, {user?.displayName?.split(' ')[0] || 'Friend'}</h1>
                 <p className="text-blue-100 opacity-90">One day at a time. You are doing great.</p>
             </div>

             {/* THE MATRIX GRID */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                 
                 {/* COLUMN 1: JOURNAL */}
                 <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider">
                         <BookOpenIcon className="h-4 w-4" /> Journal
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <FireIcon className="h-5 w-5 text-orange-400" />
                                 <span className="text-sm font-medium">Streak</span>
                             </div>
                             <span className="text-xl font-bold">{journalStats.streak} Days</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <ChartBarIcon className="h-5 w-5 text-purple-400" />
                                 <span className="text-sm font-medium">Consistency</span>
                             </div>
                             <span className="text-xl font-bold">{journalStats.consistency}/wk</span>
                         </div>
                     </div>
                 </div>

                 {/* COLUMN 2: TASKS */}
                 <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider">
                         <ClipboardDocumentCheckIcon className="h-4 w-4" /> Habits
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <BoltIcon className="h-5 w-5 text-yellow-400" />
                                 <span className="text-sm font-medium">Fire</span>
                             </div>
                             <span className="text-xl font-bold">{taskStats.fire} Days</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <div className="h-5 w-5 rounded-full border-2 border-green-400 flex items-center justify-center">
                                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                                 </div>
                                 <span className="text-sm font-medium">Completion</span>
                             </div>
                             <span className="text-xl font-bold">{taskStats.rate}%</span>
                         </div>
                     </div>
                 </div>

                 {/* COLUMN 3: WORKBOOKS (NEW) */}
                 <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider">
                         <AcademicCapIcon className="h-4 w-4" /> Wisdom
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <SparklesIcon className="h-5 w-5 text-cyan-400" />
                                 <span className="text-sm font-medium">Score</span>
                             </div>
                             <span className="text-xl font-bold">{workbookStats.wisdom} Ans</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <div className="h-5 w-5 relative">
                                     <svg className="w-full h-full transform -rotate-90">
                                         <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                                         <circle cx="10" cy="10" r="8" fill="none" stroke="#67e8f9" strokeWidth="3" strokeDasharray={`${workbookStats.completion * 0.5} 100`} />
                                     </svg>
                                 </div>
                                 <span className="text-sm font-medium">Mastery</span>
                             </div>
                             <span className="text-xl font-bold">{workbookStats.completion}%</span>
                         </div>
                     </div>
                 </div>

             </div>
         </div>
      </div>

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