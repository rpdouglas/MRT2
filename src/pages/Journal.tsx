import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JournalEditor from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights';
import { 
  PencilSquareIcon, 
  ClockIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import type { JournalEntry } from '../components/journal/JournalEditor';

export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // DERIVED STATE: Single Source of Truth (The URL)
  const activeTab = searchParams.get('tab') || 'write';
  
  // EXTRACT TEMPLATE ID (for Deep Links like ?template=urge_log)
  const initialTemplateId = searchParams.get('template');
  
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Update URL directly. React will re-render with the new derived activeTab.
  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
        prev.set('tab', tab);
        // Clean up template param if leaving write tab so it doesn't persist unwantedly
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
    // Remove template param from URL after save to prevent it from reappearing
    setSearchParams(prev => {
        prev.delete('template');
        prev.set('tab', 'history');
        return prev;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
           <p className="text-gray-500 mt-1">Capture your thoughts, track your mood, and uncover patterns.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 space-x-1 bg-blue-50/50 rounded-xl border border-blue-100">
           <button
             onClick={() => handleTabChange('write')}
             className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'write' 
                 ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
             }`}
           >
             <PencilSquareIcon className="h-4 w-4" />
             Write
           </button>
           <button
             onClick={() => handleTabChange('history')}
             className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'history' 
                 ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
             }`}
           >
             <ClockIcon className="h-4 w-4" />
             History
           </button>
           <button
             onClick={() => handleTabChange('insights')}
             className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'insights' 
                 ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
             }`}
           >
             <ChartBarIcon className="h-4 w-4" />
             Insights
           </button>
        </div>
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
  );
}