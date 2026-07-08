/**
 * src/pages/ToolsHub.tsx
 * PROJ-27: The CBT Engine / PROJ-50 §5: Tools Hub Redesign
 * Central routing directory for all interactive recovery tools. The 8 real,
 * journal-persisted guided/CBT tools get three entry points (Start Fresh /
 * Resume / View History) plus richer cards (time estimate, "Best for",
 * completion count). Urge Surfer and Resentment Burner keep their original
 * simple card — neither has steps, drafts, or (for Resentment Burner) any
 * persistence at all, so entry-modes/history/completion-count don't apply.
 */
import { Link } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { PuzzlePieceIcon, ClockIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { TOOLS } from '../lib/toolsRegistry';
import { hasGuidedDraft } from '../hooks/useGuidedDraft';
import { useSmartToolCompletions } from '../hooks/useSmartToolCompletions';

export default function ToolsHub() {
    const { data: completions } = useSmartToolCompletions();
    const counts = completions?.counts ?? {};
    const hasDraftDoc = completions?.hasDraftDoc ?? {};

    return (
        <div className={`pb-24 relative min-h-screen bg-slate-50`}>

            <div className="flex-shrink-0 z-10">
                <VibrantHeader
                    title="Recovery Tools"
                    subtitle="Practical exercises to manage cravings and rewire thoughts."
                    icon={PuzzlePieceIcon}
                    fromColor="from-blue-600"
                    viaColor="via-indigo-600"
                    toColor="to-violet-600"
                />
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-30 space-y-4">

                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-blue-100 text-sm text-blue-900 mb-6 shadow-sm">
                    <strong>SMART Recovery & CBT:</strong> These tools are designed to help you interrupt the cycle of addiction by applying logic and planning to emotional urges.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TOOLS.map((tool) => {
                        const isComingSoon = tool.status === 'coming_soon';

                        // Coming Soon: SMART Goal today — no component exists yet.
                        if (isComingSoon) {
                            return (
                                <div key={tool.id} className={`block relative bg-white rounded-2xl p-5 border border-gray-200 opacity-60 cursor-not-allowed ${tool.border} border-l-[6px]`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                                            <tool.icon className="h-7 w-7" />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-base font-bold text-slate-500">{tool.title}</h3>
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                    Coming Soon
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed pr-2">{tool.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Real, journal-persisted guided/CBT tools: three entry points + richer card.
                        if (tool.toolType) {
                            const count = counts[tool.toolType] ?? 0;
                            const canResume = Boolean(tool.hasGuidedFlow) && (hasGuidedDraft(tool.toolType) || Boolean(hasDraftDoc[tool.toolType]));

                            return (
                                <div key={tool.id} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-200 ${tool.border} border-l-[6px] space-y-3`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                                            <tool.icon className="h-7 w-7" />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="text-base font-bold text-gray-900">{tool.title}</h3>
                                                {tool.bestFor && (
                                                    <span className="shrink-0 mt-0.5 text-[9px] uppercase tracking-widest font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                        Best for: {tool.bestFor}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed pr-2">{tool.description}</p>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {tool.timeEstimate && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                                        <ClockIcon className="w-3.5 h-3.5" /> {tool.timeEstimate}
                                                    </span>
                                                )}
                                                {count > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                                                        <CheckBadgeIcon className="w-3.5 h-3.5" /> Completed {count} time{count === 1 ? '' : 's'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            to={`${tool.path}?fresh=1`}
                                            className="flex-1 min-w-[100px] min-h-[44px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
                                        >
                                            Start Fresh
                                        </Link>
                                        {canResume && (
                                            <Link
                                                to={tool.path}
                                                className="flex-1 min-w-[100px] min-h-[44px] flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-bold rounded-xl transition-colors active:scale-95"
                                            >
                                                Resume
                                            </Link>
                                        )}
                                        {count > 0 && (
                                            <Link
                                                to={`/tools/${tool.toolType}/history`}
                                                className="flex-1 min-w-[100px] min-h-[44px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-sm font-bold rounded-xl transition-colors active:scale-95"
                                            >
                                                History
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // Not a SMART Tool (Urge Surfer, Resentment Burner) — original simple card.
                        return (
                            <Link
                                key={tool.id}
                                to={tool.path}
                                className={`block relative group bg-white rounded-2xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md active:scale-95 ${tool.border} border-l-[6px]`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                                        <tool.icon className="h-7 w-7" />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
                                            {tool.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed pr-2">{tool.description}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
