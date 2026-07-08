/**
 * src/components/smart_tools/FiveQuestionsTool.tsx
 * PROJ-50 Phase 5: Five Questions
 * Byron Katie's "The Work" adapted for recovery — a guided, step-locked
 * self-enquiry flow. An "intro" screen names the specific thought being
 * examined, a "guided" phase asks the five questions in order via
 * GuidedWorkflowEngine (Q1/Q2 pair a Yes/No answer with an explanation, Q5
 * pairs the turnaround with a 1-5 rating of how true it feels), and a
 * "summary" phase reviews the full self-enquiry before saving.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SmartToolContainer } from './SmartToolContainer';
import { GuidedWorkflowEngine, type Step } from '../tools/GuidedWorkflowEngine';
import { YesNoToggle } from '../tools/YesNoToggle';
import { StarRating } from '../tools/StarRating';
import VibrantHeader from '../VibrantHeader';
import { DRAFT_TAG, type FiveQuestionsPayload } from '../../lib/types/smart';
import { ChatBubbleLeftRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const EXPLANATION = "The Five Questions are Byron Katie's method of self-enquiry, adapted for recovery. Rather than arguing with a difficult thought, you question it — gently, honestly — and see what's still true once you do.";

type Phase = 'intro' | 'guided' | 'summary';

function isFiveQuestionsComplete(d: FiveQuestionsPayload): boolean {
    return Boolean(d.thought) &&
        Boolean(d.q1Explanation) && d.q1IsTrue !== '' &&
        Boolean(d.q2Explanation) && d.q2CanKnow !== '' &&
        Boolean(d.q3Reaction) &&
        Boolean(d.q4WithoutThought) &&
        Boolean(d.turnaround) && d.turnaroundRating > 0;
}

function buildFiveQuestionsSteps(thought: string): Step[] {
    const t = thought || 'this thought';
    return [
        {
            id: 'q1Explanation', label: 'Q1 — Is It True?',
            question: `Is the thought "${t}" true?`,
            coaching: "Not whether it feels true — whether you can actually stand behind it as fact. Take a breath before you answer, and write down what makes you say yes or no.",
            inputType: 'textarea',
            placeholder: 'e.g., It feels true in the moment, but I can think of times it wasn\'t.',
            minLength: 10, aiPromptEnabled: false,
            canAdvanceExtra: (allStepValues) => allStepValues.q1IsTrue === 'yes' || allStepValues.q1IsTrue === 'no',
            renderExtra: ({ allStepValues, setStepValue }) => (
                <YesNoToggle
                    value={(allStepValues.q1IsTrue as 'yes' | 'no' | '' | undefined) ?? ''}
                    onChange={(v) => setStepValue('q1IsTrue', v)}
                    label="Is it true?"
                />
            ),
        },
        {
            id: 'q2Explanation', label: 'Q2 — Can You Know For Certain?',
            question: `Can you absolutely know that "${t}" is true?`,
            coaching: "This is a harder question than it sounds. Certainty is a high bar — most of what troubles us doesn't clear it once we really look for the exceptions.",
            inputType: 'textarea',
            placeholder: 'e.g., No — I can\'t know for certain, even if it feels that way right now.',
            minLength: 10, aiPromptEnabled: false,
            canAdvanceExtra: (allStepValues) => allStepValues.q2CanKnow === 'yes' || allStepValues.q2CanKnow === 'no',
            renderExtra: ({ allStepValues, setStepValue }) => (
                <YesNoToggle
                    value={(allStepValues.q2CanKnow as 'yes' | 'no' | '' | undefined) ?? ''}
                    onChange={(v) => setStepValue('q2CanKnow', v)}
                    label="Can you know for certain?"
                />
            ),
        },
        {
            id: 'q3Reaction', label: 'Q3 — How You React',
            question: `How do you react — what happens — when you believe "${t}"?`,
            coaching: "Notice what this thought does to you: how your body feels, how you treat the people around you, what you reach for. Just observe it, without judging yourself for it.",
            inputType: 'textarea',
            placeholder: 'e.g., I get tense, pull away from people, and start looking for a way to numb out.',
            minLength: 10, aiPromptEnabled: false,
        },
        {
            id: 'q4WithoutThought', label: 'Q4 — Who Without It',
            question: `Who would you be without the thought "${t}"?`,
            coaching: 'Close your eyes for a moment. Imagine waking up tomorrow and this thought is simply gone. What does your day look like?',
            inputType: 'textarea',
            placeholder: 'e.g., I\'d probably feel lighter, and I\'d actually call my friend back instead of avoiding it.',
            minLength: 10, aiPromptEnabled: false,
        },
        {
            id: 'turnaround', label: 'Q5 — The Turnaround',
            question: `Write the turnaround — the opposite of "${t}." Then rate how true it feels.`,
            coaching: "A turnaround isn't a trick — it's a genuine possibility you're testing. Write the opposite of your original thought, then sit with it honestly: could this be just as true, or truer?",
            inputType: 'textarea',
            placeholder: 'e.g., The opposite of my thought might be just as true, if not more.',
            minLength: 10, aiPromptEnabled: true,
            canAdvanceExtra: (allStepValues) => typeof allStepValues.turnaroundRating === 'number' && allStepValues.turnaroundRating > 0,
            renderExtra: ({ allStepValues, setStepValue }) => (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">How true does the turnaround feel?</h4>
                    <StarRating
                        value={(allStepValues.turnaroundRating as number | undefined) ?? 0}
                        onChange={(v) => setStepValue('turnaroundRating', v)}
                    />
                </div>
            ),
        },
    ];
}

interface FiveQuestionsToolInnerProps {
    data: FiveQuestionsPayload;
    updateData: (newData: Partial<FiveQuestionsPayload>) => void;
    save: (overrideData: FiveQuestionsPayload, extraTags?: string[]) => Promise<void>;
    isSaving: boolean;
    forceFresh: boolean;
}

function FiveQuestionsToolInner({ data, updateData, save, isSaving, forceFresh }: FiveQuestionsToolInnerProps) {
    const [phase, setPhase] = useState<Phase>(() => {
        if (forceFresh) return 'intro';
        if (isFiveQuestionsComplete(data)) return 'summary';
        if (data.thought) return 'guided';
        return 'intro';
    });
    const [thought, setThought] = useState(forceFresh ? '' : data.thought);

    const handleStartGuided = async () => {
        const trimmed = thought.trim();
        const merged: FiveQuestionsPayload = { ...data, thought: trimmed };
        updateData({ thought: trimmed });
        await save(merged, [DRAFT_TAG]);
        setPhase('guided');
    };

    if (phase === 'intro') {
        return (
            <div className="min-h-[100dvh] bg-slate-50">
                <VibrantHeader
                    title="Five Questions"
                    subtitle="Let's name the thought first"
                    icon={ChatBubbleLeftRightIcon}
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
                                What's the thought or belief you want to examine?
                            </label>
                            <input
                                type="text"
                                value={thought}
                                onChange={(e) => setThought(e.target.value)}
                                placeholder="e.g. I'll never be able to relax without using"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg font-semibold focus:border-blue-400 focus:ring-0 transition-all placeholder-slate-300"
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!thought.trim()}
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
            <GuidedWorkflowEngine<FiveQuestionsPayload>
                toolType="FIVE_QUESTIONS"
                toolLabel="Five Questions"
                steps={buildFiveQuestionsSteps(data.thought)}
                initialData={data}
                isSaving={isSaving}
                forceFresh={forceFresh}
                suppressCompletionScreen
                onSaveProgress={(partial) => save(partial as FiveQuestionsPayload, [DRAFT_TAG])}
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
                title="Five Questions"
                subtitle={`Examining: "${data.thought}"`}
                icon={ChatBubbleLeftRightIcon}
                fromColor="from-blue-600" viaColor="via-indigo-600" toColor="to-violet-600"
            />
            <div className="-mt-8 relative z-10 max-w-2xl mx-auto px-4 pb-24 space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Q1 — Is It True?</h3>
                    <p className="text-sm font-bold text-teal-700">{data.q1IsTrue === 'yes' ? 'Yes' : data.q1IsTrue === 'no' ? 'No' : '—'}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.q1Explanation}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Q2 — Can You Know For Certain?</h3>
                    <p className="text-sm font-bold text-teal-700">{data.q2CanKnow === 'yes' ? 'Yes' : data.q2CanKnow === 'no' ? 'No' : '—'}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.q2Explanation}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Q3 — How You React</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.q3Reaction}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Q4 — Who Without It</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.q4WithoutThought}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Q5 — The Turnaround</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.turnaround}</p>
                    <StarRating value={data.turnaroundRating} readOnly />
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

export const FiveQuestionsTool: React.FC = () => {
    const [searchParams] = useSearchParams();
    const forceFresh = searchParams.get('fresh') === '1';

    const initialData: FiveQuestionsPayload = {
        thought: '',
        q1Explanation: '', q1IsTrue: '',
        q2Explanation: '', q2CanKnow: '',
        q3Reaction: '',
        q4WithoutThought: '',
        turnaround: '', turnaroundRating: 0,
    };

    return (
        <SmartToolContainer<FiveQuestionsPayload>
            toolType="FIVE_QUESTIONS"
            toolLabel="Five Questions"
            initialData={initialData}
            resumeSession
            hideDefaultSaveButton
            hideHeader
        >
            {({ data, updateData, save, isSaving }) => (
                <FiveQuestionsToolInner data={data} updateData={updateData} save={save} isSaving={isSaving} forceFresh={forceFresh} />
            )}
        </SmartToolContainer>
    );
};
