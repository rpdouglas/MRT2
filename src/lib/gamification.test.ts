import { describe, it, expect } from 'vitest';
import { calculateTaskStats } from './gamification';
import type { Task } from './tasks';

describe('Gamification Logic', () => {
  it('calculates completion rate correctly', () => {
    // We use a mock array cast to Task[] to avoid 'any' and satisfy strict linting
    const mockTasks = [
      { id: '1', completed: true, currentStreak: 0 },
      { id: '2', completed: false, currentStreak: 0 },
      { id: '3', completed: true, currentStreak: 0 },
      { id: '4', completed: true, currentStreak: 0 },
    ] as unknown as Task[]; 

    const result = calculateTaskStats(mockTasks); 
    expect(result.completionRate).toBe(75);
  });

  it('returns 0 for empty task list', () => {
    const result = calculateTaskStats([]);
    expect(result.completionRate).toBe(0);
  });

  it('calculates highest fire streak correctly', () => {
    const mockTasks = [
        { id: '1', completed: true, currentStreak: 5 },
        { id: '2', completed: true, currentStreak: 12 }, 
        { id: '3', completed: false, currentStreak: 0 },
    ] as unknown as Task[];

    const result = calculateTaskStats(mockTasks);
    expect(result.habitFire).toBe(12);
  });
});