import { PencilSquareIcon, ClockIcon, ChartPieIcon } from '@heroicons/react/24/outline';

interface JournalTabsProps {
  activeTab: 'write' | 'history' | 'insights';
  onChange: (tab: 'write' | 'history' | 'insights') => void;
}

export default function JournalTabs({ activeTab, onChange }: JournalTabsProps) {
  return (
    <div className="flex p-1 space-x-1 bg-blue-100/50 rounded-xl mb-6 overflow-x-auto">
      <button
        onClick={() => onChange('write')}
        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          activeTab === 'write'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-blue-600 hover:bg-white/50'
        }`}
      >
        <PencilSquareIcon className="w-4 h-4" />
        New Entry
      </button>
      <button
        onClick={() => onChange('history')}
        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          activeTab === 'history'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-blue-600 hover:bg-white/50'
        }`}
      >
        <ClockIcon className="w-4 h-4" />
        History
      </button>
      <button
        onClick={() => onChange('insights')}
        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          activeTab === 'insights'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-blue-600 hover:bg-white/50'
        }`}
      >
        <ChartPieIcon className="w-4 h-4" />
        Insights
      </button>
    </div>
  );
}