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

export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id?: string;
  uid: string;
  title: string;
  isRecurring: boolean;
  frequency: Frequency;
  priority: Priority; // ADDED
  currentStreak: number;
  lastCompletedAt: Date | null;
  dueDate: Date;
  createdAt: Date;
}

const COLLECTION = 'tasks';

// 1. CREATE
export async function addTask(
  uid: string, 
  title: string, 
  frequency: Frequency, 
  priority: Priority, // ADDED
  startDate: Date // ADDED for Approach 3
) {
  if (!db) throw new Error("Database not initialized");
  
  const isRecurring = frequency !== 'once';
  // Ensure date is start of day to avoid time zone drift
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
    createdAt: Timestamp.now()
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
    // Safely convert Timestamps to Dates
    const task = { 
      id: docSnap.id, 
      ...data,
      dueDate: data.dueDate?.toDate(),
      lastCompletedAt: data.lastCompletedAt?.toDate(),
      createdAt: data.createdAt?.toDate()
    } as Task;

    // --- LAZY EVALUATION LOGIC (Preserved from your code) ---
    // If it's recurring, overdue, and NOT completed today:
    if (task.isRecurring && isBefore(task.dueDate, today)) {
        
        const completedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);
        
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
  if (!db) throw new Error("Database not initialized");
  const taskRef = doc(db, COLLECTION, task.id!);
  const today = startOfDay(new Date());

  if (isCompleted) {
    // MARKING DONE
    let newStreak = task.currentStreak;
    if (newStreak < 0) {
        newStreak = 1; // Bounce back from negative
    } else {
        newStreak += 1;
    }

    // Calculate next due date (Smart Reset Approach)
    // We calculate from TODAY, ensuring users don't get stuck in the past
    let nextDue = task.dueDate;
    if (task.frequency === 'daily') nextDue = addDays(today, 1);
    else if (task.frequency === 'weekly') nextDue = addWeeks(today, 1);
    else if (task.frequency === 'monthly') nextDue = addMonths(today, 1);
    
    // If 'once', we don't change the due date, it just gets marked done.

    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: Timestamp.fromDate(new Date()),
        // Only update due date if recurring
        ...(task.isRecurring && { dueDate: Timestamp.fromDate(nextDue) })
    });

  } else {
    // UNCHECKING (Undo)
    const newStreak = task.currentStreak > 0 ? task.currentStreak - 1 : task.currentStreak;
    
    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: null,
        // If unchecking, we usually want to reset the due date to "Today" or the original due date.
        // For simplicity in recovery, if you uncheck it, it becomes due today.
        dueDate: Timestamp.fromDate(today)
    });
  }
}

// 4. DELETE
export async function deleteTask(id: string) {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, COLLECTION, id));
}

// 5. GET COMPLETED TODAY
export async function getCompletedTasksForToday(uid: string) {
    if (!db) throw new Error("Database not initialized");
    const today = startOfDay(new Date());
    const allTasks = await getUserTasks(uid);
    
    return allTasks.filter(t => 
        t.lastCompletedAt && isSameDay(t.lastCompletedAt, today)
    );
}