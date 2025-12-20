import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserJournals } from '../lib/journal';
import { calculateJournalStats } from '../lib/gamification';
import { 
    FireIcon, 
    ChartBarIcon, 
    PencilSquareIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';
import JournalTabs from '../components/journal/JournalTabs';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';

export default function Journal() {
  const { user } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'insights'>('write');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Stats Data State
  const [streak, setStreak] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

  // Initial Load Logic (Stats)
  useEffect(() => {
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* --- NEW HEADER (Tasks Style) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
                Daily Journal
            </h1>
            <p className="text-sm text-gray-500 mt-1">Reflect, release, and recover. One day at a time.</p>
          </div>
      </div>

      {/* --- MINI STATS GRID --- */}
      <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Streak</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-orange-600">
                  <FireIcon className="h-6 w-6" />
                  {streak}
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Consistency</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-blue-600">
                  <ChartBarIcon className="h-6 w-6" />
                  {consistency}<span className="text-xs text-gray-400 self-end mb-1">/wk</span>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Words</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-purple-600">
                  <PencilSquareIcon className="h-6 w-6" />
                  {totalWords > 1000 ? `${(totalWords/1000).toFixed(1)}k` : totalWords}
              </div>
          </div>
      </div>

      {/* --- TABS --- */}
      <JournalTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* --- CONTENT --- */}
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