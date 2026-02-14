/**
 * src/components/journal/JournalAnalysisWizard.tsx
 * GITHUB COMMENT:
 * [JournalAnalysisWizard.tsx]
 * FIX: Resolved explicit 'any' type error on SelectionCard component.
 * UPDATE: Added strict SelectionCardProps interface.
 */
import { Fragment, useState, useEffect, useCallback, type ElementType } from 'react';
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
    PlusCircleIcon,
    TrophyIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { generateComparativeAnalysis, type ComparativeAnalysisResult } from '../../lib/gemini';
import type { JournalEntry } from './JournalEditor';
import { subDays, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { useDeepPatternAnalysis } from '../../hooks/useDeepPatternAnalysis';
import { addTask } from '../../lib/tasks';
import { type UserProfile } from '../../lib/db';

interface WizardProps {
    isOpen: boolean;
    onClose: () => void;
    entries: JournalEntry[]; 
}

type AnalysisScope = 'weekly' | 'monthly' | 'all-time';

// Helper for UI status
interface EligibilityStatus {
    allowed: boolean;
    reason?: string;
    progress?: number; // 0-100 for progress bar
}

interface SelectionCardProps {
    type: AnalysisScope;
    title: string;
    subtitle: string;
    icon: ElementType;
    colorClass: string;
    borderClass: string;
    bgClass: string;
}

export default function JournalAnalysisWizard({ isOpen, onClose, entries }: WizardProps) {
    const { user, isAdmin } = useAuth();
    const [step, setStep] = useState<'select' | 'analyzing' | 'results'>('select');
    const [scope, setScope] = useState<AnalysisScope>('weekly');
    
    // Limits State
    const [usageProfile, setUsageProfile] = useState<UserProfile['usage_limits'] | null>(null);
    const [loadingLimits, setLoadingLimits] = useState(false);
    
    const [standardResult, setStandardResult] = useState<ComparativeAnalysisResult | null>(null);
    
    const { 
        analyze: runDeepAnalysis, 
        progress: deepProgress, 
        result: deepResult,
        error: deepError 
    } = useDeepPatternAnalysis();

    const [saving, setSaving] = useState(false);
    const [addedActions, setAddedActions] = useState<Set<string>>(new Set());

    // --- 1. LOAD USAGE LIMITS ON OPEN ---
    const loadUsageLimits = useCallback(async () => {
        if (!user || !db) return;
        setLoadingLimits(true);
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
                const data = snap.data() as UserProfile;
                setUsageProfile(data.usage_limits || {});
            }
        } catch (e) {
            console.error("Failed to load limits", e);
        } finally {
            setLoadingLimits(false);
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            loadUsageLimits();
            setStep('select');
        }
    }, [isOpen, loadUsageLimits]);

    // --- 2. ELIGIBILITY LOGIC ENGINE ---
    const checkEligibility = (targetScope: AnalysisScope): EligibilityStatus => {
        // Admin Bypass
        if (isAdmin) return { allowed: true };

        const entryCount = entries.length;
        const now = new Date();

        if (targetScope === 'weekly') {
            // Rule: Min 7 entries
            if (entryCount < 7) {
                return { 
                    allowed: false, 
                    reason: `Need ${7 - entryCount} more entries`,
                    progress: (entryCount / 7) * 100
                };
            }
            // Rule: Once every 7 days
            if (usageProfile?.lastWeeklyInsight) {
                const lastRun = usageProfile.lastWeeklyInsight.toDate();
                const diff = differenceInDays(now, lastRun);
                if (diff < 7) {
                    return { allowed: false, reason: `Available in ${7 - diff} days`, progress: 100 };
                }
            }
        } 
        
        if (targetScope === 'monthly' || targetScope === 'all-time') {
            // Rule: Min 30 entries
            if (entryCount < 30) {
                return { 
                    allowed: false, 
                    reason: `Need ${30 - entryCount} more entries`,
                    progress: (entryCount / 30) * 100
                };
            }
            // Rule: Once every 30 days
            const lastRunTimestamp = targetScope === 'monthly' ? usageProfile?.lastMonthlyInsight : usageProfile?.lastDeepDive;
            
            if (lastRunTimestamp) {
                const lastRun = lastRunTimestamp.toDate();
                const diff = differenceInDays(now, lastRun);
                if (diff < 30) {
                    return { allowed: false, reason: `Available in ${30 - diff} days`, progress: 100 };
                }
            }
        }

        return { allowed: true };
    };

    // --- 3. ENFORCE COST (STAMP USAGE) ---
    const stampUsage = async (targetScope: AnalysisScope) => {
        if (!user || !db || isAdmin) return; // Admins don't spend tokens
        
        const updateField = targetScope === 'weekly' 
            ? 'usage_limits.lastWeeklyInsight' 
            : targetScope === 'monthly' 
                ? 'usage_limits.lastMonthlyInsight' 
                : 'usage_limits.lastDeepDive';
        
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                [updateField]: Timestamp.now()
            });
            // Reload local state to reflect lock immediately if they go back
            loadUsageLimits(); 
        } catch (e) {
            console.error("Failed to stamp usage token", e);
        }
    };

    const runStandardAnalysis = async () => {
        setStep('analyzing');
        setAddedActions(new Set());
        
        // STAMP USAGE IMMEDIATELY
        await stampUsage(scope);
        
        try {
            const now = new Date();
            let currentSet: JournalEntry[] = [];
            let previousSet: JournalEntry[] = [];

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

            const analysis = await generateComparativeAnalysis(currentTxt, prevTxt, scope);
            setStandardResult(analysis);
            setStep('results');

        } catch (error) {
            console.error(error);
            alert("Analysis failed. Please try again.");
            setStep('select');
        }
    };

    const handleStartAnalysis = async () => {
        const status = checkEligibility(scope);
        if (!status.allowed && !isAdmin) return;

        if (scope === 'all-time') {
            setStep('analyzing');
            setAddedActions(new Set());
            // STAMP USAGE
            await stampUsage('all-time');
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
            const dueDate = addDays(new Date(), 7);
            await addTask(user.uid, action, 'once', 'Medium', dueDate);
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
                await addDoc(collection(database, 'insights'), {
                    uid: user.uid,
                    type: 'journal',
                    summary: deepResult.pattern_summary,
                    pillars: {
                        understanding: deepResult.core_triggers.join(', '),
                        growth: deepResult.emotional_velocity,
                        blind_spots: deepResult.hidden_correlations.join(', ')
                    },
                    suggested_actions: deepResult.long_term_advice.slice(0, 3), 
                    createdAt: Timestamp.now(),
                    scope_context: 'Deep Pattern Recognition',
                    risks: [`Risk Level: ${deepResult.relapse_risk_level}`]
                });
            } else if (standardResult) {
                await addDoc(collection(database, 'insights'), {
                    uid: user.uid,
                    type: 'journal',
                    summary: standardResult.comparison_summary,
                    pillars: {
                        understanding: standardResult.key_themes.join(', '),
                        growth: standardResult.wins.join(', '),
                        blind_spots: standardResult.blind_spots.join(', ')
                    },
                    strengths: standardResult.wins,
                    risks: standardResult.blind_spots,
                    suggested_actions: standardResult.actionable_advice.slice(0, 3), 
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

    // Helper to render selection cards with locking logic
    const SelectionCard = ({ type, title, subtitle, icon: Icon, colorClass, borderClass, bgClass }: SelectionCardProps) => {
        const { allowed, reason, progress } = checkEligibility(type);
        const isSelected = scope === type;

        return (
            <button 
                onClick={() => allowed ? setScope(type) : null}
                disabled={!allowed}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    !allowed ? 'opacity-70 bg-gray-50 border-gray-200 cursor-not-allowed' :
                    isSelected ? `${borderClass} ${bgClass}` : 'border-gray-100 hover:border-gray-300'
                }`}
            >
                {/* LOCKED OVERLAY */}
                {!allowed && (
                    <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center backdrop-blur-[1px] z-10">
                        <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-500">
                            <LockClosedIcon className="h-3 w-3" />
                            {reason}
                        </div>
                    </div>
                )}
                
                <div className={`p-3 rounded-full shadow-sm ${!allowed ? 'bg-gray-200 text-gray-400' : `bg-white ${colorClass}`}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                    <div className={`font-bold ${!allowed ? 'text-gray-500' : 'text-gray-900'}`}>{title}</div>
                    <div className="text-xs text-gray-500">{subtitle}</div>
                    
                    {/* Progress Bar for Volume Requirement */}
                    {!allowed && progress !== undefined && progress < 100 && (
                        <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
                {isSelected && allowed && <div className={`w-3 h-3 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>}
            </button>
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        
                        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-4 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-white">
                                <SparklesIcon className="h-6 w-6" />
                                <h3 className="font-bold text-lg">
                                    {scope === 'all-time' ? 'Deep Pattern Engine' : 'Analysis Wizard'}
                                </h3>
                            </div>
                            <button onClick={onClose} className="text-white/80 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {step === 'select' && (
                                <div className="space-y-4">
                                    {loadingLimits ? (
                                        <div className="text-center py-8 text-gray-400">Checking eligibility...</div>
                                    ) : (
                                        <>
                                            <p className="text-gray-600 text-sm text-center mb-6">Select a timeframe to analyze. The AI will compare your current progress against previous patterns.</p>
                                            
                                            <SelectionCard 
                                                type="weekly"
                                                title="Weekly Check-in"
                                                subtitle="Last 7 days vs Previous 7 days"
                                                icon={CalendarDaysIcon}
                                                colorClass="text-fuchsia-600"
                                                bgClass="bg-fuchsia-50"
                                                borderClass="border-fuchsia-500"
                                            />

                                            <SelectionCard 
                                                type="monthly"
                                                title="Monthly Review"
                                                subtitle="Last 30 days vs Previous 30 days"
                                                icon={ChartBarIcon}
                                                colorClass="text-purple-600"
                                                bgClass="bg-purple-50"
                                                borderClass="border-purple-500"
                                            />

                                            <SelectionCard 
                                                type="all-time"
                                                title="Deep Dive (90 Days)"
                                                subtitle="Identify relapse triggers & patterns"
                                                icon={GlobeAmericasIcon}
                                                colorClass="text-indigo-600"
                                                bgClass="bg-indigo-50"
                                                borderClass="border-indigo-500"
                                            />

                                            <button 
                                                onClick={handleStartAnalysis} 
                                                disabled={!checkEligibility(scope).allowed}
                                                className="w-full mt-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {checkEligibility(scope).allowed ? 'Begin Analysis' : 'Locked'}
                                            </button>
                                        </>
                                    )}
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
                                                    <h5 className="text-xs font-bold text-green-700 uppercase flex items-center gap-1">
                                                        <TrophyIcon className="h-4 w-4" /> Strengths & Wins
                                                    </h5>
                                                    <ul className="text-xs text-gray-600 space-y-1">{standardResult.wins.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                                <div className="space-y-2">
                                                    <h5 className="text-xs font-bold text-orange-700 uppercase flex items-center gap-1">
                                                        <ExclamationTriangleIcon className="h-4 w-4" /> Risk Analysis
                                                    </h5>
                                                    <ul className="text-xs text-gray-600 space-y-1">{standardResult.blind_spots.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                                </div>
                                            </div>

                                            <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                                                <h5 className="text-xs font-bold text-fuchsia-800 uppercase mb-2">Suggested Actions (Choose to Add)</h5>
                                                <div className="space-y-2">
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