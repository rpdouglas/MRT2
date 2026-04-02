import { useState, useMemo, useEffect, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Firestore, Timestamp } from 'firebase/firestore';
import { PlusIcon, ClipboardDocumentListIcon, CalendarIcon, ClockIcon, SparklesIcon, ArchiveBoxIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Virtuoso } from 'react-virtuoso';
import VibrantHeader from '../components/VibrantHeader';
import TaskRow from '../components/tasks/TaskRow';
import TaskFormModal, { type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { groupItemsByYearAndMonth } from '../lib/grouping';
import { THEME } from '../lib/theme';
import type { Task } from '../lib/tasks';
import { isBefore, isAfter, startOfDay, addDays, isSameDay, format } from 'date-fns';

type TabOption = 'this_week' | 'later' | 'action_plan' | 'history';

type HistoryItem = 
    | { type: 'header-year'; title: string; count: number } 
    | { type: 'header-month'; title: string; year: string; monthIndex: number; count: number } 
    | { type: 'task'; data: Task };

const toDate = (val: Date | Timestamp | undefined | null): Date | null => { if (!val) return null; if (val instanceof Timestamp) return val.toDate(); if (val instanceof Date) return val; return null; }

export default function Tasks() {
    const { user } = useAuth();
    const { addTask, toggleTask, deleteTask, updateTask } = useTaskOperations();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabOption>('this_week');
    
    // Modals & Editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    
    // Future Task Intercept State
    const [pendingFutureTask, setPendingFutureTask] = useState<{task: Task; isCompleting: boolean} | null>(null);
    const [isFutureModalOpen, setIsFutureModalOpen] = useState(false);

    // Virtuoso Collapsible State
    const [expandedYears, setExpandedYears] = useState<Set<string>>(() => {
        return new Set([new Date().getFullYear().toString()]);
    });
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => { const now = new Date(); return new Set([`${now.getFullYear()}-${now.getMonth()}`]); });

    useEffect(() => {
        if (!user || !db) return;
        const database: Firestore = db;
        
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

    const filteredTasks = useMemo(() => {
        const today = startOfDay(new Date());
        const nextWeekBoundary = addDays(today, 7);
        
        return tasks.filter(task => {
            const isStatusCompleted = task.status === 'completed';
            const taskLastCompleted = toDate(task.lastCompletedAt);
            const isCompletedToday = taskLastCompleted ? isSameDay(taskLastCompleted, today) : false;
            
            if (activeTab === 'history') {
                return isStatusCompleted || isCompletedToday;
            }

            if (isStatusCompleted) return false;

            const date = startOfDay(toDate(task.dueDate) || today);
            const isManual = !task.source || task.source === 'manual';
            const isAI = task.source === 'ai';

            if (activeTab === 'action_plan') {
                return isAI;
            }

            if (isManual) { if (activeTab === 'this_week') { return isBefore(date, nextWeekBoundary); }
                if (activeTab === 'later') {
                    return !isBefore(date, nextWeekBoundary);
                }
            }
            return false;
        }).sort((a, b) => {
            if (activeTab === 'history') {
                const dateA = toDate(a.lastCompletedAt)?.getTime() || 0;
                const dateB = toDate(b.lastCompletedAt)?.getTime() || 0;
                return dateB - dateA;
            }

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

    // Data Transformation for Virtuoso History
    const historyFlatData = useMemo(() => {
        if (activeTab !== 'history') return [];

        const itemsToGroup = filteredTasks.map(task => {
            const dateToUse = toDate(task.lastCompletedAt) || toDate(task.createdAt) || new Date();
            return {
                ...task,
                createdAt: dateToUse
            };
        });

        const grouped = groupItemsByYearAndMonth(itemsToGroup as unknown as { createdAt: Date | Timestamp }[]);
        const result: HistoryItem[] = [];

        const sortedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

        sortedYears.forEach(year => {
            const monthsInYear = grouped[year];
            const sortedMonthIndexes = Object.keys(monthsInYear)
                .map(Number)
                .sort((a, b) => b - a);

            const yearTotal = sortedMonthIndexes.reduce((sum, mIndex) => sum + monthsInYear[mIndex].length, 0);

            result.push({ type: 'header-year', title: year, count: yearTotal });

            if (expandedYears.has(year)) {
                sortedMonthIndexes.forEach(monthIndex => {
                    const monthEntries = monthsInYear[monthIndex];
                    const monthName = format(new Date(Number(year), monthIndex), 'MMMM');

                    result.push({ 
                        type: 'header-month', 
                        title: monthName, 
                        year: year, 
                        monthIndex: monthIndex, 
                        count: monthEntries.length 
                    });

                    if (expandedMonths.has(`${year}-${monthIndex}`)) { monthEntries.forEach(entry => { result.push({ type: 'task', data: entry as unknown as Task }); });
                    }
                });
            }
        });

        return result;
    }, [filteredTasks, expandedYears, expandedMonths, activeTab]);

    // Handlers
    const handleSave = async (data: TaskFormData) => {
        const [y, m, d] = data.dueDate.split('-').map(Number);
        const safeDate = new Date(y, m - 1, d, 12, 0, 0);

        if (editingTask && data.id) {
            await updateTask({ 
                id: data.id,
                title: data.title,
                category: data.category,
                priority: data.priority,
                recurrence: data.recurrence,
                dueDate: safeDate 
            });
        } else {
            await addTask({
                title: data.title,
                recurrence: data.recurrence,
                priority: data.priority,
                dueDate: safeDate,
                source: 'manual' 
            });
        }
    };

    const handleEdit = (task: Task) => { setEditingTask(task); setIsModalOpen(true); };

    const handleDelete = (id: string) => {
        if (confirm("Delete this task?")) deleteTask(id);
    };

    const toggleYear = (year: string) => {
        setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year);
            else next.add(year);
            return next;
        });
    };

    const toggleMonth = (year: string, monthIndex: number) => {
        const key = `${year}-${monthIndex}`;
        setExpandedMonths(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleTaskToggleIntercept = (params: {task: Task; isCompleting: boolean}) => {
        const { task, isCompleting } = params;
        
        if (isCompleting && task.dueDate) {
            const dueDate = toDate(task.dueDate);
            if (dueDate) {
                const todayDate = startOfDay(new Date());
                const taskStartOfDay = startOfDay(dueDate);
                
                if (isAfter(taskStartOfDay, todayDate)) {
                    setPendingFutureTask(params);
                    setIsFutureModalOpen(true);
                    return; 
                }
            }
        }
        toggleTask(params);
    };

    const confirmFutureToggle = () => { if (pendingFutureTask) { toggleTask(pendingFutureTask); }
        setIsFutureModalOpen(false);
        setPendingFutureTask(null);
    };

    const cancelFutureToggle = () => { setIsFutureModalOpen(false); setPendingFutureTask(null); };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading ledger...</div>;

    return (
        <div className={`min-h-screen flex flex-col bg-gray-50 pb-20`}>
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Tasks" 
                    subtitle="Daily Actions & Goals" 
                    icon={ClipboardDocumentListIcon}
                    fromColor={THEME.tasks.header.from}
                    viaColor={THEME.tasks.header.via}
                    toColor={THEME.tasks.header.to}
                    percentage={0}
                    percentageColor={THEME.tasks.ring}
                />
            </div>

            <div className="px-4 -mt-8 relative z-20">
                <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-200 flex overflow-x-auto no-scrollbar">
                    {[
                        { id: 'this_week', label: 'This Week', icon: CalendarIcon },
                        { id: 'later', label: 'Later', icon: ClockIcon },
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

            <div className="flex-1 px-4 mt-6 max-w-3xl mx-auto w-full">
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative flex flex-col ${activeTab === 'history' ? 'h-[65vh] min-h-[400px]' : 'min-h-[300px]'}`}>
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
                    ) : activeTab === 'history' ? (
                        <div className="flex-1 h-full w-full">
                            <Virtuoso 
                                style={{ height: '100%' }}
                                data={historyFlatData}
                                itemContent={(_index, item) => {
                                    if (item.type === 'header-year') {
                                        const isExpanded = expandedYears.has(item.title);
                                        return (
                                            <div className="mt-4 mb-2 px-4">
                                                <button 
                                                    onClick={() => toggleYear(item.title)}
                                                    className="w-full flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-6 bg-slate-800 rounded-full"></div>
                                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{item.title}</h2>
                                                        <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                                        {item.count} Tasks
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    }

                                    if (item.type === 'header-month') {
                                        const isExpanded = expandedMonths.has(`${item.year}-${item.monthIndex}`);
                                        return (
                                            <button 
                                                onClick={() => toggleMonth(item.year, item.monthIndex)}
                                                className={`w-[calc(100%-2rem)] mx-auto flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm py-2 px-3 mb-2 rounded-lg border shadow-sm transition-colors ${isExpanded ? 'bg-indigo-50/95 border-indigo-200' : 'bg-white/95 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? <ChevronDownIcon className="h-3 w-3 text-indigo-500" /> : <ChevronRightIcon className="h-3 w-3 text-gray-400" />}
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className={`h-4 w-4 ${isExpanded ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                        <h3 className={`text-sm font-bold uppercase tracking-wide ${isExpanded ? 'text-indigo-900' : 'text-gray-600'}`}>{item.title}</h3>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isExpanded ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {item.count}
                                                </span>
                                            </button>
                                        );
                                    }

                                    return (
                                        <div className="px-4">
                                            <div className="border border-gray-100 rounded-xl overflow-hidden mb-2 shadow-sm max-w-[96%] mx-auto">
                                                <TaskRow 
                                                    task={item.data} 
                                                    isLogView={true}
                                                    onToggle={handleTaskToggleIntercept}
                                                    onDelete={handleDelete}
                                                    onEdit={handleEdit}
                                                />
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredTasks.map(task => (
                                <TaskRow 
                                    key={task.id} 
                                    task={task} 
                                    isLogView={false}
                                    onToggle={handleTaskToggleIntercept}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                className="fixed bottom-24 right-6 h-14 w-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-black transition-all active:scale-95 z-40"
            >
                <PlusIcon className="h-6 w-6" />
            </button>

            <TaskFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialTask={editingTask}
                onSave={handleSave}
            />

            {/* FUTURE TASK WARNING MODAL */}
            <Transition.Root show={isFutureModalOpen} as={Fragment}>
              <Dialog as="div" className="relative z-50" onClose={cancelFutureToggle}>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                <div className="fixed inset-0 z-10 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-full max-w-sm sm:p-6 border-t-8 border-amber-500 animate-slideUp">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                          <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                          <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                            Complete Future Task?
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 leading-relaxed">
                              This task isn't scheduled until later. Are you sure you want to mark it as complete ahead of time?
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 sm:flex sm:flex-row-reverse gap-3">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition-all sm:w-auto"
                          onClick={confirmFutureToggle}
                        >
                          Complete Anyway
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-200 sm:mt-0 sm:w-auto transition-colors"
                          onClick={cancelFutureToggle}
                        >
                          Cancel
                        </button>
                      </div>
                    </Dialog.Panel>
                  </div>
                </div>
              </Dialog>
            </Transition.Root>

        </div>
    );
}
