import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInsightHistory, type SavedInsight } from '../lib/insights';
import { 
  LightBulbIcon, 
  SparklesIcon, 
  AcademicCapIcon, 
  BookOpenIcon, 
  ShieldExclamationIcon,
  CheckCircleIcon,
  TrophyIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function InsightsLog() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'journal' | 'workbook'>('all');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getInsightHistory(user.uid);
      setInsights(data);
    } catch (error) {
      console.error("Failed to load insights log", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInsights = insights.filter(item => filter === 'all' || item.type === filter);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading wisdom archive...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <LightBulbIcon className="h-8 w-8 text-yellow-500" />
                Wisdom Log
            </h1>
            <p className="text-sm text-gray-500 mt-1">A timeline of your AI coaching sessions and breakthroughs.</p>
          </div>
          
          {/* FILTER TABS */}
          <div className="flex p-1 space-x-1 bg-gray-100 rounded-xl">
             {(['all', 'journal', 'workbook'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                    filter === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
             ))}
          </div>
      </div>

      {/* TIMELINE LIST */}
      <div className="space-y-6">
        {filteredInsights.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Insights Saved Yet</h3>
                <p className="text-gray-500">Generate analysis from your Journal or Workbooks to populate this log.</p>
            </div>
        ) : (
            filteredInsights.map((insight) => (
                <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* META HEADER */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {insight.type === 'journal' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <BookOpenIcon className="h-3 w-3" /> Journal
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <AcademicCapIcon className="h-3 w-3" /> Workbook
                                </span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <CalendarDaysIcon className="h-3 w-3" />
                                {insight.createdAt.toLocaleDateString()} • {insight.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>

                    {/* CONTENT BODY */}
                    <div className="p-5">
                        
                        {/* --- RENDER JOURNAL INSIGHT --- */}
                        {insight.type === 'journal' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Daily Reflection</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{insight.summary}</p>
                                </div>
                                <div className="flex gap-4 text-xs">
                                    <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-blue-700">
                                        Mood: <span className="font-bold">{insight.mood}</span>
                                    </div>
                                    <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-blue-700">
                                        Sentiment: <span className="font-bold">{insight.sentiment}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                        <div className="text-orange-800 font-bold text-xs uppercase mb-1 flex items-center gap-1">
                                            <ShieldExclamationIcon className="h-3 w-3" /> Risk
                                        </div>
                                        <p className="text-xs text-orange-900">{insight.risk_analysis}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <div className="text-green-800 font-bold text-xs uppercase mb-1 flex items-center gap-1">
                                            <TrophyIcon className="h-3 w-3" /> Win
                                        </div>
                                        <p className="text-xs text-green-900">{insight.positive_reinforcement}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- RENDER WORKBOOK INSIGHT --- */}
                        {insight.type === 'workbook' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-purple-900 mb-1">{insight.scope_context}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="text-blue-800 font-bold text-xs uppercase mb-1">Understanding</div>
                                        <p className="text-xs text-blue-900 leading-relaxed">{insight.pillars.understanding}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <div className="text-green-800 font-bold text-xs uppercase mb-1">Growth</div>
                                        <p className="text-xs text-green-900 leading-relaxed">{insight.pillars.emotional_resonance}</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                        <div className="text-orange-800 font-bold text-xs uppercase mb-1">Blind Spots</div>
                                        <p className="text-xs text-orange-900 leading-relaxed">{insight.pillars.blind_spots}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="text-gray-500 font-bold text-xs uppercase mb-2 flex items-center gap-1">
                                        <CheckCircleIcon className="h-3 w-3" /> Action Plan
                                    </div>
                                    <ul className="space-y-1">
                                        {insight.suggested_actions?.map((action: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                                <span className="text-purple-400">•</span> {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}