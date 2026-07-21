/**
 * src/pages/ToolsHub.tsx
 * PROJ-27: The CBT Engine / PROJ-50 §5: Tools Hub Redesign / PROJ-71: Tools Hub Regrouping
 * Central routing directory for all interactive recovery tools, grouped into four
 * moment-based accordion sections (Right Now / Before It Happens / After a Hard
 * Moment / Big Picture) so crisis-relevant tools (Urge Surfer, Resentment Burner)
 * are unconditionally first and expanded by default. The 8 real, journal-persisted
 * guided/CBT tools keep their three entry points (Start Fresh / Resume / View
 * History) plus richer cards (time estimate, "Best for", completion count).
 * Urge Surfer and Resentment Burner keep their original simple card — neither has
 * steps, drafts, or (for Resentment Burner) any persistence at all, so entry-modes/
 * history/completion-count don't apply.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { PuzzlePieceIcon, ClockIcon, CheckBadgeIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { TOOLS, PHASE_META, type ToolPhase, type ToolRegistryEntry } from '../lib/toolsRegistry';
import { hasGuidedDraft } from '../hooks/useGuidedDraft';
import { useSmartToolCompletions } from '../hooks/useSmartToolCompletions';

const PHASE_ORDER: ToolPhase[] = ['right-now', 'before', 'after', 'big-picture'];

interface ToolCardProps {
    tool: ToolRegistryEntry;
    count: number;
    canResume: boolean;
}

function ToolCard({ tool, count, canResume }: ToolCardProps) {
    const isComingSoon = tool.status === 'coming_soon';

    // Coming Soon: SMART Goal today — no component exists yet.
    if (isComingSoon) {
        return (
            <div className={`relative bg-white rounded-2xl p-5 border border-gray-200 opacity-60 cursor-not-allowed ${tool.border} border-l-[6px]`}>
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                        <tool.icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[17.6px] font-bold text-slate-500">{tool.title}</h3>
                            <span className="text-[9.9px] uppercase tracking-widest font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Coming Soon
                            </span>
                        </div>
                        <p className="text-[15.4px] text-slate-400 leading-relaxed pr-2">{tool.description}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Real, journal-persisted guided/CBT tools: three entry points + richer card.
    if (tool.toolType) {
        return (
            <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-200 ${tool.border} border-l-[6px] space-y-3`}>
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                        <tool.icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-wrap items-start gap-2 mb-1">
                            <h3 className="text-[17.6px] font-bold text-gray-900 flex-1 min-w-[120px]">{tool.title}</h3>
                            {tool.bestFor && (
                                <span className="shrink-0 mt-0.5 text-[9.9px] uppercase tracking-widest font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    Best for: {tool.bestFor}
                                </span>
                            )}
                        </div>
                        <p className="text-[15.4px] text-gray-600 leading-relaxed pr-2">{tool.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {tool.timeEstimate && (
                                <span className="flex items-center gap-1 text-[13.2px] text-slate-400 font-medium">
                                    <ClockIcon className="w-3.5 h-3.5" /> {tool.timeEstimate}
                                </span>
                            )}
                            {count > 0 && (
                                <span className="flex items-center gap-1 text-[13.2px] text-emerald-600 font-bold">
                                    <CheckBadgeIcon className="w-3.5 h-3.5" /> Completed {count} time{count === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        to={`${tool.path}?fresh=1`}
                        className="flex-1 min-w-[100px] min-h-[44px] flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white text-[15.4px] font-bold rounded-xl transition-colors active:scale-95"
                    >
                        Start Fresh
                    </Link>
                    {canResume && (
                        <Link
                            to={tool.path}
                            className="flex-1 min-w-[100px] min-h-[44px] flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[15.4px] font-bold rounded-xl transition-colors active:scale-95"
                        >
                            Resume
                        </Link>
                    )}
                    {count > 0 && (
                        <Link
                            to={`/tools/${tool.toolType}/history`}
                            className="flex-1 min-w-[100px] min-h-[44px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[15.4px] font-bold rounded-xl transition-colors active:scale-95"
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
            to={tool.path}
            className={`block relative group bg-white rounded-2xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md active:scale-95 ${tool.border} border-l-[6px]`}
        >
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                    <tool.icon className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-[17.6px] font-bold text-gray-900 group-hover:text-amber-700 transition-colors mb-1">
                        {tool.title}
                    </h3>
                    <p className="text-[15.4px] text-gray-600 leading-relaxed pr-2">{tool.description}</p>
                </div>
            </div>
        </Link>
    );
}

export default function ToolsHub() {
    const { data: completions } = useSmartToolCompletions();
    const counts = completions?.counts ?? {};
    const hasDraftDoc = completions?.hasDraftDoc ?? {};

    const [expanded, setExpanded] = useState<Record<ToolPhase, boolean>>({
        'right-now': true,
        before: false,
        after: false,
        'big-picture': false,
    });

    const togglePhase = (phase: ToolPhase) => {
        setExpanded((prev) => ({ ...prev, [phase]: !prev[phase] }));
    };

    const groupedTools = useMemo(() => {
        const map = new Map<ToolPhase, ToolRegistryEntry[]>(PHASE_ORDER.map((phase) => [phase, []]));
        for (const tool of TOOLS) {
            map.get(tool.phase)?.push(tool);
        }
        return map;
    }, []);

    return (
        <div className={`pb-24 relative min-h-screen bg-slate-50`}>

            <div className="flex-shrink-0 z-10">
                <VibrantHeader
                    title="Recovery Tools"
                    subtitle="Practical exercises to manage cravings and rewire thoughts."
                    icon={PuzzlePieceIcon}
                    fromColor="from-amber-500"
                    viaColor="via-orange-500"
                    toColor="to-orange-600"
                />
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-30 space-y-4">

                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-blue-100 text-[15.4px] text-blue-900 shadow-sm">
                    <strong>SMART Recovery & CBT:</strong> These tools are designed to help you interrupt the cycle of addiction by applying logic and planning to emotional urges.
                </div>

                {PHASE_ORDER.map((phase) => {
                    const meta = PHASE_META[phase];
                    const tools = groupedTools.get(phase) ?? [];
                    const isOpen = expanded[phase];
                    const ChevronIcon = isOpen ? ChevronUpIcon : ChevronDownIcon;

                    return (
                        <div key={phase}>
                            <div
                                className="rounded-[14px] p-[1.5px]"
                                style={{ background: 'linear-gradient(145deg, #FBBF2455, #EA580C33)' }}
                            >
                                <button
                                    onClick={() => togglePhase(phase)}
                                    aria-expanded={isOpen}
                                    className="w-full min-h-[44px] flex items-center justify-between gap-3 px-4 py-3 rounded-[12.5px] bg-[#0804149e] text-left hover:brightness-125 active:scale-[0.99] transition-[filter,transform]"
                                    style={{ backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)' }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-white/10 text-amber-300">
                                            <meta.icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-[15.4px] font-bold text-white">{meta.label}</h2>
                                                <span className="text-[11px] font-bold text-amber-200 bg-white/10 px-1.5 py-0.5 rounded-full">
                                                    {tools.length}
                                                </span>
                                            </div>
                                            <p className="text-[13.2px] text-white/60 truncate">{meta.subtitle}</p>
                                        </div>
                                    </div>
                                    <ChevronIcon className="h-5 w-5 text-white/50 flex-shrink-0 transition-transform motion-reduce:transition-none" />
                                </button>
                            </div>

                            {isOpen && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    {tools.map((tool) => {
                                        const count = tool.toolType ? counts[tool.toolType] ?? 0 : 0;
                                        const canResume = Boolean(tool.hasGuidedFlow) && (hasGuidedDraft(tool.toolType!) || Boolean(hasDraftDoc[tool.toolType!]));
                                        return <ToolCard key={tool.id} tool={tool} count={count} canResume={canResume} />;
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
