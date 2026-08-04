/**
 * src/lib/tasks.ts
 * UPDATED: Re-architected toggleTask and addTask to properly handle RecurrenceConfig.
 */
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { startOfDay, isBefore, addDays, addWeeks, addMonths, subHours, isAfter, differenceInDays } from "date-fns";
import type { Task as TaskInterface } from "./db";
import { type RecurrenceConfig, calculateNextDueDate } from "./dateUtils";

export type Task = TaskInterface;
export type Priority = 'High' | 'Medium' | 'Low';
export type { RecurrenceConfig };

const COLLECTION = 'tasks';

const toDate = (val: unknown): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val as string | number); 
}

// 1. CREATE
export async function addTask(
  uid: string,
  title: string,
  recurrence: RecurrenceConfig,
  priority: Priority,
  startDate: Date,
  source: Task['source'] = 'manual',
  aiMeta?: { sourceContext?: string; sourceRef?: string }
) {
  if (!db) throw new Error("Database not initialized");

  const isRecurring = recurrence.type !== 'once';
  const due = startOfDay(startDate);

  const recurrenceToStore: RecurrenceConfig = { ...recurrence };
  if (recurrence.type === 'monthly') {
    recurrenceToStore.originalDayOfMonth = startDate.getDate();
  }

  await addDoc(collection(db, COLLECTION), {
    uid,
    title,
    isRecurring,
    frequency: recurrenceToStore.type, // Backwards compatibility
    recurrence: recurrenceToStore,
    priority,
    currentStreak: 0,
    lastCompletedAt: null,
    dueDate: Timestamp.fromDate(due),
    createdAt: Timestamp.now(),
    source,
    ...(aiMeta?.sourceContext && { sourceContext: aiMeta.sourceContext }),
    ...(aiMeta?.sourceRef && { sourceRef: aiMeta.sourceRef }),
  });
}

// 2. READ & LAZY EVALUATE
export async function getUserTasks(uid: string) {
  if (!db) throw new Error("Database not initialized");

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);
  const tasks: Task[] = [];
  const today = startOfDay(new Date());
  const GRACE_WINDOW_HOURS = 2;
  const graceWindowStart = subHours(today, GRACE_WINDOW_HOURS);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    const task: Task = { 
      id: docSnap.id, 
      uid: data.uid,
      title: data.title,
      completed: data.completed || false, 
      status: data.status || 'pending',
      isRecurring: data.isRecurring || false,
      frequency: data.frequency || 'once',
      recurrence: data.recurrence, // Rehydrate config
      currentStreak: data.currentStreak || 0,
      priority: data.priority || 'Medium',
      dueDate: toDate(data.dueDate),
      lastCompletedAt: toDate(data.lastCompletedAt) || null,
      createdAt: toDate(data.createdAt) || new Date(),
      source: data.source || 'manual',
      missedCountHistory: data.missedCountHistory ?? undefined,
    };

    if (task.isRecurring && task.dueDate && isBefore(task.dueDate as Date, today)) {
        // Grace window: completions within 2 hours before midnight count for "today"
        // Protects David's late-night sessions from silent streak resets
        const completedInWindow = task.lastCompletedAt &&
          isAfter(task.lastCompletedAt as Date, graceWindowStart);

        if (!completedInWindow) {
            let newStreak = task.currentStreak;

            if (newStreak > 0) {
                newStreak = 0;
            } else {
                newStreak -= 1;
            }

            const daysMissed = differenceInDays(today, startOfDay(task.dueDate as Date));
            const taskRef = doc(db, COLLECTION, task.id!);
            await updateDoc(taskRef, {
              currentStreak: newStreak,
              dueDate: Timestamp.fromDate(today),
              missedCountHistory: arrayUnion(daysMissed),
            });

            task.currentStreak = newStreak;
            task.dueDate = today;
            task.missedCountHistory = [...(task.missedCountHistory ?? []), daysMissed];
        }
    }

    tasks.push(task);
  }

  return tasks;
}

// 3. TOGGLE COMPLETION (The Lifecycle Fix)
export async function toggleTask(task: Task, isCompleting: boolean) {
  if (!db || !task.id) throw new Error("Database not initialized or Task ID missing");
  const taskRef = doc(db, COLLECTION, task.id);
  const today = startOfDay(new Date());

  if (isCompleting) {
    const newStreak = task.currentStreak < 0 ? 1 : task.currentStreak + 1;
    const currentDue = toDate(task.dueDate) || today;
    let nextDue = currentDue;

    // Use full recurrence logic if available, else fallback to legacy frequency
    if (task.isRecurring && task.recurrence) {
        const baseDate = isBefore(currentDue, today) ? today : currentDue;
        const calculatedNext = calculateNextDueDate(baseDate, task.recurrence);
        if (calculatedNext) nextDue = calculatedNext;
    } else if (task.frequency && task.frequency !== 'once') {
        if (task.frequency === 'daily') nextDue = addDays(today, 1);
        else if (task.frequency === 'weekly') nextDue = addWeeks(today, 1);
        else if (task.frequency === 'monthly') nextDue = addMonths(today, 1);
    }
    
    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: Timestamp.now(),
        status: task.isRecurring ? 'pending' : 'completed',
        ...(task.isRecurring && { dueDate: Timestamp.fromDate(nextDue) })
    });

  } else {
    // Unchecking (Undo)
    const newStreak = Math.max(0, task.currentStreak - 1);
    
    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: null,
        status: 'pending',
        dueDate: Timestamp.fromDate(today)
    });
  }
}

// 4. DELETE
export async function deleteTask(id: string) { if (!db) throw new Error("Database not initialized"); await deleteDoc(doc(db, COLLECTION, id)); }

// 5. UPDATE
export async function updateTask(id: string, updates: Partial<Task>) { if (!db) throw new Error("Database not initialized"); await updateDoc(doc(db, COLLECTION, id), updates); }
