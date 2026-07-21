/**
 * src/pages/ToolsHub.tsx
 * PROJ-27: The CBT Engine / PROJ-50 §5: Tools Hub Redesign / PROJ-71: Tools Hub Regrouping
 * Central routing directory for all interactive recovery tools, grouped into four
 * moment-based accordion sections (Right Now / Before It Happens / After a Hard
 * Moment / Big Picture), all collapsed by default. Each section reuses one of the
 * ROSC Matrix's 4 pillar hues (rose/orange/purple/green, defined per-phase in
 * toolsRegistry.ts's PHASE_META) for its dark header glass and light "frosted"
 * body glass. The 8 real, journal-persisted guided/CBT tools keep their three
 * entry points (Start Fresh / Resume / View History) plus richer cards (time
 * estimate, "Best for", completion count).
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
import { THEME } from '../lib/theme';

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
                                <span className={`shrink-0 mt-0.5 text-[9.9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${PHASE_META[tool.phase].pillBg} ${PHASE_META[tool.phase].pillText}`}>
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
    // Only tools in the "Right Now" phase lack a toolType; that section's expanded body
    // uses the same light frosted-glass treatment as every other section (PROJ-71 round 4),
    // so this branch is styled for a light background like the other two branches.
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
                    <h3 className={`text-[17.6px] font-bold text-gray-900 transition-colors mb-1 ${PHASE_META[tool.phase].hoverText}`}>
                        {tool.title}
                    </h3>
                    <p className="text-[15.4px] text-gray-600 leading-relaxed pr-2">{tool.description}</p>
                </div>
            </div>
        </Link>
    );
}

/**
 * Light "frosted glass" section-body shell (PROJ-71 round 4) — the same gradient-border +
 * blur + ambient-glow recipe GlassCard.tsx uses for its dark module cards, rebuilt with a
 * light translucent base instead of near-black, tinted per Tools Hub section via `gradA`/`gradB`.
 * Kept local to this page rather than added to GlassCard.tsx since these are per-section
 * accent colors, not a module-level design token.
 */
function LightGlass({ gradA, gradB, children }: { gradA: string; gradB: string; children: React.ReactNode }) {
    return (
        <div className="relative overflow-hidden rounded-[20px] p-[1.5px]" style={{ background: `linear-gradient(145deg, ${gradA}55, ${gradB}33)` }}>
            <div
                className="relative overflow-hidden rounded-[19px] p-[18px_16px]"
                style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}
            >
                <div className="pointer-events-none absolute -right-[30px] -top-[40px] h-[140px] w-[140px] rounded-full" style={{ background: `radial-gradient(circle, ${gradA}30 0%, transparent 65%)` }} />
                <div className="pointer-events-none absolute -bottom-[30px] -left-[10px] h-[100px] w-[100px] rounded-full" style={{ background: `radial-gradient(circle, ${gradB}25 0%, transparent 65%)` }} />
                <div className="relative z-10">{children}</div>
            </div>
        </div>
    );
}

export default function ToolsHub() {
    const { data: completions } = useSmartToolCompletions();
    const counts = completions?.counts ?? {};
    const hasDraftDoc = completions?.hasDraftDoc ?? {};

    const [expanded, setExpanded] = useState<Record<ToolPhase, boolean>>({
        'right-now': false,
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
        <div className={`pb-24 relative min-h-screen ${THEME.tools.page}`}>

            <div className="flex-shrink-0 z-10">
                <VibrantHeader
                    title="Recovery Tools"
                    subtitle="Practical exercises to manage cravings and rewire thoughts."
                    icon={PuzzlePieceIcon}
                    fromColor={THEME.tools.header.from}
                    viaColor={THEME.tools.header.via}
                    toColor={THEME.tools.header.to}
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
                                style={{ background: `linear-gradient(145deg, ${meta.gradA}55, ${meta.gradB}33)` }}
                            >
                                <button
                                    onClick={() => togglePhase(phase)}
                                    aria-expanded={isOpen}
                                    className="w-full min-h-[44px] flex items-center justify-between gap-3 px-4 py-3 rounded-[12.5px] bg-[#0804149e] text-left hover:brightness-125 active:scale-[0.99] transition-[filter,transform]"
                                    style={{ backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)' }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-white/10" style={{ color: meta.gradA }}>
                                            <meta.icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-[15.4px] font-bold text-white">{meta.label}</h2>
                                                <span className="text-[11px] font-bold bg-white/10 px-1.5 py-0.5 rounded-full" style={{ color: meta.gradA }}>
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
                                <div className="mt-3">
                                    <LightGlass gradA={meta.gradA} gradB={meta.gradB}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tools.map((tool) => {
                                                const count = tool.toolType ? counts[tool.toolType] ?? 0 : 0;
                                                const canResume = Boolean(tool.hasGuidedFlow) && (hasGuidedDraft(tool.toolType!) || Boolean(hasDraftDoc[tool.toolType!]));
                                                return <ToolCard key={tool.id} tool={tool} count={count} canResume={canResume} />;
                                            })}
                                        </div>
                                    </LightGlass>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
