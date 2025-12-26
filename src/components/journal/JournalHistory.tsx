import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { groupItemsByDate } from '../../lib/grouping';
import type { JournalEntry } from './JournalEditor';
import { 
    TrashIcon, 
    PencilSquareIcon, 
    ShieldExclamationIcon,
    ShareIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

interface JournalHistoryProps {
  onEdit: (entry: JournalEntry) => void;
}

// Helper interface to handle Firestore Timestamp vs Date safely without 'any'
interface FirestoreTimestamp {
    toDate: () => Date;
}

export default function JournalHistory({ onEdit }: JournalHistoryProps) {
  const { user } = useAuth();
  const { decrypt } = useEncryption();
  const [searchParams] = useSearchParams();

  // Data State
  const [groupedEntries, setGroupedEntries] = useState<Record<string, JournalEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'journals'), 
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      
      const decryptedData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let content = data.content;

          if (data.isEncrypted) {
             try {
                 content = await decrypt(data.content);
             } catch {
                 content = "[Locked Content]";
             }
          }

          return { 
              id: doc.id, 
              ...data, 
              content,
              // Explicitly convert to Date for easier handling in UI
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          } as JournalEntry;
      }));

      // Apply Search Filter
      const searchTerm = searchParams.get('search')?.toLowerCase();
      const filtered = searchTerm 
        ? decryptedData.filter(e => e.content.toLowerCase().includes(searchTerm))
        : decryptedData;

      setGroupedEntries(groupItemsByDate(filtered));

    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  }, [user, decrypt, searchParams]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'journals', id));
      loadEntries(); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async (entry: JournalEntry) => {
    let dateStr = 'Unknown Date';
    
    // Type-safe check without 'any'
    if (entry.createdAt instanceof Date) {
        dateStr = entry.createdAt.toLocaleDateString();
    } else if (entry.createdAt && typeof (entry.createdAt as unknown as FirestoreTimestamp).toDate === 'function') {
        dateStr = (entry.createdAt as unknown as FirestoreTimestamp).toDate().toLocaleDateString();
    }

    const textToShare = `${dateStr} - My Recovery Toolkit\n\n${entry.content}`;

    // 1. Try Native Share (Mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Journal Entry',
                text: textToShare,
            });
            return;
        } catch (err) {
            console.log('Share dismissed', err);
        }
    }

    // 2. Fallback to Clipboard
    try {
        await navigator.clipboard.writeText(textToShare);
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading History...</div>;

  const dates = Object.keys(groupedEntries);

  if (dates.length === 0) return <div className="text-center py-10 text-gray-400">No entries found.</div>;

  return (
    <div className="space-y-6 pb-20">
        {dates.map(dateHeader => (
            <div key={dateHeader}>
                {/* STICKY DATE HEADER */}
                <div className="sticky top-0 z-10 bg-indigo-200/90 backdrop-blur-sm py-2 px-3 mb-2 rounded-lg border-b border-indigo-300 shadow-sm">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">{dateHeader}</h3>
                </div>

                <div className="space-y-3">
                    {groupedEntries[dateHeader].map(entry => (
                        <div key={entry.id} className="bg-white rounded-xl p-4 shadow-sm border border-indigo-50 relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400">
                                        {/* Runtime Check for Rendering Date - Safe version */}
                                        {entry.createdAt instanceof Date 
                                            ? entry.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                            : (entry.createdAt as unknown as FirestoreTimestamp)?.toDate?.().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    {entry.moodScore && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${entry.moodScore >= 7 ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                            Mood: {entry.moodScore}
                                        </span>
                                    )}
                                    {entry.isEncrypted && <ShieldExclamationIcon className="h-3 w-3 text-green-500" />}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleShare(entry)} 
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="Share or Copy"
                                    >
                                        {copiedId === entry.id ? (
                                            <CheckIcon className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <ShareIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => onEdit(entry)} 
                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                        title="Edit Entry"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(entry.id)} 
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                        title="Delete Entry"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                                {entry.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
}