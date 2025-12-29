// src/components/tasks/TaskFormModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import type { RecurrenceConfig, RecurrenceType } from '../../lib/dateUtils';
import { Timestamp } from 'firebase/firestore';

// Define explicit union types locally to avoid 'any' casting
type CategoryType = 'Recovery' | 'Health' | 'Life' | 'Work';
type PriorityType = 'High' | 'Medium' | 'Low';

export interface TaskFormData {
  id?: string;
  title: string;
  category: CategoryType;
  priority: PriorityType;
  recurrence: RecurrenceConfig;
  dueDate: string; // YYYY-MM-DD format for input
}

// Interface for the raw task data coming in (looser than FormData)
interface IncomingTask {
    id: string;
    title: string;
    category: CategoryType;
    priority: PriorityType;
    dueDate: Timestamp | Date | null;
    recurrence?: RecurrenceConfig;
    frequency?: string; // Legacy support
}

interface TaskFormModalProps {
  isOpen: boolean;
  // FIX: Replaced 'any' with specific type
  initialTask: IncomingTask | null; 
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
}

export default function TaskFormModal({ isOpen, initialTask, onClose, onSave }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Recovery');
  const [priority, setPriority] = useState<PriorityType>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Recurrence State
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('once');
  const [relWeek, setRelWeek] = useState(1); // 1-5 (5=Last)
  const [relDay, setRelDay] = useState(5); // 0-6 (5=Fri)

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
        if (initialTask) {
            setTitle(initialTask.title);
            setCategory(initialTask.category);
            setPriority(initialTask.priority);
            
            // Date Handling
            let dateStr = '';
            if (initialTask.dueDate) {
                 const d = initialTask.dueDate instanceof Date 
                    ? initialTask.dueDate 
                    : (initialTask.dueDate as Timestamp).toDate();
                 dateStr = d.toISOString().split('T')[0];
            }
            setDueDate(dateStr);

            // Recurrence Handling
            if (initialTask.recurrence) {
                setRecurrenceType(initialTask.recurrence.type);
                if (initialTask.recurrence.weekOfMonth) setRelWeek(initialTask.recurrence.weekOfMonth);
                if (initialTask.recurrence.dayOfWeek !== undefined) setRelDay(initialTask.recurrence.dayOfWeek);
            } else {
                // Fallback for old data
                setRecurrenceType(
                    (initialTask.frequency === 'once' || !initialTask.frequency) 
                    ? 'once' 
                    : initialTask.frequency as RecurrenceType
                );
            }

        } else {
            // Reset for new task
            setTitle('');
            setCategory('Recovery');
            setPriority('Medium');
            setDueDate(new Date().toISOString().split('T')[0]);
            setRecurrenceType('once');
            setRelWeek(1);
            setRelDay(5);
        }
    }
  }, [isOpen, initialTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
        const config: RecurrenceConfig = {
            type: recurrenceType
        };

        if (recurrenceType === 'monthly-relative') {
            config.weekOfMonth = relWeek;
            config.dayOfWeek = relDay;
        }

        await onSave({
            id: initialTask?.id,
            title,
            category,
            priority,
            dueDate,
            recurrence: config
        });
        onClose();
    } catch (error) {
        console.error("Failed to save task", error);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
        <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slideUp sm:animate-fadeIn overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    {initialTask ? 'Edit Quest' : 'New Quest'}
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* TITLE */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Quest Title</label>
                    <input
                        type="text"
                        placeholder="e.g., Call Sponsor, Gym, Meditate..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-3"
                        autoFocus={!initialTask}
                    />
                </div>

                {/* CATEGORY & PRIORITY */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                        <select 
                            value={category}
                            // FIX: Replaced 'any' with specific Union Type cast
                            onChange={(e) => setCategory(e.target.value as CategoryType)}
                            className="w-full rounded-xl border-gray-300 text-sm py-2.5"
                        >
                            <option value="Recovery">Recovery</option>
                            <option value="Health">Health</option>
                            <option value="Life">Life</option>
                            <option value="Work">Work</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Priority</label>
                        <select 
                            value={priority}
                            // FIX: Replaced 'any' with specific Union Type cast
                            onChange={(e) => setPriority(e.target.value as PriorityType)}
                            className="w-full rounded-xl border-gray-300 text-sm py-2.5"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                {/* RECURRENCE SECTION */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                        <ArrowPathIcon className="h-4 w-4" />
                        Repetition Rules
                    </div>
                    
                    <select 
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                        className="w-full rounded-lg border-gray-300 text-sm"
                    >
                        <option value="once">One-time Quest</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly (Every 2 weeks)</option>
                        <option value="monthly">Monthly (Same date)</option>
                        <option value="monthly-relative">Monthly (Relative day)</option>
                    </select>

                    {/* Conditional: Monthly Relative Options */}
                    {recurrenceType === 'monthly-relative' && (
                        <div className="flex gap-2 animate-fadeIn">
                             <select 
                                value={relWeek} 
                                onChange={(e) => setRelWeek(Number(e.target.value))}
                                className="flex-1 rounded-lg border-gray-300 text-sm"
                             >
                                <option value={1}>1st</option>
                                <option value={2}>2nd</option>
                                <option value={3}>3rd</option>
                                <option value={4}>4th</option>
                                <option value={5}>Last</option>
                             </select>
                             <select 
                                value={relDay} 
                                onChange={(e) => setRelDay(Number(e.target.value))}
                                className="flex-1 rounded-lg border-gray-300 text-sm"
                             >
                                <option value={0}>Sunday</option>
                                <option value={1}>Monday</option>
                                <option value={2}>Tuesday</option>
                                <option value={3}>Wednesday</option>
                                <option value={4}>Thursday</option>
                                <option value={5}>Friday</option>
                                <option value={6}>Saturday</option>
                             </select>
                             <span className="self-center text-sm text-gray-500">of month</span>
                        </div>
                    )}
                </div>

                {/* DUE DATE */}
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Due Date</label>
                     <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input 
                            type="date" 
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full pl-10 rounded-xl border-gray-300 text-sm py-2.5" 
                        />
                     </div>
                </div>

                <button
                    type="submit"
                    disabled={!title.trim() || loading}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : initialTask ? 'Update Quest' : 'Accept Quest'}
                </button>
            </form>
        </div>
    </div>
  );
}