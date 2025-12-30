/**
 * src/pages/InsightsLog.tsx
 * GITHUB COMMENT:
 * [InsightsLog.tsx]
 * UPDATED: UI labels changed to "Strengths & Wins" and "Risk Analysis" to match wizard.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInsightHistory, type SavedInsight } from '../lib/insights';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { addTask } from '../lib/tasks';
import { addDays } from 'date-fns';
import { 
    LightBulbIcon, 
    SparklesIcon, 
    AcademicCapIcon, 
    BookOpenIcon, 
    ShieldExclamationIcon, 
    CheckCircleIcon, 
    TrophyIcon, 
    CalendarDaysIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';

// Local interface to define the shape of potential action fields
interface InsightWithActions {
    suggested_actions?: string[];
    actionableSteps?: string[];
    actionable_advice?: string[];
}

// Helper to normalize different naming conventions from different API versions
const getActions = (data: unknown): string[] => {
    const insight = data as InsightWithActions;

    // 1. Check for standard "suggested_actions" (Current Standard)
    if (insight.suggested_actions && Array.isArray(insight.suggested_actions)) {
        return insight.suggested_actions;
    }
    // 2. Check for "actionableSteps" (Legacy Journal Analysis)
    if (insight.actionableSteps && Array.isArray(insight.actionableSteps)) {
        return insight.actionableSteps;
    }
    // 3. Check for "actionable_advice" (Raw Gemini Response)
    if (insight.actionable_advice && Array.isArray(insight.actionable_advice)) {
        return insight.actionable_advice;
    }
    return [];
};

export default function InsightsLog() {
    const { user } = useAuth();
    const [insights, setInsights] = useState<SavedInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'journal' | 'workbook'>('all');
    const [addedActions, setAddedActions] = useState<Set<string>>(new Set());

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

    const handleAddToTasks = async (action: string) => {
        if (!user) return;
        try {
            const dueDate = addDays(new Date(), 7);
            await addTask(user.uid, action, 'once', 'Medium', dueDate);
            setAddedActions(prev => new Set(prev).add(action));
        } catch (e) {
            console.error("Failed to add task", e);
        }
    };

    const filteredInsights = insights.filter(item => filter === 'all' || item.type === filter);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading wisdom archive...</div>;

    return (
        <div className={`pb-24 relative min-h-screen ${THEME.insights.page}`}>
            <VibrantHeader 
                title="Insights" 
                subtitle="A timeline of your AI coaching sessions and breakthroughs." 
                icon={LightBulbIcon} 
                fromColor={THEME.insights.header.from} 
                viaColor={THEME.insights.header.via} 
                toColor={THEME.insights.header.to} 
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
                    filteredInsights.map((insight) => {
                        // Normalize actions using the helper
                        const actions = getActions(insight).slice(0, 3); // STRICT LIMIT: 3 Items Max

                        return (
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
                                                    Mood: <span className="font-bold">{insight.moodScore}/10</span>
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
                                                    <ul className="text-xs text-orange-900 leading-relaxed list-disc pl-4 space-y-1">
                                                        {insight.risks && insight.risks.length > 0 ? (
                                                            insight.risks.map((risk, idx) => <li key={idx}>{risk}</li>)
                                                        ) : (
                                                            <li>None detected.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                                
                                                {/* ACTION ITEMS SECTION */}
                                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                                    <div className="text-green-800 font-bold text-xs uppercase mb-1.5 flex items-center gap-1">
                                                        <TrophyIcon className="h-4 w-4" /> Strengths & Wins
                                                    </div>
                                                    <ul className="text-xs text-green-900 leading-relaxed space-y-2">
                                                        {/* slice(0, 3) applied to historical view as well */}
                                                        {insight.actionableSteps && insight.actionableSteps.slice(0, 3).map((step, idx) => (
                                                            <li key={idx} className="flex items-start justify-between gap-2">
                                                                <span>{step}</span>
                                                                <button
                                                                    onClick={() => !addedActions.has(step) && handleAddToTasks(step)}
                                                                    disabled={addedActions.has(step)}
                                                                    className={`p-1 rounded-full transition-all ${addedActions.has(step) ? 'text-green-600 bg-green-200' : 'text-green-400 hover:text-green-700 hover:bg-green-200'}`}
                                                                    title="Add to Quests"
                                                                >
                                                                    {addedActions.has(step) ? <CheckCircleIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
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
                                                <p className="text-gray-600 text-sm leading-relaxed mt-2">{insight.summary}</p>
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
                                            
                                            {/* WORKBOOK ACTIONS */}
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="text-gray-500 font-bold text-xs uppercase mb-2 flex items-center gap-1">
                                                    <CheckCircleIcon className="h-4 w-4" /> Action Plan
                                                </div>
                                                <ul className="space-y-2">
                                                    {actions.length > 0 ? (
                                                        actions.map((action, idx) => (
                                                            <li key={idx} className="text-xs text-gray-700 flex items-center justify-between gap-2">
                                                                <div className="flex gap-2">
                                                                    <span className="text-purple-400 font-bold mt-0.5">•</span> 
                                                                    {action}
                                                                </div>
                                                                <button
                                                                    onClick={() => !addedActions.has(action) && handleAddToTasks(action)}
                                                                    disabled={addedActions.has(action)}
                                                                    className={`p-1 rounded-full transition-all flex-shrink-0 ${addedActions.has(action) ? 'text-green-500 bg-green-100' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-100'}`}
                                                                    title="Add to Quests"
                                                                >
                                                                    {addedActions.has(action) ? <CheckCircleIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
                                                                </button>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="text-xs text-gray-500 italic">No specific actions found.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}