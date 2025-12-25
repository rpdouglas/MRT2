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
  PencilSquareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { calculateNextDueDate, getRecurrenceLabel, type RecurrenceConfig } from '../lib/dateUtils';
import TaskFormModal, { type TaskFormData } from '../components/tasks/TaskFormModal';

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
  frequency?: string; // Legacy support
  recurrence?: RecurrenceConfig; // New robust config
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
          case 'Medium': return null; 
          default: return <span className="text-[10px] text-gray-400">Low</span>;
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your quests...</div>;

  return (
    <div className="pb-24 relative min-h-screen bg-gray-50">
        
        {/* --- HEADER --- */}
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
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCategoryColor(task.category).split(' ')[0]}`} />
                        
                        <div className="p-4 pl-5 flex items-start gap-3">
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

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    {getPriorityBadge(task.priority)}
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                        <span className={`w-1.5 h-1.5 rounded-full ${task.category === 'Recovery' ? 'bg-blue-400' : 'bg-gray-400'}`} />
                                        {task.category}
                                    </span>
                                    {task.recurrence && task.recurrence.type !== 'once' && (
                                        <span className="flex items-center gap-1 text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                            <ArrowPathIcon className="h-3 w-3" />
                                            {getRecurrenceLabel(task.recurrence)}
                                        </span>
                                    )}
                                </div>

                                <div className={`text-sm font-medium transition-all duration-300 ${
                                    task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                                } ${
                                    expandedTaskId === task.id ? 'whitespace-pre-wrap' : 'line-clamp-2'
                                }`}>
                                    {task.title}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
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

                            <div className="flex-shrink-0 mt-1">
                                <EllipsisHorizontalIcon className={`h-5 w-5 text-gray-300 transition-transform ${expandedTaskId === task.id ? 'rotate-90 text-blue-500' : ''}`} />
                            </div>
                        </div>

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
                                    onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    <PencilSquareIcon className="h-3.5 w-3.5" />
                                    Edit
                                </button>
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
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all active:scale-90 z-20"
        >
            <PlusIcon className="h-6 w-6" />
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