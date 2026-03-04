import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInsightHistory, type SavedInsight } from '../lib/insights';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { useTaskOperations } from '../hooks/useTaskOperations'; 
import { addDays } from 'date-fns';
import { 
    LightBulbIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    PlusCircleIcon,
    ShieldExclamationIcon,
    TrophyIcon,
    CalendarDaysIcon,
    BookOpenIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

interface InsightWithActions {
    suggested_actions?: string[];
    actionableSteps?: string[];
    actionable_advice?: string[];
    strengths?: string[];
    risks?: string[];
    pillars?: {
        growth?: string;
        blind_spots?: string;
        understanding?: string;
        emotional_resonance?: string;
    };
}

const getActions = (data: unknown): string[] => {
    const insight = data as InsightWithActions;
    if (insight.suggested_actions && Array.isArray(insight.suggested_actions)) return insight.suggested_actions;
    if (insight.actionableSteps && Array.isArray(insight.actionableSteps)) return insight.actionableSteps;
    if (insight.actionable_advice && Array.isArray(insight.actionable_advice)) return insight.actionable_advice;
    return [];
};

const getStrengths = (data: unknown): string[] => {
    const insight = data as InsightWithActions;
    if (insight.strengths && Array.isArray(insight.strengths)) return insight.strengths;
    if (insight.pillars?.growth) return [insight.pillars.growth]; 
    return [];
};

const getRisks = (data: unknown): string[] => {
    const insight = data as InsightWithActions;
    if (insight.risks && Array.isArray(insight.risks)) return insight.risks;
    if (insight.pillars?.blind_spots) return [insight.pillars.blind_spots];
    return [];
};

export default function InsightsLog() {
    const { user } = useAuth();
    const { addTask } = useTaskOperations(); 
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
            await addTask({
                title: action,
                recurrence: { type: 'once' },
                priority: 'Medium',
                dueDate: dueDate,
                source: 'ai' 
            });
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
                subtitle="Daily analysis and coaching history." 
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
                            ? 'bg-gradient-to-br from-fuchsia-600 to-rose-600 text-white shadow-md' 
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
                    </div>
                ) : (
                    filteredInsights.map((insight) => {
                        const actions = getActions(insight).slice(0, 3);
                        const strengths = getStrengths(insight);
                        const risks = getRisks(insight);

                        return (
                            <div key={insight.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {insight.type === 'journal' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase border border-blue-200">
                                                <BookOpenIcon className="h-3 w-3" /> Journal
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase border border-purple-200">
                                                <AcademicCapIcon className="h-3 w-3" /> Workbook
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                            <CalendarDaysIcon className="h-3 w-3" />
                                            {insight.createdAt.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 space-y-5">
                                    <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
                                    
                                    {/* STRENGTHS & RISKS GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                            <div className="text-green-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                <TrophyIcon className="h-4 w-4" /> Strengths & Wins
                                            </div>
                                            <ul className="text-xs text-green-900 leading-relaxed list-disc pl-4 space-y-1">
                                                {strengths.length > 0 ? strengths.map((s, idx) => <li key={idx}>{s}</li>) : <li>Persistence in recovery.</li>}
                                            </ul>
                                        </div>
                                        
                                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                            <div className="text-orange-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                <ShieldExclamationIcon className="h-4 w-4" /> Risk Analysis
                                            </div>
                                            <ul className="text-xs text-orange-900 leading-relaxed list-disc pl-4 space-y-1">
                                                {risks.length > 0 ? risks.map((r, idx) => <li key={idx}>{r}</li>) : <li>None detected.</li>}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* ACTION PLAN SECTION */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="text-gray-500 font-bold text-xs uppercase mb-3 flex items-center gap-1">
                                            <CheckCircleIcon className="h-4 w-4" /> Suggested Actions
                                        </div>
                                        <ul className="space-y-2">
                                            {actions.map((step, idx) => (
                                                <li key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-xs text-gray-700">
                                                    <span>{step}</span>
                                                    <button
                                                        onClick={() => !addedActions.has(step) && handleAddToTasks(step)}
                                                        disabled={addedActions.has(step)}
                                                        className={`p-1.5 rounded-full transition-all ${addedActions.has(step) ? 'text-green-600 bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                    >
                                                        {addedActions.has(step) ? <CheckCircleIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
