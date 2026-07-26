import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';
import VibrantHeader from '../components/VibrantHeader';
import TabBar from '../components/ui/TabBar';
import { THEME } from '../lib/theme';
import { PencilSquareIcon, ClockIcon, ChartBarIcon, BookOpenIcon } from '@heroicons/react/24/outline';

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
        // Clear template param if leaving write tab
        if (tab !== 'write') prev.delete('template');
        // Clear search param if leaving history tab
        if (tab !== 'history') prev.delete('search');
        return prev;
    });
  };

  const handleEdit = (entry: JournalEntry) => { setEditingEntry(entry); handleTabChange('write'); };

  const handleEntrySaved = () => { setEditingEntry(null); setSearchParams(prev => { prev.delete('template'); prev.set('tab', 'history'); return prev; });
  };

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.journal.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="My Journal"
            subtitle="Capture your thoughts."
            icon={BookOpenIcon}
            fromColor={THEME.journal.header.from}
            viaColor={THEME.journal.header.via}
            toColor={THEME.journal.header.to}
        />
      </div>

      {/* 2. FLOATING TABS (Overlaps Header) */}
      <div className="px-4 -mt-10 relative z-30 flex-shrink-0">
        <TabBar
          tabs={[
            { id: 'write', label: 'Write', icon: PencilSquareIcon },
            { id: 'history', label: 'History', icon: ClockIcon },
            { id: 'insights', label: 'Insights', icon: ChartBarIcon },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          border={THEME.journal.tabBar.border}
          hoverText={THEME.journal.tabBar.hoverText}
          activeFrom={THEME.journal.header.from}
          activeTo={THEME.journal.header.to}
        />
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
            <div className="animate-fadeIn h-full">
                <JournalHistory onEdit={handleEdit} />
            </div>
        )}
        
        {activeTab === 'insights' && (
            <div className="animate-fadeIn h-full">
                <JournalInsights />
            </div>
        )}

      </div>
    </div>
  );
}
