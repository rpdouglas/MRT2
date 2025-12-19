import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
    PlusIcon, 
    SparklesIcon, 
    TrashIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { analyzeJournalEntries, type AnalysisResult } from '../lib/gemini';
import { getUserTemplates, type JournalTemplate } from '../lib/db'; // FIX 1: Type-only import
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface JournalEntry {
  id: string;
  content: string;
  moodScore: number;
  sentiment?: string;
  createdAt: any;
  tags?: string[];
  weather?: { temp: number; condition: string } | null;
}

// Default Hardcoded Templates
const DEFAULT_TEMPLATES = [
  { id: 'morning_checkin', name: 'Morning Check-in', text: "Morning Check-in ☀️\n\nHow am I feeling today?\n\n\nWhat is my main focus for today?\n\n\nOne thing I am grateful for:\n", tags: ['#morning'] },
  { id: 'nightly_review', name: 'Nightly Review', text: "Nightly Review 🌙\n\nWhat went well today?\n\n\nWhat challenged me?\n\n\nDid I stay sober today?\n", tags: ['#nightly'] },
  { id: 'urge_log', name: 'Urge Log (SOS)', text: "Urge Log 🚨\n\nTrigger:\n\n\nIntensity (1-10):\n\n\nCoping Strategy Used:\n", tags: ['#urge', '#sos'] },
  { id: 'meeting_reflection', name: 'Meeting Reflection', text: "Meeting Reflection 🪑\n\nMeeting Topic:\n\n\nOne thing I heard that resonated:\n\n\nHow can I apply this?\n", tags: ['#meeting'] },
];

export default function Journal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState(5);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<AnalysisResult | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);

  // Template State
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<JournalTemplate | null>(null);
  const [formAnswers, setFormAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    loadEntries();
    loadCustomTemplates();
    fetchWeather();
  }, [user]);

  // --- LOADERS ---
  const loadEntries = async () => {
    // FIX 2: Guard clause for DB
    if (!user || !db) return;
    
    try {
      const q = query(
        collection(db, 'journals'), 
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry)));
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomTemplates = async () => {
    if (!user) return;
    const t = await getUserTemplates(user.uid);
    setCustomTemplates(t);
  };

  const fetchWeather = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
          const data = await res.json();
          
          const code = data.current.weather_code;
          let condition = "Clear";
          if (code > 0 && code < 50) condition = "Cloudy";
          if (code >= 50 && code < 70) condition = "Rainy";
          if (code >= 70) condition = "Snowy";

          setWeather({
             temp: Math.round(data.current.temperature_2m),
             condition
          });
        } catch (e) {
          console.warn("Weather fetch failed", e);
        }
      });
    }
  };

  // --- ACTIONS ---

  const handleTemplateSelect = (tId: string) => {
    const defTemplate = DEFAULT_TEMPLATES.find(t => t.id === tId);
    if (defTemplate) {
        setNewEntry(defTemplate.text);
        setActiveTemplate(null);
        return;
    }

    const custTemplate = customTemplates.find(t => t.id === tId);
    if (custTemplate) {
        setActiveTemplate(custTemplate);
        setFormAnswers(new Array(custTemplate.prompts.length).fill(''));
        setNewEntry('');
    } else {
        setActiveTemplate(null);
        setNewEntry('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // FIX 2: Guard clause for DB
    if (!user || !db) return;

    const isFormValid = activeTemplate && formAnswers.some(a => a.trim() !== '');
    const isTextValid = !activeTemplate && newEntry.trim() !== '';

    if (!isFormValid && !isTextValid) return;

    setSaving(true);

    let finalContent = newEntry;
    let finalTags: string[] = [];

    if (activeTemplate) {
        finalContent = `**${activeTemplate.name}**\n\n`;
        activeTemplate.prompts.forEach((prompt, idx) => {
            finalContent += `**${prompt}**\n${formAnswers[idx] || '-(Skipped)-'}\n\n`;
        });
        finalTags = [...activeTemplate.defaultTags];
    } else {
        const textTags = newEntry.match(/#[a-z0-9]+/gi) || [];
        finalTags = textTags as string[];
        
        const matchedDef = DEFAULT_TEMPLATES.find(t => newEntry.startsWith(t.text.split('\n')[0]));
        if (matchedDef) {
            finalTags = [...new Set([...finalTags, ...matchedDef.tags])];
        }
    }

    try {
      const entryData = {
        uid: user.uid,
        content: finalContent,
        moodScore: mood,
        sentiment: 'Pending', 
        weather,
        tags: finalTags,
        createdAt: Timestamp.now()
      };

      if (editingId) {
        await updateDoc(doc(db, 'journals', editingId), { 
            content: finalContent, 
            moodScore: mood,
            tags: finalTags
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'journals'), entryData);
      }

      setNewEntry('');
      setFormAnswers([]);
      setActiveTemplate(null);
      setMood(5);
      await loadEntries();
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // FIX 2: Guard clause for DB
    if (!db) return;
    if (!confirm('Are you sure?')) return;
    
    try {
      await deleteDoc(doc(db, 'journals', id));
      await loadEntries();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setNewEntry(entry.content);
    setMood(entry.moodScore);
    setEditingId(entry.id);
    setActiveTemplate(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAiAnalysis = async () => {
    if (entries.length === 0) return;
    setAnalyzing(true);
    setShowInsightModal(true);
    
    const recentTexts = entries.slice(0, 5).map(e => e.content);
    
    const result = await analyzeJournalEntries(recentTexts);
    setInsight(result);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* --- ENTRY CREATOR CARD --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
           <h2 className="font-semibold text-gray-700">
             {editingId ? 'Edit Entry' : 'New Journal Entry'}
           </h2>
           
           <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:flex-none">
                <select 
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full sm:w-48 pl-3 pr-8 py-1.5 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue=""
                >
                    <option value="" disabled>Choose a Template...</option>
                    <option value="none">Free Write (Blank)</option>
                    <optgroup label="Standard">
                        {DEFAULT_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </optgroup>
                    {customTemplates.length > 0 && (
                        <optgroup label="My Templates">
                            {customTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
             </div>

             <button 
                onClick={() => navigate('/templates')}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition"
                title="Manage Templates"
             >
                <Cog6ToothIcon className="h-5 w-5" />
             </button>
           </div>
        </div>
        
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
          
          {activeTemplate ? (
             <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-blue-900">{activeTemplate.name}</h3>
                    <button 
                        type="button" 
                        onClick={() => setActiveTemplate(null)}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                        Switch to Text Mode
                    </button>
                </div>
                
                {activeTemplate.prompts.map((prompt, idx) => (
                    <div key={idx}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{prompt}</label>
                        <textarea
                            rows={2}
                            value={formAnswers[idx] || ''}
                            onChange={(e) => {
                                const newAns = [...formAnswers];
                                newAns[idx] = e.target.value;
                                setFormAnswers(newAns);
                            }}
                            className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            placeholder="Type your answer..."
                        />
                    </div>
                ))}
             </div>
          ) : (
            <textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="How are you feeling today? (Type # to add tags)"
                className="w-full h-40 p-4 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none text-gray-700 leading-relaxed"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
               <span className="text-sm font-medium text-gray-500">Mood:</span>
               <input 
                 type="range" 
                 min="1" 
                 max="10" 
                 value={mood}
                 onChange={(e) => setMood(Number(e.target.value))}
                 className="w-24 accent-blue-600 cursor-pointer"
               />
               <span className={`text-sm font-bold w-6 text-center ${mood >= 7 ? 'text-green-600' : mood <= 4 ? 'text-red-500' : 'text-yellow-600'}`}>
                 {mood}
               </span>
            </div>

            {weather && (
               <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <span>{weather.condition}</span>
                  <span>•</span>
                  <span>{weather.temp}°C</span>
               </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  <span>{editingId ? 'Update Entry' : 'Save Entry'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between pt-4">
         <h3 className="text-xl font-bold text-gray-900">Recent Entries</h3>
         
         <button 
           onClick={handleAiAnalysis}
           disabled={analyzing || entries.length === 0}
           className="flex items-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
         >
           {analyzing ? (
             <ArrowPathIcon className="h-5 w-5 animate-spin" />
           ) : (
             <SparklesIcon className="h-5 w-5" />
           )}
           <span className="font-medium text-sm">Analyze History</span>
         </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading your journey...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No entries yet. Start your recovery journal today.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                   <span className="text-sm font-medium text-gray-400">
                     {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                   </span>
                   {entry.weather && (
                      <span className="text-xs text-gray-300 hidden sm:inline">• {entry.weather.temp}°C</span>
                   )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleEdit(entry)} className="p-1 text-gray-400 hover:text-blue-600">
                      <PencilSquareIcon className="h-4 w-4" />
                   </button>
                   <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <TrashIcon className="h-4 w-4" />
                   </button>
                </div>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                      {entry.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                              {tag}
                          </span>
                      ))}
                  </div>
              )}
              
              <div className="prose prose-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mood</span>
                    <div className={`h-2 w-2 rounded-full ${entry.moodScore >= 7 ? 'bg-green-500' : entry.moodScore <= 4 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                 </div>
                 
                 {entry.sentiment && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.sentiment === 'Positive' ? 'bg-green-100 text-green-700' : 
                        entry.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {entry.sentiment}
                    </span>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      <Transition appear show={showInsightModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowInsightModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2"
                  >
                    <SparklesIcon className="h-6 w-6 text-purple-500" />
                    Gemini Analysis
                  </Dialog.Title>
                  
                  {analyzing ? (
                    <div className="mt-4 py-8 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Reading your entries...</p>
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
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-purple-100 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 w-full"
                      onClick={() => setShowInsightModal(false)}
                    >
                      Got it
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