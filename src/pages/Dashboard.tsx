import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  TrophyIcon, 
  FireIcon, 
  CalendarDaysIcon, 
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    daysClean: 0,
    entriesCount: 0,
    streak: 0,
    tasksDue: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || !db) return;

    try {
      // 1. Calculate Days Clean (Mock calculation based on sobrietyDate)
      // In a real app, fetch user.sobrietyDate and diff with today
      const daysClean = 12; // Placeholder or calculate from profile

      // 2. Journal Stats
      const journalQ = query(collection(db, 'journals'), where('uid', '==', user.uid));
      const journalSnap = await getDocs(journalQ);
      
      // 3. Tasks Stats
      const tasksQ = query(
        collection(db, 'tasks'), 
        where('uid', '==', user.uid),
        where('completed', '==', false),
        limit(5)
      );
      const tasksSnap = await getDocs(tasksQ);
      
      setStats({
        daysClean,
        entriesCount: journalSnap.size,
        streak: 3, // Placeholder for gamification logic
        tasksDue: tasksSnap.size
      });

      setRecentTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Dashboard load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* --- RECOVERY HERO --- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">{stats.daysClean} Days</h1>
            <p className="text-blue-100 text-lg">Clean & Sober. One day at a time.</p>
         </div>
         <TrophyIcon className="h-32 w-32 text-white opacity-10 absolute right-0 bottom-0 -mr-8 -mb-8 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         {/* --- STATS DOCK --- */}
         <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2">
                    <FireIcon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.streak}</span>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Day Streak</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <CalendarDaysIcon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.entriesCount}</span>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Entries</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-2">
                    <ChartBarIcon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900">8.5</span>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avg Mood</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                    <CheckCircleIcon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.tasksDue}</span>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">To-Do</span>
            </div>
         </div>

         {/* --- PRIORITIES WIDGET --- */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                Priorities
            </h3>
            {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-400">No active tasks.</p>
            ) : (
                <ul className="space-y-3">
                    {recentTasks.map(task => (
                        <li key={task.id} className="text-sm text-gray-700 flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full border border-gray-300 flex-shrink-0" />
                            <span className="truncate">{task.title}</span>
                        </li>
                    ))}
                </ul>
            )}
         </div>

      </div>
    </div>
  );
}