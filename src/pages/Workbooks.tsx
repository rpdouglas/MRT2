import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WORKBOOKS } from '../data/workbooks';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { BookOpenIcon, StarIcon, HeartIcon, AcademicCapIcon, ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Globe, BookOpen, ExternalLink } from 'lucide-react';

const FELLOWSHIP_RESOURCES = [
  { name: 'Alcoholics Anonymous', desc: 'Traditional 12-step fellowship.', official: 'https://www.aa.org', lit: 'https://www.aa.org/the-big-book' },
  { name: 'Narcotics Anonymous', desc: '12-step fellowship for all addictions.', official: 'https://www.na.org', lit: 'https://www.na.org/recovery-literature/' },
  { name: 'SMART Recovery', desc: 'CBT-based mutual support.', official: 'https://smartrecovery.org', lit: 'https://smartrecovery.org/smart-recovery-toolbox/' },
  { name: 'Recovery Dharma', desc: 'Buddhist-inspired path.', official: 'https://recoverydharma.org', lit: 'https://recoverydharma.org/book/' },
  { name: 'Women for Sobriety', desc: 'Empowerment-based support.', official: 'https://womenforsobriety.org', lit: 'https://womenforsobriety.org/catalog/' }
];

export default function Workbooks() {
  const [activeTab, setActiveTab] = useState<'workbooks' | 'literature'>('workbooks');

  const getTheme = (type: string) => {
    switch (type) {
      case 'general': return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-l-yellow-500', icon: StarIcon };
      case 'steps': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-600', icon: BookOpenIcon };
      default: return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500', icon: HeartIcon };
    }
  };

  return (
    <div className={`pb-24 relative min-h-screen ${THEME.workbooks.page}`}>
      
      {/* HEADER */}
      <div className="flex-shrink-0 z-10">
          <VibrantHeader 
            title="My Workbooks"
            subtitle="Structured guides to process your journey."
            icon={AcademicCapIcon}
            fromColor={THEME.workbooks.header.from}
            viaColor={THEME.workbooks.header.via}
            toColor={THEME.workbooks.header.to}
          />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-30 space-y-6 flex flex-col">
        
        {/* TAB NAVIGATION */}
        <div className="flex p-1 space-x-1 bg-emerald-100/50 rounded-xl mb-2 overflow-x-auto shadow-sm border border-emerald-200 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('workbooks')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all duration-200 uppercase tracking-wide ${
              activeTab === 'workbooks'
                ? 'bg-white text-emerald-800 shadow-md transform scale-[1.02]'
                : 'text-emerald-700 hover:bg-white/50'
            }`}
          >
            <BookOpenIcon className="w-4 h-4" />
            Workbooks
          </button>
          <button
            onClick={() => setActiveTab('literature')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all duration-200 uppercase tracking-wide ${
              activeTab === 'literature'
                ? 'bg-white text-emerald-800 shadow-md transform scale-[1.02]'
                : 'text-emerald-700 hover:bg-white/50'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Fellowships
          </button>
        </div>

        {/* WORKBOOKS CONTENT */}
        {activeTab === 'workbooks' && (
            <div className="space-y-4 animate-fadeIn">
              {WORKBOOKS.map((workbook) => {
                  const theme = getTheme(workbook.type);
                  
                  return (
                      <Link 
                          key={workbook.id} 
                          to={`/workbooks/${workbook.id}`}
                          className={`block relative group bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md ${theme.border} border-l-[6px]`}
                      >
                          <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${theme.bg} ${theme.color}`}>
                                  <theme.icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                          {workbook.title}
                                      </h3>
                                      <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                  </div>
                                  <p className="text-base text-gray-600 mb-3 line-clamp-2">
                                      {workbook.description}
                                  </p>
                                  <div className="flex items-center gap-3">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${theme.bg} ${theme.color} border-transparent`}>
                                          {workbook.sections.length} Sections
                                      </span>
                                      {workbook.type === 'steps' && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                              12-Step Compatible
                                          </span>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </Link>
                  );
              })}
            </div>
        )}

        {/* LITERATURE CONTENT (FELLOWSHIP RESOURCES DIRECTORY) */}
        {activeTab === 'literature' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
              {FELLOWSHIP_RESOURCES.map((fellowship) => (
                <div key={fellowship.name} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-emerald-200/50 flex flex-col h-full hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-emerald-900">{fellowship.name}</h3>
                  <p className="text-sm text-emerald-700/80 mt-1 mb-4 flex-grow">{fellowship.desc}</p>
                  <div className="flex flex-col gap-2 mt-auto">
                    <a href={fellowship.official} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50 transition-colors text-emerald-800 group border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-sm">Official Website</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                    </a>
                    <a href={fellowship.lit} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50 transition-colors text-emerald-800 group border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-sm">Core Literature</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
        )}

      </div>
    </div>
  );
}
