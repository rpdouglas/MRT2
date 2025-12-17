import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addJournalEntry, getUserJournals, type JournalEntry } from '../lib/journal';
import { getCurrentWeather, type WeatherData } from '../lib/weather';
import { SunIcon } from '@heroicons/react/24/outline'; // Removed CloudIcon

export default function Journal() {
  const { user } = useAuth();
  
  // Form State
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(5);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null); // Store fetched weather
  
  // List State
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // 1. Load Journal History
  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  // 2. Auto-Fetch Weather on Mount
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      const tags = content.match(/#[a-z0-9]+/gi) || [];
      
      // Pass the weather state to the save function
      await addJournalEntry(user.uid, content, mood, tags as string[], weather);
      
      setContent('');
      setMood(5);
      await loadEntries();
    } catch (error) {
      console.error("Failed to save journal", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* 1. NEW ENTRY FORM */}
      <div className="bg-white shadow sm:rounded-lg p-6 border-t-4 border-blue-600">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Daily Check-In</h2>
            
            {/* Weather Badge (Shows user what weather is being captured) */}
            {weather ? (
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <SunIcon className="h-4 w-4 mr-1" />
                    <span>{weather.temp}°C, {weather.condition}</span>
                </div>
            ) : (
                <span className="text-xs text-gray-400 animate-pulse">Locating...</span>
            )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How are you doing today?
            </label>
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Struggling</span>
              <span>Neutral</span>
              <span>Thriving</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. JOURNAL HISTORY LIST */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
        
        {entries.length === 0 && (
          <p className="text-gray-500 italic">No entries yet. Start writing above!</p>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">
                    {entry.createdAt.toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {entry.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
              </div>

              <div className="flex space-x-2">
                 {/* Display Saved Weather */}
                 {entry.weather && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
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