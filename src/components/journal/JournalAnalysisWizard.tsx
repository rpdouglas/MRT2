/**
 * src/components/journal/JournalAnalysisWizard.tsx
 * GITHUB COMMENT:
 * [JournalAnalysisWizard.tsx]
 * FIX: Enforced strict slice(0,3) on actionable items to prevent overflow.
 * UPDATED: Integrated interactive "Add to Quest" logic for both Standard and Deep analysis.
 */
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    SparklesIcon, 
    XMarkIcon, 
    CalendarDaysIcon, 
    ChartBarIcon, 
    GlobeAmericasIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    ArrowPathIcon,
    BoltIcon,
    ShieldCheckIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { generateComparativeAnalysis, type ComparativeAnalysisResult } from '../../lib/gemini';
import type { JournalEntry } from './JournalEditor';
import { subDays, isAfter, isBefore, addDays } from 'date-fns';
import { useDeepPatternAnalysis } from '../../hooks/useDeepPatternAnalysis';
import { addTask } from '../../lib/tasks';

interface WizardProps {
    isOpen: boolean;
    onClose: () => void;
    entries: JournalEntry[]; // Used for standard weekly/monthly analysis
}

type AnalysisScope = 'weekly' | 'monthly' | 'all-time';

export default function JournalAnalysisWizard({ isOpen, onClose, entries }: WizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<'select' | 'analyzing' | 'results'>('select');
    const [scope, setScope] = useState<AnalysisScope>('weekly');
    
    // Standard Analysis State
    const [standardResult, setStandardResult] = useState<ComparativeAnalysisResult | null>(null);
    
    // Deep Dive Hook
    const { 
        analyze: runDeepAnalysis, 
        // FIXED: Removed unused 'loading' destructuring to satisfy linter
        progress: deepProgress, 
        result: deepResult,
        error: deepError 
    } = useDeepPatternAnalysis();

    const [saving, setSaving] = useState(false);
    const [addedActions, setAddedActions] = useState<Set<string>>(new Set());

    const runStandardAnalysis = async () => {
        setStep('analyzing');
        setAddedActions(new Set()); // Reset added actions on new run
        
        try {
            const now = new Date();
            let currentSet: JournalEntry[] = [];
            let previousSet: JournalEntry[] = [];

            // 1. Partition Data (Client-Side for Standard)
            if (scope === 'weekly') {
                const oneWeekAgo = subDays(now, 7);
                const twoWeeksAgo = subDays(now, 14);
                const getDate = (e: JournalEntry) => e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt as unknown as string);

                currentSet = entries.filter(e => isAfter(getDate(e), oneWeekAgo));
                previousSet = entries.filter(e => isAfter(getDate(e), twoWeeksAgo) && isBefore(getDate(e), oneWeekAgo));
            } else if (scope === 'monthly') {
                const oneMonthAgo = subDays(now, 30);
                const twoMonthsAgo = subDays(now, 60);
                const getDate = (e: JournalEntry) => e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt as unknown as string);

                currentSet = entries.filter(e => isAfter(getDate(e), oneMonthAgo));
                previousSet = entries.filter(e => isAfter(getDate(e), twoMonthsAgo) && isBefore(getDate(e), oneMonthAgo));
            }

            // 2. Format for AI
            const formatSet = (set: JournalEntry[]) => set.map(e => {
                const d = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt as unknown as string);
                return `[${d.toLocaleDateString()}] Mood: ${e.moodScore || 'N/A'}\n${e.content}`;
            }).join('\n---\n');
            
            const currentTxt = formatSet(currentSet);
            const prevTxt = formatSet(previousSet);

            if (!currentTxt) {
                alert("Not enough journal data for this period to perform an analysis.");
                setStep('select');
                return;
            }

            // 3. Call Gemini
            const analysis = await generateComparativeAnalysis(currentTxt, prevTxt, scope);
            setStandardResult(analysis);
            setStep('results');

        } catch (error) {
            console.error(error);
            alert("Analysis failed. Please try again.");
            setStep('select');
        }
    };

    const handleStartAnalysis = () => {
        if (scope === 'all-time') {
            setStep('analyzing');
            setAddedActions(new Set());
            runDeepAnalysis().then(() => {
                setStep('results');
            });
        } else {
            runStandardAnalysis();
        }
    };

    const handleAddToTasks = async (action: string) => {
        if (!user) return;
        try {
            // Defaults: Recovery Category, Medium Priority, Due in 7 Days
            const dueDate = addDays(new Date(), 7);
            await addTask(
                user.uid,
                action,
                'once',
                'Medium',
                dueDate
            );
            setAddedActions(prev => new Set(prev).add(action));
        } catch (e) {
            console.error("Failed to add task", e);
        }
    };

    const saveInsight = async () => {
        if (!user || !db) return;
        setSaving(true);
        const database: Firestore = db;

        try {
            if (scope === 'all-time' && deepResult) {
                // Save Deep Result
                await addDoc(collection(database, 'insights'), {
                    uid: user.uid,
                    type: 'journal',
                    summary: deepResult.pattern_summary,
                    pillars: {
                        understanding: deepResult.core_triggers.join(', '),
                        growth: deepResult.emotional_velocity,
                        blind_spots: deepResult.hidden_correlations.join(', ')
                    },
                    suggested_actions: deepResult.long_term_advice.slice(0, 3), // Ensure saved data is also limited
                    createdAt: Timestamp.now(),
                    scope_context: 'Deep Pattern Recognition',
                    risks: [`Risk Level: ${deepResult.relapse_risk_level}`]
                });
            } else if (standardResult) {
                // Save Standard Result
                await addDoc(collection(database, 'insights'), {
                    uid: user.uid,
                    type: 'journal',
                    summary: standardResult.comparison_summary,
                    pillars: {
                        understanding: standardResult.key_themes.join(', '),
                        growth: standardResult.wins.join(', '),
                        blind_spots: standardResult.blind_spots.join(', ')
                    },
                    suggested_actions: standardResult.actionable_advice.slice(0, 3), // Ensure saved data is also limited
                    createdAt: Timestamp.now(),
                    scope_context: `${scope.charAt(0).toUpperCase() + scope.slice(1)} Comparative Review`
                });
            }
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-4 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-white">
                                <SparklesIcon className="h-6 w-6" />
                                <h3 className="font-bold text-lg">
                                    {scope === 'all-time' ? 'Deep Pattern Engine' : 'Analysis Wizard'}
                                </h3>
                            </div>
                            <button onClick={onClose} className="text-white/80 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                        </div>

                        {/* Content (Scrollable) */}
                        <div className="p-6 overflow-y-auto">
                            {step === 'select' && (
                                <div className="space-y-4">
                                    <p className="text-gray-600 text-sm text-center mb-6">Select a timeframe to analyze. The AI will compare your current progress against previous patterns.</p>
                                    
                                    <button onClick={() => setScope('weekly')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${scope === 'weekly' ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-100 hover:border-fuchsia-200'}`}>
                                        <div className="bg-white p-3 rounded-full shadow-sm text-fuchsia-600"><CalendarDaysIcon className="h-6 w-6" /></div>
                                        <div className="text-left"><div className="font-bold text-gray-900">Weekly Check-in</div><div className="text-xs text-gray-500">Last 7 days vs Previous 7 days</div></div>
                                    </button>

                                    <button onClick={() => setScope('monthly')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${scope === 'monthly' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                                        <div className="bg-white p-3 rounded-full shadow-sm text-purple-600"><ChartBarIcon className="h-6 w-6" /></div>
                                        <div className="text-left"><div className="font-bold text-gray-900">Monthly Review</div><div className="text-xs text-gray-500">Last 30 days vs Previous 30 days</div></div>
                                    </button>

                                    <button onClick={() => setScope('all-time')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${scope === 'all-time' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}>
                                        <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600"><GlobeAmericasIcon className="h-6 w-6" /></div>
                                        <div className="text-left"><div className="font-bold text-gray-900">Deep Dive (30 Days)</div><div className="text-xs text-gray-500">Identify relapse triggers & patterns</div></div>
                                    </button>

                                    <button onClick={handleStartAnalysis} className="w-full mt-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all">
                                        Begin Analysis
                                    </button>
                                </div>
                            )}

                            {step === 'analyzing' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-600"></div>
                                        {scope === 'all-time' && (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-fuchsia-600">
                                                {deepProgress}%
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">
                                            {scope === 'all-time' ? 'Processing Vault...' : 'Consulting the Compass...'}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                                            {scope === 'all-time' 
                                                ? "Decrypting your history and finding hidden patterns." 
                                                : "Comparing periods and identifying trajectory."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 'results' && (deepError) && (
                                <div className="text-center py-8">
                                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900">Analysis Failed</h3>
                                    <p className="text-gray-500 mb-4">{deepError}</p>
                                    <button onClick={() => setStep('select')} className="text-indigo-600 font-bold hover:underline">Try Again</button>
                                </div>
                            )}

                            {step === 'results' && !deepError && (
                                <div className="space-y-6 animate-fadeIn">
                                    
                                    {/* --- DEEP PATTERN RESULTS --- */}
                                    {scope === 'all-time' && deepResult && (
                                        <>
                                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                                <h5 className="text-xs font-bold text-indigo-800 uppercase mb-2">Psychological Landscape</h5>
                                                <p className="text-sm text-indigo-900 leading-relaxed">{deepResult.pattern_summary}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                    <h5 className="text-xs font-bold text-orange-800 uppercase flex items-center gap-1 mb-2">
                                                        <BoltIcon className="h-4 w-4" /> Core Triggers
                                                    </h5>
                                                    <ul className="text-xs text-orange-900 space-y-1">
                                                        {deepResult.core_triggers.map((t, i) => <li key={i}>• {t}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                    <h5 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1 mb-2">
                                                        <ArrowPathIcon className="h-4 w-4" /> Velocity
                                                    </h5>
                                                    <p className="text-xs text-blue-900">{deepResult.emotional_velocity}</p>
                                                </div>
                                            </div>

                                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                                <h5 className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-1 mb-2">
                                                    <ShieldCheckIcon className="h-4 w-4" /> Hidden Correlations
                                                </h5>
                                                <ul className="text-xs text-yellow-900 space-y-1">
                                                    {deepResult.hidden_correlations.map((c, i) => <li key={i}>• {c}</li>)}
                                                </ul>
                                            </div>

                                            <div className="bg-gray-900 text-white p-4 rounded-xl">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Long-Term Strategy (Choose to Add)</h5>
                                                <div className="space-y-2">
                                                    {/* CRITICAL: Enforced .slice(0, 3) to ensure rule of 3 in UI */}
                                                    {deepResult.long_term_advice.slice(0, 3).map((action, i) => (
                                                        <div key={i} className="flex items-center justify-between gap-2 text-sm bg-gray-800/50 p-2 rounded-lg group hover:bg-gray-800 transition-colors">
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-bold text-gray-500">→</span>
                                                                <span>{action}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => !addedActions.has(action) && handleAddToTasks(action)}
                                                                disabled={addedActions.has(action)}
                                                                className={`p-1.5 rounded-full transition-all ${addedActions.has(action) ? 'text-green-400 bg-green-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                                                title={addedActions.has(action) ? "Added to Quests" : "Add to Quests"}
                                                            >
                                                                {addedActions.has(action) ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* --- STANDARD RESULTS --- */}
                                    {scope !== 'all-time' && standardResult && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                                    standardResult.trajectory === 'Improving' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                    standardResult.trajectory === 'Declining' ? 'bg-red-100 text-red-700 border-red-200' :
                                                    'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                    Trajectory: {standardResult.trajectory}
                                                </div>
                                                <span className="text-xs text-gray-400 font-mono">AI Generated</span>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
                                                {standardResult.comparison_summary}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h5 className="text-xs font-bold text-green-700 uppercase flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Wins</h5>
                                                    <ul className="text-xs text-gray-600 space-y-1">{standardResult.wins.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                                <div className="space-y-2">
                                                    <h5 className="text-xs font-bold text-orange-700 uppercase flex items-center gap-1"><ExclamationTriangleIcon className="h-4 w-4" /> Blind Spots</h5>
                                                    <ul className="text-xs text-gray-600 space-y-1">{standardResult.blind_spots.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                            </div>

                                            <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                                                <h5 className="text-xs font-bold text-fuchsia-800 uppercase mb-2">Suggested Actions (Choose to Add)</h5>
                                                <div className="space-y-2">
                                                    {/* CRITICAL: Enforced .slice(0, 3) to ensure rule of 3 in UI */}
                                                    {standardResult.actionable_advice.slice(0, 3).map((action, i) => (
                                                        <div key={i} className="flex items-center justify-between gap-2 text-xs text-fuchsia-900 bg-white/50 p-2 rounded-lg group hover:bg-white/80 transition-colors">
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-bold text-fuchsia-400">{i+1}.</span> 
                                                                <span>{action}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => !addedActions.has(action) && handleAddToTasks(action)}
                                                                disabled={addedActions.has(action)}
                                                                className={`p-1 rounded-full transition-all ${addedActions.has(action) ? 'text-green-600 bg-green-100' : 'text-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-100'}`}
                                                                title={addedActions.has(action) ? "Added to Quests" : "Add to Quests"}
                                                            >
                                                                {addedActions.has(action) ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button onClick={saveInsight} disabled={saving} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all disabled:opacity-50">
                                        {saving ? 'Saving...' : 'Save to Insights Log'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition.Root>
    );
}