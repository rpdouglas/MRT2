import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Firestore, Timestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import { 
    PlusIcon, 
    ClipboardDocumentListIcon,
    CalendarIcon,
    ClockIcon,
    SparklesIcon,
    ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import VibrantHeader from '../components/VibrantHeader';
import TaskRow from '../components/tasks/TaskRow';
import TaskFormModal, { type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { THEME } from '../lib/theme';
import type { Task } from '../lib/tasks';
import { isBefore, isAfter, endOfDay } from 'date-fns';

type TabOption = 'today' | 'upcoming' | 'action_plan' | 'history';

// Helper for type casting dates
const toDate = (val: Date | Timestamp | undefined | null): Date | null => {
    if (!val) return null;
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return null;
}

export default function Tasks() {
    const { user } = useAuth();
    const { addTask, toggleTask, deleteTask, updateTask } = useTaskOperations();

    // Data State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [activeTab, setActiveTab] = useState<TabOption>('today');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // 1. Live Subscription
    useEffect(() => {
        if (!user || !db) return;
        const database: Firestore = db;
        
        // Fetch ALL tasks for user, filtering happens client-side for "Smart Tabs"
        const q = query(
            collection(database, 'tasks'),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskData = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : d.dueDate,
                    createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt,
                    lastCompletedAt: d.lastCompletedAt?.toDate ? d.lastCompletedAt.toDate() : d.lastCompletedAt
                } as Task;
            });
            setTasks(taskData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Smart Filter Logic (The Brain)
    const filteredTasks = useMemo(() => {
        const todayEnd = endOfDay(new Date());
        
        return tasks.filter(task => {
            const isCompleted = task.status === 'completed';
            const date = toDate(task.dueDate) || new Date(); 
            const isManual = !task.source || task.source === 'manual';
            const isAI = task.source === 'ai';

            if (activeTab === 'today') {
                return !isCompleted && isBefore(date, todayEnd) && isManual;
            }
            if (activeTab === 'upcoming') {
                return !isCompleted && isAfter(date, todayEnd) && isManual;
            }
            if (activeTab === 'action_plan') {
                return !isCompleted && isAI;
            }
            if (activeTab === 'history') {
                return isCompleted;
            }
            return false;
        }).sort((a, b) => {
            const pMap = { High: 3, Medium: 2, Low: 1 };
            const pA = a.priority || 'Medium';
            const pB = b.priority || 'Medium';
            const priorityDiff = pMap[pB] - pMap[pA];
            if (priorityDiff !== 0) return priorityDiff;
            
            const dateA = toDate(a.dueDate)?.getTime() || 0;
            const dateB = toDate(b.dueDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [tasks, activeTab]);

    // 3. Handlers
    const handleSave = async (data: TaskFormData) => {
        if (editingTask && data.id) {
            await updateTask({ 
                id: data.id,
                title: data.title,
                category: data.category,
                priority: data.priority,
                recurrence: data.recurrence,
                // Ensure dueDate is a Date object for Firestore
                dueDate: new Date(data.dueDate) 
            });
        } else {
            await addTask({
                title: data.title,
                frequency: data.recurrence.type === 'once' ? 'once' : 'daily',
                priority: data.priority,
                dueDate: new Date(data.dueDate),
                source: 'manual' 
            });
        }
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this task?")) deleteTask(id);
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading ledger...</div>;

    return (
        <div className={`min-h-screen flex flex-col bg-gray-50 pb-20`}>
            {/* Header */}
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Tasks" 
                    subtitle="Daily Actions & Goals" 
                    icon={ClipboardDocumentListIcon}
                    fromColor={THEME.tasks.header.from}
                    viaColor={THEME.tasks.header.via}
                    toColor={THEME.tasks.header.to}
                    percentage={0} // Can hook up completion rate later if desired
                    percentageColor={THEME.tasks.ring}
                />
            </div>

            {/* Smart Tabs */}
            <div className="px-4 -mt-8 relative z-20">
                <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-200 flex overflow-x-auto no-scrollbar">
                    {[
                        { id: 'today', label: 'Today', icon: CalendarIcon },
                        { id: 'upcoming', label: 'Upcoming', icon: ClockIcon },
                        { id: 'action_plan', label: 'Action Plan', icon: SparklesIcon },
                        { id: 'history', label: 'Log', icon: ArchiveBoxIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabOption)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-slate-800 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Container */}
            <div className="flex-1 px-4 mt-6 max-w-3xl mx-auto w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[300px]">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                {activeTab === 'action_plan' ? (
                                    <SparklesIcon className="h-8 w-8 text-purple-300" />
                                ) : (
                                    <ClipboardDocumentListIcon className="h-8 w-8 text-slate-300" />
                                )}
                            </div>
                            <h3 className="text-slate-900 font-bold">
                                {activeTab === 'action_plan' ? 'No Active Insights' : 'All Clear'}
                            </h3>
                            <p className="text-slate-500 text-xs mt-1 max-w-xs">
                                {activeTab === 'action_plan' 
                                    ? 'Visit the Insights page to generate an AI Action Plan.' 
                                    : 'You have no pending tasks for this view. Enjoy the moment.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredTasks.map(task => (
                                <TaskRow 
                                    key={task.id} 
                                    task={task} 
                                    onToggle={toggleTask}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FAB */}
            <button
                onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                className="fixed bottom-24 right-6 h-14 w-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-black transition-all active:scale-95 z-40"
            >
                <PlusIcon className="h-6 w-6" />
            </button>

            {/* Modal */}
            <TaskFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialTask={editingTask}
                onSave={handleSave}
            />
        </div>
    );
}
