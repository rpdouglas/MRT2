/**
 * src/hooks/useTaskOperations.ts
 * PURPOSE: Centralized hook for Task CRUD.
 * STACK: React Query v5 + Firebase
 * PROJ-101: migrated onto useFirestoreCrud's useFirestoreMutation primitive
 * (PROJ-59 built this hook's shape from this exact file but never migrated
 * it). useFirestoreMutation gained an optional onSuccess hook (see
 * useFirestoreCrud.ts) specifically so this hook's 'task_created'/
 * 'task_completed' PostHog telemetry survives the migration unchanged.
 *
 * Optimistic-update machinery removed in the same pass (PROJ-101 Phase 3),
 * not preserved: it targeted the ['tasks', uid] TanStack cache key, but
 * Tasks.tsx — the actual page a user watches while completing a task — never
 * reads that key. It renders from useTasksList.ts's own onSnapshot
 * subscription + local useState instead, by deliberate design (live
 * cross-tab/cross-device updates, see that file's own comment) — and
 * Firestore's client SDK already echoes a pending local write into that
 * onSnapshot listener before the server round-trip completes, so the Tasks
 * page was never actually waiting on this hook's now-removed optimistic
 * cache patch for its perceived responsiveness. Migrating useTasksList onto
 * TanStack Query instead (the spec's alternative option) would have touched
 * that live, already-verified real-time path for the same end-user outcome;
 * deleting the dead optimistic layer here was the lower-risk fix for a
 * ticket whose whole premise is "no end-user-facing behavior change."
 */
import { useAuth } from "../contexts/AuthContext";
import * as TaskLib from "../lib/tasks";
import posthog from "posthog-js";
import { useFirestoreMutation } from "./useFirestoreCrud";

export function useTaskOperations() {
  const { user } = useAuth();
  const queryKey = ["tasks", user?.uid];

  // --- 1. ADD TASK ---
  const addTaskMutation = useFirestoreMutation<{
    title: string;
    recurrence: TaskLib.RecurrenceConfig;
    priority: TaskLib.Priority;
    dueDate: Date;
    source?: 'manual' | 'ai';
    aiMeta?: { sourceContext?: string; sourceRef?: string };
  }>(queryKey, {
    mutationFn: async (uid, params) => {
      await TaskLib.addTask(
        uid,
        params.title,
        params.recurrence,
        params.priority,
        params.dueDate,
        params.source,
        params.aiMeta,
      );
    },
    onSuccess: (_data, variables) => {
      posthog.capture('task_created', {
        recurrence: variables.recurrence.type,
        priority: variables.priority,
        source: variables.source || 'manual',
      });
    },
  });

  // --- 2. TOGGLE TASK ---
  const toggleTaskMutation = useFirestoreMutation<{
    task: TaskLib.Task;
    isCompleting: boolean;
  }>(queryKey, {
    mutationFn: async (_uid, params) => {
      await TaskLib.toggleTask(params.task, params.isCompleting);
    },
    onSuccess: (_data, variables) => {
      if (variables.isCompleting) {
        posthog.capture('task_completed', {
          recurrence: variables.task.recurrence?.type,
          priority: variables.task.priority,
          source: variables.task.source || 'manual',
        });
      }
    },
  });

  // --- 3. DELETE TASK ---
  const deleteTaskMutation = useFirestoreMutation<string>(queryKey, {
    mutationFn: async (_uid, taskId) => {
      await TaskLib.deleteTask(taskId);
    },
  });

  // --- 4. UPDATE TASK ---
  const updateTaskMutation = useFirestoreMutation<{ id: string } & Partial<TaskLib.Task>>(queryKey, {
    mutationFn: async (_uid, params) => {
      const { id, ...updates } = params;
      await TaskLib.updateTask(id, updates);
    },
  });

  return {
    addTask: addTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    isLoading:
      addTaskMutation.isPending ||
      toggleTaskMutation.isPending ||
      deleteTaskMutation.isPending,
  };
}
