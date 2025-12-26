import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInsightHistory, type SavedInsight } from '../lib/insights';
import VibrantHeader from '../components/VibrantHeader';
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
    <div className="pb-24 relative min-h-screen bg-fuchsia-100">
      {/* HEADER: The Wisdom */}
      <VibrantHeader 
        title="Insights"
        subtitle="A timeline of your AI coaching sessions and breakthroughs."
        icon={LightBulbIcon}
        fromColor="from-fuchsia-600"
        viaColor="via-pink-600"
        toColor="to-rose-500"
      />

      <div className="px-4 -mt-10 relative z-30">
        <div className="bg-white p-1.5 rounded-xl shadow-lg border border-fuchsia-200 flex max-w-md mx-auto">
            {(['all', 'journal', 'workbook'] as const).map((tab) => (
            <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all capitalize tracking-wide ${
                filter === tab 
                    ? 'bg-gradient-to-br from-fuchsia-600 to-rose-600 text-white shadow-md transform scale-105' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
                {tab}
            </button>
            ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 px-4 mt-6">
        {filteredInsights.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Insights Yet</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Generate analysis from your Journal or Workbooks to populate this log.
                </p>
            </div>
        ) : (
            filteredInsights.map((insight) => (
                <div key={insight.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    
                    <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {insight.type === 'journal' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                    <BookOpenIcon className="h-3.5 w-3.5" /> Journal
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                    <AcademicCapIcon className="h-3.5 w-3.5" /> Workbook
                                </span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                <CalendarDaysIcon className="h-3.5 w-3.5" />
                                {insight.createdAt.toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="p-5">
                        {insight.type === 'journal' && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Daily Reflection</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{insight.summary}</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 text-xs">
                                    <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-blue-700">
                                        Mood: <span className="font-bold">{insight.mood}</span>
                                    </div>
                                    <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-indigo-700">
                                        Sentiment: <span className="font-bold">{insight.sentiment}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                        <div className="text-orange-800 font-bold text-xs uppercase mb-1.5 flex items-center gap-1">
                                            <ShieldExclamationIcon className="h-4 w-4" /> Risk Analysis
                                        </div>
                                        <p className="text-xs text-orange-900 leading-relaxed">{insight.risk_analysis}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <div className="text-green-800 font-bold text-xs uppercase mb-1.5 flex items-center gap-1">
                                            <TrophyIcon className="h-4 w-4" /> Strength & Win
                                        </div>
                                        <p className="text-xs text-green-900 leading-relaxed">{insight.positive_reinforcement}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {insight.type === 'workbook' && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-purple-900 mb-1 flex items-center gap-2">
                                        {insight.scope_context}
                                    </h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                        <div className="text-blue-800 font-bold text-xs uppercase mb-1">Understanding</div>
                                        <p className="text-xs text-blue-900 leading-relaxed">{insight.pillars.understanding}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <div className="text-green-800 font-bold text-xs uppercase mb-1">Growth</div>
                                        <p className="text-xs text-green-900 leading-relaxed">{insight.pillars.emotional_resonance}</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                        <div className="text-orange-800 font-bold text-xs uppercase mb-1">Blind Spots</div>
                                        <p className="text-xs text-orange-900 leading-relaxed">{insight.pillars.blind_spots}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="text-gray-500 font-bold text-xs uppercase mb-2 flex items-center gap-1">
                                        <CheckCircleIcon className="h-4 w-4" /> Action Plan
                                    </div>
                                    <ul className="space-y-1.5">
                                        {insight.suggested_actions?.map((action: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                                <span className="text-purple-400 font-bold mt-0.5">•</span> {action}
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