import os

FENCE = chr(96) * 3

def safe_write(filepath, content):
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.replace("```", FENCE))

pill_capsules_code = """import { useState, useEffect } from 'react';
import type { ROSCAssessment } from '../../lib/types/rosc';

interface Props {
    current: ROSCAssessment;
    previous?: ROSCAssessment;
}

const PILLARS = [
    { key: 'health',    label: 'Health',    icon: '🫀', gradA: '#F472B6', gradB: '#EC4899', glow: '#F472B6' },
    { key: 'home',      label: 'Home',      icon: '🏠', gradA: '#FB923C', gradB: '#F59E0B', glow: '#FB923C' },
    { key: 'purpose',   label: 'Purpose',   icon: '⭐', gradA: '#A78BFA', gradB: '#7C3AED', glow: '#A78BFA' },
    { key: 'community', label: 'Community', icon: '🤝', gradA: '#34D399', gradB: '#059669', glow: '#34D399' },
] as const;

function useSegReveal(run: boolean, currentScores: number[], delay = 60) {
    const [revealed, setRevealed] = useState<number[]>(currentScores.map(() => 0));
    const scoresKey = currentScores.join(',');

    useEffect(() => {
        if (!run) { setRevealed(currentScores.map(() => 0)); return; }
        const timers: ReturnType<typeof setTimeout>[] = [];
        currentScores.forEach((target, pi) => {
            let seg = 0;
            const t = setTimeout(() => {
                const iv = setInterval(() => {
                    seg++;
                    setRevealed(prev => { 
                        const n = [...prev]; 
                        n[pi] = seg; 
                        return n; 
                    });
                    if (seg >= target) clearInterval(iv);
                }, delay + pi * 15);
                timers.push(iv as unknown as ReturnType<typeof setTimeout>);
            }, pi * 160);
            timers.push(t);
        });
        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, scoresKey, delay]);
    
    return revealed;
}

export default function ROSCPillCapsules({ current, previous }: Props) {
    const SEG = 10;
    const counts = [
        current.scores.health.score,
        current.scores.home.score,
        current.scores.purpose.score,
        current.scores.community.score
    ];
    
    const revealed = useSegReveal(true, counts, 55);

    return (
        <div className="flex flex-col gap-[18px]">
            {PILLARS.map((p, pi) => {
                const cur = current.scores[p.key].score;
                const prev = previous ? previous.scores[p.key].score : 0;
                const gain = cur - prev;
                
                return (
                    <div key={p.key}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{p.icon}</span>
                                <span className="text-[13px] font-semibold text-white/90">{p.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {previous ? <span className="text-[11px] text-white/30">{prev}</span> : null}
                                <span className="text-[21px] font-black text-white">{cur}</span>
                                {previous && gain !== 0 && (
                                    <span 
                                        className="text-[11px] font-bold rounded-full px-2 py-0.5"
                                        style={{ color: p.gradA, background: `${p.gradA}22` }}
                                    >
                                        {gain > 0 ? '+' : ''}{gain}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-1.5">
                            {Array.from({ length: SEG }).map((_, si) => {
                                const filled = si < revealed[pi];
                                const wasFill = previous && si < prev;
                                return (
                                    <div 
                                        key={si} 
                                        className="flex-1 h-[14px] rounded-full origin-center"
                                        style={{
                                            background: filled
                                                ? `linear-gradient(135deg, ${p.gradA}, ${p.gradB})`
                                                : wasFill
                                                    ? "rgba(255,255,255,0.11)"
                                                    : "rgba(255,255,255,0.04)",
                                            boxShadow: filled ? `0 0 10px ${p.glow}77` : "none",
                                            border: `1px solid ${filled ? p.gradA+"44" : "rgba(255,255,255,0.06)"}`,
                                            transition: filled ? "all 0.18s ease" : "none",
                                            transform: filled ? "scaleY(1)" : "scaleY(0.8)",
                                        }} 
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            
            {previous && (
                <div className="mt-5 pt-3.5 border-t border-white/5 flex gap-4">
                    {[
                        { bg: "rgba(255,255,255,0.13)", label: "Last month" },
                        { bg: "linear-gradient(90deg,#C026D3,#EC4899)", label: "This month" }
                    ].map(({ bg, label }) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className="w-[22px] h-[3px] rounded-sm" style={{ background: bg }} />
                            <span className="text-[10px] text-white/30">{label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
"""

assessment_card_code = """import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { LockClosedIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useEncryption } from '../../contexts/EncryptionContext';
import ROSCPillCapsules from './ROSCPillCapsules';
import type { ROSCAssessment } from '../../lib/types/rosc';

interface DecryptedContext {
    narrative: string;
    strengths: string[];
    growth_areas: string[];
    evidence: Record<string, string[]>;
}

interface Props {
    assessment: ROSCAssessment;
    previous?: ROSCAssessment;
    compact?: boolean;
}

function trajectoryPill(t: ROSCAssessment['trajectory']) {
    const map: Record<string, string> = {
        'Improving': 'bg-emerald-100 text-emerald-700',
        'Stable': 'bg-blue-100 text-blue-700',
        'Declining': 'bg-amber-100 text-amber-700',
        'Insufficient Data': 'bg-gray-100 text-gray-500',
    };
    return map[t] ?? 'bg-gray-100 text-gray-500';
}

export default function ROSCAssessmentCard({ assessment, previous, compact = false }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [context, setContext] = useState<DecryptedContext | null>(null);
    const [decrypting, setDecrypting] = useState(false);
    const { decrypt, isVaultUnlocked } = useEncryption();

    const createdDate = assessment.createdAt?.toDate
        ? assessment.createdAt.toDate()
        : new Date(assessment.createdAt as unknown as string);

    const handleExpand = useCallback(async () => {
        const next = !expanded;
        setExpanded(next);
        if (next && !context && assessment.encryptedAIContext && isVaultUnlocked) {
            setDecrypting(true);
            try {
                const plain = await decrypt(assessment.encryptedAIContext);
                setContext(JSON.parse(plain) as DecryptedContext);
            } catch {
                // Context unavailable — show locked state
            } finally {
                setDecrypting(false);
            }
        }
    }, [expanded, context, assessment.encryptedAIContext, isVaultUnlocked, decrypt]);

    if (expanded) {
        const gain = previous ? assessment.totalScore - previous.totalScore : 0;
        return (
            <div className="relative rounded-3xl overflow-hidden p-[1.5px] shadow-lg" style={{ background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)' }}>
                <div className="relative rounded-[23px] bg-[#0A0418]/60 backdrop-blur-2xl p-5 overflow-hidden">
                    {/* Ambient blobs */}
                    <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #7C3AED40 0%, transparent 65%)' }} />
                    <div className="absolute -bottom-10 -left-5 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #EC489930 0%, transparent 65%)' }} />
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <button onClick={handleExpand} className="w-full flex justify-between items-start mb-6 text-left cursor-pointer">
                            <div>
                                <div className="text-[10px] tracking-widest text-white/45 uppercase mb-1">
                                    {format(createdDate, 'MMM yyyy')}
                                </div>
                                <div className="text-[13px] text-white/65">Recovery Capital</div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-baseline gap-1">
                                    <div className="text-[42px] font-black text-white leading-none">{assessment.totalScore}</div>
                                    <div className="text-[11px] text-white/35 pb-1">/ 40</div>
                                </div>
                                {previous && (
                                    <div className="text-[11px] text-[#34D399] font-bold mt-1">
                                        {gain >= 0 ? '▲ +' : '▼ '}{gain} this month
                                    </div>
                                )}
                            </div>
                        </button>

                        <div className="space-y-5">
                            {!compact && (
                                <ROSCPillCapsules current={assessment} previous={previous} />
                            )}

                            {assessment.journalEntriesAnalysed > 0 && (
                                <p className="text-[10px] text-white/40 text-center">
                                    Based on {assessment.journalEntriesAnalysed} journal entries
                                </p>
                            )}

                            {assessment.encryptedAIContext ? (
                                isVaultUnlocked ? (
                                    decrypting ? (
                                        <div className="text-center text-xs text-white/40 py-4">Unlocking your recovery story…</div>
                                    ) : context ? (
                                        <div className="space-y-3">
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <SparklesIcon className="h-3.5 w-3.5 text-fuchsia-400" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">This Month</span>
                                                </div>
                                                <p className="text-xs text-white/80 leading-relaxed">{context.narrative}</p>
                                            </div>

                                            {context.strengths?.length > 0 && (
                                                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3">
                                                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-400 mb-1.5">Strengths</div>
                                                    <ul className="space-y-1">
                                                        {context.strengths.map((s, i) => (
                                                            <li key={i} className="text-xs text-emerald-100/80">· {s}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {context.growth_areas?.length > 0 && (
                                                <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
                                                    <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400 mb-1.5">Areas to Nurture</div>
                                                    <ul className="space-y-1">
                                                        {context.growth_areas.map((g, i) => (
                                                            <li key={i} className="text-xs text-amber-100/80">· {g}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : null
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-4 bg-white/5 rounded-xl border border-dashed border-white/20">
                                        <LockClosedIcon className="h-5 w-5 text-white/40" />
                                        <p className="text-xs text-white/50 text-center">
                                            Unlock vault to read your recovery story.
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-xs text-white/40 py-2">
                                    Upgrade to Premium for AI-powered insights on your recovery.
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-2 flex justify-center border-t border-white/5">
                            <button onClick={handleExpand} className="p-2">
                                <ChevronUpIcon className="h-4 w-4 text-white/40 flex-shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-fuchsia-100 shadow-sm overflow-hidden">
            <button
                onClick={handleExpand}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-fuchsia-50/40 transition-colors text-left cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white rounded-xl w-10 h-10 flex flex-col items-center justify-center leading-none">
                        <span className="text-[11px] font-bold">{format(createdDate, 'MMM').toUpperCase()}</span>
                        <span className="text-[10px] opacity-80">{format(createdDate, 'yyyy')}</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">
                            Recovery Capital · {format(createdDate, 'MMMM yyyy')}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-fuchsia-700">{assessment.totalScore}/40</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trajectoryPill(assessment.trajectory)}`}>
                                {assessment.trajectory}
                            </span>
                        </div>
                    </div>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </button>
        </div>
    );
}
"""

history_panel_code = """import { useState } from 'react';
import { format } from 'date-fns';
import { SparklesIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useROSCAssessments } from '../../hooks/useROSCAssessments';
import ROSCCheckIn from './ROSCCheckIn';
import ROSCAssessmentCard from './ROSCAssessmentCard';
import ROSCPillCapsules from './ROSCPillCapsules';
import type { ROSCCheckInAnswers } from '../../lib/types/rosc';

export default function ROSCHistoryPanel() {
    const { userTier } = useAuth();
    const { isVaultUnlocked } = useEncryption();
    const {
        assessments,
        isLoading,
        canCreateThisMonth,
        hasStartedCheckIn,
        savedCheckIn,
        saveCheckInProgress,
        createAssessment,
        isCreating,
        createProgress,
        createError,
    } = useROSCAssessments();

    const [showCheckIn, setShowCheckIn] = useState(false);
    const isOnline = navigator.onLine;

    const handleCheckInStart = () => {
        localStorage.setItem(`roscCheckInStarted_${format(new Date(), 'yyyy-MM')}`, 'true');
    };

    const handleCheckInComplete = async (answers: ROSCCheckInAnswers) => {
        setShowCheckIn(false);
        saveCheckInProgress(answers);
        await createAssessment(answers).catch(() => {});
    };

    const latest = assessments[0];
    const previous = assessments[1];

    const ctaLabel = (() => {
        if (!canCreateThisMonth) return null;
        if (hasStartedCheckIn) return 'Continue your check-in';
        if (assessments.length === 0) return 'Start your first check-in';
        return 'Start this month\\'s check-in';
    })();

    const ctaDisabled = !isOnline || !isVaultUnlocked || isCreating;

    const ctaDisabledReason = (() => {
        if (!isOnline) return 'Connect to complete your check-in';
        if (!isVaultUnlocked) return 'Unlock vault to begin';
        return null;
    })();

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Recovery Capital</h2>
                    <p className="text-sm text-black mt-0.5">Monthly snapshot across all four ROSC dimensions</p>
                </div>
                {ctaLabel && (
                    <div className="flex flex-col items-end gap-0.5">
                        <button
                            onClick={() => !ctaDisabled && setShowCheckIn(true)}
                            disabled={ctaDisabled}
                            className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                                ctaDisabled
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-fuchsia-600 to-rose-500 text-white hover:opacity-90 shadow-sm'
                            }`}
                        >
                            {ctaLabel}
                        </button>
                        {ctaDisabledReason && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <WifiIcon className="h-3 w-3" />
                                {ctaDisabledReason}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {isCreating && (
                <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="h-4 w-4 text-fuchsia-500 animate-pulse" />
                        <span className="text-xs font-bold text-fuchsia-700">Analysing your recovery capital…</span>
                    </div>
                    <div className="w-full bg-fuchsia-100 rounded-full h-1.5">
                        <div
                            className="bg-fuchsia-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${createProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {createError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
                    {createError}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8 text-xs text-gray-400">Loading your history…</div>
            ) : assessments.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-fuchsia-200">
                    <div className="w-12 h-12 bg-fuchsia-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <SparklesIcon className="h-6 w-6 text-fuchsia-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Your first snapshot awaits</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                        Complete your first monthly check-in to see your Recovery Capital across Health, Home, Purpose, and Community.
                    </p>
                    {userTier !== 'premium' && (
                        <p className="text-[10px] text-gray-400 mt-2">
                            Free tier shows scores · Upgrade for AI insights
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {latest && !isCreating && (
                        <div className="relative rounded-3xl overflow-hidden p-[1.5px] shadow-lg" style={{ background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)' }}>
                            <div className="relative rounded-[23px] bg-[#0A0418]/60 backdrop-blur-2xl p-5 overflow-hidden">
                                {/* Ambient blobs */}
                                <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #7C3AED40 0%, transparent 65%)' }} />
                                <div className="absolute -bottom-10 -left-5 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #EC489930 0%, transparent 65%)' }} />
                                
                                <div className="relative z-10">
                                    <div className="mb-6 flex justify-between items-start">
                                        <div>
                                            <div className="text-[10px] tracking-widest text-white/45 uppercase mb-1">
                                                {format(latest.createdAt.toDate ? latest.createdAt.toDate() : new Date(), 'MMMM yyyy')}
                                            </div>
                                            <div className="text-[13px] text-white/65">Recovery Capital</div>
                                            {assessments.length === 1 && (
                                                <div className="text-[10px] text-white/40 mt-1">Your first snapshot</div>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-baseline gap-1">
                                                <div className="text-[42px] font-black text-white leading-none">{latest.totalScore}</div>
                                                <div className="text-[11px] text-white/35 pb-1">/ 40</div>
                                            </div>
                                            {assessments.length >= 2 && previous && (
                                                <div className="text-[11px] text-[#34D399] font-bold mt-1">
                                                    {latest.totalScore >= previous.totalScore ? '▲ +' : '▼ '}{latest.totalScore - previous.totalScore} this month
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ROSCPillCapsules current={latest} previous={assessments.length >= 2 ? previous : undefined} />
                                </div>
                            </div>
                        </div>
                    )}

                    {assessments.length === 0 && !canCreateThisMonth && (
                        <p className="text-center text-xs text-gray-400">Check back next month for your next snapshot.</p>
                    )}

                    {assessments.length >= 2 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 px-1">History</h3>
                            {assessments.slice(1).map((a, i) => (
                                <ROSCAssessmentCard
                                    key={a.id}
                                    assessment={a}
                                    previous={assessments[i + 2]}
                                    compact
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showCheckIn && (
                <ROSCCheckIn
                    onComplete={handleCheckInComplete}
                    onDismiss={() => setShowCheckIn(false)}
                    onStart={handleCheckInStart}
                    initialAnswers={savedCheckIn}
                />
            )}
        </div>
    );
}
"""

components_dir = "src/components/insights"
os.makedirs(components_dir, exist_ok=True)

safe_write(os.path.join(components_dir, "ROSCPillCapsules.tsx"), pill_capsules_code)
safe_write(os.path.join(components_dir, "ROSCAssessmentCard.tsx"), assessment_card_code)
safe_write(os.path.join(components_dir, "ROSCHistoryPanel.tsx"), history_panel_code)

chart_path = os.path.join(components_dir, "ROSCRadarChart.tsx")
if os.path.exists(chart_path):
    os.remove(chart_path)
    
print("Successfully wrote ROSCPillCapsules.tsx, updated ROSCAssessmentCard.tsx and ROSCHistoryPanel.tsx, and deleted ROSCRadarChart.tsx.")
