/**
 * src/hooks/useTaskOperations.ts
 * PURPOSE: Centralized hook for Task CRUD with Optimistic UI updates.
 * STACK: React Query v5 + Firebase
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as TaskLib from '../lib/tasks';
import { Timestamp } from 'firebase/firestore';

export function useTaskOperations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['tasks', user?.uid];

    // --- 1. ADD TASK ---
    const addTaskMutation = useMutation({
        mutationFn: async (params: { 
            title: string; 
            frequency: TaskLib.Frequency; 
            priority: TaskLib.Priority; 
            dueDate: Date;
            source?: 'manual' | 'ai';
        }) => {
            if (!user) throw new Error("No user");
            await TaskLib.addTask(
                user.uid, 
                params.title, 
                params.frequency, 
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
                    frequency: newVar.frequency,
                    priority: newVar.priority,
                    dueDate: Timestamp.fromDate(newVar.dueDate),
                    createdAt: Timestamp.now(),
                    completed: false,
                    status: 'pending',
                    isRecurring: newVar.frequency !== 'once',
                    currentStreak: 0,
                    lastCompletedAt: null,
                    source: newVar.source || 'manual',
                    category: 'Recovery' // Default for optimistic
                };
                queryClient.setQueryData(queryKey, [optimisticTask, ...previousTasks]);
            }

            return { previousTasks };
        },
        onError: (_err, _newVar, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(queryKey, context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- 2. TOGGLE TASK ---
    const toggleTaskMutation = useMutation({
        mutationFn: async (task: TaskLib.Task) => {
            const isCompleted = task.status !== 'completed';
            await TaskLib.toggleTask(task, isCompleted);
        },
        onMutate: async (targetTask) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<TaskLib.Task[]>(queryKey);

            if (previousTasks) {
                const isNowCompleted = targetTask.status !== 'completed';
                
                queryClient.setQueryData(queryKey, previousTasks.map(t => {
                    if (t.id === targetTask.id) {
                        return {
                            ...t,
                            status: isNowCompleted ? 'completed' : 'pending',
                            // Optimistic Streak Update
                            currentStreak: isNowCompleted 
                                ? (t.currentStreak < 0 ? 1 : t.currentStreak + 1)
                                : (t.currentStreak > 0 ? t.currentStreak - 1 : t.currentStreak)
                        };
                    }
                    return t;
                }));
            }

            return { previousTasks };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(queryKey, context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- 3. DELETE TASK ---
    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            await TaskLib.deleteTask(taskId);
        },
        onMutate: async (taskId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<TaskLib.Task[]>(queryKey);

            if (previousTasks) {
                queryClient.setQueryData(queryKey, previousTasks.filter(t => t.id !== taskId));
            }

            return { previousTasks };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(queryKey, context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- 4. UPDATE TASK ---
    // FIX: Replaced 'any' with Partial<TaskLib.Task> to satisfy ESLint
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