/**
 * src/components/journal/JournalHistory.tsx
 * GITHUB COMMENT:
 * [JournalHistory.tsx]
 * FEAT: Implemented 2-Level Grouping (Year -> Month).
 * UX: Default state is Current Year + Current Month expanded; all others collapsed.
 */
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useJournalOperations } from '../../hooks/useJournalOperations';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, type Firestore } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { groupItemsByYearAndMonth } from '../../lib/grouping';
import type { JournalEntry } from './JournalEditor';
import JournalAnalysisWizard from './JournalAnalysisWizard';
import { Virtuoso } from 'react-virtuoso';
import { format } from 'date-fns'; 
import { TrashIcon, PencilSquareIcon, ShieldExclamationIcon, ShareIcon, CheckIcon, SparklesIcon, SunIcon, CloudIcon, BoltIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

type JournalEntryWithStatus = JournalEntry & { isError?: boolean };

// Flattened Item Type for Virtuoso (Now has 3 types)
type HistoryItem = 
    | { type: 'header-year'; title: string; count: number } 
    | { type: 'header-month'; title: string; year: string; monthIndex: number; count: number } 
    | { type: 'entry'; data: JournalEntryWithStatus };

interface JournalHistoryProps {
  onEdit: (entry: JournalEntry) => void;
}

// Helper to pick the right weather icon
const WeatherIcon = ({ condition }: { condition: string }) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('storm')) {
        return <BoltIcon className="h-3 w-3 text-blue-500" />;
    }
    if (lower.includes('cloud') || lower.includes('fog') || lower.includes('mist')) {
        return <CloudIcon className="h-3 w-3 text-gray-500" />;
    }
    return <SunIcon className="h-3 w-3 text-orange-500" />;
};

export default function JournalHistory({ onEdit }: JournalHistoryProps) {
  const { user } = useAuth();
  const { decrypt, isVaultUnlocked } = useEncryption();
  const { deleteJournal } = useJournalOperations();
  const [searchParams, setSearchParams] = useSearchParams();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // --- COLLAPSIBILITY STATE ---
  // Default: Current Year is expanded
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => {
      return new Set([new Date().getFullYear().toString()]);
  });

  // Default: Current Month of Current Year is expanded (Format: "YYYY-M")
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => { const now = new Date(); return new Set([`${now.getFullYear()}-${now.getMonth()}`]); });

  // Search Param State
  const searchQuery = searchParams.get('search') || '';

  // --- REACT QUERY FETCH ---
  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['journals', user?.uid, isVaultUnlocked],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(
            collection(database, 'journals'), 
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let content = data.content;
            let isError = false;

            if (data.isEncrypted) {
                try {
                    content = await decrypt(data.content);
                } catch (err) {
                    console.error(`Failed to decrypt entry ${docSnap.id}:`, err);
                    content = "🔒 [Locked - Decryption Failed]";
                    isError = true;
                }
            }

            let createdDate = new Date();
            if (data.createdAt?.toDate) {
                createdDate = data.createdAt.toDate();
            } else if (data.createdAt instanceof Timestamp) {
                createdDate = data.createdAt.toDate();
            }

            return { 
                id: docSnap.id, 
                ...data, 
                content, 
                createdAt: createdDate,
                isError                
            } as unknown as JournalEntryWithStatus;
        }));
    },
    enabled: !!user,
  });

  // --- FILTER ENGINE ---
  const filteredEntries = useMemo(() => {
      if (!searchQuery.trim()) return allEntries;
      const lowerQuery = searchQuery.toLowerCase();
      return allEntries.filter(entry => {
          const textMatch = entry.content?.toLowerCase().includes(lowerQuery);
          const tagMatch = entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
          return textMatch || tagMatch;
      });
  }, [allEntries, searchQuery]);

  // --- 2-LEVEL FLATTENING (The Logic Core) ---
  const flatData = useMemo(() => {
    const grouped = groupItemsByYearAndMonth(filteredEntries);
    const result: HistoryItem[] = [];
    
    // 1. Sort Years Descending (2026, 2025...)
    const sortedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

    sortedYears.forEach(year => {
        const monthsInYear = grouped[year];
        const sortedMonthIndexes = Object.keys(monthsInYear)
            .map(Number)
            .sort((a, b) => b - a); // Dec -> Jan

        // Calculate total count for Year Badge
        const yearTotal = sortedMonthIndexes.reduce((sum, mIndex) => sum + monthsInYear[mIndex].length, 0);

        // A. Push Year Header
        result.push({ type: 'header-year', title: year, count: yearTotal });

        // If Year is Expanded (or Searching), process Months
        if (expandedYears.has(year) || searchQuery) {
            
            sortedMonthIndexes.forEach(monthIndex => {
                const entries = monthsInYear[monthIndex];
                const monthName = format(new Date(Number(year), monthIndex), 'MMMM');
                
                // B. Push Month Header
                result.push({ 
                    type: 'header-month', 
                    title: monthName, 
                    year: year, 
                    monthIndex: monthIndex, 
                    count: entries.length 
                });

                // If Month is Expanded (or Searching), process Entries
                if (expandedMonths.has(`${year}-${monthIndex}`) || searchQuery) {
                    entries.forEach(entry => {
                        // C. Push Entry
                        result.push({ type: 'entry', data: entry as JournalEntryWithStatus });
                    });
                }
            });
        }
    });

    return result;
  }, [filteredEntries, expandedYears, expandedMonths, searchQuery]);

  // --- TOGGLE HANDLERS ---

  const toggleYear = (year: string) => {
      setExpandedYears(prev => {
          const next = new Set(prev);
          if (next.has(year)) next.delete(year);
          else next.add(year);
          return next;
      });
  };

  const toggleMonth = (year: string, monthIndex: number) => {
      const key = `${year}-${monthIndex}`;
      setExpandedMonths(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
      });
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete this entry?')) return; try { await deleteJournal(id); } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async (entry: JournalEntryWithStatus) => {
    const dateStr = entry.createdAt instanceof Date ? entry.createdAt.toLocaleDateString() : 'Unknown Date';
    const textToShare = `${dateStr} - My Recovery Toolkit\n\n${entry.content}\n\nmyrecoverytoolkit.ca`;

    if (navigator.share) {
        try { await navigator.share({ title: 'Journal Entry', text: textToShare }); return; } catch (err) { console.log('Share dismissed', err); }
    }
    try { await navigator.clipboard.writeText(textToShare); setCopiedId(entry.id); setTimeout(() => setCopiedId(null), 2000); } catch (err) { console.error('Failed to copy', err); }
  };

  if (isLoading) return <div className="text-center py-10 text-gray-400">Loading History...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] relative"> 
        
        {/* SEARCH BAR (Sticky at Top) */}
        <div className="shrink-0 mb-4 relative z-20">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-3.5 text-indigo-400" />
            <input 
                type="text" 
                placeholder="Search journal, tags, or feelings..." 
                value={searchQuery}
                onChange={(e) => {
                    setSearchParams(prev => {
                        if (e.target.value) prev.set('search', e.target.value);
                        else prev.delete('search');
                        return prev;
                    }, { replace: true });
                }}
                className="w-full pl-11 pr-10 py-3 bg-white border border-indigo-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-slate-700 placeholder:text-slate-400"
            />
            {searchQuery && (
                <button 
                    onClick={() => setSearchParams(prev => { prev.delete('search'); return prev; }, { replace: true })}
                    className="absolute right-3 top-3 p-1 text-indigo-300 hover:text-indigo-600 bg-indigo-50 rounded-full transition-colors"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            )}
        </div>

        {flatData.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-300 shadow-sm p-6 text-center">
                 <p className="text-gray-500 font-medium">No entries found.</p>
                 {searchQuery && <p className="text-gray-400 text-xs mt-2">Try adjusting your search terms.</p>}
             </div>
        ) : (
            <div className="flex-1 min-h-0 relative">
                <Virtuoso 
                    style={{ height: '100%' }}
                    data={flatData}
                    itemContent={(_index, item) => {
                        
                        // === TYPE 1: YEAR HEADER ===
                        if (item.type === 'header-year') {
                            const isExpanded = expandedYears.has(item.title) || !!searchQuery;
                            return (
                                <div className="mt-4 mb-2">
                                    <button 
                                        onClick={() => toggleYear(item.title)}
                                        disabled={!!searchQuery}
                                        className="w-full flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* Line Decorator */}
                                            <div className="w-1 h-6 bg-slate-800 rounded-full"></div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{item.title}</h2>
                                            {!searchQuery && (
                                                <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {item.count} Entries
                                        </span>
                                    </button>
                                </div>
                            );
                        }

                        // === TYPE 2: MONTH HEADER ===
                        if (item.type === 'header-month') {
                            const isExpanded = expandedMonths.has(`${item.year}-${item.monthIndex}`) || !!searchQuery;
                            return (
                                <button 
                                    onClick={() => toggleMonth(item.year, item.monthIndex)}
                                    disabled={!!searchQuery} 
                                    className={`w-full flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm py-2 px-3 mb-2 ml-2 rounded-lg border shadow-sm transition-colors max-w-[98%] ${isExpanded ? 'bg-indigo-50/95 border-indigo-200' : 'bg-white/95 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {!searchQuery && (isExpanded ? <ChevronDownIcon className="h-3 w-3 text-indigo-500" /> : <ChevronRightIcon className="h-3 w-3 text-gray-400" />)}
                                        <div className="flex items-center gap-2">
                                            <CalendarDaysIcon className={`h-4 w-4 ${isExpanded ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <h3 className={`text-sm font-bold uppercase tracking-wide ${isExpanded ? 'text-indigo-900' : 'text-gray-600'}`}>{item.title}</h3>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isExpanded ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {item.count}
                                    </span>
                                </button>
                            );
                        }

                        // === TYPE 3: ENTRY CARD ===
                        const entry = item.data;
                        return (
                            <div className={`bg-white rounded-xl p-4 mb-3 ml-4 shadow-sm border relative group max-w-[96%] ${entry.isError ? 'border-red-300 bg-red-50' : 'border-indigo-50'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-mono text-gray-400 font-bold">
                                            {/* Day Only (e.g. "12th") since header has Month */}
                                            {entry.createdAt instanceof Date ? format(entry.createdAt, 'do (EEE)') : ''}
                                        </span>
                                        
                                        {/* MOOD BADGE */}
                                        {entry.moodScore && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${entry.moodScore >= 7 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                                Mood: {entry.moodScore}
                                            </span>
                                        )}

                                        {/* WEATHER BADGE */}
                                        {entry.weather && (
                                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                                <WeatherIcon condition={entry.weather.condition} />
                                                {Math.round(entry.weather.temp)}°
                                            </span>
                                        )}

                                        {entry.isEncrypted && <ShieldExclamationIcon className={`h-3 w-3 ${entry.isError ? 'text-red-500' : 'text-emerald-500'}`} />}
                                    </div>
                                    
                                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleShare(entry)} title="Share Entry" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
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
                        );
                    }}
                />
            </div>
        )}

        {/* FLOATING ACTION BUTTON */}
        <button 
            onClick={() => setIsWizardOpen(true)}
            className="fixed bottom-24 right-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white p-4 rounded-full shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-all z-30 flex items-center gap-2 group"
        >
            <SparklesIcon className="h-6 w-6 group-hover:animate-pulse" />
            <span className="hidden group-hover:inline text-sm font-bold pr-1">Analyze</span>
        </button>

        <JournalAnalysisWizard 
            isOpen={isWizardOpen} 
            onClose={() => setIsWizardOpen(false)} 
            entries={allEntries} 
        />
    </div>
  );
}
