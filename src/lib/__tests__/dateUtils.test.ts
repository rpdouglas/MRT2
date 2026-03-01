import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateSobrietyDuration, calculateNextDueDate, getRecurrenceLabel, type RecurrenceConfig } from '../dateUtils';
import { subDays, subMonths, subYears, startOfDay } from 'date-fns';

describe('📅 DateUtils Engine', () => {
  
  // SRE FIX: Lock system time to avoid commutative math errors 
  // when tests run on month boundaries (like March 1st or Leap Years).
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('calculateSobrietyDuration', () => {
    it('should calculate 0 for future dates to prevent negative time', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = calculateSobrietyDuration(tomorrow);
      expect(result).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
    });

    it('should calculate exactly 1 year', () => {
      const today = startOfDay(new Date());
      const oneYearAgo = subYears(today, 1);
      
      const result = calculateSobrietyDuration(oneYearAgo);
      expect(result.years).toBe(1);
      expect(result.months).toBe(0);
      expect(result.days).toBe(0);
      expect(result.totalDays).toBeGreaterThanOrEqual(365); 
    });

    it('should calculate complex durations (1y, 2m, 15d)', () => {
      const today = startOfDay(new Date());
      let pastDate = subYears(today, 1);
      pastDate = subMonths(pastDate, 2);
      pastDate = subDays(pastDate, 15);
      
      const result = calculateSobrietyDuration(pastDate);
      expect(result.years).toBe(1);
      expect(result.months).toBe(2);
      expect(result.days).toBe(15);
    });
  });

  describe('calculateNextDueDate', () => {
    const baseDate = new Date('2026-01-01T12:00:00Z'); // Thursday

    it('should return null for "once" recurrence', () => {
      const config: RecurrenceConfig = { type: 'once' };
      expect(calculateNextDueDate(baseDate, config)).toBeNull();
    });

    it('should add exactly 1 day for "daily" without interval', () => {
      const config: RecurrenceConfig = { type: 'daily' };
      const nextDate = calculateNextDueDate(baseDate, config);
      expect(nextDate?.getDate()).toBe(2);
      expect(nextDate?.getHours()).toBe(23); // Should normalize to end of day
    });

    it('should add specific interval for "daily" (e.g. every 3 days)', () => {
      const config: RecurrenceConfig = { type: 'daily', interval: 3 };
      const nextDate = calculateNextDueDate(baseDate, config);
      expect(nextDate?.getDate()).toBe(4);
    });

    it('should add exactly 7 days for "weekly"', () => {
      const config: RecurrenceConfig = { type: 'weekly' };
      const nextDate = calculateNextDueDate(baseDate, config);
      expect(nextDate?.getDate()).toBe(8);
    });

    it('should add exactly 14 days for "biweekly"', () => {
      const config: RecurrenceConfig = { type: 'biweekly' };
      const nextDate = calculateNextDueDate(baseDate, config);
      expect(nextDate?.getDate()).toBe(15);
    });

    it('should handle "monthly" overflow correctly (Jan 31 -> Feb 28)', () => {
      const endOfJan = new Date('2026-01-31T12:00:00Z');
      const config: RecurrenceConfig = { type: 'monthly' };
      const nextDate = calculateNextDueDate(endOfJan, config);
      // 2026 is not a leap year, so Feb has 28 days
      expect(nextDate?.getMonth()).toBe(1); // Feb (0-indexed)
      expect(nextDate?.getDate()).toBe(28);
    });
  });

  describe('getRecurrenceLabel', () => {
    it('should return simple string for standard types', () => {
      expect(getRecurrenceLabel({ type: 'daily' })).toBe('Daily');
      expect(getRecurrenceLabel({ type: 'biweekly' })).toBe('Bi-Weekly');
    });

    it('should return formatted string for relative monthly', () => {
      // 1st Monday
      expect(getRecurrenceLabel({ type: 'monthly-relative', weekOfMonth: 1, dayOfWeek: 1 })).toBe('1st Mon of Month');
      // Last Friday
      expect(getRecurrenceLabel({ type: 'monthly-relative', weekOfMonth: 5, dayOfWeek: 5 })).toBe('Last Fri of Month');
    });
  });
});
