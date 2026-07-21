import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { SparklesIcon, XMarkIcon, CalendarDaysIcon, ChartBarIcon, GlobeAmericasIcon, CheckCircleIcon, ArrowPathIcon, BoltIcon, PlusCircleIcon, TrophyIcon, LockClosedIcon, ShieldExclamationIcon, LinkIcon, HashtagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreMutation } from '../../hooks/useFirestoreCrud';
import { saveInsight, type InsightPayload } from '../../lib/insights';
import { generateComparativeAnalysis, type ComparativeAnalysisResult } from '../../lib/gemini';
import type { JournalEntry } from './JournalEditor';
import { subDays, isAfter, isBefore, addDays } from 'date-fns';
import { useDeepPatternAnalysis } from '../../hooks/useDeepPatternAnalysis';
import { useTaskOperations } from '../../hooks/useTaskOperations';
import { useRateLimits } from '../../hooks/useRateLimits';
import { DRAFT_TAG } from '../../lib/types/smart';
import { parseSmartToolPayload } from '../../lib/smartToolPayload';
import { getFieldLabel, formatFieldValueText } from '../../lib/toolHistorySummary';
import { TOOLS } from '../../lib/toolsRegistry';
import type { ElementType } from 'react';

interface WizardProps { isOpen: boolean; onClose: () => void; entries: JournalEntry[]; }

type AnalysisScope = 'weekly' | 'monthly' | 'all-time';

interface EligibilityStatus { allowed: boolean; reason?: string; progress?: number; requiresUpgrade?: boolean; }

interface SelectionCardProps {
    title: string;
    subtitle: string;
    icon: ElementType;
    colorClass: string;
    borderClass: string;
    bgClass: string;
    isSelected: boolean;
    eligibility: EligibilityStatus;
    onSelect: () => void;
    onUpgradeClick: () => void;
}

// Hoisted to module scope (react-hooks/static-components) — takes its
// eligibility/selection state as props instead of closing over the wizard's
// local state, so it isn't recreated every render.
function SelectionCard({ title, subtitle, icon: Icon, colorClass, borderClass, bgClass, isSelected, eligibility, onSelect, onUpgradeClick }: SelectionCardProps) {
    const { allowed, reason, progress, requiresUpgrade } = eligibility;

    return (
        <div className={`w-full relative overflow-hidden rounded-xl border-2 transition-all ${!allowed ? 'bg-gray-50 border-gray-200' : isSelected ? `${borderClass} ${bgClass}` : 'border-gray-100 hover:border-gray-300'}`}>

            {/* UPGRADE OVERLAY */}
            {!allowed && requiresUpgrade && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
                    <div className="bg-amber-100 px-3 py-1 rounded-full mb-2 border border-amber-200">
                        <LockClosedIcon className="h-4 w-4 text-amber-600 inline mr-1" />
                        <span className="text-xs font-bold text-amber-800 uppercase">Limit Reached</span>
                    </div>
                    <button onClick={onUpgradeClick} className="text-xs font-bold text-blue-600 hover:underline text-center">
                        {reason}
                    </button>
                </div>
            )}

            <button
                onClick={() => allowed ? onSelect() : null}
                disabled={!allowed}
                className={`w-full flex items-center gap-4 p-4 text-left ${!allowed ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <div className={`p-3 rounded-full shadow-sm ${!allowed ? 'bg-gray-200 text-gray-400' : `bg-white ${colorClass}`}`}><Icon className="h-6 w-6" /></div>
                <div className="flex-1">
                    <div className={`font-bold ${!allowed ? 'text-gray-500' : 'text-gray-900'}`}>{title}</div>
                    <div className="text-xs text-gray-500">{subtitle}</div>
                    {!allowed && progress !== undefined && progress < 100 && !requiresUpgrade && (
                        <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                    {!allowed && !requiresUpgrade && reason && (
                         <div className="text-[10px] font-bold text-gray-400 mt-1">{reason}</div>
                    )}
                </div>
                {isSelected && allowed && <div className={`w-3 h-3 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>}
            </button>
        </div>
    );
}

export default function JournalAnalysisWizard({
isOpen, onClose, entries }: WizardProps) {
  const navigate = useNavigate();

    const { user, userTier } = useAuth();
    const { addTask } = useTaskOperations();
    const { checkEligibility: checkRateLimit, loadingLimits } = useRateLimits();
    const saveInsightMutation = useFirestoreMutation<InsightPayload>(['insights', user?.uid], {
        mutationFn: (uid, payload) => saveInsight(uid, payload),
    });

    const [step, setStep] = useState<'select' | 'analyzing' | 'results'>('select');
    const [scope, setScope] = useState<AnalysisScope>('weekly');

    const [standardResult, setStandardResult] = useState<ComparativeAnalysisResult | null>(null);

    const {
        analyze: runDeepAnalysis,
        progress: deepProgress,
        result: deepResult,
        error: deepError
    } = useDeepPatternAnalysis();

    const [addedActions, setAddedActions] = useState<Set<string>>(new Set());

    // Reset to the selection step each time the wizard reopens. Adjusted
    // during render (React's documented pattern for resetting state when a
    // prop changes) rather than in an effect, to avoid the extra render pass.
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) setStep('select');
    }

    // Exclude in-progress guided-tool drafts — they're incomplete and shouldn't
    // count toward eligibility or feed into AI analysis.
    const analyzableEntries = useMemo(() => entries.filter(e => !e.tags?.includes(DRAFT_TAG)), [entries]);

    const checkEligibility = (targetScope: AnalysisScope): EligibilityStatus => {
        const entryCount = analyzableEntries.length;
        const isDev = import.meta.env.DEV;

        // 1. Check strict data volume requirements (bypassed in DEV mode for testing/screenshots)
        if (!isDev) {
            if (targetScope === 'weekly' && entryCount < 7) {
                return { allowed: false, reason: `Need ${7 - entryCount} more entries`, progress: (entryCount / 7) * 100 };
            }
            if ((targetScope === 'monthly' || targetScope === 'all-time') && entryCount < 30) {
                return { allowed: false, reason: `Need ${30 - entryCount} more entries`, progress: (entryCount / 30) * 100 };
            }
        }

        // 2. Check cost-shield rate limits
        const rateLimit = checkRateLimit(targetScope);
        if (!rateLimit.allowed) {
            return { allowed: false, reason: rateLimit.reason, progress: 100, requiresUpgrade: true };
        }

        return { allowed: true };
    };

    const runStandardAnalysis = async () => {
        setStep('analyzing');
        setAddedActions(new Set());
        
        try {
            const now = new Date();
            let currentSet: JournalEntry[] = [];
            let previousSet: JournalEntry[] = [];
            const getDate = (e: JournalEntry): Date => {
                if (e.createdAt instanceof Date) return e.createdAt;
                return (e.createdAt as unknown as { toDate: () => Date }).toDate();
            };

            if (scope === 'weekly') {
                const oneWeekAgo = subDays(now, 7);
                const twoWeeksAgo = subDays(now, 14);
                currentSet = analyzableEntries.filter(e => isAfter(getDate(e), oneWeekAgo));
                previousSet = analyzableEntries.filter(e => isAfter(getDate(e), twoWeeksAgo) && isBefore(getDate(e), oneWeekAgo));
            } else if (scope === 'monthly') {
                const oneMonthAgo = subDays(now, 30);
                const twoMonthsAgo = subDays(now, 60);
                currentSet = analyzableEntries.filter(e => isAfter(getDate(e), oneMonthAgo));
                previousSet = analyzableEntries.filter(e => isAfter(getDate(e), twoMonthsAgo) && isBefore(getDate(e), oneMonthAgo));
            }

            const formatEntry = (e: JournalEntry): string => {
                const header = `[${getDate(e).toLocaleDateString()}] Mood: ${e.moodScore || 'N/A'}`;
                const toolPayload = parseSmartToolPayload(e.content);
                if (!toolPayload) return `${header}\n${e.content}`;

                const toolTitle = TOOLS.find(t => t.toolType === toolPayload.type)?.title ?? toolPayload.type;
                const fields = Object.entries(toolPayload.data)
                    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
                    .map(([key, value]) => `${getFieldLabel(toolPayload.type, key, toolPayload.data)}: ${formatFieldValueText(toolPayload.type, value)}`)
                    .join('\n');
                return `${header}\n[${toolTitle}]\n${fields}`;
            };
            const formatSet = (set: JournalEntry[]) => set.map(formatEntry).join('\n---\n');
            const currentTxt = formatSet(currentSet);
            const prevTxt = formatSet(previousSet);

            if (!currentTxt) { toast.error("Not enough journal data for this period."); setStep('select'); return; }

            const analysis = await generateComparativeAnalysis(currentTxt, prevTxt, scope);
            setStandardResult(analysis);
            setStep('results');
        } catch (error) { console.error(error); toast.error("Analysis failed."); setStep('select'); }
    };

    const handleStartAnalysis = async () => {
        const status = checkEligibility(scope);
        if (!status.allowed && userTier !== 'premium') return;
        
        if (scope === 'all-time') {
            setStep('analyzing');
            setAddedActions(new Set());
            runDeepAnalysis().then(() => setStep('results'));
        } else {
            runStandardAnalysis();
        }
    };

    const handleAddToTasks = async (action: string, actionIndex: number) => {
        if (!user) return;
        try {
            const dueDate = addDays(new Date(), 7);
            const result = scope === 'all-time' ? deepResult : standardResult;
            const sourceContext = result?.action_contexts?.[actionIndex];
            await addTask({
                title: action,
                recurrence: { type: 'once' },
                priority: 'Medium',
                dueDate: dueDate,
                source: 'ai',
                ...(sourceContext && { aiMeta: { sourceContext } }),
            });
            setAddedActions(prev => new Set(prev).add(action));
      toast.success('Task added to your ledger.', { action: { label: 'View Tasks', onClick: () => navigate('/tasks') } });
        } catch (e) {
            console.error("Failed to add task", e);
        }
    };

    const handleSaveInsight = async () => {
        if (!user) return;
        try {
            let payload: InsightPayload | null = null;

            if (scope === 'all-time' && deepResult) {
                payload = {
                    type: 'journal',
                    summary: deepResult.pattern_summary,
                    pillars: {
                        understanding: deepResult.core_triggers.join(', '),
                        growth: deepResult.emotional_velocity,
                        blind_spots: deepResult.hidden_correlations.join(', ')
                    },
                    core_triggers: deepResult.core_triggers,
                    hidden_correlations: deepResult.hidden_correlations,
                    emotional_velocity: deepResult.emotional_velocity,
                    relapse_risk_level: deepResult.relapse_risk_level,
                    suggested_actions: deepResult.long_term_advice.slice(0, 3),
                    scope_context: 'Deep Pattern Recognition',
                    risks: [`Risk Level: ${deepResult.relapse_risk_level}`]
                };
            } else if (standardResult) {
                payload = {
                    type: 'journal',
                    summary: standardResult.comparison_summary,
                    pillars: {
                        understanding: standardResult.key_themes.join(', '),
                        growth: standardResult.wins.join(', '),
                        blind_spots: standardResult.blind_spots.join(', ')
                    },
                    key_themes: standardResult.key_themes,
                    trajectory: standardResult.trajectory,
                    strengths: standardResult.wins,
                    risks: standardResult.blind_spots,
                    suggested_actions: standardResult.actionable_advice.slice(0, 3),
                    scope_context: `${scope.charAt(0).toUpperCase() + scope.slice(1)} Comparative Review`
                };
            }

            if (payload) {
                await saveInsightMutation.mutateAsync(payload);
            }
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-4 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-white"><SparklesIcon className="h-6 w-6" /><h3 className="font-bold text-lg">{scope === 'all-time' ? 'Deep Pattern Engine' : 'Analysis Wizard'}</h3></div>
                            <button onClick={onClose} className="text-white/80 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {step === 'select' && (
                                <div className="space-y-4">
                                    {loadingLimits ? <div className="text-center py-8 text-gray-400">Checking eligibility...</div> : (
                                        <>
                                            <p className="text-gray-600 text-sm text-center mb-6">Select a timeframe to analyze. The AI will compare your current progress against previous patterns.</p>
                                            <SelectionCard title="Weekly Check-in" subtitle="Last 7 days vs Previous 7 days" icon={CalendarDaysIcon} colorClass="text-fuchsia-600" bgClass="bg-fuchsia-50" borderClass="border-fuchsia-500" isSelected={scope === 'weekly'} eligibility={checkEligibility('weekly')} onSelect={() => setScope('weekly')} onUpgradeClick={() => navigate('/premium')} />
                                            <SelectionCard title="Monthly Review" subtitle="Last 30 days vs Previous 30 days" icon={ChartBarIcon} colorClass="text-purple-600" bgClass="bg-purple-50" borderClass="border-purple-500" isSelected={scope === 'monthly'} eligibility={checkEligibility('monthly')} onSelect={() => setScope('monthly')} onUpgradeClick={() => navigate('/premium')} />
                                            <SelectionCard title="Deep Dive (90 Days)" subtitle="Identify relapse triggers & patterns" icon={GlobeAmericasIcon} colorClass="text-indigo-600" bgClass="bg-indigo-50" borderClass="border-indigo-500" isSelected={scope === 'all-time'} eligibility={checkEligibility('all-time')} onSelect={() => setScope('all-time')} onUpgradeClick={() => navigate('/premium')} />
                                            
                                            <button onClick={handleStartAnalysis} disabled={!checkEligibility(scope).allowed} className="w-full mt-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
                                                Begin Analysis
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {step === 'analyzing' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="relative"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-600"></div>{scope === 'all-time' && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-fuchsia-600">{deepProgress}%</div>}</div>
                                    <h4 className="text-lg font-bold text-gray-900">{scope === 'all-time' ? 'Analyzing Journal History...' : 'Consulting the Compass...'}</h4>
                                </div>
                            )}

                            {step === 'results' && !deepError && (
                                <div className="space-y-6 animate-fadeIn">
                                    {scope === 'all-time' && deepResult ? (
                                        <>
                                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="text-xs font-bold text-indigo-800 uppercase">Landscape</h5>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        deepResult.relapse_risk_level === 'Low' ? 'bg-green-100 text-green-700' :
                                                        deepResult.relapse_risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                                        deepResult.relapse_risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                        {deepResult.relapse_risk_level} Risk
                                                    </span>
                                                </div>
                                                <p className="text-sm text-indigo-900">{deepResult.pattern_summary}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                    <h5 className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1 mb-2"><BoltIcon className="h-4 w-4" /> Triggers</h5>
                                                    <ul className="text-xs text-amber-900 space-y-1">{deepResult.core_triggers.map((t, i) => <li key={i}>• {t}</li>)}</ul>
                                                </div>
                                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                    <h5 className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1 mb-2"><ArrowPathIcon className="h-4 w-4" /> Velocity</h5>
                                                    <p className="text-xs text-blue-900">{deepResult.emotional_velocity}</p>
                                                </div>
                                                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                    <h5 className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1 mb-2"><LinkIcon className="h-4 w-4" /> Hidden Links</h5>
                                                    <ul className="text-xs text-rose-900 space-y-1">{deepResult.hidden_correlations.map((c, i) => <li key={i}>• {c}</li>)}</ul>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                                                <h5 className="text-xs font-bold text-purple-800 uppercase mb-3 flex items-center gap-2">
                                                    <CheckCircleIcon className="h-4 w-4" /> Recommended Strategy
                                                </h5>
                                                <div className="space-y-2">
                                                    {deepResult.long_term_advice.slice(0, 3).map((action, i) => (
                                                        <div key={i} className="flex items-center justify-between gap-2 text-sm bg-white p-2.5 rounded-lg border border-purple-50 shadow-sm text-purple-900">
                                                            <span>{action}</span>
                                                            <button onClick={() => !addedActions.has(action) && handleAddToTasks(action, i)} disabled={addedActions.has(action)} className={`p-1.5 rounded-full transition-all ${addedActions.has(action) ? 'text-green-500 bg-green-50' : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100'}`}>
                                                                {addedActions.has(action) ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : standardResult && (
                                        <>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border w-fit ${standardResult.trajectory === 'Improving' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>Trajectory: {standardResult.trajectory}</div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700">{standardResult.comparison_summary}</div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                    <h5 className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1 mb-1.5"><HashtagIcon className="h-3 w-3" /> Key Themes</h5>
                                                    <ul className="text-xs text-blue-900 space-y-1">{standardResult.key_themes.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                                    <h5 className="text-[10px] font-bold text-green-800 uppercase flex items-center gap-1 mb-1.5"><TrophyIcon className="h-3 w-3" /> Wins</h5>
                                                    <ul className="text-xs text-green-900 space-y-1">{standardResult.wins.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                    <h5 className="text-[10px] font-bold text-orange-800 uppercase flex items-center gap-1 mb-1.5"><ShieldExclamationIcon className="h-3 w-3" /> Risks</h5>
                                                    <ul className="text-xs text-orange-900 space-y-1">{standardResult.blind_spots.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                            </div>

                                            <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                                                <h5 className="text-xs font-bold text-fuchsia-800 uppercase mb-2 flex items-center gap-2">
                                                    <CheckCircleIcon className="h-4 w-4" /> Suggested Actions
                                                </h5>
                                                <div className="space-y-2">
                                                    {standardResult.actionable_advice.slice(0, 3).map((action, i) => (
                                                        <div key={i} className="flex items-center justify-between gap-2 text-sm text-fuchsia-900 bg-white p-2.5 rounded-lg border border-fuchsia-50 shadow-sm">
                                                            <span>{action}</span>
                                                            <button onClick={() => !addedActions.has(action) && handleAddToTasks(action, i)} disabled={addedActions.has(action)} className={`p-1 rounded-full transition-all ${addedActions.has(action) ? 'text-green-600 bg-green-100' : 'text-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-100'}`}>
                                                                {addedActions.has(action) ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <button onClick={handleSaveInsight} disabled={saveInsightMutation.isPending} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all disabled:opacity-50">{saveInsightMutation.isPending ? 'Saving...' : 'Save to Insights Log'}</button>
                                </div>
                            )}
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
