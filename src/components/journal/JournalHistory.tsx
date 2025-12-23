import { useState, useEffect, Fragment, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // NEW
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { 
    TrashIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    SparklesIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ShareIcon,
    ShieldExclamationIcon,
    TrophyIcon,
    WrenchScrewdriverIcon,
    LightBulbIcon,
    PlusCircleIcon,
    CheckCircleIcon,
    BookmarkIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { analyzeJournalEntries, type AnalysisResult } from '../../lib/gemini';
import { addTask } from '../../lib/tasks';
import { saveInsight } from '../../lib/insights';
import type { JournalEntry } from './JournalEditor';

interface JournalHistoryProps {
  onEdit: (entry: JournalEntry) => void;
}

export default function JournalHistory({ onEdit }: JournalHistoryProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams(); // NEW

  // Data State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  // Initialize searchQuery from URL param if present
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterTag, setFilterTag] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<AnalysisResult | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [savingInsight, setSavingInsight] = useState(false);
  
  // Track which AI suggestions have been added to tasks
  const [addedTools, setAddedTools] = useState<Set<string>>(new Set());

  // --- DATA LOADING ---
  const loadEntries = useCallback(async () => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'journals'), 
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
      setEntries(data);
      // We don't setFilteredEntries here immediately because the useEffect below handles it based on filters
      
      // Extract unique tags
      const tags = new Set<string>();
      data.forEach(e => e.tags?.forEach(t => tags.add(t)));
      setAvailableTags(Array.from(tags));

    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial Load
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Listen for URL param changes to update search (e.g. clicking word cloud)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
        setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Client-Side Filtering
  useEffect(() => {
    let result = entries;

    // 1. Keyword Search
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        result = result.filter(e => e.content.toLowerCase().includes(lowerQ));
    }

    // 2. Tag Filter
    if (filterTag) {
        result = result.filter(e => e.tags?.includes(filterTag));
    }

    // 3. Date Range
    if (dateFrom) {
        const from = new Date(dateFrom);
        result = result.filter(e => e.createdAt?.toDate() >= from);
    }
    if (dateTo) {
        // Set 'To' date to end of day
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        result = result.filter(e => e.createdAt?.toDate() <= to);
    }

    setFilteredEntries(result);
  }, [entries, searchQuery, filterTag, dateFrom, dateTo]);

  // Sync Search Query back to URL (optional, keeps URL clean if user types)
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val) {
        setSearchParams(prev => {
            prev.set('search', val);
            return prev;
        });
    } else {
        setSearchParams(prev => {
            prev.delete('search');
            return prev;
        });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteDoc(doc(db, 'journals', id));
      await loadEntries(); // Reload to refresh list
    } catch (error) {
      console.error(error);
    }
  };

  // --- SHARE HANDLER ---
  const handleShare = async (entry: JournalEntry) => {
    const dateStr = entry.createdAt?.toDate ? 
      entry.createdAt.toDate().toLocaleDateString() : 'Unknown Date';
    
    // Construct text with signature
    const signature = "\n\nShared from My Recovery Toolkit";
    const textToShare = `Journal Entry - ${dateStr}\n\n${entry.content}${signature}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Journal Entry ${dateStr}`,
                text: textToShare,
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(textToShare);
            alert('Journal entry copied to clipboard! (Signature included)'); 
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
  };

  const handleAiAnalysis = async () => {
    if (filteredEntries.length === 0) return;

    setAnalyzing(true);
    setShowInsightModal(true);
    setAddedTools(new Set()); 
    setSavingInsight(false);
    
    // Analyze filtered results (up to 10 to avoid token limits)
    const textsToAnalyze = filteredEntries.slice(0, 10).map(e => e.content);
    const result = await analyzeJournalEntries(textsToAnalyze);
    
    setInsight(result);
    setAnalyzing(false);
  };

  const handleSaveLog = async () => {
    if (!user || !insight) return;
    setSavingInsight(true);
    try {
        await saveInsight(user.uid, { type: 'journal', ...insight });
        alert("Insight saved to Wisdom Log!");
        setSavingInsight(false);
    } catch (error) {
        console.error("Failed to save log", error);
        setSavingInsight(false);
    }
  };

  const handleAddToTasks = async (toolSuggestion: string) => {
    if (!user) return;

    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        await addTask(
            user.uid,
            toolSuggestion,
            'once',      // Frequency
            'Medium',    // Priority
            dueDate      // Due Date
        );
        setAddedTools(prev => new Set(prev).add(toolSuggestion));
    } catch (error) {
        console.error("Failed to add task from suggestion:", error);
        alert("Could not add task. Please try again.");
    }
  };

  const clearFilters = () => {
      setSearchQuery('');
      setSearchParams(prev => { prev.delete('search'); return prev; }); // Clear URL param
      setFilterTag('');
      setDateFrom('');
      setDateTo('');
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading history...</div>;

  return (
    <div className="space-y-6">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div className="relative flex-1 w-full sm:w-auto">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Search keywords..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
             </div>
             
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                 >
                    <FunnelIcon className="h-4 w-4" />
                    Filters
                 </button>
                 
                 <button 
                    onClick={handleAiAnalysis}
                    disabled={analyzing || filteredEntries.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                 >
                    {analyzing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                    <span className="font-medium text-sm">Analyze Selection</span>
                 </button>
             </div>
          </div>

          {showFilters && (
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Tag</label>
                      <select 
                        value={filterTag} 
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md"
                      >
                          <option value="">All Tags</option>
                          {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                      <input 
                        type="date" 
                        value={dateFrom} 
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                      <input 
                        type="date" 
                        value={dateTo} 
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md"
                      />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                      <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                          <XMarkIcon className="h-3 w-3" /> Clear Filters
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* --- RESULTS INFO --- */}
      <div className="flex justify-between items-center px-2">
          <p className="text-sm text-gray-500">
             Showing {filteredEntries.length} entries 
             {(searchQuery || filterTag || dateFrom) && <span className="text-gray-400"> (Filtered)</span>}
          </p>
      </div>

      {/* --- ENTRIES LIST --- */}
      {filteredEntries.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No entries match your filters.</p>
          </div>
      ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all group overflow-hidden">
              
              {/* --- HEADER ROW (Stacked Meta) --- */}
              <div className="bg-blue-50/50 p-3 border-b border-gray-100 flex flex-nowrap justify-between items-center gap-2">
                
                {/* Left: Stacked Meta */}
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-bold text-gray-800 truncate">
                        {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                    </span>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span>
                            {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}
                        </span>
                        
                        {entry.weather && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="bg-white/80 px-1.5 py-0.5 rounded-md border border-gray-200 whitespace-nowrap">
                                    {entry.weather.condition}, {entry.weather.temp}°C
                                </span>
                            </>
                        )}
                    </div>

                    {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                             {entry.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-[10px] bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                      {tag}
                                  </span>
                             ))}
                             {entry.tags.length > 3 && (
                                 <span className="text-[10px] text-gray-400 pl-1">+{entry.tags.length - 3}</span>
                             )}
                        </div>
                    )}
                </div>

                {/* Right: Mood & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-center">
                   
                    <div className="flex items-center gap-1.5 bg-white/60 px-1.5 py-0.5 rounded-lg border border-blue-100/50 shadow-sm whitespace-nowrap">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Mood</span>
                        <div className={`h-2 w-2 rounded-full ${entry.moodScore >= 7 ? 'bg-green-500' : entry.moodScore <= 4 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-bold text-gray-700">{entry.moodScore}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => onEdit(entry)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition-colors" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                       </button>
                       <button onClick={() => handleShare(entry)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-white rounded-full transition-colors" title="Share">
                          <ShareIcon className="h-4 w-4" />
                       </button>
                       <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-full transition-colors" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                       </button>
                    </div>
                </div>

              </div>

              {/* BODY CONTENT */}
              <div className="p-5">
                  <div className="prose prose-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </div>

                  {entry.sentiment && entry.sentiment !== 'Pending' && (
                    <div className="mt-4 flex justify-end">
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                            entry.sentiment === 'Positive' ? 'bg-green-50 text-green-700 border-green-100' : 
                            entry.sentiment === 'Negative' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                            {entry.sentiment} Analysis
                        </span>
                    </div>
                  )}
              </div>

            </div>
          ))
      )}

      {/* --- AI MODAL --- */}
      <Transition appear show={showInsightModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowInsightModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4 mb-4">
                    <SparklesIcon className="h-6 w-6 text-purple-500" />
                    Recovery Compass Analysis
                  </Dialog.Title>
                  
                  {analyzing ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                        <p className="text-gray-500 font-medium">Consulting your AI Sponsor...</p>
                    </div>
                  ) : (
                    insight && (
                        <div className="space-y-6">
                            
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex gap-4">
                                <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg h-fit">
                                    <LightBulbIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-purple-900 text-sm uppercase tracking-wide mb-1">The Insight</h4>
                                    <p className="text-purple-800 text-sm leading-relaxed">{insight.summary}</p>
                                    <div className="flex gap-3 mt-3">
                                        <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded text-purple-700 border border-purple-200">
                                            Mood: {insight.mood}
                                        </span>
                                        <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded text-purple-700 border border-purple-200">
                                            Sentiment: {insight.sentiment}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold text-sm uppercase tracking-wide">
                                        <ShieldExclamationIcon className="h-5 w-5" />
                                        Risk Detection
                                    </div>
                                    <p className="text-sm text-orange-900 leading-relaxed">
                                        {insight.risk_analysis}
                                    </p>
                                </div>

                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <div className="flex items-center gap-2 mb-2 text-green-800 font-bold text-sm uppercase tracking-wide">
                                        <TrophyIcon className="h-5 w-5" />
                                        Strengths & Wins
                                    </div>
                                    <p className="text-sm text-green-900 leading-relaxed">
                                        {insight.positive_reinforcement}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold text-sm uppercase tracking-wide">
                                    <WrenchScrewdriverIcon className="h-5 w-5" />
                                    Suggested Toolkit (Quick Add)
                                </div>
                                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {insight.tool_suggestions.map((tool, i) => {
                                        const isAdded = addedTools.has(tool);
                                        return (
                                            <li key={i} className={`bg-white p-3 rounded-lg text-sm text-blue-900 shadow-sm border ${isAdded ? 'border-green-200 bg-green-50' : 'border-blue-100'} flex items-start gap-2 justify-between group`}>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-400 font-bold mt-0.5">•</span>
                                                    <span className={isAdded ? 'text-green-700' : ''}>{tool}</span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => !isAdded && handleAddToTasks(tool)}
                                                    disabled={isAdded}
                                                    className={`flex-shrink-0 transition-all ${isAdded ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
                                                    title={isAdded ? "Added to tasks" : "Add to tasks"}
                                                >
                                                    {isAdded ? (
                                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <PlusCircleIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-600" />
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                        </div>
                    )
                  )}

                  <div className="mt-6 flex justify-between">
                    <button 
                        type="button" 
                        disabled={analyzing || !insight || savingInsight}
                        onClick={handleSaveLog}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <BookmarkIcon className="h-4 w-4" />
                        {savingInsight ? "Saving..." : "Save to Wisdom Log"}
                    </button>

                    <button type="button" className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors" onClick={() => setShowInsightModal(false)}>
                      Close Analysis
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}