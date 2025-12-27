import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { groupItemsByDate } from '../../lib/grouping';
import type { JournalEntry } from './JournalEditor';
import JournalAnalysisWizard from './JournalAnalysisWizard';
import { 
    TrashIcon, 
    PencilSquareIcon, 
    ShieldExclamationIcon,
    ShareIcon,
    CheckIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

// 1. EXTEND THE TYPE LOCALLY
type JournalEntryWithStatus = JournalEntry & { isError?: boolean };

interface JournalHistoryProps {
  onEdit: (entry: JournalEntry) => void;
}

// Helper interface to handle Firestore Timestamp vs Date safely
interface FirestoreTimestamp {
    toDate: () => Date;
}

export default function JournalHistory({ onEdit }: JournalHistoryProps) {
  const { user } = useAuth();
  const { decrypt } = useEncryption();
  const [searchParams] = useSearchParams();

  // 2. UPDATE STATE TYPE
  const [allEntries, setAllEntries] = useState<JournalEntryWithStatus[]>([]); 
  const [groupedEntries, setGroupedEntries] = useState<Record<string, JournalEntryWithStatus[]>>({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'journals'), 
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      
      // FAIL-SAFE DATA LOADING
      const processedData = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let content = data.content;
          let isError = false;

          // 1. Attempt Decryption
          if (data.isEncrypted) {
             try {
                 content = await decrypt(data.content);
             } catch (err) {
                 console.error(`Failed to decrypt entry ${docSnap.id}:`, err);
                 content = "🔒 [Locked - Decryption Failed]";
                 isError = true;
             }
          }

          // 2. Safety check for dates
          let createdDate = new Date();
          try {
              if (data.createdAt?.toDate) {
                  createdDate = data.createdAt.toDate();
              } else if (data.createdAt) {
                  createdDate = new Date(data.createdAt);
              }
          } catch (e) {
              console.warn("Date parse error", e);
          }

          // 3. Construct Object & Cast
          // FIX: Cast to 'unknown' first to bypass strict property checks on raw DB data
          return { 
              id: docSnap.id, 
              ...data,        
              content,        
              createdAt: createdDate,
              isError         
          } as unknown as JournalEntryWithStatus;
      }));

      setAllEntries(processedData);

      // Apply Search Filter
      const searchTerm = searchParams.get('search')?.toLowerCase();
      const filtered = searchTerm 
        ? processedData.filter(e => e.content.toLowerCase().includes(searchTerm))
        : processedData;

      setGroupedEntries(groupItemsByDate(filtered));

    } catch (error) {
      console.error("CRITICAL: Error loading journal history:", error);
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

  const handleShare = async (entry: JournalEntryWithStatus) => {
    let dateStr = 'Unknown Date';
    if (entry.createdAt instanceof Date) {
        dateStr = entry.createdAt.toLocaleDateString();
    } else if (entry.createdAt && typeof (entry.createdAt as unknown as FirestoreTimestamp).toDate === 'function') {
        dateStr = (entry.createdAt as unknown as FirestoreTimestamp).toDate().toLocaleDateString();
    }

    const textToShare = `${dateStr} - My Recovery Toolkit\n\n${entry.content}`;

    if (navigator.share) {
        try { await navigator.share({ title: 'Journal Entry', text: textToShare }); return; } catch (err) { console.log('Share dismissed', err); }
    }

    try {
        await navigator.clipboard.writeText(textToShare);
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 2000);
    } catch (err) { console.error('Failed to copy', err); }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading History...</div>;

  const dates = Object.keys(groupedEntries);

  return (
    <div className="relative min-h-full">
        {dates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                <p className="text-gray-500">No entries found.</p>
            </div>
        ) : (
            <div className="space-y-6 pb-24">
                {dates.map(dateHeader => (
                    <div key={dateHeader}>
                        <div className="sticky top-0 z-10 bg-indigo-200/90 backdrop-blur-sm py-2 px-3 mb-2 rounded-lg border-b border-indigo-300 shadow-sm">
                            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">{dateHeader}</h3>
                        </div>

                        <div className="space-y-3">
                            {groupedEntries[dateHeader].map(entry => (
                                <div key={entry.id} className={`bg-white rounded-xl p-4 shadow-sm border relative group ${entry.isError ? 'border-red-300 bg-red-50' : 'border-indigo-50'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-400">
                                                {entry.createdAt instanceof Date 
                                                    ? entry.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                                    : (entry.createdAt as unknown as FirestoreTimestamp)?.toDate?.().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {entry.moodScore && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${entry.moodScore >= 7 ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                    Mood: {entry.moodScore}
                                                </span>
                                            )}
                                            {/* Show Lock Icon if Encrypted */}
                                            {entry.isEncrypted && <ShieldExclamationIcon className={`h-3 w-3 ${entry.isError ? 'text-red-500' : 'text-emerald-500'}`} />}
                                        </div>
                                        
                                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleShare(entry)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                                                {copiedId === entry.id ? <CheckIcon className="h-4 w-4 text-green-600" /> : <ShareIcon className="h-4 w-4" />}
                                            </button>
                                            <button onClick={() => onEdit(entry)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"><PencilSquareIcon className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                    <p className={`text-sm whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer ${entry.isError ? 'text-red-600 font-mono text-xs' : 'text-gray-800'}`}>
                                        {entry.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* FLOATING ACTION BUTTON (FAB) FOR AI */}
        {allEntries.length > 0 && (
            <button
                onClick={() => setIsWizardOpen(true)}
                className="fixed bottom-24 right-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white p-4 rounded-full shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-all z-30 flex items-center gap-2 group"
            >
                <SparklesIcon className="h-6 w-6 group-hover:animate-pulse" />
                <span className="hidden group-hover:inline text-sm font-bold pr-1">Analyze</span>
            </button>
        )}

        <JournalAnalysisWizard 
            isOpen={isWizardOpen} 
            onClose={() => setIsWizardOpen(false)} 
            entries={allEntries} 
        />
    </div>
  );
}