import { describe, it, expect } from 'vitest';
import { groupItemsByYearAndMonth, getTodayTasks, getLaterTasks, getLogTasks } from '../grouping';
import { Timestamp } from 'firebase/firestore';
import type { Task } from '../tasks';

describe('grouping.ts', () => {
    describe('groupItemsByYearAndMonth', () => {
        it('correctly sorts an array of Timestamp objects', () => {
            const items = [
                { id: 1, createdAt: Timestamp.fromDate(new Date('2026-03-15T00:00:00Z')) },
                { id: 2, createdAt: Timestamp.fromDate(new Date('2026-03-20T00:00:00Z')) },
                { id: 3, createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')) },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(2); // March is index 2
            expect(grouped['2025'][11]).toHaveLength(1); // December is index 11
        });

        it('correctly sorts an array of Date objects', () => {
            const items = [
                { id: 1, createdAt: new Date('2026-03-15T00:00:00Z') },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(1);
        });

        it('correctly sorts an array of string dates', () => {
            const items = [
                { id: 1, createdAt: '2026-03-15T00:00:00Z' },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(1);
        });

        it('correctly sorts an array of numeric timestamps', () => {
            const items = [
                { id: 1, createdAt: new Date('2026-03-15T00:00:00Z').getTime() },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(1);
        });
    });
});

// --- Tab Filter Tests ---

function makeTask(overrides: Partial<Task>): Task {
    return {
        uid: 'u1', title: 'Test', completed: false, status: 'pending',
        isRecurring: false, frequency: 'once', currentStreak: 0,
        priority: 'Medium', createdAt: new Date(), dueDate: new Date(),
        lastCompletedAt: null, source: 'manual',
        ...overrides,
    };
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

describe('getTodayTasks', () => {
    it('includes a task due today', () => {
        const tasks = [makeTask({ dueDate: today })];
        expect(getTodayTasks(tasks)).toHaveLength(1);
    });

    it('includes an overdue task (due yesterday)', () => {
        const tasks = [makeTask({ dueDate: yesterday })];
        expect(getTodayTasks(tasks)).toHaveLength(1);
    });

    it('excludes a task due tomorrow', () => {
        const tasks = [makeTask({ dueDate: tomorrow })];
        expect(getTodayTasks(tasks)).toHaveLength(0);
    });

    it('excludes a completed one-time task', () => {
        const tasks = [makeTask({ dueDate: today, status: 'completed' })];
        expect(getTodayTasks(tasks)).toHaveLength(0);
    });

    it('includes an AI task due today', () => {
        const tasks = [makeTask({ dueDate: today, source: 'ai' })];
        expect(getTodayTasks(tasks)).toHaveLength(1);
    });

    it('sorts overdue tasks before today tasks', () => {
        const todayTask = makeTask({ dueDate: today, title: 'Today' });
        const overdueTask = makeTask({ dueDate: yesterday, title: 'Overdue' });
        const result = getTodayTasks([todayTask, overdueTask]);
        expect(result[0].title).toBe('Overdue');
        expect(result[1].title).toBe('Today');
    });
});

describe('getLaterTasks', () => {
    it('includes a task due tomorrow', () => {
        const tasks = [makeTask({ dueDate: tomorrow })];
        expect(getLaterTasks(tasks)).toHaveLength(1);
    });

    it('excludes an overdue task', () => {
        const tasks = [makeTask({ dueDate: yesterday })];
        expect(getLaterTasks(tasks)).toHaveLength(0);
    });

    it('excludes a task due today', () => {
        const tasks = [makeTask({ dueDate: today })];
        expect(getLaterTasks(tasks)).toHaveLength(0);
    });

    it('includes an AI task due next week', () => {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const tasks = [makeTask({ dueDate: nextWeek, source: 'ai' })];
        expect(getLaterTasks(tasks)).toHaveLength(1);
    });
});

describe('getLogTasks', () => {
    it('includes a completed one-time task', () => {
        const tasks = [makeTask({ status: 'completed', isRecurring: false })];
        expect(getLogTasks(tasks)).toHaveLength(1);
    });

    it('includes a recurring task completed today', () => {
        const tasks = [makeTask({ isRecurring: true, status: 'pending', lastCompletedAt: new Date() })];
        expect(getLogTasks(tasks)).toHaveLength(1);
    });

    it('excludes a pending task', () => {
        const tasks = [makeTask({ dueDate: today, status: 'pending', lastCompletedAt: null })];
        expect(getLogTasks(tasks)).toHaveLength(0);
    });
});
