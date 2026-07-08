/**
 * src/components/tools/PayloadSummaryList.tsx
 * PROJ-50 §5: Tools Hub Redesign
 * Generic, tool-agnostic renderer for a decrypted SMART Tool payload — used by
 * the History view so a past completion reads as labeled fields instead of
 * raw JSON. Deliberately generic (humanized key + value row per field) rather
 * than a bespoke renderer per tool, so new tool types need no new code here.
 */
import { humanizeKey } from '../../lib/toolHistorySummary';

interface PayloadSummaryListProps {
    data: Record<string, unknown>;
}

function isEmotionArray(value: unknown): value is Array<{ emotion: string; intensity: number }> {
    return Array.isArray(value) && value.length > 0 &&
        typeof value[0] === 'object' && value[0] !== null &&
        'emotion' in value[0] && 'intensity' in value[0];
}

function PayloadValue({ value }: { value: unknown }) {
    if (isEmotionArray(value)) {
        return (
            <p className="text-sm text-slate-700 leading-relaxed">
                {value.map(e => `${e.emotion} ${e.intensity}%`).join(', ')}
            </p>
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

function isPresent(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

export function PayloadSummaryList({ data }: PayloadSummaryListProps) {
    const entries = Object.entries(data).filter(([, value]) => isPresent(value));

    if (entries.length === 0) {
        return <p className="text-sm text-slate-400 italic">No details recorded.</p>;
    }

    return (
        <div className="space-y-3">
            {entries.map(([key, value]) => (
                <div key={key}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{humanizeKey(key)}</h4>
                    <PayloadValue value={value} />
                </div>
            ))}
        </div>
    );
}
