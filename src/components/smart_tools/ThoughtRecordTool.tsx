/**
 * src/components/smart_tools/ThoughtRecordTool.tsx
 * PROJ-50 Phase 4: Thought Record
 * Guided, step-locked 7-column CBT thought record: a "guided" phase collects
 * the seven columns in order via GuidedWorkflowEngine (including an optional
 * cognitive-distortion identification and a before/after emotion re-rating),
 * and a "summary" phase shows the balanced thought and the emotion "Delta"
 * before the final save.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SmartToolContainer } from './SmartToolContainer';
import { GuidedWorkflowEngine, type Step } from '../tools/GuidedWorkflowEngine';
import { CognitiveDistortionPicker } from '../tools/CognitiveDistortionPicker';
import VibrantHeader from '../VibrantHeader';
import { DRAFT_TAG, type ThoughtRecordPayload } from '../../lib/types/smart';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

type Phase = 'guided' | 'summary';

function isThoughtRecordComplete(d: ThoughtRecordPayload): boolean {
    return Boolean(d.situation) && Boolean(d.automaticThoughts) && d.emotions.length > 0 &&
        Boolean(d.evidenceFor) && Boolean(d.evidenceAgainst) && Boolean(d.balancedThought) &&
        d.outcomeEmotions.length > 0;
}

const STEPS: Step[] = [
    {
        id: 'situation', label: 'Situation',
        question: 'What were you doing? Where were you? When did this happen?',
        coaching: "This first column is just the facts — the scene-setting. Not what it means, not how you felt about it yet. Just where you were and what was happening around you when the automatic thought showed up.",
        inputType: 'textarea',
        placeholder: 'e.g., Sitting alone in my apartment on a Friday night, phone buzzing with messages from old friends.',
        minLength: 10, aiPromptEnabled: false,
    },
    {
        id: 'automaticThoughts', label: 'Automatic Thought',
        question: 'What went through your mind? What images or memories came up?',
        coaching: "Automatic thoughts arrive fast, often as a single sentence or a flash of an image. You don't have to justify it yet — just capture exactly what crossed your mind in that moment.",
        inputType: 'textarea',
        placeholder: "e.g., I'll never be able to just relax without using. What's even the point of staying sober.",
        minLength: 10, aiPromptEnabled: false,
    },
    {
        id: 'emotions', label: 'Emotions (Before)',
        question: 'What are you feeling right now, and how strong is it?',
        coaching: "Pick up to three emotions that match this moment, then rate how strong each one feels from 0 to 100. There's no wrong answer — you're just taking an honest snapshot before you start examining the thought.",
        inputType: 'emotion', placeholder: '', minLength: 1, aiPromptEnabled: false,
    },
    {
        id: 'evidenceFor', label: 'Evidence For',
        question: 'What facts actually support this thought?',
        coaching: "Look for real, checkable facts — not feelings, not assumptions about what others think. If you're struggling to find much here, that's useful information too.",
        inputType: 'textarea',
        placeholder: 'e.g., I have relapsed after stressful weeks before.',
        minLength: 10, aiPromptEnabled: false,
    },
    {
        id: 'evidenceAgainst', label: 'Evidence Against',
        question: 'What facts contradict this thought? What would a reasonable person say?',
        coaching: "This is the step people rush past. Take your time. What would a fair, reasonable person — someone who cares about you but isn't inside your head — actually say about the evidence here?",
        inputType: 'textarea',
        placeholder: "e.g., I've made it through hard Friday nights before without using, more than once.",
        minLength: 10, aiPromptEnabled: false,
        renderExtra: ({ allStepValues, setStepValue }) => (
            <CognitiveDistortionPicker
                selected={(allStepValues.distortionType as string | undefined) ?? null}
                onChange={(d) => setStepValue('distortionType', d ?? '')}
            />
        ),
    },
    {
        id: 'balancedThought', label: 'Balanced Thought',
        question: 'Write a more balanced thought that takes all the evidence into account.',
        coaching: "A balanced thought isn't forced positivity — it's the most accurate sentence you can write once you've looked at both sides honestly. It should feel true, even if it's not comfortable yet.",
        inputType: 'textarea',
        placeholder: 'e.g., Staying sober on hard nights is difficult, but I have real evidence I can get through them without using.',
        minLength: 15, aiPromptEnabled: true,
    },
    {
        id: 'outcomeEmotions', label: 'Emotions (After)',
        question: "Re-rate the same emotions now that you've worked through this thought.",
        coaching: "Same emotions as before — just re-rated. It's okay if the numbers barely move, or don't move at all. Even a small shift is real, measurable progress.",
        inputType: 'emotion', placeholder: '', minLength: 1, aiPromptEnabled: false,
        emotionSourceStepId: 'emotions',
    },
];

interface ThoughtRecordToolInnerProps {
    data: ThoughtRecordPayload;
    save: (overrideData: ThoughtRecordPayload, extraTags?: string[]) => Promise<void>;
    isSaving: boolean;
    forceFresh: boolean;
}

function ThoughtRecordToolInner({ data, save, isSaving, forceFresh }: ThoughtRecordToolInnerProps) {
    const [phase, setPhase] = useState<Phase>(() => (!forceFresh && isThoughtRecordComplete(data)) ? 'summary' : 'guided');

    if (phase === 'guided') {
        return (
            <GuidedWorkflowEngine<ThoughtRecordPayload>
                toolType="THOUGHT_RECORD"
                toolLabel="Thought Record"
                steps={STEPS}
                initialData={data}
                isSaving={isSaving}
                forceFresh={forceFresh}
                suppressCompletionScreen
                onSaveProgress={(partial) => save(partial as ThoughtRecordPayload, [DRAFT_TAG])}
                onComplete={async (payload) => {
                    const clean = { ...payload, distortionType: payload.distortionType || undefined };
                    await save(clean, [DRAFT_TAG]); // still DRAFT — summary is the true completion gate
                    setPhase('summary');
                }}
            />
        );
    }

    // phase === 'summary'
    const deltas = data.emotions.map(before => {
        const after = data.outcomeEmotions.find(o => o.emotion === before.emotion);
        return { emotion: before.emotion, before: before.intensity, after: after?.intensity ?? before.intensity };
    });

    return (
        <div className="min-h-[100dvh] bg-slate-50">
            <VibrantHeader
                title="Thought Record"
                subtitle="Reviewing your reframed thought"
                icon={ClipboardDocumentListIcon}
                fromColor="from-blue-600" viaColor="via-indigo-600" toColor="to-violet-600"
            />
            <div className="-mt-8 relative z-10 max-w-2xl mx-auto px-4 pb-24 space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Balanced Thought</h3>
                    <p className="text-lg font-semibold text-slate-900 leading-snug">{data.balancedThought}</p>
                    {data.distortionType && (
                        <p className="text-xs text-slate-500">
                            Pattern noticed: <span className="font-bold text-indigo-600">{data.distortionType}</span>
                        </p>
                    )}
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">The Shift</h3>
                    {deltas.map(d => (
                        <p key={d.emotion} className="text-sm text-slate-700 leading-relaxed">
                            Your <span className="font-semibold">{d.emotion.toLowerCase()}</span> moved from{' '}
                            <span className="font-bold">{d.before}%</span> to <span className="font-bold">{d.after}%</span> after completing this record.
                        </p>
                    ))}
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

export const ThoughtRecordTool: React.FC = () => {
    const [searchParams] = useSearchParams();
    const forceFresh = searchParams.get('fresh') === '1';

    const initialData: ThoughtRecordPayload = {
        situation: '', automaticThoughts: '', emotions: [], evidenceFor: '', evidenceAgainst: '', balancedThought: '', outcomeEmotions: [],
    };

    return (
        <SmartToolContainer<ThoughtRecordPayload>
            toolType="THOUGHT_RECORD"
            toolLabel="Thought Record"
            initialData={initialData}
            resumeSession
            hideDefaultSaveButton
            hideHeader
        >
            {({ data, save, isSaving }) => (
                <ThoughtRecordToolInner data={data} save={save} isSaving={isSaving} forceFresh={forceFresh} />
            )}
        </SmartToolContainer>
    );
};
