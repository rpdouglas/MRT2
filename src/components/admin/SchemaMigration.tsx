/**
 * src/components/admin/SchemaMigration.tsx
 * GITHUB COMMENT:
 * [SchemaMigration.tsx]
 * NEW: Database migration tool.
 * PURPOSE: Standardizes legacy 'insights' documents by mapping 'actionableSteps' to 'suggested_actions'.
 */
import { useState } from 'react';
import { db } from '../../lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    writeBatch,
    type Firestore 
} from 'firebase/firestore';
import { 
    CircleStackIcon, 
    ArrowPathIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SchemaMigrationProps {
    uid: string;
}

export default function SchemaMigration({ uid }: SchemaMigrationProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const runMigration = async () => {
        if (!db) return;
        setLoading(true);
        setStatus("Scanning insights collection...");
        
        try {
            const database: Firestore = db;
            const q = query(collection(database, 'insights'), where('uid', '==', uid));
            const snapshot = await getDocs(q);
            
            let updatedCount = 0;
            const batch = writeBatch(database);
            let operationCounter = 0;

            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                
                // CHECK 1: Migration for "actionableSteps" -> "suggested_actions"
                if (data.actionableSteps && !data.suggested_actions) {
                    batch.update(docSnap.ref, { 
                        suggested_actions: data.actionableSteps,
                        migratedAt: new Date()
                    });
                    updatedCount++;
                    operationCounter++;
                }

                // Future schema migrations can be added here
            });

            if (updatedCount === 0) {
                setStatus("Schema is up to date. No migration needed.");
                setLoading(false);
                return;
            }

            if (operationCounter > 0) {
                await batch.commit();
            }

            setStatus(`Successfully migrated ${updatedCount} legacy records to v4.5 schema.`);

        } catch (e) {
            console.error("Migration failed", e);
            setStatus("Migration failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <CircleStackIcon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Schema Migration</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Updates legacy Insight records to match the current database schema (v4.5). Run this if you see missing "Add to Quest" buttons on older logs.
            </p>
            
            {status && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center gap-3 text-blue-800 text-sm font-medium animate-fadeIn">
                    {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                    {status}
                </div>
            )}

            <button 
                onClick={runMigration} 
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95"
            >
                Repair Database Schema
            </button>
        </div>
    );
}