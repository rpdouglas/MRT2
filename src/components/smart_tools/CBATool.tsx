/**
 * src/components/smart_tools/CBATool.tsx
 * PROJ-27: The CBT Engine / PROJ-50 Phase 3: Guided CBA Flow
 * Guided, step-locked Cost-Benefit Analysis: an "intro" screen captures the
 * behavior being analyzed, a "guided" phase collects the four quadrants in a
 * clinically-mandated order via GuidedWorkflowEngine, and a "summary" phase
 * shows the traditional editable 2x2 grid plus an AI reflection before saving.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SmartToolContainer } from './SmartToolContainer';
import { GuidedWorkflowEngine, type Step } from '../tools/GuidedWorkflowEngine';
import { ListInput, type ListAccentColor } from '../tools/ListInput';
import VibrantHeader from '../VibrantHeader';
import { useAuth } from '../../contexts/AuthContext';
import { generateCBAReflection } from '../../lib/gemini';
import { DRAFT_TAG, type CBAPayload } from '../../lib/types/smart';
import { InformationCircleIcon, ScaleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const EXPLANATION = "The Cost Benefit Analysis (CBA) helps you see the 'big picture' of your addictive behavior. By weighing short and long-term pros and cons, you move from 'feeling' you should quit to 'knowing' why you must.";

type Phase = 'intro' | 'guided' | 'summary';

const QUADRANTS: Array<{ id: keyof Pick<CBAPayload, 'advantagesDoing' | 'disadvantagesDoing' | 'advantagesStopping' | 'disadvantagesStopping'>; label: string; accentColor: ListAccentColor }> = [
    { id: 'advantagesDoing', label: 'Advantages of Doing', accentColor: 'emerald' },
    { id: 'disadvantagesDoing', label: 'Disadvantages of Doing', accentColor: 'rose' },
    { id: 'advantagesStopping', label: 'Advantages of Stopping', accentColor: 'sky' },
    { id: 'disadvantagesStopping', label: 'Disadvantages of Stopping', accentColor: 'orange' },
];

function isCBAComplete(d: CBAPayload): boolean {
    return Boolean(d.behavior) &&
        d.advantagesDoing.length > 0 &&
        d.disadvantagesDoing.length > 0 &&
        d.advantagesStopping.length > 0 &&
        d.disadvantagesStopping.length > 0;
}

function buildQuadrantSteps(behavior: string): Step[] {
    const b = behavior || 'this behavior';
    return [
        {
            id: 'advantagesDoing', label: `Advantages of ${b}`,
            question: `What does ${b} actually give you?`,
            coaching: `This is the honest part. What does ${b} actually give you — even temporarily? Relief from stress? Connection? Escape? These are real. Naming them honestly is what makes this exercise work.`,
            inputType: 'list', accentColor: 'emerald',
            placeholder: 'e.g., Relief from anxiety, at least for a while',
            minLength: 1, aiPromptEnabled: false,
        },
        {
            id: 'disadvantagesDoing', label: `Disadvantages of ${b}`,
            question: `What has ${b} cost you?`,
            coaching: `Now the other side. What has ${b} actually cost you — physically, emotionally, in your relationships or your sense of self?`,
            inputType: 'list', accentColor: 'rose',
            placeholder: 'e.g., Damaged trust with my family',
            minLength: 1, aiPromptEnabled: false,
        },
        {
            id: 'advantagesStopping', label: 'Advantages of Stopping',
            question: `What would you gain by stopping ${b}?`,
            coaching: `Picture the version of you who has stopped ${b}. What becomes possible for them that isn't possible now?`,
            inputType: 'list', accentColor: 'sky',
            placeholder: 'e.g., Waking up clear-headed',
            minLength: 1, aiPromptEnabled: false,
        },
        {
            id: 'disadvantagesStopping', label: 'Disadvantages of Stopping',
            question: `What feels hard or scary about stopping ${b}?`,
            coaching: `This one matters too. Stopping isn't free of cost either. What would you have to face, feel, or give up if you stopped ${b}? Naming this honestly is what makes the plan realistic instead of wishful.`,
            inputType: 'list', accentColor: 'orange',
            placeholder: "e.g., Losing my main way to unwind after work",
            minLength: 1, aiPromptEnabled: false,
        },
    ];
}

interface CBAToolInnerProps {
    data: CBAPayload;
    updateData: (newData: Partial<CBAPayload>) => void;
    save: (overrideData: CBAPayload, extraTags?: string[]) => Promise<void>;
    isSaving: boolean;
    forceFresh: boolean;
}

function CBAToolInner({ data, updateData, save, isSaving, forceFresh }: CBAToolInnerProps) {
    const { userTier } = useAuth();
    const [phase, setPhase] = useState<Phase>(() => {
        if (forceFresh) return 'intro';
        if (isCBAComplete(data)) return 'summary';
        if (data.behavior) return 'guided';
        return 'intro';
    });
    const [behavior, setBehavior] = useState(forceFresh ? '' : data.behavior);
    const [reflection, setReflection] = useState<string | null>(null);
    const [reflectionLoading, setReflectionLoading] = useState(false);

    const handleStartGuided = async () => {
        const trimmed = behavior.trim();
        const merged: CBAPayload = { ...data, behavior: trimmed };
        updateData({ behavior: trimmed });
        await save(merged, [DRAFT_TAG]);
        setPhase('guided');
    };

    const handleReflect = async () => {
        if (userTier !== 'premium') return; // gate the call itself, not just the rendered button
        setReflectionLoading(true);
        try {
            const sentence = await generateCBAReflection(data.behavior, {
                advantagesDoing: data.advantagesDoing,
                disadvantagesDoing: data.disadvantagesDoing,
                advantagesStopping: data.advantagesStopping,
                disadvantagesStopping: data.disadvantagesStopping,
            });
            setReflection(sentence);
        } catch (err) {
            console.error('[CBATool] AI reflection failed:', err);
        } finally {
            setReflectionLoading(false);
        }
    };

    if (phase === 'intro') {
        return (
            <div className="min-h-[100dvh] bg-slate-50">
                <VibrantHeader
                    title="Cost Benefit Analysis"
                    subtitle="Let's name the behavior first"
                    icon={ScaleIcon}
                    fromColor="from-blue-600" viaColor="via-indigo-600" toColor="to-violet-600"
                />
                <div className="-mt-8 relative z-10 max-w-2xl mx-auto px-4 pb-24 space-y-5">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-4">
                        <div className="flex items-start gap-3 text-slate-800">
                            <InformationCircleIcon className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed font-medium">{EXPLANATION}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                                What behavior are we analyzing?
                            </label>
                            <input
                                type="text"
                                value={behavior}
                                onChange={(e) => setBehavior(e.target.value)}
                                placeholder="e.g. Drinking, Isolating"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg font-semibold focus:border-blue-400 focus:ring-0 transition-all placeholder-slate-300"
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!behavior.trim()}
                            onClick={handleStartGuided}
                            className="w-full min-h-[44px] px-5 bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-200 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'guided') {
        return (
            <GuidedWorkflowEngine<CBAPayload>
                toolType="CBA"
                toolLabel="Cost Benefit Analysis"
                steps={buildQuadrantSteps(data.behavior)}
                initialData={data}
                isSaving={isSaving}
                forceFresh={forceFresh}
                onSaveProgress={(partial) => save(partial as CBAPayload, [DRAFT_TAG])}
                onComplete={async (payload) => {
                    await save(payload, [DRAFT_TAG]); // still DRAFT — summary is the true completion gate
                    setPhase('summary');
                }}
            />
        );
    }

    // phase === 'summary'
    return (
        <div className="min-h-[100dvh] bg-slate-50">
            <VibrantHeader
                title="Cost Benefit Analysis"
                subtitle={`Reviewing: ${data.behavior}`}
                icon={ScaleIcon}
                fromColor="from-blue-600" viaColor="via-indigo-600" toColor="to-violet-600"
            />
            <div className="-mt-8 relative z-10 max-w-4xl mx-auto px-4 pb-24 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {QUADRANTS.map(q => (
                        <ListInput
                            key={q.id}
                            title={q.label}
                            items={data[q.id]}
                            accentColor={q.accentColor}
                            onChange={(items) => updateData({ [q.id]: items } as Partial<CBAPayload>)}
                        />
                    ))}
                </div>

                <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl p-4 space-y-3">
                    {userTier === 'premium' ? (
                        <>
                            <button
                                type="button"
                                onClick={handleReflect}
                                disabled={reflectionLoading}
                                className="flex items-center gap-2 min-h-[44px] text-sm font-bold text-fuchsia-900 disabled:opacity-60"
                            >
                                <SparklesIcon className="w-4 h-4 text-fuchsia-500" />
                                {reflectionLoading ? 'Reflecting…' : 'What does this tell you?'}
                            </button>
                            {reflection && <p className="text-sm text-fuchsia-900/90">{reflection}</p>}
                        </>
                    ) : (
                        <p className="text-xs text-fuchsia-900/70">Upgrade to Premium for an AI reflection on your completed analysis.</p>
                    )}
                </div>

                <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => save(data, [])}
                    className="w-full min-h-[44px] px-5 bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-200 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                    {isSaving ? 'Saving…' : 'Save to Journal'}
                </button>
            </div>
        </div>
    );
}

export const CBATool: React.FC = () => {
    const [searchParams] = useSearchParams();
    const forceFresh = searchParams.get('fresh') === '1';

    const initialData: CBAPayload = {
        behavior: '',
        advantagesDoing: [],
        disadvantagesDoing: [],
        advantagesStopping: [],
        disadvantagesStopping: [],
    };

    return (
        <SmartToolContainer<CBAPayload>
            toolType="CBA"
            toolLabel="Cost Benefit Analysis"
            initialData={initialData}
            resumeSession
            hideDefaultSaveButton
            hideHeader
        >
            {({ data, updateData, save, isSaving }) => (
                <CBAToolInner data={data} updateData={updateData} save={save} isSaving={isSaving} forceFresh={forceFresh} />
            )}
        </SmartToolContainer>
    );
};
