/**
 * src/components/tools/CognitiveDistortionPicker.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Optional, single-select grid of common cognitive distortions. Purely educational —
 * never blocks advancement. In ABCDE the selection is ephemeral (used only to
 * enrich the AI coaching prompt context); in Thought Record (PROJ-50 Phase 4) it
 * is persisted into ThoughtRecordPayload.distortionType via renderExtra's setStepValue.
 */
import { useState } from 'react';
import { DISTORTIONS } from '../../lib/distortions';

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
