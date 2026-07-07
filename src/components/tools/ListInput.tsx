/**
 * src/components/tools/ListInput.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Controlled dynamic add/remove list editor — a visual/interaction port of
 * CBATool.tsx's CBAQuadrant, generalized for reuse as a GuidedWorkflowEngine
 * 'list' step body and as the CBA summary phase's editable quadrant grid.
 */
import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export type ListAccentColor = 'emerald' | 'rose' | 'sky' | 'orange';

interface ListInputProps {
    items: string[];
    onChange: (items: string[]) => void;
    accentColor: ListAccentColor;
    title?: string;
    placeholder?: string;
    emptyLabel?: string;
}

const COLOR_CLASSES: Record<ListAccentColor, string> = {
    emerald: "bg-emerald-50/50 border-emerald-100 text-emerald-900 ring-emerald-500",
    rose: "bg-rose-50/50 border-rose-100 text-rose-900 ring-rose-500",
    sky: "bg-sky-50/50 border-sky-100 text-sky-900 ring-sky-500",
    orange: "bg-orange-50/50 border-orange-100 text-orange-900 ring-orange-500",
};

const BUTTON_CLASSES: Record<ListAccentColor, string> = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    rose: "bg-rose-600 hover:bg-rose-700",
    sky: "bg-sky-600 hover:bg-sky-700",
    orange: "bg-orange-600 hover:bg-orange-700",
};

export function ListInput({ items, onChange, accentColor, title, placeholder = 'Add factor...', emptyLabel = 'No items added yet' }: ListInputProps) {
    const [input, setInput] = useState('');

    const commit = (raw: string) => {
        const trimmed = raw.trim();
        if (trimmed) onChange([...items, trimmed]);
        setInput('');
    };

    const handleAdd = () => commit(input);
    // Safeguard: in a step-locked flow, tapping "Next" without pressing Enter/+
    // would otherwise silently discard whatever the user just typed.
    const handleBlur = () => { if (input.trim()) commit(input); };
    const handleRemove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

    return (
        <div className={`p-5 rounded-2xl border backdrop-blur-sm shadow-sm flex flex-col h-full ${COLOR_CLASSES[accentColor]}`}>
            {title && (
                <h4 className="font-bold text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
                    <span className={`w-1.5 h-4 rounded-full ${BUTTON_CLASSES[accentColor]}`} />
                    {title}
                </h4>
            )}

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className="flex-1 bg-white/80 border-none rounded-xl p-2.5 text-sm focus:ring-2 placeholder-slate-400"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    aria-label="Add item"
                    className={`p-2.5 rounded-xl text-white transition-all shadow-sm ${BUTTON_CLASSES[accentColor]}`}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            <ul className="space-y-2 overflow-y-auto max-h-64 pr-1 custom-scrollbar">
                {items.map((item, idx) => (
                    <li key={idx} className="group flex justify-between items-start gap-3 bg-white/60 p-3 rounded-xl border border-white/40 animate-in fade-in slide-in-from-left-2">
                        <span className="text-sm leading-relaxed">{item}</span>
                        <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            aria-label={`Remove ${item}`}
                            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </li>
                ))}
                {items.length === 0 && (
                    <p className="text-xs italic text-slate-400 text-center py-4">{emptyLabel}</p>
                )}
            </ul>
        </div>
    );
}
