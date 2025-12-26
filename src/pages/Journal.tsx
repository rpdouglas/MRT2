import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { PencilSquareIcon, ClockIcon, ChartBarIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'write';
  const initialTemplateId = searchParams.get('template');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
        prev.set('tab', tab);
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

      {/* 2. TAB BAR (Stickyish) */}
      <div className="px-4 py-4 z-20 flex-shrink-0">
        <div className="flex p-1 space-x-1 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 shadow-sm">
           <button onClick={() => handleTabChange('write')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'write' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500'}`}>
             <PencilSquareIcon className="h-4 w-4" /> Write
           </button>
           <button onClick={() => handleTabChange('history')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500'}`}>
             <ClockIcon className="h-4 w-4" /> History
           </button>
           <button onClick={() => handleTabChange('insights')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'insights' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500'}`}>
             <ChartBarIcon className="h-4 w-4" /> Insights
           </button>
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {activeTab === 'write' && (
            <div className="animate-fadeIn h-full">
                <JournalEditor initialEntry={editingEntry} initialTemplateId={initialTemplateId} onSaveComplete={handleEntrySaved} />
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