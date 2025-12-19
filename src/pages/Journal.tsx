import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserJournals } from '../lib/journal';
import { calculateJournalStats } from '../lib/gamification';
import { FireIcon } from '@heroicons/react/24/outline';
import JournalTabs from '../components/journal/JournalTabs';
import JournalEditor, { JournalEntry } from '../components/journal/JournalEditor';
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

    // 3. Calculate Streak
    const loadStats = async () => {
        if (!user) return;
        try {
            const journals = await getUserJournals(user.uid);
            const stats = calculateJournalStats(journals);
            setStreak(stats.journalStreak);
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
    <div className="max-w-5xl mx-auto">
      
      {/* --- SMART HEADER --- */}
      <div className="mb-8 p-6 bg-gradient-to-r from-white to-blue-50/30 rounded-2xl border border-blue-50 shadow-sm animate-fadeIn">
         <div className="flex flex-row items-center justify-between gap-4">
             <div>
                {/* UPDATED: Reduced text size to 2xl */}
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {greeting}, <span className="text-blue-700">{user?.displayName ? user.displayName.split(' ')[0] : 'Friend'}</span>
                </h1>
                <p className="text-gray-500 font-medium mt-1 italic text-sm">
                    "{mantra}"
                </p>
             </div>
             
             {/* Streak Badge - Right Justified on same line */}
             <div className="flex-shrink-0 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-100 transition-transform hover:scale-105 cursor-default" title="Your current daily journaling streak">
                <FireIcon className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                <span className="font-bold text-gray-700">{streak} Day Streak</span>
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