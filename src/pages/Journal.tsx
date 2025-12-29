import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
  PencilSquareIcon, 
  ClockIcon, 
  ChartBarIcon, 
  BookOpenIcon 
} from '@heroicons/react/24/outline';

export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const activeTab = searchParams.get('tab') || 'write';
  const initialTemplateId = searchParams.get('template');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Handlers
  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
        prev.set('tab', tab);
        // Clear template param if leaving write tab so it doesn't persist unwantedly
        if (tab !== 'write') prev.delete('template');
        return prev;
    });
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    handleTabChange('write');
  };

  const handleEntrySaved = () => {
    setEditingEntry(null);
    setSearchParams(prev => {
        prev.delete('template');
        prev.set('tab', 'history');
        return prev;
    });
  };

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.journal.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Journal"
            subtitle="Capture your thoughts."
            icon={BookOpenIcon}
            fromColor={THEME.journal.header.from}
            viaColor={THEME.journal.header.via}
            toColor={THEME.journal.header.to}
        />
      </div>

      {/* 2. FLOATING TABS (Overlaps Header) */}
      <div className="px-4 -mt-10 relative z-30 flex-shrink-0">
        <div className="bg-white p-1.5 rounded-xl shadow-lg border border-indigo-200 flex">
           <button 
             onClick={() => handleTabChange('write')} 
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${
               activeTab === 'write' 
                 ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md transform scale-105' 
                 : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
             }`}
           >
             <PencilSquareIcon className="h-4 w-4" />
             Write
           </button>
           <button 
             onClick={() => handleTabChange('history')} 
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${
               activeTab === 'history' 
                 ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md transform scale-105' 
                 : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
             }`}
           >
             <ClockIcon className="h-4 w-4" />
             History
           </button>
           <button 
             onClick={() => handleTabChange('insights')} 
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${
               activeTab === 'insights' 
                 ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md transform scale-105' 
                 : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
             }`}
           >
             <ChartBarIcon className="h-4 w-4" />
             Insights
           </button>
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      {/* pt-6 ensures content doesn't butt up against the floating tabs immediately */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-20">
        
        {activeTab === 'write' && (
            <div className="animate-fadeIn h-full flex flex-col">
                <JournalEditor 
                    initialEntry={editingEntry} 
                    initialTemplateId={initialTemplateId} 
                    onSaveComplete={handleEntrySaved} 
                />
            </div>
        )}
        
        {activeTab === 'history' && (
            <div className="animate-fadeIn">
                <JournalHistory onEdit={handleEdit} />
            </div>
        )}
        
        {activeTab === 'insights' && (
            <div className="animate-fadeIn">
                <JournalInsights />
            </div>
        )}

      </div>
    </div>
  );
}