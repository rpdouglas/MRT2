import { useState, useEffect, useCallback, type ElementType } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInsightHistory, type SavedInsight } from '../lib/insights';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { useTaskOperations } from '../hooks/useTaskOperations'; 
import { groupItemsByYearAndMonth } from '../lib/grouping';
import { addDays, format } from 'date-fns';
import { Disclosure, Transition } from '@headlessui/react';
import { LightBulbIcon, SparklesIcon, CheckCircleIcon, PlusCircleIcon, ShieldExclamationIcon, TrophyIcon, CalendarDaysIcon, BookOpenIcon, AcademicCapIcon, LinkIcon, HashtagIcon, BoltIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface InsightWithActions {
    scope_context?: string;
    suggested_actions?: string[];
    actionableSteps?: string[];
    actionable_advice?: string[];
    strengths?: string[];
    risks?: string[];
    key_themes?: string[];
    hidden_correlations?: string[];
    core_triggers?: string[];
    emotional_velocity?: string;
    relapse_risk_level?: string;
    trajectory?: string;
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
    if (insight.pillars?.emotional_resonance) return [insight.pillars.emotional_resonance];
    return [];
};

const getRisks = (data: unknown): string[] => {
    const insight = data as InsightWithActions;
    if (insight.risks && Array.isArray(insight.risks)) return insight.risks;
    if (insight.pillars?.blind_spots) return [insight.pillars.blind_spots];
    return [];
};

// Reusable component to eliminate JSX duplication
const InsightBlock = ({ 
    show, title, icon: Icon, content, theme 
}: { 
    show: boolean, title: string, icon: ElementType, content: string | string[], theme: 'blue' | 'green' | 'orange' | 'rose' | 'amber' 
}) => {
    if (!show) return null;

    const themes = {
        blue: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-900', title: 'text-blue-800' },
        green: { bg: 'bg-green-50 border-green-100', text: 'text-green-900', title: 'text-green-800' },
        orange: { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-900', title: 'text-orange-800' },
        rose: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-900', title: 'text-rose-800' },
        amber: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-900', title: 'text-amber-800' }
    };

    const t = themes[theme];

    return (
        <div className={`${t.bg} p-3 rounded-xl border`}>
            <div className={`${t.title} font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1`}>
                <Icon className="h-4 w-4" /> {title}
            </div>
            {Array.isArray(content) ? (
                <ul className={`${t.text} text-xs leading-relaxed list-disc pl-4 space-y-1`}>
                    {content.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
            ) : (
                <p className={`${t.text} text-xs leading-relaxed`}>{content}</p>
            )}
        </div>
    );
};

export default function InsightsLog() {
    const { user } = useAuth();
    const { addTask } = useTaskOperations(); 
    const [insights, setInsights] = useState<SavedInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'journal' | 'workbook'>('all');
    const [addedActions, setAddedActions] = useState<Set<string>>(new Set());

    // Expand/Collapse State
    const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set([new Date().getFullYear().toString()]));
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([`${new Date().getFullYear()}-${new Date().getMonth()}`]));

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

    const toggleYear = (year: string) => {
        setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year);
            else next.add(year);
            return next;
        });
    };

    const toggleMonth = (year: string, monthIndex: number) => {
        const key = `${year}-${monthIndex}`;
        setExpandedMonths(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const filteredInsights = insights.filter(item => filter === 'all' || item.type === filter);
    
    // Group Data
    const groupedInsights = groupItemsByYearAndMonth(filteredInsights);
    const sortedYears = Object.keys(groupedInsights).sort((a, b) => Number(b) - Number(a));

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

            <div className="max-w-4xl mx-auto px-4 mt-8">
                {filteredInsights.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SparklesIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Insights Yet</h3>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedYears.map(year => {
                            const monthsInYear = groupedInsights[year];
                            const sortedMonthIndexes = Object.keys(monthsInYear)
                                .map(Number)
                                .sort((a, b) => b - a);
                            const yearTotal = sortedMonthIndexes.reduce((sum, mIndex) => sum + monthsInYear[mIndex].length, 0);
                            const isYearExpanded = expandedYears.has(year);

                            return (
                                <div key={year} className="mb-2">
                                    <button 
                                        onClick={() => toggleYear(year)} 
                                        className="w-full flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-fuchsia-800 rounded-full"></div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{year}</h2>
                                            <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isYearExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {yearTotal} Insights
                                        </span>
                                    </button>

                                    {isYearExpanded && (
                                        <div className="mt-2 space-y-4">
                                            {sortedMonthIndexes.map(monthIndex => {
                                                const monthInsights = monthsInYear[monthIndex];
                                                const monthName = format(new Date(Number(year), monthIndex), 'MMMM');
                                                const isMonthExpanded = expandedMonths.has(`${year}-${monthIndex}`);

                                                return (
                                                    <div key={`${year}-${monthIndex}`}>
                                                        <button 
                                                            onClick={() => toggleMonth(year, monthIndex)} 
                                                            className={`w-[calc(100%-1rem)] mx-auto flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm py-2 px-3 mb-2 rounded-lg border shadow-sm transition-colors ${isMonthExpanded ? 'bg-fuchsia-50/95 border-fuchsia-200' : 'bg-white/95 border-gray-200 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isMonthExpanded ? <ChevronDownIcon className="h-3 w-3 text-fuchsia-500" /> : <ChevronRightIcon className="h-3 w-3 text-gray-400" />}
                                                                <div className="flex items-center gap-2">
                                                                    <CalendarDaysIcon className={`h-4 w-4 ${isMonthExpanded ? 'text-fuchsia-600' : 'text-gray-400'}`} />
                                                                    <h3 className={`text-sm font-bold uppercase tracking-wide ${isMonthExpanded ? 'text-fuchsia-900' : 'text-gray-600'}`}>{monthName}</h3>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMonthExpanded ? 'bg-fuchsia-200 text-fuchsia-800' : 'bg-gray-100 text-gray-500'}`}>
                                                                {monthInsights.length}
                                                            </span>
                                                        </button>

                                                        {isMonthExpanded && (
                                                            <div className="ml-4 pl-3 sm:pl-6 border-l-2 border-fuchsia-100 py-2 space-y-4">
                                                                {monthInsights.map(insight => {
                                                                    const insightData = insight as unknown as InsightWithActions;
                                                                    const actions = getActions(insight).slice(0, 3);
                                                                    const strengths = getStrengths(insight);
                                                                    const risks = getRisks(insight);
                                                                    const understanding = insightData.pillars?.understanding;
                                                                    
                                                                    const keyThemes = insightData.key_themes || [];
                                                                    const hiddenCorrelations = insightData.hidden_correlations || [];
                                                                    const triggers = insightData.core_triggers || [];
                                                                    
                                                                    const scopeContext = insightData.scope_context || (insight.type === 'journal' ? 'Journal Insight' : 'Workbook Insight');

                                                                    return (
                                                                        <Disclosure key={insight.id} as="div" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                                            {({ open }) => (
                                                                                <>
                                                                                    <Disclosure.Button className="w-full flex justify-between items-center bg-gray-50/30 hover:bg-gray-50 px-4 py-3 sm:px-5 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-inset">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className={`p-2 rounded-xl border ${insight.type === 'journal' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                                                                {insight.type === 'journal' ? <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="text-sm font-bold text-gray-900 line-clamp-1">{scopeContext}</div>
                                                                                                <div className="text-[10px] text-gray-500 font-medium">{insight.createdAt.toLocaleDateString()}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                                                            {insightData.relapse_risk_level && (
                                                                                                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                                                                    insightData.relapse_risk_level === 'Low' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                                                    insightData.relapse_risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                                                    insightData.relapse_risk_level === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                                                    'bg-red-100 text-red-700 border-red-200'
                                                                                                }`}>
                                                                                                    {insightData.relapse_risk_level} Risk
                                                                                                </span>
                                                                                            )}
                                                                                            {insightData.trajectory && (
                                                                                                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                                                                    {insightData.trajectory}
                                                                                                </span>
                                                                                            )}
                                                                                            <div className={`p-1.5 rounded-full transition-transform ${open ? 'bg-fuchsia-100 text-fuchsia-600 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                                                                                                <ChevronDownIcon className="h-4 w-4" />
                                                                                            </div>
                                                                                        </div>
                                                                                    </Disclosure.Button>
                                                                                    
                                                                                    <Transition
                                                                                        enter="transition duration-150 ease-out"
                                                                                        enterFrom="transform scale-95 opacity-0"
                                                                                        enterTo="transform scale-100 opacity-100"
                                                                                        leave="transition duration-100 ease-out"
                                                                                        leaveFrom="transform scale-100 opacity-100"
                                                                                        leaveTo="transform scale-95 opacity-0"
                                                                                    >
                                                                                        <Disclosure.Panel className="p-4 sm:p-5 space-y-5 border-t border-gray-100 bg-white">
                                                                                            <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
                                                                                            
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                                                                                <InsightBlock show={!!understanding} title="Understanding" icon={AcademicCapIcon} content={understanding || ''} theme="blue" />
                                                                                                <InsightBlock show={strengths.length > 0} title="Strengths & Wins" icon={TrophyIcon} content={strengths} theme="green" />
                                                                                                <InsightBlock show={risks.length > 0} title="Risk Analysis" icon={ShieldExclamationIcon} content={risks} theme="orange" />
                                                                                                <InsightBlock show={keyThemes.length > 0} title="Key Themes" icon={HashtagIcon} content={keyThemes} theme="blue" />
                                                                                                <InsightBlock show={hiddenCorrelations.length > 0} title="Hidden Links" icon={LinkIcon} content={hiddenCorrelations} theme="rose" />
                                                                                                <InsightBlock show={triggers.length > 0} title="Triggers" icon={BoltIcon} content={triggers} theme="amber" />
                                                                                            </div>

                                                                                            {actions.length > 0 && (
                                                                                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                                                                    <div className="text-purple-800 font-bold text-xs uppercase mb-3 flex items-center gap-1">
                                                                                                        <CheckCircleIcon className="h-4 w-4" /> Recommended Strategy
                                                                                                    </div>
                                                                                                    <ul className="space-y-2">
                                                                                                        {actions.map((step, idx) => {
                                                                                                            const isAdded = addedActions.has(step);
                                                                                                            return (
                                                                                                                <li key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-purple-50 shadow-sm text-sm text-purple-900">
                                                                                                                    <span>{step}</span>
                                                                                                                    <button 
                                                                                                                        onClick={() => !isAdded && handleAddToTasks(step)}
                                                                                                                        disabled={isAdded}
                                                                                                                        className={`p-1.5 rounded-full transition-all ${isAdded ? 'text-green-500 bg-green-50' : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100'}`}
                                                                                                                    >
                                                                                                                        {isAdded ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                                                                                    </button>
                                                                                                                </li>
                                                                                                            );
                                                                                                        })}
                                                                                                    </ul>
                                                                                                </div>
                                                                                            )}
                                                                                        </Disclosure.Panel>
                                                                                    </Transition>
                                                                                </>
                                                                            )}
                                                                        </Disclosure>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
