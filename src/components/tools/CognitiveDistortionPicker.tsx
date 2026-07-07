/**
 * src/components/tools/CognitiveDistortionPicker.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Optional, single-select grid of common cognitive distortions. Purely educational —
 * never blocks advancement. The current guided flows treat the selection as
 * ephemeral (used only to enrich the AI coaching prompt context), not part of
 * any saved tool payload.
 */
import { useState } from 'react';

interface Distortion {
    label: string;
    definition: string;
}

const DISTORTIONS: Distortion[] = [
    { label: 'All-or-Nothing', definition: 'Seeing things in black-and-white categories, with no middle ground.' },
    { label: 'Overgeneralisation', definition: 'Treating a single setback as proof of a never-ending pattern.' },
    { label: 'Mental Filter', definition: 'Dwelling on one negative detail while ignoring everything positive.' },
    { label: 'Disqualifying the Positive', definition: 'Rejecting good experiences by insisting they "don\'t count."' },
    { label: 'Mind Reading', definition: 'Assuming you know what someone else is thinking, without evidence.' },
    { label: 'Fortune Telling', definition: 'Predicting things will turn out badly before they happen.' },
    { label: 'Catastrophising', definition: 'Expecting the worst-case outcome and treating it as certain.' },
    { label: 'Emotional Reasoning', definition: 'Assuming a feeling must be true just because it feels true.' },
    { label: 'Should Statements', definition: 'Holding yourself or others to rigid "should"/"must" rules.' },
    { label: 'Labelling', definition: 'Attaching a harsh global label to yourself instead of describing the behavior.' },
    { label: 'Personalisation', definition: 'Blaming yourself for something you weren\'t fully responsible for.' },
    { label: 'Magnification', definition: 'Blowing a mistake or flaw out of proportion.' },
];

interface CognitiveDistortionPickerProps {
    selected: string | null;
    onChange: (distortion: string | null) => void;
}

export function CognitiveDistortionPicker({ selected, onChange }: CognitiveDistortionPickerProps) {
    const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

    const handleTap = (label: string) => {
        setExpandedLabel(prev => (prev === label ? null : label));
        onChange(selected === label ? null : label);
    };

    return (
        <div className="w-full space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Does this match a thinking pattern? (optional)
            </h4>
            <div className="flex flex-wrap gap-2">
                {DISTORTIONS.map(d => (
                    <button
                        key={d.label}
                        type="button"
                        onClick={() => handleTap(d.label)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            selected === d.label
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                    >
                        {d.label}
                    </button>
                ))}
            </div>
            {expandedLabel && (
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {DISTORTIONS.find(d => d.label === expandedLabel)?.definition}
                </p>
            )}
        </div>
    );
}
