/**
 * src/components/smart_tools/DentsTool.tsx
 * PROJ-27: The CBT Engine / PROJ-50 Phase 5: DENTS Scenario Mode
 * Guided, step-locked D.E.N.T.S. pre-planning: an "intro" screen captures the
 * specific high-risk scenario being planned for, a "guided" phase collects the
 * five D-E-N-T-S prompts — each dynamically worded to reference that scenario —
 * via GuidedWorkflowEngine, and a "summary" phase shows the full plan, editable,
 * before the final save.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SmartToolContainer } from './SmartToolContainer';
import { GuidedWorkflowEngine, type Step } from '../tools/GuidedWorkflowEngine';
import VibrantHeader from '../VibrantHeader';
import { DRAFT_TAG, type DENTSPayload } from '../../lib/types/smart';
import {
    HandRaisedIcon, ArrowRightOnRectangleIcon, ShieldExclamationIcon, ClipboardDocumentCheckIcon,
    ArrowPathIcon, InformationCircleIcon, BoltIcon,
} from '@heroicons/react/24/outline';

const EXPLANATION = "The D.E.N.T.S. strategy helps you pre-plan for high-risk situations (like a party or a stressful family gathering). Fill this out before you go, so you have a concrete escape and distraction plan if an urge strikes.";

type Phase = 'intro' | 'guided' | 'summary';

function isDentsComplete(d: DENTSPayload): boolean {
    return Boolean(d.deny) && Boolean(d.escape) && Boolean(d.neutralize) && Boolean(d.tasks) && Boolean(d.swap);
}

function buildDentsSteps(scenario: string): Step[] {
    const s = scenario || 'this situation';
    return [
        {
            id: 'deny', label: 'Deny / Delay',
            question: `If ${s} happens, how exactly will you Deny it? What words will you say?`,
            coaching: 'Refuse the urge right now. Tell yourself "Not today, maybe tomorrow." How will you delay?',
            inputType: 'textarea',
            placeholder: 'e.g., I will promise myself to wait 24 hours before acting on any urge.',
            minLength: 10, aiPromptEnabled: false,
        },
        {
            id: 'escape', label: 'Escape',
            question: `If ${s} gets too risky, what's your exact escape plan?`,
            coaching: 'Plan your physical exit strategy. If the situation gets too risky, how do you leave?',
            inputType: 'textarea',
            placeholder: "e.g., I'll say I have a family emergency and take an Uber home immediately.",
            minLength: 10, aiPromptEnabled: false,
        },
        {
            id: 'neutralize', label: 'Neutralize',
            question: `Who will you call to neutralize the craving if ${s} happens?`,
            coaching: 'Who can you call to talk it out and defuse the craving?',
            inputType: 'textarea',
            placeholder: 'e.g., I will step outside and call my sponsor or a supportive friend.',
            minLength: 10, aiPromptEnabled: false,
        },
        {
            id: 'tasks', label: 'Tasks',
            question: `What specific task will keep your hands and mind busy during ${s}?`,
            coaching: 'What specific busy-work can you do to distract your hands and mind?',
            inputType: 'textarea',
            placeholder: 'e.g., I will go to the kitchen and help wash the dishes.',
            minLength: 10, aiPromptEnabled: false,
        },
        {
            id: 'swap', label: 'Swap',
            question: `What healthy alternative will you swap in during ${s}?`,
            coaching: 'Replace the addictive behavior with a healthy alternative you enjoy.',
            inputType: 'textarea',
            placeholder: 'e.g., I will order a sparkling water with lime instead of alcohol.',
            minLength: 10, aiPromptEnabled: false,
        },
    ];
}

interface StrategyCardProps {
    letter: string;
    title: string;
    description: string;
    value: string;
    onChange: (val: string) => void;
    icon: React.ElementType;
    colorTheme: 'rose' | 'orange' | 'amber' | 'emerald' | 'sky';
    placeholder: string;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
    letter, title, description, value, onChange, icon: Icon, colorTheme, placeholder
}) => {
    const themeStyles = {
        rose: "bg-rose-50 border-rose-200 text-rose-900 ring-rose-400 focus-within:border-rose-400 focus-within:ring-rose-200",
        orange: "bg-orange-50 border-orange-200 text-orange-900 ring-orange-400 focus-within:border-orange-400 focus-within:ring-orange-200",
        amber: "bg-amber-50 border-amber-200 text-amber-900 ring-amber-400 focus-within:border-amber-400 focus-within:ring-amber-200",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 ring-emerald-400 focus-within:border-emerald-400 focus-within:ring-emerald-200",
        sky: "bg-sky-50 border-sky-200 text-sky-900 ring-sky-400 focus-within:border-sky-400 focus-within:ring-sky-200"
    };

    const letterBgStyles = {
        rose: "bg-gradient-to-br from-rose-500 to-rose-700",
        orange: "bg-gradient-to-br from-orange-400 to-orange-600",
        amber: "bg-gradient-to-br from-amber-400 to-amber-600",
        emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700",
        sky: "bg-gradient-to-br from-sky-400 to-sky-600"
    };

    return (
        <div className={`w-full flex flex-col sm:flex-row gap-4 p-5 sm:p-6 rounded-2xl border shadow-sm transition-all duration-300 ${themeStyles[colorTheme]}`}>
            <div className={`w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center text-white shadow-md ${letterBgStyles[colorTheme]}`}>
                <span className="text-3xl font-black leading-none drop-shadow-sm">{letter}</span>
                <Icon className="h-4 w-4 mt-1 opacity-80" />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-3">
                    <h3 className="font-bold text-lg leading-tight tracking-tight">{title}</h3>
                    <p className="text-xs sm:text-sm opacity-80 mt-0.5">{description}</p>
                </div>
                <textarea
                    rows={2}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white/70 border border-black/10 rounded-xl p-3 text-sm focus:ring-4 focus:outline-none transition-all resize-y min-h-[80px] placeholder:text-black/30"
                />
            </div>
        </div>
    );
};

const STRATEGY_META: Array<{
    id: keyof Pick<DENTSPayload, 'deny' | 'escape' | 'neutralize' | 'tasks' | 'swap'>;
    letter: string; title: string; description: string;
    icon: React.ElementType; colorTheme: StrategyCardProps['colorTheme']; placeholder: string;
}> = [
    { id: 'deny', letter: 'D', title: 'Deny / Delay', description: 'Refuse the urge right now. Tell yourself "Not today, maybe tomorrow." How will you delay?', icon: HandRaisedIcon, colorTheme: 'rose', placeholder: 'e.g., I will promise myself to wait 24 hours before acting on any urge.' },
    { id: 'escape', letter: 'E', title: 'Escape', description: 'Plan your physical exit strategy. If the situation gets too risky, how do you leave?', icon: ArrowRightOnRectangleIcon, colorTheme: 'orange', placeholder: "e.g., I'll say I have a family emergency and take an Uber home immediately." },
    { id: 'neutralize', letter: 'N', title: 'Neutralize', description: 'Who can you call to talk it out and defuse the craving?', icon: ShieldExclamationIcon, colorTheme: 'amber', placeholder: 'e.g., I will step outside and call my sponsor or a supportive friend.' },
    { id: 'tasks', letter: 'T', title: 'Tasks', description: 'What specific busy-work can you do to distract your hands and mind?', icon: ClipboardDocumentCheckIcon, colorTheme: 'emerald', placeholder: 'e.g., I will go to the kitchen and help wash the dishes.' },
    { id: 'swap', letter: 'S', title: 'Swap', description: 'Replace the addictive behavior with a healthy alternative you enjoy.', icon: ArrowPathIcon, colorTheme: 'sky', placeholder: 'e.g., I will order a sparkling water with lime instead of alcohol.' },
];

interface DentsToolInnerProps {
    data: DENTSPayload;
    updateData: (newData: Partial<DENTSPayload>) => void;
    save: (overrideData: DENTSPayload, extraTags?: string[]) => Promise<void>;
    isSaving: boolean;
    forceFresh: boolean;
}

function DentsToolInner({ data, updateData, save, isSaving, forceFresh }: DentsToolInnerProps) {
    const [phase, setPhase] = useState<Phase>(() => {
        if (forceFresh) return 'intro';
        if (isDentsComplete(data)) return 'summary';
        if (data.scenario) return 'guided';
        return 'intro';
    });
    const [scenario, setScenario] = useState(forceFresh ? '' : (data.scenario ?? ''));

    const handleStartGuided = async () => {
        const trimmed = scenario.trim();
        const merged: DENTSPayload = { ...data, scenario: trimmed };
        updateData({ scenario: trimmed });
        await save(merged, [DRAFT_TAG]);
        setPhase('guided');
    };

    if (phase === 'intro') {
        return (
            <div className="min-h-[100dvh] bg-slate-50">
                <VibrantHeader
                    title="D.E.N.T.S. Strategy"
                    subtitle="Let's name the situation first"
                    icon={BoltIcon}
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
                                What's the high-risk situation you're planning for?
                            </label>
                            <input
                                type="text"
                                value={scenario}
                                onChange={(e) => setScenario(e.target.value)}
                                placeholder="e.g. My best friend's wedding, open bar all night"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg font-semibold focus:border-blue-400 focus:ring-0 transition-all placeholder-slate-300"
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!scenario.trim()}
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
            <GuidedWorkflowEngine<DENTSPayload>
                toolType="DENTS"
                toolLabel="D.E.N.T.S. Strategy"
                steps={buildDentsSteps(data.scenario ?? '')}
                initialData={data}
                isSaving={isSaving}
                forceFresh={forceFresh}
                suppressCompletionScreen
                onSaveProgress={(partial) => save(partial as DENTSPayload, [DRAFT_TAG])}
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
                title="D.E.N.T.S. Strategy"
                subtitle={data.scenario ? `Reviewing: ${data.scenario}` : 'Reviewing your plan'}
                icon={BoltIcon}
                fromColor="from-blue-600" viaColor="via-indigo-600" toColor="to-violet-600"
            />
            <div className="-mt-8 relative z-10 max-w-2xl mx-auto px-4 pb-24 space-y-4">
                {STRATEGY_META.map(m => (
                    <StrategyCard
                        key={m.id}
                        letter={m.letter}
                        title={m.title}
                        description={m.description}
                        value={data[m.id]}
                        onChange={(val) => updateData({ [m.id]: val } as Partial<DENTSPayload>)}
                        icon={m.icon}
                        colorTheme={m.colorTheme}
                        placeholder={m.placeholder}
                    />
                ))}

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

export const DentsTool: React.FC = () => {
    const [searchParams] = useSearchParams();
    const forceFresh = searchParams.get('fresh') === '1';

    const initialData: DENTSPayload = { scenario: '', deny: '', escape: '', neutralize: '', tasks: '', swap: '' };

    return (
        <SmartToolContainer<DENTSPayload>
            toolType="DENTS"
            toolLabel="D.E.N.T.S. Strategy"
            initialData={initialData}
            resumeSession
            hideDefaultSaveButton
            hideHeader
        >
            {({ data, updateData, save, isSaving }) => (
                <DentsToolInner data={data} updateData={updateData} save={save} isSaving={isSaving} forceFresh={forceFresh} />
            )}
        </SmartToolContainer>
    );
};
