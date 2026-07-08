/**
 * src/components/tools/YesNoToggle.tsx
 * PROJ-50 Phase 5: Five Questions
 * A small, optional-by-default binary choice picker used via GuidedWorkflowEngine's
 * renderExtra escape hatch (e.g. "Is this thought true?" / "Can you know for certain?").
 */
interface YesNoToggleProps {
    value: 'yes' | 'no' | '';
    onChange: (value: 'yes' | 'no') => void;
    label?: string;
}

export function YesNoToggle({ value, onChange, label }: YesNoToggleProps) {
    return (
        <div className="w-full space-y-2">
            {label && (
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</h4>
            )}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onChange('yes')}
                    aria-pressed={value === 'yes'}
                    className={`flex-1 min-h-[44px] rounded-xl font-bold border-2 transition-all active:scale-95 ${
                        value === 'yes'
                            ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                    }`}
                >
                    Yes
                </button>
                <button
                    type="button"
                    onClick={() => onChange('no')}
                    aria-pressed={value === 'no'}
                    className={`flex-1 min-h-[44px] rounded-xl font-bold border-2 transition-all active:scale-95 ${
                        value === 'no'
                            ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                    }`}
                >
                    No
                </button>
            </div>
        </div>
    );
}
