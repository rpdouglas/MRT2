import { 
    CheckCircleIcon as CheckCircleOutline, 
    TrashIcon, 
    PencilSquareIcon,
    ArrowPathIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import type { Task } from '../../lib/tasks';
import { getRecurrenceLabel } from '../../lib/dateUtils';
import { format, isBefore, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface TaskRowProps {
    task: Task;
    onToggle: (task: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
}

// Helper to ensure we treat timestamps as dates
const toDate = (val: Date | Timestamp | undefined | null): Date | null => {
    if (!val) return null;
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return null;
}

export default function TaskRow({ task, onToggle, onDelete, onEdit }: TaskRowProps) {
    const isCompleted = task.status === 'completed';
    const dueDate = toDate(task.dueDate);
    const isOverdue = !isCompleted && dueDate && isBefore(dueDate, startOfDay(new Date()));
    
    // Priority Colors
    const priorityColor = {
        High: 'text-red-600 bg-red-50 border-red-100',
        Medium: 'text-amber-600 bg-amber-50 border-amber-100',
        Low: 'text-slate-500 bg-slate-50 border-slate-100'
    }[task.priority || 'Medium']; // Default Medium if missing

    return (
        <div className={`group flex items-center gap-3 p-3 bg-white border-b border-gray-100 transition-all hover:bg-slate-50 ${isCompleted ? 'opacity-60 bg-slate-50' : ''}`}>
            
            {/* CHECKBOX */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggle(task); }}
                className="flex-shrink-0 text-slate-300 hover:text-green-500 transition-colors"
            >
                {isCompleted ? (
                    <CheckCircleSolid className="h-6 w-6 text-green-500" />
                ) : (
                    <CheckCircleOutline className="h-6 w-6" />
                )}
            </button>

            {/* CONTENT */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.title}
                    </span>
                    
                    {/* Source Badge (AI) */}
                    {task.source === 'ai' && (
                        <SparklesIcon className="h-3 w-3 text-purple-400" title="AI Suggested" />
                    )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                    {/* Priority Badge */}
                    {!isCompleted && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColor}`}>
                            {task.priority || 'Medium'}
                        </span>
                    )}

                    {/* Date Badge */}
                    {dueDate && (
                        <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                            {isOverdue ? 'Overdue' : format(dueDate, 'MMM d')}
                        </span>
                    )}

                    {/* Recurring Badge */}
                    {task.recurrence && task.recurrence.type !== 'once' && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            <ArrowPathIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">{getRecurrenceLabel(task.recurrence)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTIONS (Desktop Hover / Mobile Always) */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onEdit(task)} 
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                    title="Edit"
                >
                    <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button 
                    onClick={() => onDelete(task.id!)} 
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Delete"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
