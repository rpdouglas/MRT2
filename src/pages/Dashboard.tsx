import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserJournals, type JournalEntry } from '../lib/journal';
import { getInsightHistory } from '../lib/insights';
import { getUserTasks, toggleTask, type Task } from '../lib/tasks';
import { calculateJournalStats, type GamificationStats } from '../lib/gamification'; // <--- NEW IMPORT
import SobrietyCounter from '../components/SobrietyCounter';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  SparklesIcon,
  CheckCircleIcon,
  FireIcon,
  TrophyIcon,
  PencilSquareIcon,
  ScaleIcon
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
        
        // Calculate total positive task streak (sum of all positive recurring streaks)
        // Or just find the best one? Let's sum them for a "Global Score" feel
        const totalStreak = fetchedTasks.reduce((acc, t) => acc + (t.currentStreak > 0 ? t.currentStreak : 0), 0);
        setTaskStreak(totalStreak);

        // Filter: Not Completed OR Completed Today (so you see what you achieved)
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
    // Note: We don't reload everything here for smoothness, 
    // but the full list is updated on the /tasks page
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. WELCOME SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.displayName}</h1>
           <p className="text-gray-500">Here is your recovery overview for today.</p>
        </div>
        <Link 
          to="/journal" 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Check In</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. HERO: SOBRIETY COUNTER */}
      {sobrietyDate ? (
        <SobrietyCounter sobrietyDate={sobrietyDate} />
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            <strong>Action Required:</strong> Please go to your <Link to="/profile" className="underline">Profile</Link> to set your Sobriety Date.
          </p>
        </div>
      )}

      {/* 3. GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- PRIORITIES WIDGET (LEFT) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                            
                            {/* Simple Status Badge for Priorities */}
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

        {/* --- PROGRESS HUB (RIGHT) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                Achievements
            </h3>
            
            <div className="space-y-4">
                
                {/* Journal Streak */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                        <PencilSquareIcon className="h-6 w-6 text-purple-600" />
                        <div>
                            <span className="block text-sm font-bold text-purple-900">Journal Streak</span>
                            <span className="text-xs text-purple-700">Consecutive Days</span>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-purple-700">
                        {stats?.journalStreak || 0}
                    </div>
                </div>

                {/* Consistency */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                        <ScaleIcon className="h-6 w-6 text-blue-600" />
                        <div>
                            <span className="block text-sm font-bold text-blue-900">Consistency</span>
                            <span className="text-xs text-blue-700">Entries / Week</span>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-blue-700">
                        {stats?.consistencyRate || 0}
                    </div>
                </div>

                {/* Task Fire */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-3">
                        <FireIcon className="h-6 w-6 text-orange-600" />
                        <div>
                            <span className="block text-sm font-bold text-orange-900">Habit Fire</span>
                            <span className="text-xs text-orange-700">Total Streak Points</span>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-orange-700">
                        {taskStreak}
                    </div>
                </div>

            </div>
        </div>

        {/* 4. RECENT MOOD TREND */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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

        {/* 5. LATEST INSIGHT CARD */}
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
    </div>
  );
}