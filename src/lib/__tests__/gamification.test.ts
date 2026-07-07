import { describe, it, expect } from 'vitest';
import { calculateUserLevel, calculateJournalStats, calculateTaskStats } from '../gamification';
import { Timestamp } from 'firebase/firestore';

// Helper to mock dates easily
const mockDate = (daysAgo: number) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d; };

// Helper to mock Timestamp
const mockTimestamp = (daysAgo: number) => {
    return Timestamp.fromDate(mockDate(daysAgo));
};

describe('🎮 Gamification Engine', () => {
  describe('calculateUserLevel & Archetypes', () => {
    it('should calculate level 1 for zero XP', () => {
      const result = calculateUserLevel([], [], 0, 0);
      expect(result.levelData.level).toBe(1);
      expect(result.totalXP).toBe(0);
      expect(result.archetype).toBe('Balanced');
    });

    it('should identify the "Scholar" archetype based on workbook dominance', () => {
      // 100 questions = 1500 XP in Wisdom
      const result = calculateUserLevel([], [], 100, 0);
      expect(result.archetype).toBe('Scholar');
      expect(result.totalXP).toBe(1500);
      expect(result.levelData.level).toBeGreaterThan(1);
    });

    it('should identify the "Doer" archetype based on task dominance', () => {
      const tasks = [
          { status: 'completed', priority: 'High' }, 
          { status: 'completed', priority: 'High' }, 
      ] as unknown as Parameters<typeof calculateTaskStats>[0];
      const result = calculateUserLevel([], tasks, 0, 0);
      expect(result.archetype).toBe('Doer');
      expect(result.totalXP).toBe(100);
    });

    it('should identify the "Monk" archetype for Vitality dominance', () => {
        const journals = [
            { tags: ['Vitality'], createdAt: mockDate(0) }, 
            { tags: ['Vitality'], createdAt: mockDate(0) }  
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateUserLevel(journals, [], 0, 0);
        expect(result.archetype).toBe('Monk');
        expect(result.totalXP).toBe(30);
    });

    it('should apply Clean Day Milestones (500 XP per 30 days)', () => {
        const result = calculateUserLevel([], [], 0, 60); // 2 months
        expect(result.totalXP).toBe(1000);
    });

    it('should award 25 XP for a completed SMART Tool entry (Medium-priority equivalent, not TASK_HIGH)', () => {
        const journals = [
            { tags: ['SMART Tool', 'ABC'], createdAt: mockDate(0) },
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateUserLevel(journals, [], 0, 0);
        expect(result.totalXP).toBe(25);
        expect(result.totalXP).not.toBe(50); // not TASK_HIGH, despite PROJ-50 spec's parenthetical
    });

    it('should award 0 XP for a DRAFT-tagged (incomplete) SMART Tool entry', () => {
        const journals = [
            { tags: ['SMART Tool', 'ABC', 'DRAFT'], createdAt: mockDate(0) },
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateUserLevel(journals, [], 0, 0);
        expect(result.totalXP).toBe(0);
    });
  });

  describe('calculateJournalStats & Streaks', () => {
    it('should return zeros for empty array', () => {
        const result = calculateJournalStats([]);
        expect(result.totalEntries).toBe(0);
        expect(result.journalStreak).toBe(0);
    });

    it('should calculate streak if posted today', () => {
        const journals = [
            { createdAt: mockTimestamp(0) }, // Today
            { createdAt: mockTimestamp(1) }, // Yesterday
            { createdAt: mockTimestamp(2) }, // 2 days ago
            { createdAt: mockTimestamp(4) }  // Missed day 3
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateJournalStats(journals);
        expect(result.journalStreak).toBe(3);
    });

    it('should calculate streak if posted yesterday (streak still active)', () => {
        const journals = [
            { createdAt: mockTimestamp(1) }, // Yesterday
            { createdAt: mockTimestamp(2) }, // 2 days ago
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateJournalStats(journals);
        expect(result.journalStreak).toBe(2);
    });

    it('should break streak if missed yesterday and today', () => {
        const journals = [
            { createdAt: mockTimestamp(2) }, // 2 days ago
            { createdAt: mockTimestamp(3) }, 
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateJournalStats(journals);
        expect(result.journalStreak).toBe(0);
    });

    it('should calculate average mood', () => {
        const journals = [
            { moodScore: 10, createdAt: mockTimestamp(0) },
            { moodScore: 5, createdAt: mockTimestamp(1) }
        ] as unknown as Parameters<typeof calculateJournalStats>[0];
        const result = calculateJournalStats(journals);
        expect(result.averageMood).toBe(7.5);
    });
  });

  describe('calculateTaskStats', () => {
      it('should calculate completion rate and sum of active streaks', () => {
          const tasks = [
              { status: 'completed', currentStreak: 5 },
              { status: 'pending', currentStreak: 2 },
              { status: 'pending', currentStreak: 0 } // Broken streak
          ] as unknown as Parameters<typeof calculateTaskStats>[0];
          const result = calculateTaskStats(tasks);
          
          // 1 out of 3 completed = ~33%
          expect(result.completionRate).toBe(33);
          
          // 5 + 2 = 7 (Total Habit Fire)
          expect(result.habitFire).toBe(7);
      });
  });
});
