import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

# Path Resolution Engine to guarantee we hit the project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. src/lib/insights.ts
# =============================================================================
insights_content = r'''/**
 * src/lib/insights.ts
 * GITHUB COMMENT:
 * [insights.ts]
 * UPDATED: Extended InsightPayload to natively support rich array data from Deep Dives.
 */
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import type { AnalysisResult, WorkbookAnalysisResult } from "./gemini";

const COLLECTION = 'insights';

// --- DEFINITIONS ---

export type InsightType = 'journal' | 'workbook';

// Combined type for what we save to Firestore
export type InsightPayload = 
  | ({ 
      type: 'journal'; 
      strengths?: string[];
      key_themes?: string[];
      hidden_correlations?: string[];
      relapse_risk_level?: string;
      trajectory?: string;
      core_triggers?: string[];
      emotional_velocity?: string;
    } & AnalysisResult)
  | ({ type: 'workbook' } & WorkbookAnalysisResult);

// The hydrated object returned to the UI
export type SavedInsight = InsightPayload & {
  id: string;
  uid: string;
  createdAt: Date;
};

/**
 * Saves a new AI Insight to Firestore.
 */
export async function saveInsight(uid: string, payload: InsightPayload) {
  if (!db) throw new Error("Database not initialized");

  await addDoc(collection(db, COLLECTION), {
    uid,
    createdAt: Timestamp.now(),
    ...payload
  });
}

/**
 * Fetches the history of AI Insights for a user.
 */
export async function getInsightHistory(uid: string): Promise<SavedInsight[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const q = query(
      collection(db, COLLECTION),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const type = data.type || 'journal';

      return {
        ...data, 
        id: doc.id,
        uid: data.uid,
        type,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as SavedInsight;
    });

  } catch (e: unknown) {
    console.error("Error fetching insights:", e);
    const err = e as { message?: string };
    if (err.message && err.message.includes("index")) {
        console.warn("⚠️ MISSING INDEX: Open your browser console and click the Firebase link to create the index for 'insights'.");
    }
    return [];
  }
}
'''

# =============================================================================
# 2. src/components/journal/JournalAnalysisWizard.tsx
# =============================================================================
wizard_content = r'''import { Fragment, useState, useEffect, useCallback, type ElementType } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    SparklesIcon, 
    XMarkIcon, 
    CalendarDaysIcon, 
    ChartBarIcon, 
    GlobeAmericasIcon, 
    CheckCircleIcon, 
    ArrowPathIcon,
    BoltIcon,
    PlusCircleIcon,
    TrophyIcon,
    LockClosedIcon,
    ShieldExclamationIcon,
    LinkIcon,
    HashtagIcon
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { generateComparativeAnalysis, type ComparativeAnalysisResult } from '../../lib/gemini';
import type { JournalEntry } from './JournalEditor';
import { subDays, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { useDeepPatternAnalysis } from '../../hooks/useDeepPatternAnalysis';
import { useTaskOperations } from '../../hooks/useTaskOperations'; 
import { type UserProfile } from '../../lib/db';

interface WizardProps {
    isOpen: boolean;
    onClose: () => void;
    entries: JournalEntry[]; 
}

type AnalysisScope = 'weekly' | 'monthly' | 'all-time';

interface EligibilityStatus {
    allowed: boolean;
    reason?: string;
    progress?: number; 
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
    const { addTask } = useTaskOperations(); 
    const [step, setStep] = useState<'select' | 'analyzing' | 'results'>('select');
    const [scope, setScope] = useState<AnalysisScope>('weekly');
    
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

    const checkEligibility = (targetScope: AnalysisScope): EligibilityStatus => {
        if (isAdmin) return { allowed: true };
        const entryCount = entries.length;
        const now = new Date();

        if (targetScope === 'weekly') {
            if (entryCount < 7) {
                return { allowed: false, reason: `Need ${7 - entryCount} more entries`, progress: (entryCount / 7) * 100 };
            }
            if (usageProfile?.lastWeeklyInsight) {
                const lastRun = usageProfile.lastWeeklyInsight.toDate();
                const diff = differenceInDays(now, lastRun);
                if (diff < 7) return { allowed: false, reason: `Available in ${7 - diff} days`, progress: 100 };
            }
        } 
        
        if (targetScope === 'monthly' || targetScope === 'all-time') {
            if (entryCount < 30) {
                return { allowed: false, reason: `Need ${30 - entryCount} more entries`, progress: (entryCount / 30) * 100 };
            }
            const lastRunTimestamp = targetScope === 'monthly' ? usageProfile?.lastMonthlyInsight : usageProfile?.lastDeepDive;
            if (lastRunTimestamp) {
                const lastRun = lastRunTimestamp.toDate();
                const diff = differenceInDays(now, lastRun);
                if (diff < 30) return { allowed: false, reason: `Available in ${30 - diff} days`, progress: 100 };
            }
        }
        return { allowed: true };
    };

    const stampUsage = async (targetScope: AnalysisScope) => {
        if (!user || !db || isAdmin) return;
        const updateField = targetScope === 'weekly' ? 'usage_limits.lastWeeklyInsight' : targetScope === 'monthly' ? 'usage_limits.lastMonthlyInsight' : 'usage_limits.lastDeepDive';
        try {
            await updateDoc(doc(db, 'users', user.uid), { [updateField]: Timestamp.now() });
            loadUsageLimits(); 
        } catch (e) {
            console.error("Failed to stamp usage token", e);
        }
    };

    const runStandardAnalysis = async () => {
        setStep('analyzing');
        setAddedActions(new Set());
        await stampUsage(scope);
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
                currentSet = entries.filter(e => isAfter(getDate(e), oneWeekAgo));
                previousSet = entries.filter(e => isAfter(getDate(e), twoWeeksAgo) && isBefore(getDate(e), oneWeekAgo));
            } else if (scope === 'monthly') {
                const oneMonthAgo = subDays(now, 30);
                const twoMonthsAgo = subDays(now, 60);
                currentSet = entries.filter(e => isAfter(getDate(e), oneMonthAgo));
                previousSet = entries.filter(e => isAfter(getDate(e), twoMonthsAgo) && isBefore(getDate(e), oneMonthAgo));
            }

            const formatSet = (set: JournalEntry[]) => set.map(e => `[${getDate(e).toLocaleDateString()}] Mood: ${e.moodScore || 'N/A'}\n${e.content}`).join('\n---\n');
            const currentTxt = formatSet(currentSet);
            const prevTxt = formatSet(previousSet);

            if (!currentTxt) {
                alert("Not enough journal data for this period.");
                setStep('select');
                return;
            }

            const analysis = await generateComparativeAnalysis(currentTxt, prevTxt, scope);
            setStandardResult(analysis);
            setStep('results');
        } catch (error) {
            console.error(error);
            alert("Analysis failed.");
            setStep('select');
        }
    };

    const handleStartAnalysis = async () => {
        const status = checkEligibility(scope);
        if (!status.allowed && !isAdmin) return;
        if (scope === 'all-time') {
            setStep('analyzing');
            setAddedActions(new Set());
            await stampUsage('all-time');
            runDeepAnalysis().then(() => setStep('results'));
        } else {
            runStandardAnalysis();
        }
    };

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
                    core_triggers: deepResult.core_triggers,
                    hidden_correlations: deepResult.hidden_correlations,
                    emotional_velocity: deepResult.emotional_velocity,
                    relapse_risk_level: deepResult.relapse_risk_level,
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
                    key_themes: standardResult.key_themes,
                    trajectory: standardResult.trajectory,
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

    const SelectionCard = ({ type, title, subtitle, icon: Icon, colorClass, borderClass, bgClass }: SelectionCardProps) => {
        const { allowed, reason, progress } = checkEligibility(type);
        const isSelected = scope === type;
        return (
            <button 
                onClick={() => allowed ? setScope(type) : null}
                disabled={!allowed}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${!allowed ? 'opacity-70 bg-gray-50 border-gray-200 cursor-not-allowed' : isSelected ? `${borderClass} ${bgClass}` : 'border-gray-100 hover:border-gray-300'}`}
            >
                {!allowed && (
                    <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center backdrop-blur-[1px] z-10">
                        <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-500">
                            <LockClosedIcon className="h-3 w-3" /> {reason}
                        </div>
                    </div>
                )}
                <div className={`p-3 rounded-full shadow-sm ${!allowed ? 'bg-gray-200 text-gray-400' : `bg-white ${colorClass}`}`}><Icon className="h-6 w-6" /></div>
                <div className="text-left flex-1">
                    <div className={`font-bold ${!allowed ? 'text-gray-500' : 'text-gray-900'}`}>{title}</div>
                    <div className="text-xs text-gray-500">{subtitle}</div>
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
                            <div className="flex items-center gap-2 text-white"><SparklesIcon className="h-6 w-6" /><h3 className="font-bold text-lg">{scope === 'all-time' ? 'Deep Pattern Engine' : 'Analysis Wizard'}</h3></div>
                            <button onClick={onClose} className="text-white/80 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {step === 'select' && (
                                <div className="space-y-4">
                                    {loadingLimits ? <div className="text-center py-8 text-gray-400">Checking eligibility...</div> : (
                                        <>
                                            <p className="text-gray-600 text-sm text-center mb-6">Select a timeframe to analyze. The AI will compare your current progress against previous patterns.</p>
                                            <SelectionCard type="weekly" title="Weekly Check-in" subtitle="Last 7 days vs Previous 7 days" icon={CalendarDaysIcon} colorClass="text-fuchsia-600" bgClass="bg-fuchsia-50" borderClass="border-fuchsia-500" />
                                            <SelectionCard type="monthly" title="Monthly Review" subtitle="Last 30 days vs Previous 30 days" icon={ChartBarIcon} colorClass="text-purple-600" bgClass="bg-purple-50" borderClass="border-purple-500" />
                                            <SelectionCard type="all-time" title="Deep Dive (90 Days)" subtitle="Identify relapse triggers & patterns" icon={GlobeAmericasIcon} colorClass="text-indigo-600" bgClass="bg-indigo-50" borderClass="border-indigo-500" />
                                            <button onClick={handleStartAnalysis} disabled={!checkEligibility(scope).allowed} className="w-full mt-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">Begin Analysis</button>
                                        </>
                                    )}
                                </div>
                            )}

                            {step === 'analyzing' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="relative"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-600"></div>{scope === 'all-time' && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-fuchsia-600">{deepProgress}%</div>}</div>
                                    <h4 className="text-lg font-bold text-gray-900">{scope === 'all-time' ? 'Processing Vault...' : 'Consulting the Compass...'}</h4>
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
                                                            <button onClick={() => !addedActions.has(action) && handleAddToTasks(action)} disabled={addedActions.has(action)} className={`p-1.5 rounded-full transition-all ${addedActions.has(action) ? 'text-green-500 bg-green-50' : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100'}`}>
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
                                                            <button onClick={() => !addedActions.has(action) && handleAddToTasks(action)} disabled={addedActions.has(action)} className={`p-1 rounded-full transition-all ${addedActions.has(action) ? 'text-green-600 bg-green-100' : 'text-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-100'}`}>
                                                                {addedActions.has(action) ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <button onClick={saveInsight} disabled={saving} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save to Insights Log'}</button>
                                </div>
                            )}
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
'''

# =============================================================================
# 3. src/pages/InsightsLog.tsx
# =============================================================================
log_content = r'''import { useState, useEffect, useCallback } from 'react';
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
    AcademicCapIcon,
    LinkIcon,
    HashtagIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

interface InsightWithActions {
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
                        const insightData = insight as unknown as InsightWithActions;
                        const actions = getActions(insight).slice(0, 3);
                        const strengths = getStrengths(insight);
                        const risks = getRisks(insight);
                        
                        const keyThemes = insightData.key_themes || [];
                        const hiddenCorrelations = insightData.hidden_correlations || [];
                        const triggers = insightData.core_triggers || [];

                        return (
                            <div key={insight.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
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
                                    
                                    <div className="flex items-center gap-2">
                                        {insightData.relapse_risk_level && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                insightData.relapse_risk_level === 'Low' ? 'bg-green-100 text-green-700 border-green-200' :
                                                insightData.relapse_risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                insightData.relapse_risk_level === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                                {insightData.relapse_risk_level} Risk
                                            </span>
                                        )}
                                        {insightData.trajectory && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                {insightData.trajectory}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 space-y-5">
                                    <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
                                    
                                    {/* DYNAMIC GRID BASED ON AVAILABLE DATA */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        
                                        {strengths.length > 0 && (
                                            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                                <div className="text-green-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                    <TrophyIcon className="h-4 w-4" /> Strengths & Wins
                                                </div>
                                                <ul className="text-xs text-green-900 leading-relaxed list-disc pl-4 space-y-1">
                                                    {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {risks.length > 0 && (
                                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                <div className="text-orange-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                    <ShieldExclamationIcon className="h-4 w-4" /> Risk Analysis
                                                </div>
                                                <ul className="text-xs text-orange-900 leading-relaxed list-disc pl-4 space-y-1">
                                                    {risks.map((r, idx) => <li key={idx}>{r}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {keyThemes.length > 0 && (
                                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                <div className="text-blue-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                    <HashtagIcon className="h-4 w-4" /> Key Themes
                                                </div>
                                                <ul className="text-xs text-blue-900 leading-relaxed list-disc pl-4 space-y-1">
                                                    {keyThemes.map((w, idx) => <li key={idx}>{w}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {hiddenCorrelations.length > 0 && (
                                            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                <div className="text-rose-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                    <LinkIcon className="h-4 w-4" /> Hidden Links
                                                </div>
                                                <ul className="text-xs text-rose-900 leading-relaxed list-disc pl-4 space-y-1">
                                                    {hiddenCorrelations.map((w, idx) => <li key={idx}>{w}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {triggers.length > 0 && (
                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                <div className="text-amber-800 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                                    <BoltIcon className="h-4 w-4" /> Triggers
                                                </div>
                                                <ul className="text-xs text-amber-900 leading-relaxed list-disc pl-4 space-y-1">
                                                    {triggers.map((w, idx) => <li key={idx}>{w}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                    </div>

                                    {/* ACTION PLAN SECTION */}
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
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    dirname = os.path.dirname(absolute_path)
    
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
        
    # Safely replace FENCE
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Surgically patched: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Initiating UI & Schema Update...")
    write_file("src/lib/insights.ts", insights_content)
    write_file("src/components/journal/JournalAnalysisWizard.tsx", wizard_content)
    write_file("src/pages/InsightsLog.tsx", log_content)
    print("✨ Insights update complete. Bento grids and vibrant styling applied.")