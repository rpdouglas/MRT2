import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';
import VibrantHeader from '../components/VibrantHeader';
import { 
  PencilSquareIcon, 
  ClockIcon, 
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

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
    <div className="pb-24 bg-indigo-100 min-h-screen">
      
      {/* VIBRANT HEADER: The Deep Dive */}
      <VibrantHeader 
        title="Journal"
        subtitle="Capture your thoughts and uncover patterns."
        icon={BookOpenIcon}
        fromColor="from-indigo-600"
        viaColor="via-purple-600"
        toColor="to-violet-600"
      />

      <div className="max-w-7xl mx-auto space-y-6 px-4 -mt-10 relative z-20">
      
        {/* Tab Navigation */}
        <div className="flex p-1 space-x-1 bg-white rounded-xl border border-indigo-200 shadow-sm">
           <button
             onClick={() => handleTabChange('write')}
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'write' 
                 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
             }`}
           >
             <PencilSquareIcon className="h-4 w-4" />
             Write
           </button>
           <button
             onClick={() => handleTabChange('history')}
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'history' 
                 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
             }`}
           >
             <ClockIcon className="h-4 w-4" />
             History
           </button>
           <button
             onClick={() => handleTabChange('insights')}
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'insights' 
                 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
             }`}
           >
             <ChartBarIcon className="h-4 w-4" />
             Insights
           </button>
        </div>

        <div className="mt-6">
            {activeTab === 'write' && (
                <div className="animate-fadeIn">
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
    </div>
  );
}