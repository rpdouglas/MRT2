/**
 * src/hooks/useTaskOperations.ts
 * PURPOSE: Centralized hook for Task CRUD with Optimistic UI updates.
 * STACK: React Query v5 + Firebase
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as TaskLib from '../lib/tasks';
import { Timestamp } from 'firebase/firestore';
import { startOfDay, addDays, addWeeks, addMonths } from 'date-fns';
import { calculateNextDueDate } from '../lib/dateUtils';

const toDate = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val as string | number);
}

export function useTaskOperations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['tasks', user?.uid];

    // --- 1. ADD TASK ---
    const addTaskMutation = useMutation({
        mutationFn: async (params: { 
            title: string; 
            recurrence: TaskLib.RecurrenceConfig; 
            priority: TaskLib.Priority; 
            dueDate: Date;
            source?: 'manual' | 'ai';
        }) => {
            if (!user) throw new Error("No user");
            await TaskLib.addTask(
                user.uid, 
                params.title, 
                params.recurrence, 
                params.priority, 
                params.dueDate, 
                params.source
            );
        },
        onMutate: async (newVar) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<TaskLib.Task[]>(queryKey);

            if (previousTasks && user) {
                const optimisticTask: TaskLib.Task = {
                    id: 'temp-' + Date.now(),
                    uid: user.uid,
                    title: newVar.title,
                    frequency: (newVar.recurrence.type as unknown) as TaskLib.Frequency,
                    recurrence: newVar.recurrence,
                    priority: newVar.priority,
                    dueDate: Timestamp.fromDate(newVar.dueDate),
                    createdAt: Timestamp.now(),
                    completed: false,
                    status: 'pending',
                    isRecurring: newVar.recurrence.type !== 'once',
                    currentStreak: 0,
                    lastCompletedAt: null,
                    source: newVar.source || 'manual',
                    category: 'Recovery'
                };
                queryClient.setQueryData(queryKey, [optimisticTask, ...previousTasks]);
            }
            return { previousTasks };
        },
        onError: (_err, _newVar, context) => { if (context?.previousTasks) { queryClient.setQueryData(queryKey, context.previousTasks); }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- 2. TOGGLE TASK ---
    const toggleTaskMutation = useMutation({
        mutationFn: async (params: {task: TaskLib.Task; isCompleting: boolean}) => {
            await TaskLib.toggleTask(params.task, params.isCompleting);
        },
        onMutate: async ({task: targetTask, isCompleting}) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<TaskLib.Task[]>(queryKey);

            if (previousTasks) {
                const today = startOfDay(new Date());
                
                queryClient.setQueryData(queryKey, previousTasks.map(t => {
                    if (t.id === targetTask.id) {
                        let newStreak = t.currentStreak;
                        if (isCompleting) {
                            newStreak = newStreak < 0 ? 1 : newStreak + 1;
                            
                            let nextDue = t.dueDate ? toDate(t.dueDate) : today;
                            if (t.isRecurring && t.recurrence) {
                                const calcDue = calculateNextDueDate(nextDue || today, t.recurrence);
                                if (calcDue) nextDue = calcDue;
                            } else if (t.frequency && t.frequency !== 'once') {
                                if (t.frequency === 'daily') nextDue = addDays(today, 1);
                                else if (t.frequency === 'weekly') nextDue = addWeeks(today, 1);
                                else if (t.frequency === 'monthly') nextDue = addMonths(today, 1);
                            }

                            return {
                                ...t,
                                status: t.isRecurring ? 'pending' : 'completed',
                                currentStreak: newStreak,
                                lastCompletedAt: Timestamp.fromDate(new Date()),
                                ...(t.isRecurring && nextDue && { dueDate: Timestamp.fromDate(nextDue) })
                            };
                        } else {
                            newStreak = Math.max(0, newStreak - 1);
                            return {
                                ...t,
                                status: 'pending',
                                currentStreak: newStreak,
                                lastCompletedAt: null
                            };
                        }
                    }
                    return t;
                }));
            }
            return { previousTasks };
        },
        onError: (_err, _vars, context) => { if (context?.previousTasks) { queryClient.setQueryData(queryKey, context.previousTasks); }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- 3. DELETE TASK ---
    const deleteTaskMutation = useMutation({ mutationFn: async (taskId: string) => { await TaskLib.deleteTask(taskId); },
        onMutate: async (taskId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<TaskLib.Task[]>(queryKey);

            if (previousTasks) {
                queryClient.setQueryData(queryKey, previousTasks.filter(t => t.id !== taskId));
            }
            return { previousTasks };
        },
        onError: (_err, _vars, context) => { if (context?.previousTasks) { queryClient.setQueryData(queryKey, context.previousTasks); }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- 4. UPDATE TASK ---
    const updateTaskMutation = useMutation({
        mutationFn: async (params: { id: string } & Partial<TaskLib.Task>) => {
            const { id, ...updates } = params;
            await TaskLib.updateTask(id, updates);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return {
        addTask: addTaskMutation.mutate,
        toggleTask: toggleTaskMutation.mutate,
        deleteTask: deleteTaskMutation.mutate,
        updateTask: updateTaskMutation.mutate,
        isLoading: addTaskMutation.isPending || toggleTaskMutation.isPending || deleteTaskMutation.isPending
    };
}
