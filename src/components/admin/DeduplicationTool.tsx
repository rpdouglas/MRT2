/**
 * src/components/admin/DeduplicationTool.tsx
 * GITHUB COMMENT:
 * [DeduplicationTool.tsx]
 * REFACTOR: Extracted journal maintenance logic.
 * PURPOSE: Scans and removes duplicate journal entries caused by multiple imports.
 */
import { useState } from 'react';
import { db } from '../../lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    writeBatch, 
    doc,
    type Firestore 
} from 'firebase/firestore';
import { 
    DocumentDuplicateIcon, 
    ArrowPathIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DeduplicationToolProps {
    uid: string;
}

export default function DeduplicationTool({ uid }: DeduplicationToolProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const runDeduplication = async () => {
        if (!db) return;
        if (!confirm("This will permanently delete duplicate journal entries. Continue?")) return;
    
        setLoading(true);
        setStatus("Scanning for duplicates...");
        const database: Firestore = db;
    
        try {
          const q = query(collection(database, 'journals'), where('uid', '==', uid));
          const snapshot = await getDocs(q);
          
          const seen = new Map<string, string>(); // key: content+timestamp, value: docId
          const duplicates: string[] = [];
    
          snapshot.docs.forEach(d => {
            const data = d.data();
            const content = data.content as string;
            // Handle Timestamp vs Date objects defensively
            const time = data.createdAt?.toMillis?.() || (data.createdAt instanceof Date ? data.createdAt.getTime() : 0);
            const key = `${content.trim()}_${time}`;
    
            if (seen.has(key)) {
              duplicates.push(d.id);
            } else {
              seen.set(key, d.id);
            }
          });
    
          if (duplicates.length === 0) {
            setStatus("No duplicates found.");
            setLoading(false);
            return;
          }
    
          setStatus(`Found ${duplicates.length} duplicates. Deleting in batches...`);
    
          // Firestore Batch limit is 500
          let batch = writeBatch(database);
          let count = 0;
    
          for (const id of duplicates) {
            batch.delete(doc(database, 'journals', id));
            count++;
            if (count >= 400) {
              await batch.commit();
              batch = writeBatch(database);
              count = 0;
            }
          }
          
          if (count > 0) await batch.commit();
    
          setStatus(`Success! Removed ${duplicates.length} duplicate entries.`);
        } catch (e) {
          console.error(e);
          setStatus("Error running deduplication.");
        } finally {
          setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <DocumentDuplicateIcon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Journal Deduplicator</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Scans your journals for entries with identical content and timestamps created by multiple imports. Keeps the original and removes clones.
            </p>
            
            {status && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center gap-3 text-blue-800 text-sm font-medium animate-fadeIn">
                    {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                    {status}
                </div>
            )}

            <button 
                onClick={runDeduplication} 
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95"
            >
                Run Clean Up
            </button>
        </div>
    );
}