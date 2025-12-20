import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserTasks, 
  addTask, 
  toggleTask, 
  deleteTask, 
  type Task, 
  type Frequency,
  type Priority 
} from '../lib/tasks';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  FireIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Confetti from 'react-confetti';
import { isSameDay, startOfDay, isBefore } from 'date-fns';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [dueDateStr, setDueDateStr] = useState(''); // YYYY-MM-DD

  // Fetch Tasks
  const refreshTasks = async () => {
    if (!user) return;
    try {
      const data = await getUserTasks(user.uid);
      
      // --- SORTING (Approach 3) ---
      // 1. Incomplete/Overdue first
      // 2. Incomplete/Today next
      // 3. Future
      // 4. Completed
      const today = startOfDay(new Date());
      
      const sorted = data.sort((a, b) => {
        const aCompleted = a.lastCompletedAt && isSameDay(a.lastCompletedAt, today);
        const bCompleted = b.lastCompletedAt && isSameDay(b.lastCompletedAt, today);
        
        if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
        
        // Sort by Due Date
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
    setDueDateStr(new Date().toISOString().split('T')[0]);
    refreshTasks();
  }, [user]);

  // Handlers
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    // Convert input string to Date (noon to avoid TZ issues)
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);

    await addTask(
        user.uid, 
        title, 
        isRecurring ? frequency : 'once', 
        priority, 
        dateObj
    );
    
    setTitle('');
    setIsRecurring(false);
    refreshTasks();
  };

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

  // Helpers
  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getDateStatus = (date: Date) => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    
    if (isBefore(target, today)) return { text: 'Overdue', color: 'text-red-600 font-bold' };
    if (isSameDay(target, today)) return { text: 'Today', color: 'text-orange-600 font-bold' };
    return { text: date.toLocaleDateString(), color: 'text-gray-500' };
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading habits...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            Habits & Tasks
        </h1>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleAdd} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Task Name</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                    placeholder="e.g. Call Sponsor"
                />
            </div>
            
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                    <input 
                        type="date"
                        value={dueDateStr}
                        onChange={(e) => setDueDateStr(e.target.value)}
                        className="w-full rounded-lg border-gray-300 text-sm"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full rounded-lg border-gray-300 text-sm"
                    >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
                <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded text-blue-600"
                />
                <label htmlFor="recurring" className="text-sm text-gray-700 font-medium">Recurring?</label>
                
                {isRecurring && (
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as Frequency)}
                        className="ml-2 rounded-lg border-gray-300 text-sm py-1"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                )}
            </div>

            <button
                type="submit"
                disabled={!title.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
                <PlusIcon className="h-5 w-5" />
                Add Task
            </button>
        </form>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {tasks.map(task => {
            const dateStatus = getDateStatus(task.dueDate);
            const isDoneToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, new Date());

            return (
                <div key={task.id} className={`bg-white rounded-xl p-4 border transition-all ${isDoneToday ? 'opacity-60 border-gray-100' : 'border-gray-200 shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => handleToggle(task)}
                            className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center ${isDoneToday ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500'}`}
                        >
                            {isDoneToday && <CheckCircleIcon className="h-4 w-4" />}
                        </button>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-medium ${isDoneToday ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className={`flex items-center gap-1 ${dateStatus.color}`}>
                                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                                    {dateStatus.text}
                                </div>
                                {task.isRecurring && (
                                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        <ArrowPathIcon className="h-3 w-3" />
                                        <span>{task.frequency}</span>
                                    </div>
                                )}
                                {task.currentStreak !== 0 && (
                                    <div className={`flex items-center gap-1 font-medium ${task.currentStreak > 0 ? 'text-orange-600' : 'text-red-500'}`}>
                                        <FireIcon className="h-3.5 w-3.5" />
                                        <span>{task.currentStreak} streak</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button onClick={() => task.id && handleDelete(task.id)} className="text-gray-300 hover:text-red-500">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}