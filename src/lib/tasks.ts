/**
 * src/lib/tasks.ts
 * UPDATED: Fixed Type safety for Date/Timestamp mix.
 */
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { startOfDay, isBefore, addDays, addWeeks, addMonths, isSameDay } from "date-fns";
import type { Task as TaskInterface } from "./db";

// Re-export the interface for convenience
export type Task = TaskInterface;
export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type Priority = 'High' | 'Medium' | 'Low';

const COLLECTION = 'tasks';

// Helper: Ensure we always have a Date object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDate = (val: any): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val); // Last resort for strings
}

// 1. CREATE
export async function addTask(
  uid: string, 
  title: string, 
  frequency: Frequency, 
  priority: Priority, 
  startDate: Date,
  source: 'manual' | 'ai' = 'manual'
) {
  if (!db) throw new Error("Database not initialized");
  
  const isRecurring = frequency !== 'once';
  const due = startOfDay(startDate);

  await addDoc(collection(db, COLLECTION), {
    uid,
    title,
    isRecurring,
    frequency,
    priority,
    currentStreak: 0,
    lastCompletedAt: null,
    dueDate: Timestamp.fromDate(due),
    createdAt: Timestamp.now(),
    source
  });
}

// 2. READ & LAZY EVALUATE STREAKS
export async function getUserTasks(uid: string) {
  if (!db) throw new Error("Database not initialized");

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);
  const tasks: Task[] = [];
  const today = startOfDay(new Date());

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Explicitly construct with conversions to avoid TS errors
    const task: Task = { 
      id: docSnap.id, 
      uid: data.uid,
      title: data.title,
      completed: data.completed || false, // Default if missing
      status: data.status || 'pending',
      isRecurring: data.isRecurring || false,
      frequency: data.frequency || 'once',
      currentStreak: data.currentStreak || 0,
      priority: data.priority || 'Medium',
      dueDate: toDate(data.dueDate),
      lastCompletedAt: toDate(data.lastCompletedAt) || null,
      createdAt: toDate(data.createdAt) || new Date(),
      source: data.source || 'manual'
    };

    // --- LAZY EVALUATION LOGIC ---
    // Fix: Explicitly cast to Date because we normalized it above with toDate()
    if (task.isRecurring && task.dueDate && isBefore(task.dueDate as Date, today)) {
        
        const completedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt as Date, today);
        
        if (!completedToday) {
            let newStreak = task.currentStreak;
            
            // Punishment Logic
            if (newStreak > 0) {
                newStreak = 0; // Break positive streak
            } else {
                newStreak -= 1; // Deepen negative streak
            }

            // Reset due date to Today so they can get back on track (Smart Reset)
            const taskRef = doc(db, COLLECTION, task.id!);
            await updateDoc(taskRef, {
                currentStreak: newStreak,
                dueDate: Timestamp.fromDate(today)
            });

            task.currentStreak = newStreak;
            task.dueDate = today; 
        }
    }

    tasks.push(task);
  }

  return tasks;
}

// 3. TOGGLE COMPLETION
export async function toggleTask(task: Task, isCompleted: boolean) {
  if (!db || !task.id) throw new Error("Database not initialized or Task ID missing");
  const taskRef = doc(db, COLLECTION, task.id);
  const today = startOfDay(new Date());

  if (isCompleted) {
    // MARKING DONE
    let newStreak = task.currentStreak;
    if (newStreak < 0) {
        newStreak = 1; // Bounce back from negative
    } else {
        newStreak += 1;
    }

    const currentDue = toDate(task.dueDate) || today;
    let nextDue = currentDue;

    if (task.frequency === 'daily') nextDue = addDays(today, 1);
    else if (task.frequency === 'weekly') nextDue = addWeeks(today, 1);
    else if (task.frequency === 'monthly') nextDue = addMonths(today, 1);
    
    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: Timestamp.fromDate(new Date()),
        status: 'completed',
        // Only update due date if recurring
        ...(task.isRecurring && { dueDate: Timestamp.fromDate(nextDue) })
    });

  } else {
    // UNCHECKING (Undo)
    const newStreak = task.currentStreak > 0 ? task.currentStreak - 1 : task.currentStreak;
    
    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: null,
        status: 'pending',
        dueDate: Timestamp.fromDate(today)
    });
  }
}

// 4. DELETE
export async function deleteTask(id: string) {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, COLLECTION, id));
}

// 5. UPDATE (Generic)
export async function updateTask(id: string, updates: Partial<Task>) {
  if (!db) throw new Error("Database not initialized");
  await updateDoc(doc(db, COLLECTION, id), updates);
}

// 6. GET COMPLETED TODAY
export async function getCompletedTasksForToday(uid: string) {
    if (!db) throw new Error("Database not initialized");
    const today = startOfDay(new Date());
    const allTasks = await getUserTasks(uid);
    
    // Safety check with toDate helper
    return allTasks.filter(t => {
        const d = toDate(t.lastCompletedAt);
        return d && isSameDay(d, today);
    });
}
