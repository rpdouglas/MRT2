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
  TrophyIcon, 
  EllipsisHorizontalIcon, 
  PencilSquareIcon,
  ArrowPathIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { calculateNextDueDate, getRecurrenceLabel, type RecurrenceConfig } from '../lib/dateUtils';
import TaskFormModal, { type TaskFormData } from '../components/tasks/TaskFormModal';
import VibrantHeader from '../components/VibrantHeader'; // IMPORTED

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
  frequency?: string; 
  recurrence?: RecurrenceConfig;
  dueDate: Timestamp | Date | null;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
  stats?: {
    xp: number;
    attribute: 'Wisdom' | 'Vitality' | 'Willpower';
  };
}

// --- Theme Constants ---
const CATEGORY_THEME: Record<TaskCategory, { bg: string; text: string; border: string; ring: string }> = {
    Recovery: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', ring: 'ring-cyan-500' },
    Health:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500' },
    Life:     { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-500' },
    Work:     { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-500' },
};

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabOption>('today');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
    if (!db || !user) return;
    
    // If we are unchecking a completed task, just revert it
    if (task.status === 'completed') {
         await updateDoc(doc(db, 'tasks', task.id), {
            status: 'pending',
            completedAt: null
        });
        return;
    }

    // Completing a task
    try {
        // 1. Mark current as complete
        await updateDoc(doc(db, 'tasks', task.id), {
            status: 'completed',
            completedAt: serverTimestamp()
        });

        // 2. Check for recurrence to spawn next task
        if (task.recurrence && task.recurrence.type !== 'once') {
            const currentDueDate = task.dueDate instanceof Date 
                ? task.dueDate 
                : (task.dueDate as Timestamp).toDate();
            
            const nextDate = calculateNextDueDate(currentDueDate, task.recurrence);
            
            if (nextDate) {
                // Create the next instance
                await addDoc(collection(db, 'tasks'), {
                    ...task, // Copy all props
                    id: undefined, // Let Firebase generate new ID
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    dueDate: nextDate,
                    completedAt: null
                });
            }
        }

        if (navigator.vibrate) navigator.vibrate(50);
    } catch (e) {
        console.error("Error completing task", e);
    }
  }, [user]);

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

  const handleEdit = useCallback((task: Task) => {
      setEditingTask(task);
      setIsModalOpen(true);
      setExpandedTaskId(null); // Close drawer
  }, []);

  const handleJournalReflect = useCallback((task: Task) => {
    navigate('/journal', { 
        state: { 
            initialContent: `**Reflecting on Quest: ${task.title}**\n\nHow did completing this make me feel?\n` 
        } 
    }); 
  }, [navigate]);

  const handleSaveTask = useCallback(async (data: TaskFormData) => {
    if (!user || !db) return;

    let dueDateObj: Date | null = null;
    if (data.dueDate) {
        dueDateObj = new Date(data.dueDate);
        dueDateObj.setHours(23, 59, 59);
    }

    const payload = {
        uid: user.uid,
        title: data.title,
        category: data.category,
        priority: data.priority,
        dueDate: dueDateObj || serverTimestamp(),
        recurrence: data.recurrence,
        stats: {
             xp: data.priority === 'High' ? 50 : 20,
             attribute: data.category === 'Recovery' ? 'Wisdom' : data.category === 'Health' ? 'Vitality' : 'Willpower'
        }
    };

    try {
        if (data.id) {
            // Update existing
            await updateDoc(doc(db, 'tasks', data.id), payload);
        } else {
            // Create new
            await addDoc(collection(db, 'tasks'), {
                ...payload,
                status: 'pending',
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error saving task", error);
    }
  }, [user]);

  // UI Helpers
  const getPriorityBadge = (p: string) => {
      switch(p) {
          case 'High': return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                <FireIcon className="h-3 w-3" /> HIGH
            </span>
          );
          case 'Medium': return null; 
          default: return <span className="text-[10px] text-gray-400 font-medium">Low Priority</span>;
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your quests...</div>;

  return (
    <div className="pb-24 relative min-h-screen bg-gray-50/50">
        
        {/* VIBRANT HEADER */}
        <VibrantHeader 
            title="Today's Quests"
            subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            icon={FireIcon}
            fromColor="from-blue-600"
            viaColor="via-indigo-600"
            toColor="to-purple-600"
            percentage={progress}
            percentageColor="#fbbf24" // Amber-300 for Gold Star feel
        />

        {/* --- TABS --- */}
        <div className="px-4 -mt-6 relative z-20">
            <div className="bg-white p-1.5 rounded-xl shadow-lg border border-gray-100 flex">
                {['today', 'upcoming', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as TabOption)}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all capitalize tracking-wide ${
                            activeTab === tab 
                            ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-md transform scale-105' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {/* --- LIST AREA --- */}
        <div className="p-4 space-y-4 mt-2 max-w-4xl mx-auto">
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <TrophyIcon className="h-10 w-10 text-yellow-400" />
                    </div>
                    <p className="text-gray-900 font-medium">All caught up for {activeTab}!</p>
                    <p className="text-sm text-gray-500 mt-1">Take a moment to breathe and reflect.</p>
                </div>
            ) : (
                filteredTasks.map(task => {
                    const theme = CATEGORY_THEME[task.category] || CATEGORY_THEME.Recovery;
                    
                    return (
                        <div 
                            key={task.id} 
                            className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md ${
                                task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''
                            }`}
                            onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        >
                            {/* Accent Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.bg.replace('bg-', 'bg-gradient-to-b from-')}-400 to-${theme.bg.split('-')[1]}-600`} />
                            
                            <div className="p-4 pl-5 flex items-start gap-4">
                                {/* Checkbox */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                                    className="mt-0.5 flex-shrink-0 group"
                                >
                                    {task.status === 'completed' ? (
                                        <CheckCircleSolidIcon className="h-7 w-7 text-green-500 drop-shadow-sm transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className={`h-7 w-7 rounded-full border-2 border-gray-300 group-hover:${theme.border.replace('border-', 'border-')} group-hover:bg-gray-50 transition-colors`} />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        {getPriorityBadge(task.priority)}
                                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}>
                                            {task.category || 'General'}
                                        </span>
                                        {task.recurrence && task.recurrence.type !== 'once' && (
                                            <span className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-medium">
                                                <ArrowPathIcon className="h-3 w-3" />
                                                {getRecurrenceLabel(task.recurrence)}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`text-sm font-medium leading-relaxed transition-all duration-300 ${
                                        task.status === 'completed' ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'
                                    } ${
                                        expandedTaskId === task.id ? 'whitespace-pre-wrap' : 'line-clamp-2'
                                    }`}>
                                        {task.title}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mt-2.5">
                                        {task.dueDate && (
                                            <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                {new Date(
                                                    task.dueDate instanceof Date 
                                                    ? task.dueDate 
                                                    : (task.dueDate as Timestamp).toDate()
                                                ).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        {task.stats && (
                                            <span className="text-blue-600 flex items-center gap-1">
                                                <TrophyIcon className="h-3 w-3" />
                                                +{task.stats.xp} XP
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-shrink-0 mt-1">
                                    <EllipsisHorizontalIcon className={`h-6 w-6 text-gray-300 transition-transform ${expandedTaskId === task.id ? 'rotate-90 text-blue-600' : ''}`} />
                                </div>
                            </div>

                            {/* Action Drawer */}
                            {expandedTaskId === task.id && (
                                <div className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 p-2 flex justify-end gap-2 animate-fadeIn">
                                    {task.status === 'completed' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleJournalReflect(task); }}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-blue-600 shadow-sm hover:bg-blue-50 active:scale-95 transition-all"
                                        >
                                            <BookOpenIcon className="h-4 w-4" />
                                            Reflect
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-100 active:scale-95 transition-all"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 active:scale-95 transition-all"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>

        {/* --- FLOATING ADD BUTTON --- */}
        <button
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="fixed bottom-24 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all active:scale-95 z-30"
        >
            <PlusIcon className="h-7 w-7" />
        </button>

        {/* --- MODAL --- */}
        <TaskFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialTask={editingTask}
            onSave={handleSaveTask}
        />
    </div>
  );
}