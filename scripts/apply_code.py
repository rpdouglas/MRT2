import os

# =============================================================================
# src/components/journal/JournalEditor.tsx
# =============================================================================
journal_editor_content = r'''/**
 * src/components/journal/JournalEditor.tsx
 * GITHUB COMMENT:
 * [JournalEditor.tsx]
 * FIX: Constrained Tag Input width using min-w-0 to prevent flex blowout.
 * FIX: Replaced PlusIcon with CheckIcon for clearer 'Save' semantics.
 * FIX: Added explicit types to getSmartMood filter/reduce to satisfy strict no-implicit-any.
 * FIX: Ensured useQueryClient is properly imported.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useJournalOperations } from '../../hooks/useJournalOperations';
import { db } from '../../lib/firebase';
import { collection, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { 
    CheckIcon, // CHANGED from PlusIcon
    Cog6ToothIcon,
    MapPinIcon,
    ArrowPathIcon,
    TagIcon,
    XMarkIcon,
    MicrophoneIcon,
    FaceSmileIcon
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
  const { addJournal, updateJournal } = useJournalOperations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- SMART DEFAULT MOOD LOGIC ---
  const getSmartMood = () => {
      if (initialEntry) return initialEntry.moodScore;
      
      const cache = queryClient.getQueryData<JournalEntry[]>(['journals']);
      
      if (!cache || cache.length === 0) return 5;

      const recent = cache
        .filter((e: JournalEntry) => typeof e.moodScore === 'number' && e.moodScore > 0)
        .slice(0, 7);
      
      if (recent.length === 0) return 5;

      const sum = recent.reduce((acc: number, curr: JournalEntry) => acc + curr.moodScore, 0);
      return Math.round(sum / recent.length);
  };

  // State
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState(getSmartMood); 
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
        if (custTemplate.content) {
            setNewEntry(custTemplate.content);
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
            setActiveTemplate(null); 
        } 
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

  const handleAudioComplete = (result: AudioAnalysisResult) => {
      setNewEntry(prev => (prev ? prev + "\n\n" + result.transcription : result.transcription));
      setMood(result.mood_score);
      setTags(prev => [...new Set([...prev, ...result.tags, "Voice Note"])]);
      setIsVoiceMode(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    const isFormValid = activeTemplate && formAnswers.some(a => a.trim() !== '');
    const isTextValid = !activeTemplate && newEntry.trim() !== '';

    if (!isFormValid && !isTextValid) return;

    setSaving(true);

    let plainContent = newEntry;
    if (activeTemplate) {
        plainContent = `**${activeTemplate.name}**\n\n`;
        activeTemplate.prompts.forEach((prompt, idx) => {
            plainContent += `**${prompt}**\n${formAnswers[idx] || '-(Skipped)-'}\n\n`;
        });
    }

    try {
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

      if (initialEntry) {
        await updateJournal({ 
            id: initialEntry.id, 
            content: contentToSave, 
            moodScore: mood, 
            tags: tags, 
            isEncrypted: isEncrypted 
        });
      } else {
        await addJournal({
          content: contentToSave,
          moodScore: mood,
          sentiment: 'Pending', 
          weather: weather, 
          tags: tags,
          isEncrypted: isEncrypted
        });
      }

      setNewEntry('');
      setFormAnswers([]);
      setActiveTemplate(null);
      setMood(getSmartMood());
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)] md:h-[600px] relative">
        
        {/* === SECTION 1: FIXED HEADER === */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-3 shrink-0">
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
                        className="pl-3 pr-8 py-1.5 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white max-w-[140px] sm:max-w-none"
                        defaultValue=""
                        disabled={!!initialEntry} 
                    >
                        <option value="" disabled>Choose Template...</option>
                        <option value="none">Free Write</option>
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
        
        {/* === SECTION 2: SCROLLABLE EDITOR BODY === */}
        <div className="flex-1 overflow-y-auto p-4">
            {isVoiceMode ? (
                <div className="h-full flex items-center justify-center">
                    <AudioRecorder 
                        onAnalysisComplete={handleAudioComplete}
                        onCancel={() => setIsVoiceMode(false)}
                    />
                </div>
            ) : activeTemplate ? (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 min-h-full">
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
                                rows={3} 
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
                    placeholder="How are you feeling today?"
                    className="w-full h-full p-2 rounded-xl border-none focus:ring-0 shadow-none resize-none text-gray-700 leading-relaxed font-mono text-base placeholder:text-gray-300"
                />
            )}
        </div>

        {/* === SECTION 3: STICKY COMMAND TOOLBAR === */}
        <div className="border-t border-gray-200 bg-gray-50/95 backdrop-blur-sm p-3 shrink-0 flex flex-col gap-3">
            
            {/* Row 1: Mood Slider (Compact) */}
            <div className="flex items-center gap-3 px-2">
                <FaceSmileIcon className={`h-5 w-5 ${mood >= 7 ? 'text-green-600' : mood <= 4 ? 'text-red-500' : 'text-yellow-600'}`} />
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className={`text-xs font-bold w-6 text-center ${mood >= 7 ? 'text-green-700' : mood <= 4 ? 'text-red-700' : 'text-yellow-700'}`}>
                    {mood}
                </span>
            </div>

            {/* Row 2: Tags & Actions */}
            <div className="flex items-center gap-2">
                
                {/* Tag Input - CRITICAL FIX: min-w-0 added to prevent flex overflow */}
                <div className="relative flex-1 min-w-0 group">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                        <TagIcon className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center">
                            {tags.map(tag => (
                                <span key={tag} className="flex-shrink-0 flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
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
                                placeholder={tags.length === 0 ? "Add tags..." : ""}
                                className="min-w-[60px] text-xs border-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400 bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 max-h-32 overflow-y-auto z-50">
                            {filteredSuggestions.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    onClick={() => addTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mic Button */}
                <button
                    type="button"
                    onClick={() => setIsVoiceMode(true)}
                    className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors flex-shrink-0"
                    title="Voice Note"
                >
                    <MicrophoneIcon className="h-5 w-5" />
                </button>

                {/* Save Button (Swapped to CheckIcon) */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 flex items-center gap-1"
                >
                    {saving ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckIcon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{initialEntry ? 'Update' : 'Save'}</span>
                </button>
            </div>
        </div>
    </div>
  );
}
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Surgically patched: {path}")

if __name__ == "__main__":
    write_file("src/components/journal/JournalEditor.tsx", journal_editor_content)
    print("✨ SRE Fix complete: Resolved import error and implicit types.")