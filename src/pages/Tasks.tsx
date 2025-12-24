import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  PlusIcon, 
  BookOpenIcon, 
  TrashIcon, 
  CalendarIcon,
  FireIcon,
  TrophyIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

// --- Types ---

type TaskCategory = 'Recovery' | 'Health' | 'Life' | 'Work';
type TaskPriority = 'High' | 'Medium' | 'Low';
type TabOption = 'today' | 'upcoming' | 'history';

export interface Task {
  id: string;
  uid: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: 'pending' | 'completed';
  frequency: 'once' | 'daily' | 'weekly';
  dueDate: Timestamp | Date | null;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
  stats?: {
    xp: number;
    attribute: 'Wisdom' | 'Vitality' | 'Willpower';
  };
}

// --- Components ---

const ProgressRing = ({ percentage }: { percentage: number }) => {
  const radius = 30;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 transition-all duration-500"
      >
        <circle
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={percentage === 100 ? "#10b981" : "#3b82f6"}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-xs font-bold ${percentage === 100 ? "text-green-600" : "text-blue-600"}`}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabOption>('today');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Recovery');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
  const [newTaskDate, setNewTaskDate] = useState('');

  // 1. Data Loading
  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      setTasks(taskData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Computed Lists & Stats
  const { filteredTasks, progress } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Helper to normalize date
    const getTaskDate = (t: Task) => {
        if (!t.dueDate) return null;
        return t.dueDate instanceof Date ? t.dueDate : (t.dueDate as Timestamp).toDate();
    };

    const todayTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const historyTasks: Task[] = [];

    let completedToday = 0;
    let totalToday = 0;

    tasks.forEach(t => {
        const d = getTaskDate(t);
        const isCompleted = t.status === 'completed';

        // History Tab: Completed items older than today
        if (isCompleted && (!d || d < now)) {
            historyTasks.push(t);
            return;
        }

        // Upcoming: Future dates
        if (d && d > now && !isCompleted) {
            upcomingTasks.push(t);
            return;
        }

        // Today: Due today/past or completed today
        todayTasks.push(t);
        totalToday++;
        if (isCompleted) completedToday++;
    });

    // Sort Today: Pending first, then Priority
    todayTasks.sort((a, b) => {
        if (a.status === b.status) {
             const pMap = { High: 3, Medium: 2, Low: 1 };
             return pMap[b.priority] - pMap[a.priority];
        }
        return a.status === 'completed' ? 1 : -1;
    });

    return {
        filteredTasks: activeTab === 'today' ? todayTasks : activeTab === 'upcoming' ? upcomingTasks : historyTasks,
        progress: totalToday === 0 ? 0 : (completedToday / totalToday) * 100
    };
  }, [tasks, activeTab]);

  // 3. Actions
  const handleToggleComplete = useCallback(async (task: Task) => {
    if (!db) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? serverTimestamp() : null;

    try {
        await updateDoc(doc(db, 'tasks', task.id), {
            status: newStatus,
            completedAt
        });
        // Haptic feedback if available (mobile)
        if (navigator.vibrate && newStatus === 'completed') navigator.vibrate(50);
    } catch (e) {
        console.error("Error toggling task", e);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!db) return;
    if (confirm("Delete this quest?")) {
        try {
            await deleteDoc(doc(db, 'tasks', id));
        } catch (e) {
            console.error(e);
        }
    }
  }, []);

  const handleJournalReflect = useCallback((task: Task) => {
    // Navigate to Journal with context (Title deep linking)
    navigate('/journal', { 
        state: { 
            initialContent: `**Reflecting on Quest: ${task.title}**\n\nHow did completing this make me feel?\n` 
        } 
    }); 
  }, [navigate]);

  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !newTaskTitle.trim()) return;

    try {
        let dueDate: Date | null = null;
        if (newTaskDate) {
            dueDate = new Date(newTaskDate);
            // Set to end of day to avoid timezone confusion "due today"
            dueDate.setHours(23, 59, 59);
        }

        await addDoc(collection(db, 'tasks'), {
            uid: user.uid,
            title: newTaskTitle,
            category: newTaskCategory,
            priority: newTaskPriority,
            status: 'pending',
            frequency: 'once',
            dueDate: dueDate || serverTimestamp(), // Default to today/now
            createdAt: serverTimestamp(),
            // Auto-assign stats based on category
            stats: {
                xp: newTaskPriority === 'High' ? 50 : 20,
                attribute: newTaskCategory === 'Recovery' ? 'Wisdom' : newTaskCategory === 'Health' ? 'Vitality' : 'Willpower'
            }
        });

        setShowAddModal(false);
        setNewTaskTitle('');
        setNewTaskPriority('Medium');
        setNewTaskCategory('Recovery');
    } catch (error) {
        console.error("Error adding task", error);
    }
  }, [user, newTaskTitle, newTaskCategory, newTaskPriority, newTaskDate]);

  // UI Helpers
  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Recovery': return 'border-l-blue-500 text-blue-600 bg-blue-50';
          case 'Health': return 'border-l-red-500 text-red-600 bg-red-50';
          case 'Work': return 'border-l-purple-500 text-purple-600 bg-purple-50';
          default: return 'border-l-gray-400 text-gray-600 bg-gray-50';
      }
  };

  const getPriorityBadge = (p: string) => {
      switch(p) {
          case 'High': return <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">HIGH</span>;
          case 'Medium': return null; // Reduce noise
          default: return <span className="text-[10px] text-gray-400">Low</span>;
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your quests...</div>;

  return (
    <div className="pb-24 relative min-h-screen bg-gray-50">
        
        {/* --- HEADER: Progress & Summary --- */}
        <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Today's Quests
                        <FireIcon className="h-5 w-5 text-orange-500" />
                    </h1>
                    <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <ProgressRing percentage={progress} />
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {['today', 'upcoming', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as TabOption)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                            activeTab === tab 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {/* --- LIST AREA --- */}
        <div className="p-4 space-y-3">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                    <TrophyIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No quests found for {activeTab}.</p>
                    {activeTab === 'today' && <p className="text-xs text-blue-500 mt-2">Enjoy your free time!</p>}
                </div>
            ) : (
                filteredTasks.map(task => (
                    <div 
                        key={task.id} 
                        className={`relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all ${
                            task.status === 'completed' ? 'opacity-75' : ''
                        }`}
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    >
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCategoryColor(task.category).split(' ')[0]}`} />
                        
                        <div className="p-4 pl-5 flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                                className="mt-0.5 flex-shrink-0"
                            >
                                {task.status === 'completed' ? (
                                    <CheckCircleSolidIcon className="h-6 w-6 text-green-500 transition-transform hover:scale-110" />
                                ) : (
                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors" />
                                )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        {task.title}
                                    </span>
                                    {getPriorityBadge(task.priority)}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${task.category === 'Recovery' ? 'bg-blue-400' : 'bg-gray-400'}`} />
                                        {task.category}
                                    </span>
                                    {task.dueDate && (
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {new Date(
                                                task.dueDate instanceof Date 
                                                ? task.dueDate 
                                                : (task.dueDate as Timestamp).toDate()
                                            ).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                    {task.stats && (
                                        <span className="text-blue-500 font-bold">+{task.stats.xp} XP</span>
                                    )}
                                </div>
                            </div>

                            {/* Expand Icon */}
                            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-300" />
                        </div>

                        {/* Action Drawer (Visible when Expanded) */}
                        {expandedTaskId === task.id && (
                            <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-end gap-2 animate-fadeIn">
                                {task.status === 'completed' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleJournalReflect(task); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-blue-600 shadow-sm hover:bg-blue-50"
                                    >
                                        <BookOpenIcon className="h-3.5 w-3.5" />
                                        Reflect
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
                                >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>

        {/* --- FLOATING ADD BUTTON --- */}
        <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all active:scale-90 z-20"
        >
            <PlusIcon className="h-6 w-6" />
        </button>

        {/* --- ADD MODAL --- */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
                <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slideUp sm:animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">New Quest</h2>
                        <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <XMarkIcon className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleAddTask} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quest Title</label>
                            <input
                                type="text"
                                placeholder="e.g., Call Sponsor, Gym, Meditate..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className="w-full rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-3"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                <select 
                                    value={newTaskCategory}
                                    onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                                    className="w-full rounded-xl border-gray-300 text-sm py-2.5"
                                >
                                    <option value="Recovery">Recovery</option>
                                    <option value="Health">Health</option>
                                    <option value="Life">Life</option>
                                    <option value="Work">Work</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                                <select 
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                                    className="w-full rounded-xl border-gray-300 text-sm py-2.5"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Due Date (Optional)</label>
                             <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input 
                                    type="date" 
                                    value={newTaskDate}
                                    onChange={(e) => setNewTaskDate(e.target.value)}
                                    className="w-full pl-10 rounded-xl border-gray-300 text-sm py-2.5" 
                                />
                             </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!newTaskTitle.trim()}
                            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Accept Quest
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}