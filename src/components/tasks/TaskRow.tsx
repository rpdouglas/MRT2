import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon as CheckCircleOutline, TrashIcon, PencilSquareIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import type { Task } from '../../lib/tasks';
import { getRecurrenceLabel } from '../../lib/dateUtils';
import { format, isBefore, startOfDay, isSameDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface TaskRowProps {
    task: Task;
    onToggle: (params: {task: Task; isCompleting: boolean}) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
    isLogView?: boolean;
}

const toDate = (val: Date | Timestamp | undefined | null): Date | null => { if (!val) return null; if (val instanceof Timestamp) return val.toDate(); if (val instanceof Date) return val; return null; }

export default function TaskRow({ task, onToggle, onDelete, onEdit, isLogView = false }: TaskRowProps) {
    const navigate = useNavigate();
    const [isContextExpanded, setIsContextExpanded] = useState(false);
    const today = startOfDay(new Date());
    const taskDate = task.dueDate ? startOfDay(toDate(task.dueDate) || new Date()) : null;
    
    const taskLastCompleted = toDate(task.lastCompletedAt);
    const isCompletedToday = taskLastCompleted ? isSameDay(taskLastCompleted, new Date()) : false;
    
    // THE ILLUSION: 
    // If it is permanently completed, it is always checked.
    // If it is recurring and was completed today, it ONLY looks checked in the Log View.
    // In active views, it looks unchecked, representing the next future cycle.
    const isChecked = task.status === 'completed' || (isLogView && isCompletedToday);

    // Strict Overdue: Only if not checked and date is strictly before today
    const isOverdue = !isChecked && taskDate && isBefore(taskDate, today);
    
    const priorityColor = {
        High: 'text-red-600 bg-red-50 border-red-100',
        Medium: 'text-amber-600 bg-amber-50 border-amber-100',
        Low: 'text-slate-500 bg-slate-50 border-slate-100'
    }[task.priority || 'Medium'];

    return (
        <div className={`group flex items-start gap-3 p-3 bg-white border-b border-gray-100 transition-all hover:bg-slate-50 ${isChecked ? 'opacity-60 bg-slate-50' : ''}`}>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onToggle({task, isCompleting: !isChecked}); }}
                className="flex-shrink-0 text-slate-300 hover:text-green-500 transition-colors mt-0.5"
            >
                {isChecked ? (
                    <CheckCircleSolid className="h-6 w-6 text-green-500" />
                ) : (
                    <CheckCircleOutline className="h-6 w-6" />
                )}
            </button>

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start gap-2">
                    <span className={`text-sm font-medium line-clamp-4 break-words leading-snug pt-0.5 ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.title}
                    </span>
                    
                    {task.source === 'ai' && (
                        <SparklesIcon className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-1" title="AI Suggested" />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {!isChecked && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColor}`}>
                            {task.priority || 'Medium'}
                        </span>
                    )}

                    {taskDate && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                            {isOverdue ? 'Overdue' : `Due: ${format(taskDate, 'MMM d')}`}
                            {task.source === 'ai' && !isOverdue && (
                                <span className="bg-purple-50 text-purple-600 border border-purple-100 px-1 py-0.5 rounded-[4px] font-bold" title="Auto-scheduled by AI">
                                    +7 Days
                                </span>
                            )}
                        </span>
                    )}

                    {task.recurrence && task.recurrence.type !== 'once' && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            <ArrowPathIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">{getRecurrenceLabel(task.recurrence)}</span>
                        </div>
                    )}
                </div>

                {/* AI Context Card — only for AI tasks with sourceContext */}
                {task.source === 'ai' && task.sourceContext && (
                    <button
                        onClick={e => { e.stopPropagation(); setIsContextExpanded(v => !v); }}
                        className="mt-1.5 w-full text-left"
                        aria-expanded={isContextExpanded}
                    >
                        {!isContextExpanded ? (
                            <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                                {task.sourceContext}
                            </p>
                        ) : (
                            <div className="bg-purple-50 border border-purple-100 rounded-lg px-2.5 py-2 mt-1">
                                <p className="text-[11px] text-purple-800 leading-relaxed">
                                    {task.sourceContext}
                                </p>
                                {task.sourceRef ? (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (task.sourceRef!.startsWith('workbook:')) {
                                                navigate(`/workbooks/${task.sourceRef!.replace('workbook:', '')}`);
                                            } else {
                                                navigate('/insights');
                                            }
                                        }}
                                        className="mt-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                                    >
                                        See insight →
                                    </button>
                                ) : (
                                    <span className="mt-1 block text-[11px] text-slate-400">
                                        Source no longer available
                                    </span>
                                )}
                            </div>
                        )}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-0.5">
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
