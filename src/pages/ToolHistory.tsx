/**
 * src/pages/ToolHistory.tsx
 * PROJ-50 §5: Tools Hub Redesign
 * "View History" entry point — a readable, tag-filtered list of a single
 * tool's past completions (via useToolHistory), each expandable into its full
 * field list (via the generic PayloadSummaryList) instead of raw JSON.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import VibrantHeader from '../components/VibrantHeader';
import { PayloadSummaryList } from '../components/tools/PayloadSummaryList';
import { useToolHistory } from '../hooks/useToolHistory';
import { HEADLINE_FIELD } from '../lib/toolHistorySummary';
import { TOOLS } from '../lib/toolsRegistry';
import type { SmartToolType } from '../lib/types/smart';

function findTool(toolTypeParam: string | undefined) {
    return TOOLS.find(t => t.toolType === toolTypeParam);
}

export default function ToolHistory() {
    const { toolType: toolTypeParam } = useParams<{ toolType: string }>();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const tool = findTool(toolTypeParam);
    const toolType = tool?.toolType as SmartToolType | undefined;

    const { data: entries = [], isLoading } = useToolHistory(toolType);

    if (!tool) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-slate-500 font-medium mb-4">That tool doesn't have a history view.</p>
                <Link to="/tools" className="text-blue-600 font-bold">Back to Tools</Link>
            </div>
        );
    }

    const headlineField = toolType ? HEADLINE_FIELD[toolType] : undefined;

    return (
        <div className="min-h-[100dvh] bg-slate-50">
            <VibrantHeader
                title={tool.title}
                subtitle="Your past completions"
                icon={tool.icon}
                fromColor="from-blue-600" viaColor="via-indigo-600" toColor="to-violet-600"
            />
            <div className="-mt-8 relative z-10 max-w-2xl mx-auto px-4 pb-24 space-y-3">
                <Link to="/tools" className="inline-flex items-center gap-1 min-h-[44px] text-sm font-bold text-blue-700">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Tools
                </Link>

                {isLoading && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-8 text-center text-slate-400 animate-pulse">
                        Loading…
                    </div>
                )}

                {!isLoading && entries.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-8 text-center space-y-2">
                        <p className="text-slate-500 font-medium">No completions yet.</p>
                        <Link to={tool.path} className="inline-block text-blue-600 font-bold">Start your first session →</Link>
                    </div>
                )}

                {entries.map(entry => {
                    const headlineValue = headlineField ? entry.data[headlineField] : undefined;
                    const headline = typeof headlineValue === 'string' && headlineValue.trim()
                        ? headlineValue
                        : format(entry.createdAt, 'MMM d, yyyy');
                    const isExpanded = expandedId === entry.id;

                    return (
                        <div key={entry.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className="w-full flex items-center justify-between gap-3 p-4 text-left min-h-[44px]"
                                aria-expanded={isExpanded}
                            >
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-400 font-semibold">{format(entry.createdAt, 'MMM d, yyyy')}</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{headline}</p>
                                </div>
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-5 h-5 text-slate-400 shrink-0" />
                                ) : (
                                    <ChevronRightIcon className="w-5 h-5 text-slate-400 shrink-0" />
                                )}
                            </button>
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-3 border-t border-blue-50">
                                    <PayloadSummaryList data={entry.data} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
