import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserTasks, 
  addTask, 
  toggleTask, 
  deleteTask, 
  type Task, 
  type Frequency 
} from '../lib/tasks';
import { 
  CheckCircleIcon, 
  PlusIcon, 
  FireIcon, 
  NoSymbolIcon, 
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { isSameDay, startOfDay } from 'date-fns';

export default function Tasks() {
  const { user } = useAuth();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newFrequency, setNewFrequency] = useState<Frequency>('once');
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    async function loadTasks() {
      if (!user) return;
      try {
        const fetchedTasks = await getUserTasks(user.uid);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [user]);

  // Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!user || !newTaskTitle.trim()) return;
    
    try {
        await addTask(user.uid, newTaskTitle, newFrequency);
        setNewTaskTitle('');
        setNewFrequency('once');
        const updated = await getUserTasks(user.uid);
        setTasks(updated);
    } catch (err) {
        console.error("Failed to create task", err);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;

    const today = startOfDay(new Date());
    const isCompletedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);
    const newState = !isCompletedToday;

    // Optimistic UI Update
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
    const confirmedTasks = await getUserTasks(user.uid);
    setTasks(confirmedTasks);
  };

  const handleDeleteTask = async (id: string) => {
    if(!window.confirm("Delete this task?")) return;
    await deleteTask(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Tasks...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Task Workspace</h1>
           <p className="text-gray-500">Manage your daily habits and to-do lists.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {/* Input Form */}
            <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <input 
                    type="text" 
                    placeholder="Add a new habit or task..." 
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                
                <div className="flex gap-2">
                    <select
                        value={newFrequency}
                        onChange={(e) => setNewFrequency(e.target.value as Frequency)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-sm p-2 border"
                    >
                        <option value="once">Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    <button 
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center w-10 sm:w-auto"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </form>

            {/* Full List */}
            <div className="space-y-3">
                {tasks.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No tasks found. Start by adding one above!</p>
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
                                            {task.frequency === 'daily' && <ClockIcon className="h-3 w-3" />}
                                            {task.frequency === 'weekly' && <CalendarDaysIcon className="h-3 w-3" />}
                                            {task.frequency === 'monthly' && <CalendarDaysIcon className="h-3 w-3" />}
                                            <span className="capitalize">{task.frequency}</span>
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
                                        {Math.abs(task.currentStreak)} Streak
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
    </div>
  );
}