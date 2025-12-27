import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    SparklesIcon, 
    XMarkIcon, 
    CalendarDaysIcon,
    ChartBarIcon,
    GlobeAmericasIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { generateComparativeAnalysis, type ComparativeAnalysisResult } from '../../lib/gemini';
import type { JournalEntry } from './JournalEditor';
import { subDays, isAfter, isBefore } from 'date-fns';

interface WizardProps {
    isOpen: boolean;
    onClose: () => void;
    entries: JournalEntry[]; // Should be ALL entries (decrypted) passed from parent
}

type AnalysisScope = 'weekly' | 'monthly' | 'all-time';

export default function JournalAnalysisWizard({ isOpen, onClose, entries }: WizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<'select' | 'analyzing' | 'results'>('select');
    const [scope, setScope] = useState<AnalysisScope>('weekly');
    const [result, setResult] = useState<ComparativeAnalysisResult | null>(null);
    const [saving, setSaving] = useState(false);

    const runAnalysis = async () => {
        setStep('analyzing');
        
        try {
            const now = new Date();
            let currentSet: JournalEntry[] = [];
            let previousSet: JournalEntry[] = [];

            // 1. Partition Data
            if (scope === 'weekly') {
                const oneWeekAgo = subDays(now, 7);
                const twoWeeksAgo = subDays(now, 14);
                
                // Helper to safely get date from entry
                const getDate = (e: JournalEntry) => e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt as unknown as string);

                currentSet = entries.filter(e => isAfter(getDate(e), oneWeekAgo));
                previousSet = entries.filter(e => isAfter(getDate(e), twoWeeksAgo) && isBefore(getDate(e), oneWeekAgo));
            } else if (scope === 'monthly') {
                const oneMonthAgo = subDays(now, 30);
                const twoMonthsAgo = subDays(now, 60);
                const getDate = (e: JournalEntry) => e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt as unknown as string);

                currentSet = entries.filter(e => isAfter(getDate(e), oneMonthAgo));
                previousSet = entries.filter(e => isAfter(getDate(e), twoMonthsAgo) && isBefore(getDate(e), oneMonthAgo));
            } else {
                // All Time - Token Safety: Limit to most recent 200 entries to prevent context overflow
                // Assuming entries are already sorted desc by parent
                currentSet = entries.slice(0, 200); 
                previousSet = [];
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
            setResult(analysis);
            setStep('results');

        } catch (error) {
            console.error(error);
            alert("Analysis failed. Please try again.");
            setStep('select');
        }
    };

    const saveInsight = async () => {
        if (!user || !result || !db) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'insights'), {
                uid: user.uid,
                type: 'journal',
                summary: result.comparison_summary,
                pillars: {
                    understanding: result.key_themes.join(', '),
                    growth: result.wins.join(', '),
                    blind_spots: result.blind_spots.join(', ')
                },
                suggested_actions: result.actionable_advice,
                createdAt: Timestamp.now(),
                scope_context: scope === 'all-time' ? 'Deep Holistic Review' : `${scope.charAt(0).toUpperCase() + scope.slice(1)} Comparative Review`
            });
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
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-white">
                                <SparklesIcon className="h-6 w-6" />
                                <h3 className="font-bold text-lg">Analysis Wizard</h3>
                            </div>
                            <button onClick={onClose} className="text-white/80 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
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
                                        <div className="text-left"><div className="font-bold text-gray-900">Deep Dive (All Time)</div><div className="text-xs text-gray-500">Holistic analysis of your entire journey</div></div>
                                    </button>

                                    <button onClick={runAnalysis} className="w-full mt-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all">
                                        Begin Analysis
                                    </button>
                                </div>
                            )}

                            {step === 'analyzing' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mb-4"></div>
                                    <h4 className="text-lg font-bold text-gray-900">Consulting the Compass...</h4>
                                    <p className="text-sm text-gray-500 mt-2">Comparing periods and identifying patterns.</p>
                                </div>
                            )}

                            {step === 'results' && result && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                            result.trajectory === 'Improving' ? 'bg-green-100 text-green-700 border-green-200' : 
                                            result.trajectory === 'Declining' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                            Trajectory: {result.trajectory}
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">AI Generated</span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
                                        {result.comparison_summary}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h5 className="text-xs font-bold text-green-700 uppercase flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Wins</h5>
                                            <ul className="text-xs text-gray-600 space-y-1">{result.wins.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h5 className="text-xs font-bold text-orange-700 uppercase flex items-center gap-1"><ExclamationTriangleIcon className="h-4 w-4" /> Blind Spots</h5>
                                            <ul className="text-xs text-gray-600 space-y-1">{result.blind_spots.map((w,i) => <li key={i}>• {w}</li>)}</ul>
                                        </div>
                                    </div>

                                    <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                                        <h5 className="text-xs font-bold text-fuchsia-800 uppercase mb-2">Suggested Actions</h5>
                                        <div className="space-y-2">
                                            {result.actionable_advice.map((action, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-fuchsia-900 bg-white/50 p-2 rounded-lg">
                                                    <span className="font-bold text-fuchsia-400">{i+1}.</span> {action}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={saveInsight} disabled={saving} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all">
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