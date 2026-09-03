import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Firestore } from 'firebase/firestore';
import type { Task } from '../lib/tasks';
import { reconcileOverdueTask } from '../lib/tasks';
import { getMockTasks } from '../lib/mockData';

// Real-time listener for the full task list (Today/Later/Log tabs all read
// from this one set). Kept as a dedicated onSnapshot subscription — like
// useTodaysVitalityLogs.ts — rather than a useQuery read, since the Ledger
// needs live cross-tab/cross-device updates, not a one-shot fetch.
export function useTasksList(): { tasks: Task[]; loading: boolean } {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    // TD-25: tracks task IDs with an in-flight reconciliation write so rapid
    // successive snapshots (e.g. the write this very reconciliation makes)
    // don't fire a duplicate reconcile for the same still-overdue task before
    // the first write round-trips back.
    const reconcilingRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;

        if (user.email?.endsWith('.mock')) {
            const mockTasks = getMockTasks(user.email);
            const timer = setTimeout(() => {
                setTasks(mockTasks);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        if (!db) return;
        const database: Firestore = db;

        const q = query(
            collection(database, 'tasks'),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskData = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : d.dueDate,
                    createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt,
                    lastCompletedAt: d.lastCompletedAt?.toDate ? d.lastCompletedAt.toDate() : d.lastCompletedAt
                } as Task;
            });
            setTasks(taskData);
            setLoading(false);

            // TD-25: getUserTasks' tested lazy-eval reconciliation (overdue
            // recurring tasks silently rolled forward with a streak penalty)
            // was never wired into the listener this hook actually uses —
            // fired here instead, fire-and-forget. Any write it makes lands
            // via the next onSnapshot event and is self-terminating: a
            // reconciled task's dueDate becomes today, so it no longer
            // matches the overdue condition on the next pass.
            for (const task of taskData) {
                if (!task.id || reconcilingRef.current.has(task.id)) continue;
                reconcilingRef.current.add(task.id);
                reconcileOverdueTask(task)
                    .catch((e) => console.error('Task reconciliation failed:', e))
                    .finally(() => { if (task.id) reconcilingRef.current.delete(task.id); });
            }
        });

        return () => unsubscribe();
    }, [user]);

    return { tasks, loading };
}
