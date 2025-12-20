import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserTasks, 
  toggleTask, 
  deleteTask, 
  type Task
} from '../lib/tasks';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  FireIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Confetti from 'react-confetti';
import { isSameDay, startOfDay, isBefore } from 'date-fns';
import CreateTaskModal from '../components/CreateTaskModal';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- STATS CALCULATION ---
  const totalTasks = tasks.filter(t => !t.lastCompletedAt || !isSameDay(t.lastCompletedAt, new Date())).length;
  const dueToday = tasks.filter(t => isSameDay(t.dueDate, new Date()) && (!t.lastCompletedAt || !isSameDay(t.lastCompletedAt, new Date()))).length;
  const totalFire = tasks.reduce((acc, t) => acc + (t.currentStreak > 0 ? t.currentStreak : 0), 0);

  // Fetch Tasks
  const refreshTasks = async () => {
    if (!user) return;
    try {
      const data = await getUserTasks(user.uid);
      
      const today = startOfDay(new Date());
      
      const sorted = data.sort((a, b) => {
        const aCompleted = a.lastCompletedAt && isSameDay(a.lastCompletedAt, today);
        const bCompleted = b.lastCompletedAt && isSameDay(b.lastCompletedAt, today);
        
        if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

      setTasks(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, [user]);

  const handleToggle = async (task: Task) => {
    const today = startOfDay(new Date());
    const isCompletedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);
    
    if (!isCompletedToday) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    }

    await toggleTask(task, !isCompletedToday);
    refreshTasks();
  };

  const handleDelete = async (id: string) => {
    if(confirm('Delete this task?')) {
        await deleteTask(id);
        refreshTasks();
    }
  };

  const getUrgencyStyles = (task: Task) => {
      const today = startOfDay(new Date());
      const target = startOfDay(task.dueDate);
      const isDone = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);

      if (isDone) return 'border-l-gray-300 bg-gray-50 opacity-60';
      if (isBefore(target, today)) return 'border-l-red-500 bg-white shadow-sm ring-1 ring-red-100'; // Overdue
      if (isSameDay(target, today)) return 'border-l-orange-500 bg-white shadow-sm ring-1 ring-orange-100'; // Today
      
      // Future / Standard Priority Colors
      switch (task.priority) {
          case 'High': return 'border-l-blue-600 bg-white shadow-sm';
          case 'Medium': return 'border-l-blue-400 bg-white shadow-sm';
          case 'Low': return 'border-l-blue-200 bg-white shadow-sm';
          default: return 'border-l-gray-200 bg-white shadow-sm';
      }
  };

  const getDateLabel = (date: Date) => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    
    if (isBefore(target, today)) return { text: 'Overdue', color: 'text-red-600 font-bold' };
    if (isSameDay(target, today)) return { text: 'Today', color: 'text-orange-600 font-bold' };
    return { text: date.toLocaleDateString(), color: 'text-gray-500' };
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your ledger...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      {/* --- HEADER & MINI HERO --- */}
      <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                Habits & Tasks
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your daily habits and tasks.</p>
          </div>
          
          {/* COMPACT ADD BUTTON */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-shadow shadow-sm hover:shadow-md flex items-center justify-center"
            title="Create New Quest"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
      </div>

      {/* MINI STATS GRID */}
      <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active</span>
              <span className="text-2xl font-bold text-gray-900">{totalTasks}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Due Today</span>
              <span className={`text-2xl font-bold ${dueToday > 0 ? 'text-orange-500' : 'text-gray-900'}`}>{dueToday}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Fire</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-orange-600">
                  <FireIcon className="h-6 w-6" />
                  {totalFire}
              </div>
          </div>
      </div>

      {/* --- TASK LIST (Quest Cards) --- */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Your Ledger is Empty</h3>
                <p className="text-gray-500">Start a new quest to build your streak.</p>
            </div>
        ) : (
            tasks.map(task => {
                const dateLabel = getDateLabel(task.dueDate);
                const isDoneToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, new Date());
                const urgencyClass = getUrgencyStyles(task);

                return (
                    <div 
                        key={task.id} 
                        className={`relative group rounded-xl p-4 border-l-[6px] transition-all duration-200 ${urgencyClass}`}
                    >
                        <div className="flex items-start gap-4">
                            
                            {/* Check Button */}
                            <button
                                onClick={() => handleToggle(task)}
                                className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isDoneToday 
                                    ? 'bg-green-500 border-green-500 text-white scale-110' 
                                    : 'border-gray-300 hover:border-blue-500 text-transparent hover:text-blue-500'
                                }`}
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                            </button>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-base font-semibold ${isDoneToday ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                        {task.title}
                                    </span>
                                    
                                    {/* Action Menu (Delete) */}
                                    <button 
                                        onClick={() => task.id && handleDelete(task.id)} 
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    <div className={`flex items-center gap-1.5 ${dateLabel.color}`}>
                                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                                        {dateLabel.text}
                                    </div>

                                    {task.isRecurring && (
                                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                            <ArrowPathIcon className="h-3 w-3" />
                                            <span className="capitalize">{task.frequency}</span>
                                        </div>
                                    )}

                                    {/* Priority Badge (only if not done) */}
                                    {!isDoneToday && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            task.priority === 'High' ? 'text-red-700 bg-red-50 border-red-100' :
                                            task.priority === 'Medium' ? 'text-yellow-700 bg-yellow-50 border-yellow-100' :
                                            'text-green-700 bg-green-50 border-green-100'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Streak Micro-Badge (Right Aligned) */}
                            {(task.currentStreak > 0 || task.currentStreak < 0) && (
                                <div className={`flex flex-col items-center justify-center h-10 w-10 rounded-lg border ${
                                    task.currentStreak > 0 
                                    ? 'bg-orange-50 border-orange-100 text-orange-600' 
                                    : 'bg-red-50 border-red-100 text-red-600'
                                }`}>
                                    <FireIcon className="h-4 w-4 mb-0.5" />
                                    <span className="text-[10px] font-bold leading-none">{Math.abs(task.currentStreak)}</span>
                                </div>
                            )}

                        </div>
                    </div>
                );
            })
        )}
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTaskAdded={refreshTasks} 
      />
    </div>
  );
}