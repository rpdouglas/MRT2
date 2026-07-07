/**
 * src/components/tools/SocraticPromptCard.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Reveals a set of Socratic disputation questions one at a time.
 * Presentational only — not persisted as part of any tool payload.
 */
import { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface SocraticPromptCardProps {
    questions: string[];
}

export function SocraticPromptCard({ questions }: SocraticPromptCardProps) {
    const [revealedCount, setRevealedCount] = useState(1);

    const hasMore = revealedCount < questions.length;

    return (
        <div className="w-full bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                Questions to challenge this belief
            </h4>
            <ul className="space-y-2">
                {questions.slice(0, revealedCount).map((q, i) => (
                    <li key={i} className="text-sm text-indigo-900/90 leading-relaxed">• {q}</li>
                ))}
            </ul>
            {hasMore && (
                <button
                    type="button"
                    onClick={() => setRevealedCount(prev => prev + 1)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                    Show me another
                </button>
            )}
        </div>
    );
}
