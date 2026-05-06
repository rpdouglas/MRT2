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
        arrayUnion: vi.fn((v: unknown) => ({ __arrayUnion: v })),
        Timestamp: MockTimestamp
    };
});

describe('📋 Tasks Engine (Smart Reset & Streaks)', () => { beforeEach(() => { vi.clearAllMocks(); });

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

        it('grace window: task completed at 11:30 PM last night is NOT penalised (within 2-hour window)', async () => {
            const today = new Date();
            today.setHours(0, 10, 0, 0); // Simulated evaluation at 00:10 AM

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // 11:30 PM yesterday — within the 2-hour trailing grace window (10 PM–midnight)
            const lastNight1130pm = new Date(yesterday);
            lastNight1130pm.setHours(23, 30, 0, 0);

            const mockSnapshot = {
                docs: [{
                    id: 'task_grace_pass',
                    data: () => ({
                        uid: 'user_1',
                        title: 'Late Check-In',
                        isRecurring: true,
                        currentStreak: 7,
                        dueDate: firestore.Timestamp.fromDate(yesterday),
                        lastCompletedAt: firestore.Timestamp.fromDate(lastNight1130pm),
                    })
                }]
            };

            vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

            const tasks = await getUserTasks('user_1');

            expect(firestore.updateDoc).not.toHaveBeenCalled();
            expect(tasks[0].currentStreak).toBe(7);
        });

        it('grace window: task completed at 9:45 PM last night IS penalised (outside 2-hour window)', async () => {
            const today = new Date();
            today.setHours(0, 10, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // 9:45 PM yesterday — BEFORE the grace window start (10 PM)
            const lastNight945pm = new Date(yesterday);
            lastNight945pm.setHours(21, 45, 0, 0);

            const mockSnapshot = {
                docs: [{
                    id: 'task_grace_fail',
                    data: () => ({
                        uid: 'user_1',
                        title: 'Evening Meditation',
                        isRecurring: true,
                        currentStreak: 4,
                        dueDate: firestore.Timestamp.fromDate(yesterday),
                        lastCompletedAt: firestore.Timestamp.fromDate(lastNight945pm),
                    })
                }]
            };

            vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

            const tasks = await getUserTasks('user_1');

            expect(firestore.updateDoc).toHaveBeenCalled();
            expect(tasks[0].currentStreak).toBe(0); // Streak from 4 → 0 (first miss)
        });

        it('missedCountHistory: overdue task appends daysMissed via arrayUnion', async () => {
            const today = new Date();
            const threeDaysAgo = new Date(today);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const mockSnapshot = {
                docs: [{
                    id: 'task_miss',
                    data: () => ({
                        uid: 'user_1',
                        title: 'Weekly Run',
                        isRecurring: true,
                        currentStreak: 2,
                        dueDate: firestore.Timestamp.fromDate(threeDaysAgo),
                        lastCompletedAt: null,
                        missedCountHistory: [1],
                    })
                }]
            };

            vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

            await getUserTasks('user_1');

            expect(firestore.arrayUnion).toHaveBeenCalledWith(3);
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({
                    missedCountHistory: expect.objectContaining({ __arrayUnion: 3 }),
                })
            );
        });

        it('missedCountHistory: task due today (not yet overdue) does not append', async () => {
            const today = new Date();

            const mockSnapshot = {
                docs: [{
                    id: 'task_due_today',
                    data: () => ({
                        uid: 'user_1',
                        title: 'Daily Reflection',
                        isRecurring: true,
                        currentStreak: 3,
                        dueDate: firestore.Timestamp.fromDate(today),
                        lastCompletedAt: null,
                        missedCountHistory: [],
                    })
                }]
            };

            vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

            await getUserTasks('user_1');

            // dueDate is today, not strictly before today — lazy eval branch does not fire
            expect(firestore.arrayUnion).not.toHaveBeenCalled();
            expect(firestore.updateDoc).not.toHaveBeenCalled();
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
                    // FIX: Recurring tasks stay pending, their due date just advances
                    status: 'pending' 
                })
            );
        });

        it('should decrement streak when unchecking (undo)', async () => { const mockTask = { id: 'task_4', currentStreak: 5, frequency: 'daily', } as unknown as Task;

            await toggleTask(mockTask, false);
            
            // Verify updateDoc was called with streak = 4
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 4, status: 'pending' })
            );
        });
    });
});
