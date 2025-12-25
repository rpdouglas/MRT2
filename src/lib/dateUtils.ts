// src/lib/dateUtils.ts

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'monthly-relative';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number; // e.g. every 2 days
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc. (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  weekOfMonth?: number; // 1 (1st), 2 (2nd), ... 5 (Last) (for monthly-relative)
  dayOfWeek?: number; // 0-6 (for monthly-relative)
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

    case 'monthly': { // FIX: Added block scope braces
      // Add 1 month, try to keep same day
      const currentDay = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      // Handle edge case (e.g. Jan 31 -> Feb 28/29)
      if (nextDate.getDate() !== currentDay) {
          // If date changed, it means we overflowed (e.g. Feb 28 became Mar 2)
          // Set to 0 (last day of previous month)
          nextDate.setDate(0); 
      }
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
              // FIX: Changed let to const
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