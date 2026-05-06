// src/lib/dateUtils.ts
import { addMonths, addYears, differenceInDays, differenceInMonths, differenceInYears, startOfDay } from 'date-fns';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'monthly-relative';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number; // e.g. every 2 days
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc. (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  weekOfMonth?: number; // 1 (1st), 2 (2nd), ... 5 (Last) (for monthly-relative)
  dayOfWeek?: number; // 0-6 (for monthly-relative)
  originalDayOfMonth?: number; // Stores intended day for monthly tasks (e.g. 31) so short months don't cause permanent drift
}

export interface SobrietyDuration { years: number; months: number; days: number; totalDays: number; }

/**
 * Calculates the breakdown of time since a sobriety date.
 * Returns accurate Years, Months, and remaining Days.
 */
export function calculateSobrietyDuration(startDate: Date): SobrietyDuration {
    const now = startOfDay(new Date());
    const start = startOfDay(startDate);

    // Prevent negative calculations if date is in future
    if (start > now) {
        return { years: 0, months: 0, days: 0, totalDays: 0 };
    }

    const totalDays = differenceInDays(now, start);
    const years = differenceInYears(now, start);
    
    const dateAfterYears = addYears(start, years);
    const months = differenceInMonths(now, dateAfterYears);
    
    const dateAfterMonths = addMonths(dateAfterYears, months);
    const days = differenceInDays(now, dateAfterMonths);

    return { years, months, days, totalDays };
}

/**
 * Calculates the next due date based on a reference date (usually today or the completed date)
 * and the recurrence configuration.
 */
export function calculateNextDueDate(baseDate: Date, config: RecurrenceConfig): Date | null {
  if (config.type === 'once') return null;

  const nextDate = new Date(baseDate);
  nextDate.setHours(23, 59, 59, 999); // Normalize time

  switch (config.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + (config.interval || 1));
      break;

    case 'weekly':
      // Simple weekly: Add 7 days
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;

    case 'monthly': {
      // Use originalDayOfMonth to remember the intended day across short months.
      // e.g. Jan 31 → Feb 28 (clamped) → Mar 31 (restored). Without it, drift was permanent.
      const targetDay = config.originalDayOfMonth ?? nextDate.getDate();
      nextDate.setDate(1); // Move to 1st before incrementing to prevent JS month overflow
      nextDate.setMonth(nextDate.getMonth() + 1);
      const daysInNewMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(targetDay, daysInNewMonth));
      break;
    }

    case 'monthly-relative':
      // e.g. "Last Thursday of the month"
      if (config.weekOfMonth !== undefined && config.dayOfWeek !== undefined) {
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(1); // Start at 1st of next month

          const targetDay = config.dayOfWeek; // 0-6
          const targetWeek = config.weekOfMonth; // 1-5 (5 = Last)

          if (targetWeek === 5) {
              // Logic for "Last X of month"
              nextDate.setMonth(nextDate.getMonth() + 1);
              nextDate.setDate(0); // Last day of target month
              
              const lastDayOfWeek = nextDate.getDay();
              const diff = lastDayOfWeek - targetDay;
              const subtractDays = diff >= 0 ? diff : diff + 7;
              nextDate.setDate(nextDate.getDate() - subtractDays);
          } else {
              // Logic for "Nth X of month"
              const currentDow = nextDate.getDay();
              const daysToAdd = (targetDay - currentDow + 7) % 7;
              nextDate.setDate(nextDate.getDate() + daysToAdd);
              
              // Add weeks
              nextDate.setDate(nextDate.getDate() + (targetWeek - 1) * 7);
          }
      }
      break;
  }

  return nextDate;
}

/**
 * Returns a human-readable string for the recurrence rule.
 */
export function getRecurrenceLabel(config: RecurrenceConfig): string {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const ordinals = ['','1st','2nd','3rd','4th','Last'];

    switch(config.type) {
        case 'once': return 'One-time';
        case 'daily': return 'Daily';
        case 'weekly': return 'Weekly';
        case 'biweekly': return 'Bi-Weekly';
        case 'monthly': return 'Monthly';
        case 'monthly-relative': 
            if(config.weekOfMonth && config.dayOfWeek !== undefined) {
                return `${ordinals[config.weekOfMonth]} ${days[config.dayOfWeek]} of Month`;
            }
            return 'Custom Monthly';
        default: return 'Recurring';
    }
}

