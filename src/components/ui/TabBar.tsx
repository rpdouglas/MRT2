import type { ElementType } from 'react';

export interface TabBarItem {
  id: string;
  label: string;
  icon?: ElementType;
  badge?: number;
}

interface TabBarProps {
  tabs: TabBarItem[];
  activeTab: string;
  onChange: (id: string) => void;
  /** Fully-spelled Tailwind class, e.g. THEME.<feature>.tabBar.border */
  border: string;
  /** Fully-spelled Tailwind class, e.g. THEME.<feature>.tabBar.hoverText */
  hoverText: string;
  /** Fully-spelled Tailwind class, e.g. THEME.<feature>.header.from */
  activeFrom: string;
  /** Fully-spelled Tailwind class, e.g. THEME.<feature>.header.to */
  activeTo: string;
}

export default function TabBar({ tabs, activeTab, onChange, border, hoverText, activeFrom, activeTo }: TabBarProps) {
  return (
    <div className={`bg-white p-1.5 rounded-xl shadow-lg border ${border} flex min-w-0 overflow-x-auto no-scrollbar`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide whitespace-nowrap ${
            activeTab === tab.id
              ? `bg-gradient-to-br ${activeFrom} ${activeTo} text-white shadow-md transform scale-105`
              : `text-gray-500 ${hoverText} hover:bg-gray-50`
          }`}
        >
          {tab.icon && <tab.icon className="h-4 w-4" />}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black px-1 ${
              activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
