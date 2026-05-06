import { parseISO, startOfDay, isAfter, isBefore, isSameDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { Task } from './tasks';

// Interface
interface TimeStampedItem {
  createdAt: Timestamp | Date | string | number;
}

// Return Type: Year -> MonthIndex (0-11) -> Array of Items
type NestedGroup<T> = Record<string, Record<number, T[]>>;

/**
 * Groups items by Year -> Month Index.
 * Example: { "2026": { 2: [Entry, Entry] } } // 2 = March
 */
export function groupItemsByYearAndMonth<T extends TimeStampedItem>(items: T[]): NestedGroup<T> {
  const groups: NestedGroup<T> = {};

  items.forEach((item) => {
    let date: Date;

    // Normalize Date
    if (item.createdAt instanceof Timestamp) {
      date = item.createdAt.toDate();
    } else if (item.createdAt instanceof Date) {
      date = item.createdAt;
    } else if (typeof item.createdAt === 'string') {
      date = parseISO(item.createdAt);
    } else {
      date = new Date(item.createdAt);
    }

    const year = date.getFullYear().toString();
    const monthIndex = date.getMonth(); // 0 = Jan, 11 = Dec

    if (!groups[year]) {
      groups[year] = {};
    }

    if (!groups[year][monthIndex]) {
      groups[year][monthIndex] = [];
    }

    groups[year][monthIndex].push(item);
  });

  return groups;
}

// --- Task Tab Filters (PROJ-47) ---

const toTaskDate = (val: Date | Timestamp | undefined | null): Date | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return null;
};

/** All pending tasks due today or earlier (includes overdue). Sorted: overdue oldest-first, then today by priority. */
export function getTodayTasks(tasks: Task[]): Task[] {
  const today = startOfDay(new Date());
  return tasks
    .filter(t => {
      if (t.status === 'completed') return false;
      const due = startOfDay(toTaskDate(t.dueDate) || today);
      return !isAfter(due, today);
    })
    .sort((a, b) => {
      const aDate = startOfDay(toTaskDate(a.dueDate) || new Date());
      const bDate = startOfDay(toTaskDate(b.dueDate) || new Date());
      const aOverdue = isBefore(aDate, today);
      const bOverdue = isBefore(bDate, today);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (aOverdue) return aDate.getTime() - bDate.getTime(); // oldest overdue first
      const pMap: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      return (pMap[b.priority || 'Medium'] ?? 2) - (pMap[a.priority || 'Medium'] ?? 2);
    });
}

/** All pending tasks due after today. Sorted by dueDate ascending. */
export function getLaterTasks(tasks: Task[]): Task[] {
  const today = startOfDay(new Date());
  return tasks
    .filter(t => {
      if (t.status === 'completed') return false;
      const due = startOfDay(toTaskDate(t.dueDate) || today);
      return isAfter(due, today);
    })
    .sort((a, b) => (toTaskDate(a.dueDate)?.getTime() ?? 0) - (toTaskDate(b.dueDate)?.getTime() ?? 0));
}

/** Completed one-time tasks only (recurring completions stay in active tabs). */
export function getLogTasks(tasks: Task[]): Task[] {
  const today = startOfDay(new Date());
  return tasks.filter(t => {
    if (t.status === 'completed') return true;
    const lastDone = toTaskDate(t.lastCompletedAt);
    return !!(lastDone && isSameDay(lastDone, today));
  });
}
