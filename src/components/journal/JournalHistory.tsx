import { useState, useEffect, Fragment } from 'react';
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
    ShareIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { analyzeJournalEntries, type AnalysisResult } from '../../lib/gemini';
import type { JournalEntry } from './JournalEditor';

interface JournalHistoryProps {
  onEdit: (entry: JournalEntry) => void;
}

export default function JournalHistory({ onEdit }: JournalHistoryProps) {
  const { user } = useAuth();

  // Data State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<AnalysisResult | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user]);

  // Load ALL entries initially (or limit to last 100 for performance)
  const loadEntries = async () => {
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
      setFilteredEntries(data); // Init filtered list
      
      // Extract unique tags
      const tags = new Set<string>();
      data.forEach(e => e.tags?.forEach(t => tags.add(t)));
      setAvailableTags(Array.from(tags));

    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Share Handler
  const handleShare = async (entry: JournalEntry) => {
    const dateStr = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : 'Unknown Date';
    const textToShare = `Journal Entry - ${dateStr}\n\n${entry.content}`;

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
            alert('Journal entry copied to clipboard!'); 
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
  };

  const handleAiAnalysis = async () => {
    if (filteredEntries.length === 0) return;
    setAnalyzing(true);
    setShowInsightModal(true);
    
    // Analyze filtered results (up to 10 to avoid token limits)
    const textsToAnalyze = filteredEntries.slice(0, 10).map(e => e.content);
    
    const result = await analyzeJournalEntries(textsToAnalyze);
    setInsight(result);
    setAnalyzing(false);
  };

  const clearFilters = () => {
      setSearchQuery('');
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
              
              {/* --- HEADER ROW (Light Blue) --- */}
              <div className="bg-blue-50/50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                
                {/* Left: Date & Weather */}
                <div className="flex items-center gap-3">
                   <span className="text-sm font-semibold text-gray-700">
                     {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                   </span>
                   
                   {entry.weather && (
                      <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                          {entry.weather.condition}, {entry.weather.temp}°C
                      </span>
                   )}
                </div>

                {/* Right: Mood & Actions */}
                <div className="flex items-center gap-4">
                    
                    {/* MOOD INDICATOR (Moved here) */}
                    <div className="flex items-center gap-2 bg-white/60 px-2 py-1 rounded-lg border border-blue-100/50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mood</span>
                        <div className={`h-2.5 w-2.5 rounded-full ${entry.moodScore >= 7 ? 'bg-green-500' : entry.moodScore <= 4 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-bold text-gray-700">{entry.moodScore}</span>
                    </div>

                    {/* Actions */}
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
                  {/* Tag Badges */}
                  {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                          {entry.tags.map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full font-medium border border-gray-100">
                                  {tag}
                              </span>
                          ))}
                      </div>
                  )}
                  
                  <div className="prose prose-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </div>

                  {/* Sentiment (Only if exists) */}
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
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                    <SparklesIcon className="h-6 w-6 text-purple-500" />
                    Filtered Insights
                  </Dialog.Title>
                  
                  {analyzing ? (
                    <div className="mt-4 py-8 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Analyzing your {filteredEntries.length} selected entries...</p>
                    </div>
                  ) : (
                    insight && (
                        <div className="mt-4 space-y-4">
                            <div className="bg-purple-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed">
                                {insight.analysis}
                            </div>
                            
                            <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <span>Mood: <span className="text-purple-700">{insight.mood}</span></span>
                                <span>Sentiment: <span className="text-purple-700">{insight.sentiment}</span></span>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Suggested Actions:</h4>
                                <ul className="space-y-2">
                                    {insight.actionableSteps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                            <span className="text-purple-500 mt-1">•</span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )
                  )}

                  <div className="mt-6">
                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-purple-100 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none w-full" onClick={() => setShowInsightModal(false)}>
                      Close
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