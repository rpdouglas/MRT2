/**
 * src/components/tools/EmotionIntensitySelector.tsx
 * PROJ-50 Phase 4: Thought Record
 * Controlled emotion + intensity picker with two modes:
 * - Free-select: tap up to 3 preset (or custom) emotion words, then rate each 0-100.
 * - Re-rate (fixedEmotions provided): sliders only, for exactly those emotion names —
 *   used by Thought Record's Step 7 to re-rate the same emotions selected in Step 3.
 */
import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

export interface EmotionEntry { emotion: string; intensity: number; }

const PRESET_EMOTIONS = [
    'Anxious', 'Angry', 'Ashamed', 'Sad', 'Hopeless', 'Scared',
    'Overwhelmed', 'Relieved', 'Calm', 'Hopeful', 'Urge to use',
];

const MAX_SELECTABLE = 3;

interface EmotionIntensitySelectorProps {
    value: EmotionEntry[];
    onChange: (value: EmotionEntry[]) => void;
    /** When set, renders re-rate mode: sliders only, for exactly these names in this order — no chip grid, no custom-add. */
    fixedEmotions?: string[];
}

export function EmotionIntensitySelector({ value, onChange, fixedEmotions }: EmotionIntensitySelectorProps) {
    const [customInput, setCustomInput] = useState('');

    const setIntensity = (emotion: string, intensity: number) => {
        onChange(value.map(e => e.emotion === emotion ? { ...e, intensity } : e));
    };

    if (fixedEmotions) {
        return (
            <div className="space-y-4">
                {fixedEmotions.map(emotion => {
                    const intensity = value.find(e => e.emotion === emotion)?.intensity ?? 50;
                    return (
                        <div key={emotion} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-700">{emotion}</label>
                                <span className="text-sm font-black text-violet-600 w-10 text-right">{intensity}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={intensity}
                                onChange={(e) => setIntensity(emotion, Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-600 transition-all"
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    const isSelected = (emotion: string) => value.some(e => e.emotion === emotion);
    const atMax = value.length >= MAX_SELECTABLE;

    const toggleEmotion = (emotion: string) => {
        if (isSelected(emotion)) {
            onChange(value.filter(e => e.emotion !== emotion));
        } else if (!atMax) {
            onChange([...value, { emotion, intensity: 50 }]);
        }
    };

    const addCustom = () => {
        const trimmed = customInput.trim();
        if (!trimmed || atMax) return;
        if (value.some(e => e.emotion.toLowerCase() === trimmed.toLowerCase())) { setCustomInput(''); return; }
        onChange([...value, { emotion: trimmed, intensity: 50 }]);
        setCustomInput('');
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {PRESET_EMOTIONS.map(emotion => {
                    const selected = isSelected(emotion);
                    return (
                        <button
                            key={emotion}
                            type="button"
                            onClick={() => toggleEmotion(emotion)}
                            disabled={!selected && atMax}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                selected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                            }`}
                        >
                            {emotion}
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                    disabled={atMax}
                    placeholder="Add your own word..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 disabled:opacity-40"
                />
                <button
                    type="button"
                    onClick={addCustom}
                    disabled={atMax}
                    aria-label="Add emotion"
                    className="p-2.5 rounded-xl text-white transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {value.length > 0 && (
                <div className="space-y-4 pt-1">
                    {value.map(({ emotion, intensity }) => (
                        <div key={emotion} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-700">{emotion}</label>
                                <span className="text-sm font-black text-violet-600 w-10 text-right">{intensity}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={intensity}
                                onChange={(e) => setIntensity(emotion, Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-600 transition-all"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
