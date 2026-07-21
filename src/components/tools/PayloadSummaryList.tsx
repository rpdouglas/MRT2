/**
 * src/components/tools/PayloadSummaryList.tsx
 * PROJ-50 §5: Tools Hub Redesign
 * Generic, tool-agnostic renderer for a decrypted SMART Tool payload — used by
 * the History view so a past completion reads as labeled fields instead of
 * raw JSON. Deliberately generic (a label + value row per field) rather than
 * a bespoke renderer per tool, so new tool types need no new code here.
 */
import type { SmartToolType } from '../../lib/types/smart';
import { getFieldLabel, isEmotionArray, isObjectArray, isPresent } from '../../lib/toolHistorySummary';

interface PayloadSummaryListProps {
    data: Record<string, unknown>;
    /** Enables real question-text labels (via getFieldLabel) instead of a generic humanized key. Optional — omit for a fully tool-agnostic render. */
    toolType?: SmartToolType;
}

function PayloadValue({ value, toolType }: { value: unknown; toolType?: SmartToolType }) {
    if (isEmotionArray(value)) {
        return (
            <p className="text-sm text-slate-700 leading-relaxed">
                {value.map(e => `${e.emotion} ${e.intensity}%`).join(', ')}
            </p>
        );
    }
    if (isObjectArray(value)) {
        return (
            <div className="space-y-2">
                {value.map((item, i) => (
                    <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-1.5">
                        {Object.entries(item)
                            .filter(([k, v]) => k !== 'id' && isPresent(v))
                            .map(([k, v]) => (
                                <div key={k}>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{getFieldLabel(toolType, k, item)}:</p>
                                    <p className="text-xs text-slate-700">{String(v)}</p>
                                </div>
                            ))}
                    </div>
                ))}
            </div>
        );
    }
    if (Array.isArray(value)) {
        return (
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-0.5">
                {value.map((item, i) => <li key={i}>{String(item)}</li>)}
            </ul>
        );
    }
    if (typeof value === 'boolean') {
        return <p className="text-sm text-slate-700">{value ? 'Yes' : 'No'}</p>;
    }
    return <p className="text-sm text-slate-700 leading-relaxed">{String(value)}</p>;
}

export function PayloadSummaryList({ data, toolType }: PayloadSummaryListProps) {
    const entries = Object.entries(data).filter(([, value]) => isPresent(value));

    if (entries.length === 0) {
        return <p className="text-sm text-slate-400 italic">No details recorded.</p>;
    }

    return (
        <div className="space-y-3">
            {entries.map(([key, value]) => (
                <div key={key}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{getFieldLabel(toolType, key, data)}</h4>
                    <PayloadValue value={value} toolType={toolType} />
                </div>
            ))}
        </div>
    );
}
