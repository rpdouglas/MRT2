import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from './JournalEditor';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { startOfMonth, subMonths, isSameMonth, getDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  EyeSlashIcon, 
  TrashIcon, 
  Cog6ToothIcon, 
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// --- HELPERS ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#4ade80', '#f87171', '#94a3b8']; // Green, Red, Gray

// Stop words for Word Cloud (Base set)
const BASE_STOP_WORDS = new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'for', 'my', 'was', 'on', 'with', 'as', 'at', 'be', 'have', 'this', 'me', 'so', 'but', 'not', 'are', 'am', 'will', 'just', 'all', 'today', 'day', 'had', 'very', 'im'
]);

// --- STRICT TYPES ---
interface MoodDataPoint {
  date: string;
  mood: number;
  [key: string]: string | number | undefined; 
}

interface DayComparisonData {
  name: string; // e.g., "Mon"
  currentAvg: number;
  prevAvg: number;
  [key: string]: string | number | undefined;
}

interface SentimentDataPoint {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface WordCloudItem {
  text: string;
  count: number;
}

export default function JournalInsights() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Chart Data State
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [dayData, setDayData] = useState<DayComparisonData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [wordCloud, setWordCloud] = useState<WordCloudItem[]>([]);

  // Word Cloud Settings State (Persistent)
  const [hiddenWords, setHiddenWords] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('mrt_hidden_words');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [ignoredPhrases, setIgnoredPhrases] = useState<string[]>(() => {
    const saved = localStorage.getItem('mrt_ignored_phrases');
    return saved ? JSON.parse(saved) : [];
  });

  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');

  // --- SAVE SETTINGS ---
  useEffect(() => {
    localStorage.setItem('mrt_hidden_words', JSON.stringify(Array.from(hiddenWords)));
  }, [hiddenWords]);

  useEffect(() => {
    localStorage.setItem('mrt_ignored_phrases', JSON.stringify(ignoredPhrases));
  }, [ignoredPhrases]);

  // --- PROCESSORS ---

  const processMoodGraph = (entries: JournalEntry[]) => {
    const data = [...entries].reverse().slice(-30).map(e => ({
      date: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '',
      mood: e.moodScore
    }));
    setMoodData(data);
  };

  const processDayComparison = (entries: JournalEntry[]) => {
    const currentSums = new Array(7).fill(0);
    const currentCounts = new Array(7).fill(0);
    const prevSums = new Array(7).fill(0);
    const prevCounts = new Array(7).fill(0);

    const now = new Date();
    const lastMonthDate = subMonths(now, 1);

    entries.forEach(e => {
      if (!e.createdAt?.toDate) return;
      const entryDate = e.createdAt.toDate();
      const dayIdx = getDay(entryDate);
      
      if (isSameMonth(entryDate, now)) {
        currentSums[dayIdx] += e.moodScore;
        currentCounts[dayIdx] += 1;
      } else if (isSameMonth(entryDate, lastMonthDate)) {
        prevSums[dayIdx] += e.moodScore;
        prevCounts[dayIdx] += 1;
      }
    });

    const data: DayComparisonData[] = DAYS.map((day, idx) => ({
      name: day,
      currentAvg: currentCounts[idx] ? parseFloat((currentSums[idx] / currentCounts[idx]).toFixed(1)) : 0,
      prevAvg: prevCounts[idx] ? parseFloat((prevSums[idx] / prevCounts[idx]).toFixed(1)) : 0
    }));

    setDayData(data);
  };

  const processSentiment = (entries: JournalEntry[]) => {
    let pos = 0, neg = 0, neu = 0;
    entries.forEach(e => {
      if (e.sentiment === 'Positive') pos++;
      else if (e.sentiment === 'Negative') neg++;
      else if (e.sentiment === 'Neutral') neu++;
      else {
        if (e.moodScore >= 7) pos++;
        else if (e.moodScore <= 4) neg++;
        else neu++;
      }
    });

    setSentimentData([
      { name: 'Positive', value: pos },
      { name: 'Negative', value: neg },
      { name: 'Neutral', value: neu }
    ].filter(d => d.value > 0));
  };

  const processWordCloud = useCallback((entries: JournalEntry[]) => {
    const wordCounts: Record<string, number> = {};

    entries.forEach(e => {
      let content = e.content;

      // 1. Remove Contextual Phrases FIRST
      // This allows filtering "I feel" so that "feel" isn't counted in that specific context,
      // but might be counted if used elsewhere.
      ignoredPhrases.forEach(phrase => {
        const regex = new RegExp(phrase, caseSensitive ? 'g' : 'gi');
        content = content.replace(regex, ''); 
      });

      // 2. Tokenize
      // Remove punctuation and split
      const cleanContent = content.replace(/[^\w\s]/g, '');
      const words = cleanContent.split(/\s+/);

      words.forEach(rawWord => {
        const w = caseSensitive ? rawWord : rawWord.toLowerCase();
        
        if (w.length > 2 && !BASE_STOP_WORDS.has(w.toLowerCase()) && !hiddenWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(wordCounts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40); // Top 40 for better cloud density

    setWordCloud(sorted);
  }, [hiddenWords, ignoredPhrases, caseSensitive]);

  // --- DATA LOADING ---
  
  const loadData = useCallback(async () => {
    if (!user || !db) return;

    try {
      const now = new Date();
      const startOfLastMonth = startOfMonth(subMonths(now, 1));

      const q = query(
        collection(db, 'journals'),
        where('uid', '==', user.uid),
        where('createdAt', '>=', Timestamp.fromDate(startOfLastMonth)),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ ...doc.data() } as JournalEntry));

      processMoodGraph(entries);
      processDayComparison(entries);
      processSentiment(entries);
      processWordCloud(entries);

    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  }, [user, processWordCloud]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS ---

  const handleWordClick = (word: string) => {
    // Navigate to history and filter by this word
    navigate(`/journal?tab=history&search=${encodeURIComponent(word)}`);
  };

  const handleWordRightClick = (e: React.MouseEvent, word: string) => {
    e.preventDefault();
    if (confirm(`Hide "${word}" from the cloud?`)) {
      setHiddenWords(prev => new Set(prev).add(word));
    }
  };

  const addIgnoredPhrase = () => {
    if (newPhrase.trim()) {
      setIgnoredPhrases(prev => [...prev, newPhrase.trim()]);
      setNewPhrase('');
    }
  };

  const removeIgnoredPhrase = (idx: number) => {
    setIgnoredPhrases(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleHiddenWord = (word: string) => {
    setHiddenWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Crunching the numbers...</div>;

  if (moodData.length === 0) return <div className="text-center py-10 text-gray-400">No entries found for this period. Start journaling to see insights!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
      
      {/* 1. MOOD GRAPH */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
         <h3 className="font-bold text-gray-900 mb-4">Mood History (Last 30 Entries)</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" />
                  <YAxis domain={[1, 10]} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                    activeDot={{ r: 6 }} 
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 2. TRIGGER DAYS */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
         <h3 className="font-bold text-gray-900 mb-4">Average Mood (This Month vs Last)</h3>
         <div className="h-56 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    name="Last Month" 
                    dataKey="prevAvg" 
                    fill="#cbd5e1" // Slate-300
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    name="This Month" 
                    dataKey="currentAvg" 
                    fill="#3b82f6" // Blue-500
                    radius={[4, 4, 0, 0]} 
                  />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 3. SENTIMENT */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
         <h3 className="font-bold text-gray-900 mb-4 self-start">Emotional Weather</h3>
         <div className="h-56 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="flex gap-4 text-xs mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#4ade80]"></div>Positive</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f87171]"></div>Negative</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#94a3b8]"></div>Neutral</div>
         </div>
      </div>

      {/* 4. INTERACTIVE WORD CLOUD (UPDATED) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2 relative">
         <div className="flex justify-between items-start mb-4">
             <h3 className="font-bold text-gray-900">Recurring Themes (Top Words)</h3>
             <button 
                onClick={() => setShowCloudSettings(true)}
                className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-gray-50 transition-colors"
                title="Manage Cloud Settings"
             >
                 <Cog6ToothIcon className="h-5 w-5" />
             </button>
         </div>

         <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center p-4 min-h-[150px] content-center">
            {wordCloud.length === 0 && <p className="text-gray-400 text-sm italic">No words found. Adjust your filters or journal more!</p>}
            
            {wordCloud.map((w) => {
               // Linear Normalization Logic for Sizing
               const max = wordCloud[0]?.count || 1;
               const min = wordCloud[wordCloud.length - 1]?.count || 0;
               // Scale between 0.85rem and 2.5rem
               const normalized = (w.count - min) / (max - min || 1); 
               const size = 0.85 + (normalized * 1.65);
               
               // Dynamic Opacity based on frequency
               const opacity = 0.6 + (normalized * 0.4);

               return (
                  <span 
                    key={w.text} 
                    style={{ fontSize: `${size}rem`, opacity }}
                    className="text-blue-600 font-medium cursor-pointer transition-all hover:scale-110 hover:text-blue-800 select-none"
                    title={`Click to filter history (${w.count} times)\nRight-click to hide`}
                    onClick={() => handleWordClick(w.text)}
                    onContextMenu={(e) => handleWordRightClick(e, w.text)}
                  >
                    {w.text}
                  </span>
               );
            })}
         </div>
         <p className="text-center text-xs text-gray-400 mt-2">Click word to view entries • Right-click to hide</p>
      </div>

      {/* --- WORD CLOUD SETTINGS MODAL --- */}
      <Transition appear show={showCloudSettings} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowCloudSettings(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                    <Dialog.Title className="text-lg font-bold text-gray-900">Cloud Settings</Dialog.Title>
                    <button onClick={() => setShowCloudSettings(false)} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    
                    {/* 1. Contextual Phrases */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Ignored Context Phrases</h4>
                        <p className="text-xs text-gray-500 mb-3">Words inside these phrases won't be counted. e.g. "I feel"</p>
                        
                        <div className="flex gap-2 mb-3">
                            <input 
                                type="text" 
                                value={newPhrase} 
                                onChange={(e) => setNewPhrase(e.target.value)}
                                placeholder='e.g., "I feel"'
                                className="flex-1 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && addIgnoredPhrase()}
                            />
                            <button onClick={addIgnoredPhrase} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {ignoredPhrases.map((phrase, idx) => (
                                <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                    "{phrase}"
                                    <button onClick={() => removeIgnoredPhrase(idx)} className="text-red-400 hover:text-red-600 ml-1">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            {ignoredPhrases.length === 0 && <span className="text-xs text-gray-400 italic">No phrases added.</span>}
                        </div>
                    </div>

                    {/* 2. Hidden Words List */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Hidden Words</h4>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {Array.from(hiddenWords).map(word => (
                                <button 
                                    key={word}
                                    onClick={() => toggleHiddenWord(word)}
                                    className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-red-100 hover:bg-red-100 transition-colors"
                                    title="Click to restore"
                                >
                                    <EyeSlashIcon className="h-3 w-3" />
                                    {word}
                                </button>
                            ))}
                            {hiddenWords.size === 0 && <span className="text-xs text-gray-400 italic">No words hidden. Right-click words in the cloud to hide them.</span>}
                        </div>
                    </div>

                    {/* 3. Toggles */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={caseSensitive} 
                                onChange={(e) => setCaseSensitive(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Case Sensitive Counting
                        </label>
                        
                        <button 
                            onClick={() => { setHiddenWords(new Set()); setIgnoredPhrases([]); }} 
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <TrashIcon className="h-3 w-3" /> Reset All
                        </button>
                    </div>

                </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}