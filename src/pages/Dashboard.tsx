import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserJournals, type JournalEntry } from '../lib/journal';
import { getInsightHistory } from '../lib/insights';
import { getUserTasks, addTask, toggleTask, deleteTask, type Task } from '../lib/tasks';
import SobrietyCounter from '../components/SobrietyCounter';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  SparklesIcon,
  CheckCircleIcon,
  PlusIcon,
  FireIcon, 
  NoSymbolIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import { isSameDay, startOfDay } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  
  // State
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [latestInsight, setLatestInsight] = useState<any | null>(null);
  
  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isNewTaskRecurring, setIsNewTaskRecurring] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !db) return;

      try {
        // 1. Fetch User Profile for Sobriety Date
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().sobrietyDate) {
          setSobrietyDate(userDoc.data().sobrietyDate.toDate());
        }

        // 2. Fetch Recent Journals
        const journals = await getUserJournals(user.uid);
        setRecentEntries(journals.slice(0, 7)); 

        // 3. Fetch Latest Insight
        try {
            const insights = await getInsightHistory(user.uid);
            if (insights.length > 0) setLatestInsight(insights[0]);
        } catch (e) {
            console.warn("Insight history fetch failed", e);
        }

        // 4. Fetch Tasks (Triggers Lazy Evaluation)
        const fetchedTasks = await getUserTasks(user.uid);
        setTasks(fetchedTasks);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  // --- TASK HANDLERS ---
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;
    
    try {
        await addTask(user.uid, newTaskTitle, isNewTaskRecurring);
        setNewTaskTitle('');
        setIsNewTaskRecurring(false);
        // Reload tasks
        const updated = await getUserTasks(user.uid);
        setTasks(updated);
    } catch (err) {
        console.error("Failed to create task", err);
    }
  };

  const handleToggleTask = async (task: Task) => {
    // FIX: Safety check to ensure user exists before proceeding
    if (!user) return;

    // Check if already completed today
    const today = startOfDay(new Date());
    const isCompletedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);
    
    // If it's completed today, we are unchecking it. If not, we are checking it.
    const newState = !isCompletedToday;

    // Optimistic UI Update (Make it feel instant)
    const updatedTasks = tasks.map(t => {
        if (t.id === task.id) {
            return { 
                ...t, 
                lastCompletedAt: newState ? new Date() : null 
            }; 
        }
        return t;
    });
    setTasks(updatedTasks);

    await toggleTask(task, newState);
    
    // Refresh from DB to get correct streaks using the safe 'user.uid'
    const confirmedTasks = await getUserTasks(user.uid);
    setTasks(confirmedTasks);
  };

  const handleDeleteTask = async (id: string) => {
    if(!window.confirm("Delete this task?")) return;
    await deleteTask(id);
    setTasks(tasks.filter(t => t.id !== id));
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
        
        {/* --- HABIT TRACKER (NEW) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                Daily Habits & Tasks
            </h3>

            {/* Task Input */}
            <form onSubmit={handleCreateTask} className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    placeholder="Add a new habit or task..." 
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <div className="flex items-center gap-2 bg-gray-50 px-3 rounded-md border border-gray-200">
                    <input 
                        type="checkbox" 
                        id="recurring"
                        checked={isNewTaskRecurring}
                        onChange={(e) => setIsNewTaskRecurring(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="recurring" className="text-sm text-gray-600 cursor-pointer select-none">Daily</label>
                </div>
                <button 
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <PlusIcon className="h-5 w-5" />
                </button>
            </form>

            {/* Task List */}
            <div className="space-y-3">
                {tasks.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">No tasks yet. Add one above!</p>
                )}
                
                {tasks.map(task => {
                    const today = startOfDay(new Date());
                    const isCompleted = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);

                    return (
                        <div key={task.id} className="flex items-center justify-between group p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleToggleTask(task)}
                                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isCompleted 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 hover:border-blue-500'
                                    }`}
                                >
                                    {isCompleted && <CheckCircleIcon className="h-4 w-4" />}
                                </button>
                                
                                <div>
                                    <span className={`block font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        {task.title}
                                    </span>
                                    {task.isRecurring && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            Recurring Daily
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Streak Badge */}
                                {task.isRecurring && (
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                        task.currentStreak > 0 ? 'bg-orange-100 text-orange-700' : 
                                        task.currentStreak < 0 ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {task.currentStreak > 0 ? (
                                            <FireIcon className="h-3 w-3" />
                                        ) : (
                                            <NoSymbolIcon className="h-3 w-3" />
                                        )}
                                        {Math.abs(task.currentStreak)} Day Streak
                                    </div>
                                )}

                                <button 
                                    onClick={() => handleDeleteTask(task.id!)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
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