import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserJournals, type JournalEntry } from '../lib/journal';
import { getInsightHistory } from '../lib/insights';
import { getUserTasks, toggleTask, type Task } from '../lib/tasks';
import { calculateJournalStats, type GamificationStats } from '../lib/gamification';
import RecoveryHero from '../components/RecoveryHero';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { isSameDay, startOfDay } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  
  // State
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [latestInsight, setLatestInsight] = useState<any | null>(null);
  
  // Task State (Only top 5)
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  
  // Gamification State
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [taskStreak, setTaskStreak] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !db) return;

      try {
        // 1. Fetch User Profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().sobrietyDate) {
          setSobrietyDate(userDoc.data().sobrietyDate.toDate());
        }

        // 2. Fetch Journals & Calc Gamification
        const journals = await getUserJournals(user.uid);
        setRecentEntries(journals.slice(0, 7)); 
        const journalStats = calculateJournalStats(journals);
        setStats(journalStats);

        // 3. Fetch Latest Insight
        try {
            const insights = await getInsightHistory(user.uid);
            if (insights.length > 0) setLatestInsight(insights[0]);
        } catch (e) {
            console.warn("Insight history fetch failed", e);
        }

        // 4. Fetch Tasks & Prioritize
        const fetchedTasks = await getUserTasks(user.uid);
        
        // Calculate total positive task streak
        const totalStreak = fetchedTasks.reduce((acc, t) => acc + (t.currentStreak > 0 ? t.currentStreak : 0), 0);
        setTaskStreak(totalStreak);

        // Filter: Not Completed OR Completed Today
        const today = startOfDay(new Date());
        const visibleTasks = fetchedTasks.filter(t => {
            if (!t.lastCompletedAt) return true; // Not done yet
            return isSameDay(t.lastCompletedAt, today); // Done today
        });

        // Sort: Overdue/Today first (Ascending Due Date)
        visibleTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        
        // Top 5
        setPriorityTasks(visibleTasks.slice(0, 5));

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  // --- HANDLERS ---
  const handleToggleTask = async (task: Task) => {
    if (!user) return;

    const today = startOfDay(new Date());
    const isCompletedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);
    const newState = !isCompletedToday;

    // Optimistic UI Update
    const updatedTasks = priorityTasks.map(t => {
        if (t.id === task.id) {
            return { 
                ...t, 
                lastCompletedAt: newState ? new Date() : null 
            }; 
        }
        return t;
    });
    setPriorityTasks(updatedTasks);

    await toggleTask(task, newState);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. ACTION BUTTON (Aligned Right) */}
      <div className="flex justify-end">
        <Link 
          to="/journal" 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Check In</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. RECOVERY HERO (Unified Component) */}
      <RecoveryHero 
        sobrietyDate={sobrietyDate} 
        journalStats={stats}
        taskStreak={taskStreak}
      />

      {/* 3. MAIN GRID (Priorities + Mood) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- PRIORITIES WIDGET --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    Priorities
                </h3>
                <Link to="/tasks" className="text-sm text-blue-600 hover:underline">Manage All &rarr;</Link>
            </div>

            <div className="space-y-3">
                {priorityTasks.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">All caught up! Great job.</p>
                )}
                
                {priorityTasks.map(task => {
                    const today = startOfDay(new Date());
                    const isCompleted = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);

                    return (
                        <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => handleToggleTask(task)}>
                            <div className="flex items-center gap-3">
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isCompleted 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300'
                                    }`}
                                >
                                    {isCompleted && <CheckCircleIcon className="h-3 w-3" />}
                                </div>
                                
                                <span className={`block text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {task.title}
                                </span>
                            </div>
                            
                            {!isCompleted && task.isRecurring && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-bold">
                                    Due
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* --- MOOD HISTORY --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
            Mood History
          </h3>
          
          {recentEntries.length > 0 ? (
            <div className="flex items-end justify-between h-32 space-x-2">
              {[...recentEntries].reverse().map((entry) => (
                <div key={entry.id} className="flex flex-col items-center flex-1 group">
                   <div 
                     className={`w-full rounded-t-md transition-all duration-500 ${
                        entry.moodScore >= 7 ? 'bg-green-400' : 
                        entry.moodScore <= 3 ? 'bg-red-400' : 'bg-yellow-400'
                     }`}
                     style={{ height: `${entry.moodScore * 10}%` }}
                   />
                   <span className="text-xs text-gray-400 mt-2">
                     {entry.createdAt.getDate()}
                   </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No journal entries yet. Check in to see your trends!
            </div>
          )}
        </div>

      </div>

      {/* 4. LATEST INSIGHT CARD (Full Width Bottom) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-500" />
            Latest Insight
          </h3>
          
          {latestInsight ? (
            <div className="space-y-3">
              <p className="text-gray-600 italic">"{latestInsight.analysis}"</p>
              
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Suggested Action</p>
                <div className="flex items-center gap-2 text-sm text-gray-800 bg-purple-50 p-2 rounded">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  {latestInsight.actionableSteps?.[0] || "Keep coming back!"}
                </div>
              </div>
              
              <div className="text-right">
                 <Link to="/journal" className="text-sm text-blue-600 hover:underline">View all insights &rarr;</Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Use the "Sparkle Button" in your Journal to generate your first AI Insight.
            </div>
          )}
      </div>
    </div>
  );
}