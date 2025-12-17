import React, { useState, useEffect } from 'react';
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
  SparklesIcon, // The "Magic" Icon
  XMarkIcon
} from '@heroicons/react/24/outline'; 

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

  // --- THE AI SPARKLE BUTTON ACTION ---
  const handleAnalyze = async () => {
    if (!user || entries.length === 0) return;
    
    setAnalyzing(true);
    try {
      // 1. Gather text from last 5 entries
      const recentTexts = entries.slice(0, 5).map(e => e.content);
      
      // 2. Send to Gemini
      const result = await analyzeJournalEntries(recentTexts);
      setInsight(result); // Show Popup
      
      // 3. Save to Database
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
      const tags = content.match(/#[a-z0-9]+/gi) || [];
      
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

      {/* 1. ENTRY FORM */}
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
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

      {/* 2. HISTORY LIST HEADER & ANALYZE BUTTON */}
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
      
      {/* 3. ENTRIES LIST */}
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