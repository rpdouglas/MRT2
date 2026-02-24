import { describe, it, expect } from 'vitest';
import { 
    calculateUserLevel, 
    calculateJournalStats, 
    calculateTaskStats, 
    calculateVitalityStats 
} from '../gamification';
import { Timestamp } from 'firebase/firestore';

// Helper to mock dates easily
const mockDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
};

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
      const tasks: any[] = [
          { status: 'completed', priority: 'High' }, // 50 XP
          { status: 'completed', priority: 'High' }, // 50 XP
      ];
      const result = calculateUserLevel([], tasks, 0, 0);
      expect(result.archetype).toBe('Doer');
      expect(result.totalXP).toBe(100);
    });

    it('should identify the "Monk" archetype for Vitality dominance', () => {
        const journals: any[] = [
            { tags: ['Vitality'], createdAt: mockDate(0) }, // 15 XP
            { tags: ['Vitality'], createdAt: mockDate(0) }  // 15 XP
        ];
        const result = calculateUserLevel(journals, [], 0, 0);
        expect(result.archetype).toBe('Monk');
        expect(result.totalXP).toBe(30);
    });

    it('should apply Clean Day Milestones (500 XP per 30 days)', () => {
        const result = calculateUserLevel([], [], 0, 60); // 2 months
        expect(result.totalXP).toBe(1000);
    });
  });

  describe('calculateJournalStats & Streaks', () => {
    it('should return zeros for empty array', () => {
        const result = calculateJournalStats([]);
        expect(result.totalEntries).toBe(0);
        expect(result.journalStreak).toBe(0);
    });

    it('should calculate streak if posted today', () => {
        const journals: any[] = [
            { createdAt: mockTimestamp(0) }, // Today
            { createdAt: mockTimestamp(1) }, // Yesterday
            { createdAt: mockTimestamp(2) }, // 2 days ago
            { createdAt: mockTimestamp(4) }  // Missed day 3
        ];
        const result = calculateJournalStats(journals);
        expect(result.journalStreak).toBe(3);
    });

    it('should calculate streak if posted yesterday (streak still active)', () => {
        const journals: any[] = [
            { createdAt: mockTimestamp(1) }, // Yesterday
            { createdAt: mockTimestamp(2) }, // 2 days ago
        ];
        const result = calculateJournalStats(journals);
        expect(result.journalStreak).toBe(2);
    });

    it('should break streak if missed yesterday and today', () => {
        const journals: any[] = [
            { createdAt: mockTimestamp(2) }, // 2 days ago
            { createdAt: mockTimestamp(3) }, 
        ];
        const result = calculateJournalStats(journals);
        expect(result.journalStreak).toBe(0);
    });

    it('should calculate average mood', () => {
        const journals: any[] = [
            { moodScore: 10, createdAt: mockTimestamp(0) },
            { moodScore: 5, createdAt: mockTimestamp(1) }
        ];
        const result = calculateJournalStats(journals);
        expect(result.averageMood).toBe(7.5);
    });
  });

  describe('calculateTaskStats', () => {
      it('should calculate completion rate and sum of active streaks', () => {
          const tasks: any[] = [
              { status: 'completed', currentStreak: 5 },
              { status: 'pending', currentStreak: 2 },
              { status: 'pending', currentStreak: 0 } // Broken streak
          ];
          const result = calculateTaskStats(tasks);
          
          // 1 out of 3 completed = ~33%
          expect(result.completionRate).toBe(33);
          
          // 5 + 2 = 7 (Total Habit Fire)
          expect(result.habitFire).toBe(7);
      });
  });
});
