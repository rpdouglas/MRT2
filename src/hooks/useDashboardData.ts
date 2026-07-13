import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { JournalEntry, Task } from '../lib/db';
import { getMockTasks, getMockJournals } from '../lib/mockData';

export function useDashboardData() {
    const { user } = useAuth(); 

    return useQuery({
        queryKey: ['dashboardData', user?.uid],
        staleTime: 1000 * 60 * 5, 
        queryFn: async () => {
            if (!user) throw new Error("No authenticated user");
            
            if (user.email?.endsWith('.mock')) {
                const mockTasks = getMockTasks(user.email);
                const mockJournals = getMockJournals(user.email);
                return {
                    recentJournals: mockJournals,
                    recentTasks: mockTasks,
                    activeStreak: calculateBoundedStreak(mockTasks),
                };
            }

            if (!db) throw new Error("Firestore instance is undefined");

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const boundaryTimestamp = Timestamp.fromDate(thirtyDaysAgo);

            const journalsRef = collection(db, 'journals');
            const journalsQ = query(journalsRef, where('uid', '==', user.uid), where('createdAt', '>=', boundaryTimestamp), orderBy('createdAt', 'desc'));

            const tasksRef = collection(db, 'tasks');
            const tasksQ = query(tasksRef, where('uid', '==', user.uid), where('dueDate', '>=', boundaryTimestamp), orderBy('dueDate', 'asc'));

            const [journalSnap, taskSnap] = await Promise.all([getDocs(journalsQ), getDocs(tasksQ)]);

            const recentJournals = journalSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data, id: doc.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                } as unknown as JournalEntry;
            });

            const recentTasks = taskSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data, id: doc.id,
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                } as unknown as Task;
            });

            return {
                recentJournals, recentTasks,
                activeStreak: calculateBoundedStreak(recentTasks), 
            };
        },
        enabled: !!user?.uid,
    });
}

function calculateBoundedStreak(tasks: Task[]): number {
    if (!tasks.length) return 0;
    return tasks.filter(t => t.status === 'completed').length;
}
