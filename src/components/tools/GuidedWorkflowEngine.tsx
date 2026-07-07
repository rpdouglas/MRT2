/**
 * src/components/tools/GuidedWorkflowEngine.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Generic, tool-agnostic step-by-step flow. Sits above SmartToolContainer, which
 * still owns vault-gating, encryption, and Firestore persistence — this engine
 * only manages step navigation, draft autosave, and the optional AI coaching prompt.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CheckCircleIcon, ArrowPathIcon, SparklesIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useGuidedDraft } from '../../hooks/useGuidedDraft';
import { generateCBTCoachingPrompt } from '../../lib/gemini';
import type { SmartToolType } from '../../lib/types/smart';
import { StepCoachingCard } from './StepCoachingCard';

const AI_PROMPT_DEBOUNCE_MS = 5000;
const DRAFT_AUTOSAVE_INTERVAL_MS = 30000;

export interface Step {
    id: string;
    label: string;
    question: string;
    coaching: string;
    inputType: 'textarea';
    placeholder: string;
    minLength: number;
    aiPromptEnabled: boolean;
    renderExtra?: (ctx: {
        value: string;
        onChange: (v: string) => void;
        allStepValues: Record<string, string>;
    }) => React.ReactNode;
}

export interface GuidedWorkflowEngineProps<T> {
    toolType: SmartToolType;
    toolLabel: string;
    steps: Step[];
    initialData?: Partial<T>;
    onComplete: (payload: T) => void | Promise<void>;
    onSaveProgress: (payload: Partial<T>) => void | Promise<void>;
    isSaving?: boolean;
    /** Lets a specific tool enrich the AI prompt's context for a given step (e.g. a selected cognitive distortion). */
    getAiContext?: (step: Step, value: string) => string;
}

export function GuidedWorkflowEngine<T>({
    toolType,
    toolLabel,
    steps,
    initialData,
    onComplete,
    onSaveProgress,
    isSaving = false,
    getAiContext,
}: GuidedWorkflowEngineProps<T>) {
    const navigate = useNavigate();
    const { userTier } = useAuth();
    const { isOnline } = useLayout();
    const { getDraft, saveDraft, clearDraft } = useGuidedDraft<Record<string, string>>(toolType);

    const [currentStep, setCurrentStep] = useState(0);
    const [stepData, setStepData] = useState<Record<string, string>>(() => ({ ...(initialData as Record<string, string> | undefined) }));
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<{ currentStep: number; stepData: Partial<Record<string, string>> } | null>(null);
    const [savedFlash, setSavedFlash] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const [aiPrompts, setAiPrompts] = useState<Record<string, string>>({});
    const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check for an existing same-session draft on mount.
    useEffect(() => {
        const draft = getDraft();
        if (draft && Object.keys(draft.stepData).length > 0) {
            setPendingDraft(draft);
            setShowResumePrompt(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Autosave the current draft to sessionStorage every 30s.
    useEffect(() => {
        const interval = setInterval(() => {
            if (Object.keys(stepData).length > 0) saveDraft(currentStep, stepData);
        }, DRAFT_AUTOSAVE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [currentStep, stepData, saveDraft]);

    const step = steps[currentStep];
    const currentValue = stepData[step.id] ?? '';
    const canAdvance = currentValue.length >= step.minLength;
    const isLastStep = currentStep === steps.length - 1;
    const aiEnabled = step.aiPromptEnabled && userTier === 'premium';

    const updateStepValue = (value: string) => {
        setStepData(prev => ({ ...prev, [step.id]: value }));
    };

    // AI coaching prompt: fires once per step, after a pause in typing, Premium only.
    useEffect(() => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        if (!aiEnabled || aiPrompts[step.id] || currentValue.length < step.minLength) return;

        aiTimerRef.current = setTimeout(() => {
            const context = getAiContext ? getAiContext(step, currentValue) : currentValue;
            generateCBTCoachingPrompt(toolType, step.id, context)
                .then(question => setAiPrompts(prev => ({ ...prev, [step.id]: question })))
                .catch(err => console.error('[GuidedWorkflowEngine] AI coaching prompt failed:', err));
        }, AI_PROMPT_DEBOUNCE_MS);

        return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue, step.id, aiEnabled]);

    const handleResume = () => {
        if (pendingDraft) {
            setStepData(pendingDraft.stepData as Record<string, string>);
            setCurrentStep(pendingDraft.currentStep);
        }
        setShowResumePrompt(false);
    };

    const handleStartFresh = () => {
        clearDraft();
        setShowResumePrompt(false);
    };

    const handleSaveProgress = async () => {
        await onSaveProgress(stepData as unknown as Partial<T>);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
    };

    const handleExit = async () => {
        await onSaveProgress(stepData as unknown as Partial<T>);
        navigate('/tools');
    };

    const handleNext = async () => {
        if (!canAdvance) return;
        if (isLastStep) {
            await onComplete(stepData as unknown as T);
            clearDraft();
            setIsComplete(true);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    if (isComplete) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-emerald-50/80 rounded-3xl border border-emerald-100 space-y-3">
                <CheckCircleIcon className="w-14 h-14 text-emerald-500" />
                <h3 className="text-xl font-bold text-emerald-900">You just did some serious cognitive work.</h3>
                <button
                    type="button"
                    onClick={() => navigate('/tools')}
                    className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                >
                    Back to Tools
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-2xl mx-auto pb-24">
            {/* Progress + exit */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {steps.map((s, i) => (
                        <div
                            key={s.id}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${i <= currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                        />
                    ))}
                </div>
                <button type="button" onClick={handleExit} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
                    Exit and save draft
                </button>
            </div>

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Step {currentStep + 1} of {steps.length} — {step.label}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 leading-snug">{step.question}</h2>

            <StepCoachingCard coaching={step.coaching} />

            <textarea
                rows={5}
                value={currentValue}
                onChange={(e) => updateStepValue(e.target.value)}
                placeholder={step.placeholder}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-base focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all resize-y min-h-[140px]"
            />

            {step.renderExtra && (
                <div className="w-full">
                    {step.renderExtra({ value: currentValue, onChange: updateStepValue, allStepValues: stepData })}
                </div>
            )}

            {aiEnabled && aiPrompts[step.id] && (
                <button
                    type="button"
                    onClick={() => updateStepValue(`${currentValue}\n\n${aiPrompts[step.id]}\n`)}
                    className="w-full text-left flex items-start gap-2 bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-3 text-sm text-fuchsia-900 hover:bg-fuchsia-100 transition-colors"
                >
                    <SparklesIcon className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                    <span><span className="font-bold">A deeper question:</span> {aiPrompts[step.id]}</span>
                </button>
            )}

            {!isOnline && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <WifiIcon className="w-4 h-4" /> Connect to save your progress
                </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
                <button
                    type="button"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Back
                </button>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        disabled={!isOnline || isSaving}
                        onClick={handleSaveProgress}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : savedFlash ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : null}
                        {savedFlash ? 'Saved ✓' : 'Save Progress'}
                    </button>

                    <button
                        type="button"
                        disabled={!canAdvance || (isLastStep && (!isOnline || isSaving))}
                        onClick={handleNext}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                        {isLastStep ? 'Finish' : 'Next →'}
                    </button>
                </div>
            </div>

            <Transition.Root show={showResumePrompt} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={handleStartFresh}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4 text-center">
                            <h3 className="text-lg font-bold text-slate-900">Resume your {toolLabel} session?</h3>
                            <p className="text-sm text-slate-500">You have an unsaved draft from earlier in this browser session.</p>
                            <div className="flex flex-col gap-2 pt-2">
                                <button type="button" onClick={handleResume} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                                    Resume
                                </button>
                                <button type="button" onClick={handleStartFresh} className="w-full py-2.5 text-slate-500 font-bold hover:text-slate-700">
                                    Start Fresh
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
