import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserJournals } from '../lib/journal';
import { calculateJournalStats } from '../lib/gamification';
import { 
    FireIcon, 
    ChartBarIcon, 
    PencilSquareIcon 
} from '@heroicons/react/24/outline';
import JournalTabs from '../components/journal/JournalTabs';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';

const MANTRAS = [
  "One day at a time.",
  "Progress, not perfection.",
  "This too shall pass.",
  "Serenity, Courage, Wisdom.",
  "Keep coming back.",
  "Easy does it.",
  "First things first.",
  "Let go and let God.",
  "To thine own self be true.",
  "Just for today.",
  "Feelings are not facts.",
  "Nothing changes if nothing changes."
];

export default function Journal() {
  const { user } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'insights'>('write');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Header Data State
  const [greeting, setGreeting] = useState('Welcome');
  const [streak, setStreak] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [mantra, setMantra] = useState('');

  // Initial Load Logic (Greeting, Mantra, Streak)
  useEffect(() => {
    // 1. Set Greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // 2. Pick Random Mantra
    setMantra(MANTRAS[Math.floor(Math.random() * MANTRAS.length)]);

    // 3. Calculate Stats
    const loadStats = async () => {
        if (!user) return;
        try {
            const journals = await getUserJournals(user.uid);
            const stats = calculateJournalStats(journals);
            setStreak(stats.journalStreak);
            setConsistency(stats.consistencyRate);
            setTotalWords(stats.totalWords);
        } catch (error) {
            console.error("Failed to load journal stats", error);
        }
    };
    loadStats();
  }, [user]);

  // Called when user clicks "Edit" in History tab
  const handleEditRequest = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setActiveTab('write');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Called when Editor successfully saves
  const handleSaveComplete = () => {
    setEditingEntry(null);
    setActiveTab('history'); // Auto-switch to history to see the result
  };

  return (
    <div className="max-w-5xl mx-auto -mt-6">
      
      {/* --- SMART HEADER --- */}
      <div className="mb-8 p-6 bg-gradient-to-r from-white to-blue-50/30 rounded-2xl border border-blue-50 shadow-sm animate-fadeIn">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {greeting}, <span className="text-blue-700">{user?.displayName ? user.displayName.split(' ')[0] : 'Friend'}</span>
                </h1>
                <p className="text-gray-500 font-medium mt-1 italic text-sm">
                    "{mantra}"
                </p>
             </div>
             
             {/* GAMIFICATION BADGES ROW (Reduced size for mobile fit) */}
             <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                 
                 {/* 1. Streak Badge */}
                 <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-blue-100 transition-transform hover:scale-105 cursor-default" title="Your current daily journaling streak">
                    <FireIcon className={`h-3.5 w-3.5 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                    <span className="text-xs font-bold text-gray-700">{streak} Day Streak</span>
                 </div>

                 {/* 2. Consistency Badge */}
                 <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-blue-100 transition-transform hover:scale-105 cursor-default" title="Average entries per week">
                    <ChartBarIcon className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-gray-700">{consistency} / wk</span>
                 </div>

                 {/* 3. Word Count Badge */}
                 <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-blue-100 transition-transform hover:scale-105 cursor-default" title="Total words journaled">
                    <PencilSquareIcon className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-bold text-gray-700">{totalWords.toLocaleString()} Words</span>
                 </div>

             </div>
         </div>
      </div>

      <JournalTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="transition-opacity duration-200">
        {activeTab === 'write' ? (
          <JournalEditor 
            initialEntry={editingEntry} 
            onSaveComplete={handleSaveComplete} 
          />
        ) : activeTab === 'history' ? (
          <JournalHistory 
            onEdit={handleEditRequest} 
          />
        ) : (
          <JournalInsights />
        )}
      </div>
    </div>
  );
}