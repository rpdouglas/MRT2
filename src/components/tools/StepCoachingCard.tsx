/**
 * src/components/tools/StepCoachingCard.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Collapsible psychoeducation card shown below a guided step's question.
 * Collapsed by default — users who know the model can skip it.
 */
import { useState } from 'react';
import { InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface StepCoachingCardProps {
    coaching: string;
}

export function StepCoachingCard({ coaching }: StepCoachingCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="w-full bg-blue-50/80 border border-blue-100 rounded-2xl overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
                <span className="flex items-center gap-2 text-sm font-bold text-blue-900">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0" />
                    What does this mean?
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-blue-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-blue-900/90">{coaching}</p>
            )}
        </div>
    );
}
