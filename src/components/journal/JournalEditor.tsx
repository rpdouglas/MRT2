import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { 
    PlusIcon, 
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { getUserTemplates, type JournalTemplate } from '../../lib/db';
import { getCurrentWeather } from '../../lib/weather'; // NEW IMPORT
import { useNavigate } from 'react-router-dom';

// --- Types ---
export interface JournalEntry {
  id: string;
  content: string;
  moodScore: number;
  sentiment?: string;
  createdAt: any;
  tags?: string[];
  weather?: { temp: number; condition: string } | null;
}

interface JournalEditorProps {
  initialEntry: JournalEntry | null;
  onSaveComplete: () => void;
}

const DEFAULT_TEMPLATES = [
  { id: 'morning_checkin', name: 'Morning Check-in', text: "Morning Check-in ☀️\n\nHow am I feeling today?\n\n\nWhat is my main focus for today?\n\n\nOne thing I am grateful for:\n", tags: ['#morning'] },
  { id: 'nightly_review', name: 'Nightly Review', text: "Nightly Review 🌙\n\nWhat went well today?\n\n\nWhat challenged me?\n\n\nDid I stay sober today?\n", tags: ['#nightly'] },
  { id: 'urge_log', name: 'Urge Log (SOS)', text: "Urge Log 🚨\n\nTrigger:\n\n\nIntensity (1-10):\n\n\nCoping Strategy Used:\n", tags: ['#urge', '#sos'] },
  { id: 'meeting_reflection', name: 'Meeting Reflection', text: "Meeting Reflection 🪑\n\nMeeting Topic:\n\n\nOne thing I heard that resonated:\n\n\nHow can I apply this?\n", tags: ['#meeting'] },
];

export default function JournalEditor({ initialEntry, onSaveComplete }: JournalEditorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState(5);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Template State
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<JournalTemplate | null>(null);
  const [formAnswers, setFormAnswers] = useState<string[]>([]);

  // Load Initial Data (Editing Mode)
  useEffect(() => {
    if (initialEntry) {
      setNewEntry(initialEntry.content);
      setMood(initialEntry.moodScore);
      // Load saved weather if it exists
      if (initialEntry.weather) {
        setWeather(initialEntry.weather);
      }
      setActiveTemplate(null); // Edit mode defaults to text
    } else {
      // Reset if switching from edit back to new
      setNewEntry('');
      setMood(5);
      setActiveTemplate(null);
      setFormAnswers([]);
      setWeather(null); // Clear old weather
      fetchLocalWeather(); // Fetch NEW weather
    }
  }, [initialEntry]);

  // Load Resources
  useEffect(() => {
    if (!user) return;
    loadCustomTemplates();
    // Only fetch weather on mount if it's a new entry (handled in the effect above mostly, but good for initial load)
    if (!initialEntry) fetchLocalWeather(); 
  }, [user]);

  const loadCustomTemplates = async () => {
    if (!user) return;
    const t = await getUserTemplates(user.uid);
    setCustomTemplates(t);
  };

  const fetchLocalWeather = async () => {
    try {
      const data = await getCurrentWeather();
      if (data) {
        setWeather({
          temp: Math.round(data.temp),
          condition: data.condition
        });
      }
    } catch (e) {
      console.warn("Failed to auto-load weather", e);
    }
  };

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
      if (initialEntry) {
        // UPDATE existing
        // We do NOT update weather here, preserving the original historical data
        await updateDoc(doc(db, 'journals', initialEntry.id), { 
            content: finalContent, 
            moodScore: mood,
            tags: finalTags
        });
      } else {
        // CREATE new
        await addDoc(collection(db, 'journals'), {
          uid: user.uid,
          content: finalContent,
          moodScore: mood,
          sentiment: 'Pending', 
          weather, // Saves the auto-fetched weather
          tags: finalTags,
          createdAt: Timestamp.now()
        });
      }

      // Reset form
      setNewEntry('');
      setFormAnswers([]);
      setActiveTemplate(null);
      setMood(5);
      
      // Notify parent
      onSaveComplete();
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Compact Header: Just Controls */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-end items-center gap-3">
             <div className="relative">
                <select 
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="pl-3 pr-8 py-1.5 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    defaultValue=""
                    disabled={!!initialEntry} 
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
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                title="Manage Templates"
             >
                <Cog6ToothIcon className="h-5 w-5" />
             </button>
        </div>
        
        <form onSubmit={handleSave} className="p-4 space-y-4">
          
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
                            rows={4} 
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
                // UPDATED: Reduced to 45vh to prevent scroll
                className="w-full h-[45vh] p-4 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none text-gray-700 leading-relaxed"
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
                  {/* Visual indicator for historical vs current */}
                  {initialEntry ? (
                    <span className="text-[10px] text-gray-300 uppercase tracking-wide ml-1">(Recorded)</span>
                  ) : null}
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
                  <span>{initialEntry ? 'Update Entry' : 'Save Entry'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
  );
}