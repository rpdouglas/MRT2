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
import { startOfDay, isBefore, addDays, isSameDay } from "date-fns";

export interface Task {
  id?: string;
  uid: string;
  title: string;
  isRecurring: boolean;
  frequency: 'daily'; // Expandable to 'weekly' later
  currentStreak: number;
  lastCompletedAt: Date | null;
  dueDate: Date;
  createdAt: Date;
}

const COLLECTION = 'tasks';

// 1. CREATE
export async function addTask(uid: string, title: string, isRecurring: boolean) {
  if (!db) throw new Error("Database not initialized");
  
  // Default due date is Today (start of day)
  const today = startOfDay(new Date());

  await addDoc(collection(db, COLLECTION), {
    uid,
    title,
    isRecurring,
    frequency: 'daily',
    currentStreak: 0,
    lastCompletedAt: null,
    dueDate: Timestamp.fromDate(today),
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

  // Process tasks and check for missed streaks
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const task = { 
      id: docSnap.id, 
      ...data,
      dueDate: data.dueDate?.toDate(),
      lastCompletedAt: data.lastCompletedAt?.toDate(),
      createdAt: data.createdAt?.toDate()
    } as Task;

    // --- LAZY EVALUATION LOGIC ---
    // If it's recurring, overdue, and NOT completed today:
    // We punish the streak and reset the due date to today so they can try again.
    if (task.isRecurring && isBefore(task.dueDate, today)) {
        
        // Only punish if they didn't actually do it (double safety check)
        const completedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt, today);
        
        if (!completedToday) {
            let newStreak = task.currentStreak;
            
            // If they had a positive streak, break it to 0.
            // If they are already negative/zero, go deeper into negative.
            if (newStreak > 0) {
                newStreak = 0; 
            } else {
                newStreak -= 1;
            }

            // Update DB immediately
            const taskRef = doc(db, COLLECTION, task.id!);
            await updateDoc(taskRef, {
                currentStreak: newStreak,
                dueDate: Timestamp.fromDate(today) // Reset due date to today
            });

            // Update local object for UI
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
    
    // Logic: If streak was negative, reset to 1. If positive, add 1.
    if (newStreak < 0) {
        newStreak = 1;
    } else {
        newStreak += 1;
    }

    // Calculate next due date
    // If recurring, due date becomes Tomorrow. If one-off, it stays as is (completed).
    const nextDue = task.isRecurring ? addDays(today, 1) : task.dueDate;

    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: Timestamp.fromDate(new Date()), // Now
        dueDate: Timestamp.fromDate(nextDue)
    });

  } else {
    // UNCHECKING (Oops, I didn't mean to check it)
    // Revert logic is complex, for simplicity we just decrement streak back
    // and reset dates.
    const newStreak = task.currentStreak > 0 ? task.currentStreak - 1 : task.currentStreak;
    
    await updateDoc(taskRef, {
        currentStreak: newStreak,
        lastCompletedAt: null,
        dueDate: Timestamp.fromDate(today)
    });
  }
}

// 4. DELETE
export async function deleteTask(id: string) {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, COLLECTION, id));
}

// 5. GET COMPLETED TODAY (For Journal Import)
export async function getCompletedTasksForToday(uid: string) {
    if (!db) throw new Error("Database not initialized");
    const today = startOfDay(new Date());
    
    // We fetch all tasks and filter in memory for simplicity 
    // (Firestore date filtering can be tricky with timezone offsets)
    const allTasks = await getUserTasks(uid);
    
    return allTasks.filter(t => 
        t.lastCompletedAt && isSameDay(t.lastCompletedAt, today)
    );
}