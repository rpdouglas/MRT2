import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Adjust path if necessary based on your alias
import { useAuth } from '../contexts/AuthContext'; // Adjust path
import type { JournalEntry, Task } from '../lib/db'; // Explicit type import for verbatimModuleSyntax

/**
 * 🚀 PROJ-19: Dashboard Load Speed Optimization
 * Approach B: Bounded Queries. 
 * This hook restricts payload size by only fetching data from the last 30 days.
 */
export function useDashboardData() {
    const { user } = useAuth(); // Changed from currentUser to user to match AuthContextType

    return useQuery({
        queryKey: ['dashboardData', user?.uid],
        // Stale time set to 5 minutes to prevent aggressive refetching on tab focus
        staleTime: 1000 * 60 * 5, 
        queryFn: async () => {
            if (!user) throw new Error("No authenticated user");
            if (!db) throw new Error("Firestore instance is undefined"); // Type guard for db

            // Define the 30-day boundary
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const boundaryTimestamp = Timestamp.fromDate(thirtyDaysAgo);

            // 1. Fetch Bounded Journals
            const journalsRef = collection(db, 'journals');
            const journalsQ = query(
                journalsRef,
                where('uid', '==', user.uid),
                where('createdAt', '>=', boundaryTimestamp),
                orderBy('createdAt', 'desc')
            );

            // 2. Fetch Bounded Tasks
            const tasksRef = collection(db, 'tasks');
            const tasksQ = query(
                tasksRef,
                where('uid', '==', user.uid),
                where('dueDate', '>=', boundaryTimestamp),
                orderBy('dueDate', 'asc')
            );

            // Execute concurrently
            const [journalSnap, taskSnap] = await Promise.all([
                getDocs(journalsQ),
                getDocs(tasksQ)
            ]);

            // Normalization: Convert Firestore Timestamps to JS Dates strictly
            const recentJournals = journalSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                } as unknown as JournalEntry;
            });

            const recentTasks = taskSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                } as unknown as Task;
            });

            return {
                recentJournals,
                recentTasks,
                // Pass these bounded arrays to your gamification engine
                activeStreak: calculateBoundedStreak(recentTasks), 
            };
        },
        enabled: !!user?.uid,
    });
}

// Minimal helper to calculate streak from bounded tasks to prevent UI thread locking
function calculateBoundedStreak(tasks: Task[]): number {
    if (!tasks.length) return 0;
    // Implementation relies on your src/lib/gamification.ts logic
    // but safely operates only on the bounded array in memory.
    const completedTasks = tasks.filter(t => t.status === 'completed');
    return completedTasks.length; // Placeholder for actual gamification logic
}
