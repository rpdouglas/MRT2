import { useState } from 'react';
import JournalTabs from '../components/journal/JournalTabs';
import JournalEditor, { type JournalEntry } from '../components/journal/JournalEditor';
import JournalHistory from '../components/journal/JournalHistory';
import JournalInsights from '../components/journal/JournalInsights'; // NEW Import

export default function Journal() {
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'insights'>('write');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recovery Journal</h1>
        <p className="text-gray-500">Track your journey, moods, and daily reflections.</p>
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