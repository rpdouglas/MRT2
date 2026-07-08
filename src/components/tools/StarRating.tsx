/**
 * src/components/tools/StarRating.tsx
 * PROJ-50 Phase 5: Five Questions
 * A small 1-5 star rating picker used via GuidedWorkflowEngine's renderExtra escape
 * hatch (Q5's "how true does the turnaround feel?" rating). `readOnly` renders a
 * static display for the summary phase.
 */
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    max?: number;
    readOnly?: boolean;
}

export function StarRating({ value, onChange, max = 5, readOnly = false }: StarRatingProps) {
    const stars = Array.from({ length: max }, (_, i) => i + 1);

    return (
        <div className="flex items-center gap-1">
            {stars.map(n => {
                const filled = n <= value;
                const Icon = filled ? StarSolid : StarOutline;
                if (readOnly) {
                    return <Icon key={n} className={`w-6 h-6 ${filled ? 'text-amber-400' : 'text-slate-300'}`} />;
                }
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange?.(n)}
                        aria-label={`Rate ${n} out of ${max}`}
                        aria-pressed={n === value}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <Icon className={`w-8 h-8 ${filled ? 'text-amber-400' : 'text-slate-300'}`} />
                    </button>
                );
            })}
        </div>
    );
}
