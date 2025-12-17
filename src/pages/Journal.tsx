import { useState, useEffect } from 'react'; // Removed unused 'React'
import { useAuth } from '../contexts/AuthContext';
import { 
  addJournalEntry, 
  getUserJournals, 
  deleteJournalEntry, 
  updateJournalEntry, 
  type JournalEntry 
} from '../lib/journal';
import { getCurrentWeather, type WeatherData } from '../lib/weather';
import { analyzeJournalEntries, type AnalysisResult } from '../lib/gemini';
import { saveInsight } from '../lib/insights';
import { 
  SunIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  XCircleIcon,
  SparklesIcon, 
  XMarkIcon,
  DocumentPlusIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// --- TEMPLATES CONFIGURATION ---
const TEMPLATES = [
  {
    id: "morning",
    name: "Morning Check-in",
    content: `☀️ MORNING CHECK-IN #morning_checkin

1. Three things I am grateful for today:
-
-
-

2. My main intention/focus for today is:
(e.g., Patience, Honesty, Service, Self-Care)

3. One action I will take for my recovery today:

4. How am I feeling right now? (Physically/Emotionally):`
  },
  {
    id: "nightly",
    name: "Nightly Inventory",
    content: `🌙 NIGHTLY INVENTORY #nightly_review

1. What went well today? (Wins & Successes):

2. Did I experience any strong cravings or triggers? How did I handle them?

3. Reviewing my interactions: Was I resentful, selfish, dishonest, or afraid?
(If yes, do I need to make amends?)

4. What is one thing I want to do better tomorrow?`
  },
  {
    id: "urge",
    name: "Urge Log / SOS",
    content: `🌊 URGE LOG #urge_log

1. Trigger: What happened right before I felt this urge?
(A thought, a feeling, an event?)

2. The Lie: What is my addiction telling me right now?
(e.g., "Just one won't hurt," "I deserve this")

3. The Reality: If I use, what will happen? (Play the tape forward):

4. My Plan: Who can I call, or what distraction can I use right now?`
  },
  {
    id: "meeting",
    name: "Meeting Reflection",
    content: `🤝 MEETING REFLECTION #meeting_reflection

1. Meeting Name/Topic:

2. Key Takeaway: What was the most important thing I heard?

3. Identification: How does this apply to my own story or struggle?

4. Action: Is there something from this meeting I want to practice?`
  }
];

export default function Journal() {
  const { user } = useAuth();
  
  // Form State
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(5);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // List State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  
  // AI Insight State
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<AnalysisResult | null>(null);

  // Load Data
  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  // Load Weather
  useEffect(() => {
    async function fetchLocalWeather() {
      const data = await getCurrentWeather();
      if (data) setWeather(data);
    }
    fetchLocalWeather();
  }, []);

  async function loadEntries() {
    if (!user) return;
    const data = await getUserJournals(user.uid);
    setEntries(data);
  }

  // --- TEMPLATE HANDLER ---
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    
    // Handle "Clear / New"
    if (selectedId === "clear") {
       if (content.length > 10 && !window.confirm("Clear current text?")) return;
       setContent("");
       return;
    }

    const template = TEMPLATES.find(t => t.id === selectedId);
    if (!template) return;

    // Prevent accidental overwrite if user has typed a lot
    if (content.length > 10 && !window.confirm("This will replace your current text. Are you sure?")) {
      // Reset dropdown to default if they cancel
      e.target.value = ""; 
      return;
    }
    
    setContent(template.content);
  };

  // --- ACTIONS ---

  const handleEditClick = (entry: JournalEntry) => {
    setContent(entry.content);
    setMood(entry.moodScore);
    setEditingId(entry.id!);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setContent('');
    setMood(5);
    setEditingId(null);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteJournalEntry(id);
      await loadEntries();
      if (editingId === id) handleCancelEdit();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleAnalyze = async () => {
    if (!user || entries.length === 0) return;
    setAnalyzing(true);
    try {
      const recentTexts = entries.slice(0, 5).map(e => e.content);
      const result = await analyzeJournalEntries(recentTexts);
      setInsight(result); 
      await saveInsight(user.uid, result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("AI Analysis failed. Check console.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      // Extract hashtags automatically
      const tags = content.match(/#[a-z0-9_]+/gi) || [];
      
      if (editingId) {
        await updateJournalEntry(editingId, content, mood, tags as string[]);
      } else {
        await addJournalEntry(user.uid, content, mood, tags as string[], weather);
      }
      
      handleCancelEdit();
      await loadEntries();
    } catch (error) {
      console.error("Failed to save journal", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative">
      
      {/* --- AI INSIGHT MODAL --- */}
      {insight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-start">
               <div>
                 <h3 className="text-white text-lg font-bold flex items-center gap-2">
                   <SparklesIcon className="h-5 w-5 text-yellow-300" />
                   Recovery Insights
                 </h3>
                 <p className="text-purple-100 text-sm mt-1">Based on your recent entries</p>
               </div>
               <button onClick={() => setInsight(null)} className="text-purple-200 hover:text-white">
                 <XMarkIcon className="h-6 w-6" />
               </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-gray-800 italic">"{insight.analysis}"</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Suggested Actions</h4>
                <ul className="space-y-2">
                  {insight.actionableSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-end">
              <button 
                onClick={() => setInsight(null)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE --- */}

      <div className={`bg-white shadow sm:rounded-lg p-6 border-t-4 ${editingId ? 'border-orange-500' : 'border-blue-600'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingId ? 'Editing Entry' : 'Daily Check-In'}
            </h2>
            
            {weather ? (
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <SunIcon className="h-4 w-4 mr-1" />
                    <span>{weather.temp}°C, {weather.condition}</span>
                </div>
            ) : (
                <span className="text-xs text-gray-400">Locating...</span>
            )}
        </div>

        {/* --- TEMPLATES DROPDOWN (UPDATED) --- */}
        {!editingId && (
          <div className="mb-4 relative">
             <div className="relative">
                <DocumentPlusIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  onChange={handleTemplateChange}
                  defaultValue=""
                  className="block w-full rounded-md border-gray-300 pl-10 pr-10 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none border"
                >
                  <option value="" disabled>Select a Quick Template...</option>
                  <option value="clear">✨ Clear / New Entry</option>
                  <hr />
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              rows={8}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border font-sans text-base"
              placeholder="Write your thoughts here... Use #hashtags to tag topics."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mood Score: <span className="text-blue-600 font-bold">{mood}/10</span>
            </label>
            <input 
              type="range" 
              min="1" max="10" 
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span>Struggling</span>
              <span>Neutral</span>
              <span>Thriving</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center text-gray-600 px-4 py-2 hover:text-gray-900"
              >
                <XCircleIcon className="h-5 w-5 mr-1" />
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`text-white px-4 py-2 rounded-md transition disabled:opacity-50 ${
                editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Entry')}
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
        
        {entries.length > 0 && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {analyzing ? (
               <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
               <SparklesIcon className="h-4 w-4 text-yellow-300" />
            )}
            <span className="text-sm font-bold">
              {analyzing ? 'Analyzing...' : 'Get AI Insights'}
            </span>
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className={`bg-white shadow rounded-lg p-6 relative group ${editingId === entry.id ? 'ring-2 ring-orange-400' : ''}`}>
            
            <div className="absolute top-4 right-4 flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEditClick(entry)} className="text-gray-400 hover:text-blue-600 p-1">
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button onClick={() => handleDeleteClick(entry.id!)} className="text-gray-400 hover:text-red-600 p-1">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-between items-start mb-2 pr-16">
              <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">
                    {entry.createdAt.toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {entry.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
              </div>

              <div className="flex space-x-2">
                 {entry.weather && (
                    <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                        {entry.weather.temp}°C {entry.weather.condition}
                    </span>
                 )}
                 <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.moodScore >= 7 ? 'bg-green-100 text-green-800' :
                    entry.moodScore <= 3 ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Mood: {entry.moodScore}
                  </span>
              </div>
            </div>
            
            <p className="text-gray-800 whitespace-pre-wrap mt-2">{entry.content}</p>
            
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}