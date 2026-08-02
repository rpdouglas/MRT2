import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import VibrantHeader from '../components/VibrantHeader';
import { WrenchScrewdriverIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { subDays, startOfDay } from 'date-fns';
import { THEME } from '../lib/theme';
import type { Task } from '../lib/tasks';

export default function DebugTools() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    // FIX: Wrapped in useCallback to stabilize the function reference
    const loadTasks = useCallback(async () => {
        if (!user || !db) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'tasks'), where('uid', '==', user.uid));
            const snap = await getDocs(q);
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        } catch (e) {
            console.error("Failed to load tasks", e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // FIX: Added dependency array
    useEffect(() => { loadTasks(); }, [loadTasks]);

    const simulateCompletedYesterday = async (taskId: string) => {
        if (!db) return;
        const yesterday = subDays(startOfDay(new Date()), 1);
        
        setStatus(`Simulating 'Completed Yesterday' for ${taskId}...`);
        await updateDoc(doc(db, 'tasks', taskId), {
            status: 'completed',
            lastCompletedAt: Timestamp.fromDate(yesterday),
            dueDate: Timestamp.fromDate(yesterday),
            currentStreak: 5 
        });
        setStatus('Done. Go to Tasks page to verify Reset.');
        loadTasks();
    };

    const simulateMissedYesterday = async (taskId: string) => {
        if (!db) return;
        const yesterday = subDays(startOfDay(new Date()), 1);
        const twoDaysAgo = subDays(startOfDay(new Date()), 2);

        setStatus(`Simulating 'Missed Yesterday' for ${taskId}...`);
        await updateDoc(doc(db, 'tasks', taskId), {
            status: 'pending',
            lastCompletedAt: Timestamp.fromDate(twoDaysAgo), 
            dueDate: Timestamp.fromDate(yesterday), 
            currentStreak: 5 
        });
        setStatus('Done. Go to Tasks page to verify Punishment.');
        loadTasks();
    };

    return (
        <div className={`min-h-screen ${THEME.profile.page}`}>
            <VibrantHeader 
                title="Time Travel Debugger" 
                subtitle="Verification tools for logic engines." 
                icon={WrenchScrewdriverIcon}
                fromColor="from-slate-700" viaColor="via-slate-800" toColor="to-slate-900"
            />

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm">
                    <strong>⚠️ Dev Mode Only:</strong> These tools directly manipulate Firestore data to simulate time passing. 
                </div>

                {/* FIX: Used the 'loading' variable */}
                {loading && <div className="text-center text-sm text-gray-500 animate-pulse">Refreshing data...</div>}

                {status && (
                    <div className="bg-green-100 text-green-800 p-3 rounded-lg font-mono text-xs animate-pulse">
                        &gt; {status}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Active Tasks</h3>
                        <button onClick={loadTasks} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Refresh task list"><ArrowPathIcon className="h-5 w-5" /></button>
                    </div>
                    {tasks.map(task => (
                        <div key={task.id} className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="font-bold">{task.title}</div>
                                <div className="text-xs text-gray-500 font-mono">
                                    Streak: {task.currentStreak} | Status: {task.status} <br/>
                                    Due: {task.dueDate instanceof Timestamp ? task.dueDate.toDate().toLocaleDateString() : task.dueDate?.toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => task.id && simulateCompletedYesterday(task.id)}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200"
                                >
                                    <ClockIcon className="h-3 w-3 inline mr-1" />
                                    Sim: Done Yest.
                                </button>
                                <button
                                    onClick={() => task.id && simulateMissedYesterday(task.id)}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200"
                                >
                                    <ClockIcon className="h-3 w-3 inline mr-1" />
                                    Sim: Missed
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
