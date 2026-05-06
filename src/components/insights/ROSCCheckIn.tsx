import { useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ROSCCheckInAnswers } from '../../lib/types/rosc';

const QUESTIONS: {
    domain: keyof Omit<ROSCCheckInAnswers, 'resilience'> | 'resilience';
    label: string;
    question: string;
    low: string;
    high: string;
}[] = [
    {
        domain: 'health',
        label: 'Health',
        question: 'This month, how well did you take care of your physical and emotional health?',
        low: 'Struggling',
        high: 'Thriving',
    },
    {
        domain: 'home',
        label: 'Home',
        question: 'How stable and safe does your living situation feel right now?',
        low: 'Uncertain',
        high: 'Very stable',
    },
    {
        domain: 'purpose',
        label: 'Purpose',
        question: 'How meaningful and engaging are your daily activities — work, creative pursuits, service, family?',
        low: 'Adrift',
        high: 'Fully engaged',
    },
    {
        domain: 'community',
        label: 'Community',
        question: 'How connected do you feel to people who support and encourage your recovery?',
        low: 'Isolated',
        high: 'Deeply connected',
    },
    {
        domain: 'resilience',
        label: 'Resilience',
        question: 'When this month got hard, how well did you bounce back?',
        low: 'It knocked me down',
        high: 'I found my footing',
    },
];

interface Props {
    onComplete: (answers: ROSCCheckInAnswers) => void;
    onDismiss: () => void;
    onStart?: () => void;
    initialAnswers?: ROSCCheckInAnswers | null;
}

export default function ROSCCheckIn({ onComplete, onDismiss, onStart, initialAnswers }: Props) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<ROSCCheckInAnswers>>(initialAnswers ?? {});
    const [started, setStarted] = useState(false);

    const current = QUESTIONS[step];
    const currentValue = answers[current.domain];

    const handleSelect = useCallback((value: number) => {
        if (!started) {
            setStarted(true);
            onStart?.();
        }
        const next = { ...answers, [current.domain]: value };
        setAnswers(next);

        if (step < QUESTIONS.length - 1) {
            setTimeout(() => setStep(s => s + 1), 250);
        } else {
            onComplete(next as ROSCCheckInAnswers);
        }
    }, [started, answers, current.domain, step, onComplete, onStart]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl shadow-2xl border border-rose-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex gap-1.5">
                        {QUESTIONS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i <= step ? 'bg-rose-500 w-6' : 'bg-rose-200 w-3'
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-rose-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-100 transition-colors"
                        aria-label="Dismiss check-in"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 pb-8">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                            {current.label} · Question {step + 1} of {QUESTIONS.length}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 leading-snug mb-8">
                        {current.question}
                    </h2>

                    <div className="flex justify-center gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map((val) => (
                            <button
                                key={val}
                                onClick={() => handleSelect(val)}
                                className={`w-12 h-12 rounded-full text-sm font-bold border-2 transition-all duration-150 ${
                                    currentValue === val
                                        ? 'bg-rose-500 border-rose-500 text-white scale-110 shadow-lg shadow-rose-200'
                                        : 'bg-white border-rose-200 text-rose-600 hover:border-rose-400 hover:bg-rose-50'
                                }`}
                                aria-pressed={currentValue === val}
                            >
                                {val}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between text-xs text-rose-400 font-medium px-1">
                        <span>{current.low}</span>
                        <span>{current.high}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
