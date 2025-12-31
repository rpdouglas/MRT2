/**
 * src/components/journal/JournalEditor.tsx
 * GITHUB COMMENT:
 * [JournalEditor.tsx]
 * UPDATED: Integrated AudioRecorder component.
 * FEATURE: Toggle between Text and Voice modes. Auto-fills content from AI transcription.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
    PlusIcon, 
    Cog6ToothIcon,
    MapPinIcon,
    ArrowPathIcon,
    TagIcon,
    XMarkIcon,
    MicrophoneIcon
} from '@heroicons/react/24/outline';
import { getUserTemplates, type JournalTemplate } from '../../lib/db';
import { getCurrentWeather } from '../../lib/weather';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import type { AudioAnalysisResult } from '../../lib/gemini';

// --- Types ---

interface JournalDocData {
    tags?: string[];
    [key: string]: unknown;
}

export interface JournalEntry {
  id: string;
  content: string;
  moodScore: number;
  sentiment?: string;
  createdAt: Timestamp; 
  tags?: string[];
  weather?: { temp: number; condition: string } | null;
  isEncrypted?: boolean; 
}

interface ExtendedJournalTemplate extends JournalTemplate {
    content?: string;
}

interface JournalEditorProps {
  initialEntry: JournalEntry | null;
  initialTemplateId?: string | null;
  onSaveComplete: () => void;
}

const DEFAULT_TEMPLATES = [
  { id: 'morning_checkin', name: 'Morning Check-in', text: "Morning Check-in ☀️\n\nHow am I feeling today?\n\n\nWhat is my main focus for today?\n\n\nOne thing I am grateful for:\n", tags: ['Morning'] },
  { id: 'nightly_review', name: 'Nightly Review', text: "Nightly Review 🌙\n\nWhat went well today?\n\n\nWhat challenged me?\n\n\nDid I stay sober today?\n", tags: ['Nightly'] },
  { id: 'urge_log', name: 'Urge Log (SOS)', text: "Urge Log 🚨\n\nTrigger:\n\n\nIntensity (1-10):\n\n\nCoping Strategy Used:\n", tags: ['Urge', 'SOS'] },
  { id: 'meeting_reflection', name: 'Meeting Reflection', text: "Meeting Reflection 🪑\n\nMeeting Topic:\n\n\nOne thing I heard that resonated:\n\n\nHow can I apply this?\n", tags: ['Meeting'] },
];

export default function JournalEditor({ initialEntry, initialTemplateId, onSaveComplete }: JournalEditorProps) {
  const { user } = useAuth();
  const { encrypt } = useEncryption();
  const navigate = useNavigate();

  // State
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState(5);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  // Tag State
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Template State
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<JournalTemplate | null>(null);
  const [formAnswers, setFormAnswers] = useState<string[]>([]);

  // NEW: Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // --- Helper Functions ---

  const fetchLocalWeather = useCallback(async () => {
    setWeatherLoading(true);
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
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const loadCustomTemplates = useCallback(async () => {
    if (!user) return;
    try {
        const t = await getUserTemplates(user.uid);
        setCustomTemplates(t);
    } catch (e) {
        console.error("Failed to load templates", e);
    }
  }, [user]);

  const loadUserTags = useCallback(async () => {
    if (!user || !db) return;
    try {
        const q = query(
            collection(db, 'journals'),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const tagSet = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as JournalDocData; 
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach((t: string) => tagSet.add(t));
            }
        });
        setAvailableTags(Array.from(tagSet).sort());
    } catch (e) {
        console.warn("Failed to load user tags", e);
    }
  }, [user]);

  const handleTemplateSelect = useCallback((tId: string) => {
    const defTemplate = DEFAULT_TEMPLATES.find(t => t.id === tId);
    if (defTemplate) {
        setNewEntry(defTemplate.text);
        setTags(prev => [...new Set([...prev, ...defTemplate.tags])]);
        setActiveTemplate(null);
        return;
    }

    const custTemplate = customTemplates.find(t => t.id === tId) as ExtendedJournalTemplate | undefined;
    
    if (custTemplate) {
        // Free Text Mode
        if (custTemplate.content) {
            setNewEntry(custTemplate.content);
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
            setActiveTemplate(null); 
        } 
        // Form Mode
        else if (custTemplate.prompts) {
            setActiveTemplate(custTemplate);
            setFormAnswers(new Array(custTemplate.prompts.length).fill(''));
            setNewEntry('');
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
        }
    } else {
        setActiveTemplate(null);
        setNewEntry('');
        setTags([]);
    }
  }, [customTemplates]); 

  // --- Effects ---

  useEffect(() => {
    if (!user) return;
    loadCustomTemplates();
    loadUserTags();
    if (!initialEntry) fetchLocalWeather(); 
  }, [user, initialEntry, loadCustomTemplates, loadUserTags, fetchLocalWeather]);

  useEffect(() => {
    if (initialEntry) {
      setNewEntry(initialEntry.content);
      setMood(initialEntry.moodScore);
      setTags(initialEntry.tags || []);
      if (initialEntry.weather) {
        setWeather(initialEntry.weather);
      }
      setActiveTemplate(null);
    } else {
      setNewEntry('');
      setMood(5);
      setTags([]);
      setActiveTemplate(null);
      setFormAnswers([]);
      setWeather(null);
      fetchLocalWeather(); 

      if (initialTemplateId) {
          handleTemplateSelect(initialTemplateId);
      }
    }
  }, [initialEntry, initialTemplateId, handleTemplateSelect, fetchLocalWeather]);

  // Tag Handling
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
        setTags(prev => prev.slice(0, -1));
    }
  };

  const addTag = (tagName: string) => {
    const cleanTag = tagName.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const filteredSuggestions = availableTags.filter(t => 
    t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)
  );

  // --- VOICE HANDLER ---
  const handleAudioComplete = (result: AudioAnalysisResult) => {
      setNewEntry(prev => (prev ? prev + "\n\n" + result.transcription : result.transcription));
      setMood(result.mood_score);
      setTags(prev => [...new Set([...prev, ...result.tags, "Voice Note"])]);
      setIsVoiceMode(false);
  };

  // --- SAVE HANDLER ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    const isFormValid = activeTemplate && formAnswers.some(a => a.trim() !== '');
    const isTextValid = !activeTemplate && newEntry.trim() !== '';

    if (!isFormValid && !isTextValid) return;

    setSaving(true);

    // 1. Prepare Content
    let plainContent = newEntry;
    if (activeTemplate) {
        plainContent = `**${activeTemplate.name}**\n\n`;
        activeTemplate.prompts.forEach((prompt, idx) => {
            plainContent += `**${prompt}**\n${formAnswers[idx] || '-(Skipped)-'}\n\n`;
        });
    }

    try {
      // 2. Encrypt Content
      let contentToSave = plainContent;
      let isEncrypted = false;

      try {
        contentToSave = await encrypt(plainContent);
        isEncrypted = true;
      } catch (err) {
        console.error("Encryption failed", err);
        alert("Security Error: Could not encrypt. Save aborted.");
        setSaving(false);
        return;
      }

      // 3. Save to Firestore
      if (initialEntry) {
        await updateDoc(doc(db, 'journals', initialEntry.id), { 
            content: contentToSave, 
            moodScore: mood,
            tags: tags,
            isEncrypted: isEncrypted
        });
      } else {
        await addDoc(collection(db, 'journals'), {
          uid: user.uid,
          content: contentToSave,
          moodScore: mood,
          sentiment: 'Pending', 
          weather, 
          tags: tags,
          createdAt: Timestamp.now(),
          isEncrypted: isEncrypted
        });
      }

      // Reset
      setNewEntry('');
      setFormAnswers([]);
      setActiveTemplate(null);
      setMood(5);
      setTags([]);
      onSaveComplete();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible relative">
        
        {/* HEADER */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-3">
             
             {/* LEFT: Weather Widget */}
             <div>
                 {weather ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                      <span>{weather.condition}</span>
                      <span className="font-bold">{weather.temp}°C</span>
                      {!initialEntry && (
                          <button type="button" onClick={fetchLocalWeather} disabled={weatherLoading} className="ml-1 text-blue-400 hover:text-blue-600">
                              <ArrowPathIcon className={`h-3 w-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                          </button>
                      )}
                    </div>
                ) : (
                    !initialEntry && (
                        <button 
                            type="button" 
                            onClick={fetchLocalWeather} 
                            disabled={weatherLoading}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-2 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm"
                        >
                            {weatherLoading ? (
                                <ArrowPathIcon className="h-3 w-3 animate-spin" />
                            ) : (
                                <MapPinIcon className="h-3 w-3" />
                            )}
                            <span>Add Weather</span>
                        </button>
                    )
                )}
             </div>

             {/* RIGHT: Template Controls */}
             <div className="flex items-center gap-2">
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
        </div>
        
        {/* VOICE MODE OVERLAY */}
        {isVoiceMode ? (
            <div className="p-6">
                <AudioRecorder 
                    onAnalysisComplete={handleAudioComplete}
                    onCancel={() => setIsVoiceMode(false)}
                />
            </div>
        ) : (
            <form onSubmit={handleSave} className="p-4 space-y-4">
            
            {/* EDITOR AREA */}
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
                <div className="relative">
                    <textarea
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="How are you feeling today?"
                        className="w-full h-[45vh] p-4 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none text-gray-700 leading-relaxed font-mono"
                    />
                    {/* Floating Voice Button */}
                    <button
                        type="button"
                        onClick={() => setIsVoiceMode(true)}
                        className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all active:scale-95 group"
                        title="Voice Note"
                    >
                        <MicrophoneIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}

            {/* MOOD SLIDER */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Mood Score</label>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${mood >= 7 ? 'text-green-700 bg-green-100' : mood <= 4 ? 'text-red-700 bg-red-100' : 'text-yellow-700 bg-yellow-100'}`}>
                        {mood}/10
                    </span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Struggling</span>
                    <span>Neutral</span>
                    <span>Thriving</span>
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                
                {/* TAG INPUT */}
                <div className="relative group w-full sm:flex-1">
                    <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                        <TagIcon className="h-4 w-4 text-gray-400" />
                        
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        ))}

                        <input 
                            type="text"
                            value={tagInput}
                            onChange={(e) => {
                                setTagInput(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onKeyDown={handleAddTag}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={tags.length === 0 ? "Add tags (e.g. Grateful)..." : ""}
                            className="flex-1 min-w-[120px] text-sm border-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-1 w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto z-50">
                            {filteredSuggestions.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    onClick={() => addTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
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
        )}
    </div>
  );
}