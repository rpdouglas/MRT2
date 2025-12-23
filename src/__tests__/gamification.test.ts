import { describe, it, expect } from 'vitest';
import { calculateJournalStats, calculateWorkbookStats } from '../lib/gamification';
import type { JournalEntry } from '../components/journal/JournalEditor';
import { Timestamp } from 'firebase/firestore';

// Helper to create mock entries relative to "Today"
const createEntry = (daysAgo: number): JournalEntry => ({
  id: `test-${daysAgo}`,
  uid: 'test-user',
  content: 'Mock content',
  moodScore: 5,
  tags: [],
  createdAt: Timestamp.fromDate(new Date(Date.now() - daysAgo * 86400000)),
  updatedAt: Timestamp.now()
} as JournalEntry);

describe('Gamification Engine', () => {
  
  describe('Journal Stats', () => {
    it('calculates current streak correctly for consecutive days', () => {
      // Entry today (0), yesterday (1), and day before (2)
      const entries = [createEntry(0), createEntry(1), createEntry(2)];
      const stats = calculateJournalStats(entries);
      expect(stats.journalStreak).toBe(3);
    });

    it('resets streak if yesterday is missed', () => {
      // Entry today (0) and day before yesterday (2). Missed day 1.
      const entries = [createEntry(0), createEntry(2)];
      const stats = calculateJournalStats(entries);
      expect(stats.journalStreak).toBe(1); // Should only count the active streak
    });

    it('handles empty entries gracefully', () => {
      const stats = calculateJournalStats([]);
      expect(stats.journalStreak).toBe(0);
      expect(stats.consistencyRate).toBe(0);
    });

    it('calculates weekly consistency rate', () => {
      // 3 entries in the last 7 days
      const entries = [createEntry(0), createEntry(2), createEntry(5)];
      const stats = calculateJournalStats(entries);
      expect(stats.consistencyRate).toBe(3);
    });
  });

  describe('Workbook Stats', () => {
    it('calculates completion percentage correctly', () => {
      const totalQs = 100;
      const answered = 50;
      const stats = calculateWorkbookStats(answered, totalQs);
      expect(stats.masterCompletion).toBe(50);
    });

    it('caps completion at 100%', () => {
      const stats = calculateWorkbookStats(105, 100); // More answers than questions?
      expect(stats.masterCompletion).toBe(100);
    });

    it('calculates wisdom score (10 points per answer)', () => {
      const stats = calculateWorkbookStats(5, 100);
      expect(stats.wisdomScore).toBe(50);
    });
  });
});