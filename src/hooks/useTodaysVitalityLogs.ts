import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

export interface VitalityLog {
    id: string;
    tags: string[];
    createdAt: Timestamp;
}

// Real-time, tag-filtered listener for today's Vitality entries — distinct
// from the generic ['journals', uid] cache owned by Journal.tsx/Dashboard.tsx,
// so it stays a dedicated onSnapshot subscription rather than a useQuery read.
export function useTodaysVitalityLogs(): VitalityLog[] {
    const { user } = useAuth();
    const [todaysLogs, setTodaysLogs] = useState<VitalityLog[]>([]);

    useEffect(() => {
        if (!user || !db) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'journals'),
            where('uid', '==', user.uid),
            where('tags', 'array-contains', 'Vitality'),
            where('createdAt', '>=', Timestamp.fromDate(startOfToday)),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VitalityLog));
            setTodaysLogs(logs);
        });

        return () => unsubscribe();
    }, [user]);

    return todaysLogs;
}
