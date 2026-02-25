import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserTasks, toggleTask, type Task } from '../tasks';
import * as firestore from 'firebase/firestore';

// Mock Firebase config
vi.mock('../firebase', () => ({
    db: {} 
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    
    // We must mock Timestamp as a Class so `instanceof Timestamp` works in tasks.ts
    class MockTimestamp {
        date: Date;
        constructor(date: Date) { this.date = date; }
        toDate() { return this.date; }
        static fromDate(d: Date) { return new MockTimestamp(d); }
        static now() { return new MockTimestamp(new Date()); }
    }

    return {
        ...actual as Record<string, unknown>,
        collection: vi.fn(),
        addDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        getDocs: vi.fn(),
        doc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        Timestamp: MockTimestamp
    };
});

describe('📋 Tasks Engine (Smart Reset & Streaks)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserTasks - Lazy Evaluation', () => {
        it('should penalize streak and reset due date for missed recurring tasks', async () => {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(today.getDate() - 2);

            // Mock a snapshot containing a task that was due yesterday and not completed today
            const mockSnapshot = {
                docs: [{
                    id: 'task_1',
                    data: () => ({
                        uid: 'user_1',
                        title: 'Morning Meditation',
                        isRecurring: true,
                        frequency: 'daily',
                        currentStreak: 5,
                        dueDate: firestore.Timestamp.fromDate(yesterday), // Missed!
                        lastCompletedAt: firestore.Timestamp.fromDate(twoDaysAgo), 
                    })
                }]
            };

            vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

            const tasks = await getUserTasks('user_1');
            
            // Should have evaluated the missed task
            expect(firestore.updateDoc).toHaveBeenCalled();
            
            const updatedTask = tasks[0];
            // Streak should drop from 5 to 0 (punishment logic)
            expect(updatedTask.currentStreak).toBe(0);
            
            // Due date should be smartly reset to TODAY so they can try again
            const newDue = updatedTask.dueDate as Date;
            expect(newDue.getDate()).toBe(today.getDate());
        });

        it('should NOT penalize if task was completed today', async () => {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const mockSnapshot = {
                docs: [{
                    id: 'task_2',
                    data: () => ({
                        uid: 'user_1',
                        title: 'Drink Water',
                        isRecurring: true,
                        currentStreak: 5,
                        dueDate: firestore.Timestamp.fromDate(yesterday), 
                        lastCompletedAt: firestore.Timestamp.fromDate(today), // Already done today!
                    })
                }]
            };

            vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

            const tasks = await getUserTasks('user_1');
            
            // Should NOT trigger punishment
            expect(firestore.updateDoc).not.toHaveBeenCalled();
            expect(tasks[0].currentStreak).toBe(5);
        });
    });

    describe('toggleTask', () => {
        it('should increment streak when marking as completed', async () => {
            const mockTask = {
                id: 'task_3',
                currentStreak: 3,
                frequency: 'daily',
                isRecurring: true,
                dueDate: new Date()
            } as unknown as Task;

            await toggleTask(mockTask, true);
            
            // Verify updateDoc was called with streak = 4
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined, // doc() mock returns undefined in this setup
                expect.objectContaining({
                    currentStreak: 4,
                    status: 'completed'
                })
            );
        });

        it('should decrement streak when unchecking (undo)', async () => {
            const mockTask = {
                id: 'task_4',
                currentStreak: 5,
                frequency: 'daily',
            } as unknown as Task;

            await toggleTask(mockTask, false);
            
            // Verify updateDoc was called with streak = 4
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({
                    currentStreak: 4,
                    status: 'pending'
                })
            );
        });
    });
});
