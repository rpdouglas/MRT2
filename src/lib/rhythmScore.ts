import { startOfDay, subDays, isBefore, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { Task } from './db';

function toDate(val: Timestamp | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return null;
}

/**
 * Computes a 0–100 Rhythm Score from the last 14 days of task completion history.
 *
 * More forgiving than a streak: one missed day out of 14 ≈ 93, not zero.
 * Formula: (days with ≥1 recurring task completed in last 14) / 14 × 100.
 */
export function computeRhythmScore(tasks: Task[]): number {
  const today = startOfDay(new Date());
  const windowStart = subDays(today, 13); // inclusive 14-day window

  const completedDays = new Set<string>();

  for (const task of tasks) {
    if (!task.isRecurring) continue;
    if (!task.lastCompletedAt) continue;

    const completedDate = toDate(task.lastCompletedAt);
    if (!completedDate) continue;
    if (isBefore(completedDate, windowStart)) continue;

    completedDays.add(format(startOfDay(completedDate), 'yyyy-MM-dd'));
  }

  return Math.round((completedDays.size / 14) * 100);
}
