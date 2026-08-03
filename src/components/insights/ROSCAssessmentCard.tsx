import { useState, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LockClosedIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, PlusCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useTaskOperations } from '../../hooks/useTaskOperations';
import ROSCPillCapsules from './ROSCPillCapsules';
import type { ROSCAssessment } from '../../lib/types/rosc';
import { cadenceCurrentLabel, cadenceDateFormat, cadenceSinceLabel, type ROSCCadence } from '../../lib/roscCadence';

type ROSCDomain = 'health' | 'home' | 'purpose' | 'community';

const DOMAIN_LABELS: Record<ROSCDomain, string> = {
    health: 'Health',
    home: 'Home',
    purpose: 'Purpose',
    community: 'Community',
};

interface DecryptedContext {
    narrative: string;
    strengths: string[];
    growth_areas: string[];
    evidence: Record<string, string[]>;
    actions?: Record<ROSCDomain, string>;
}

interface Props {
    assessment: ROSCAssessment;
    previous?: ROSCAssessment;
    compact?: boolean;
    cadence?: ROSCCadence;
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

export default function ROSCAssessmentCard({ assessment, previous, compact = false, cadence = 'monthly' }: Props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addTask } = useTaskOperations();
    const [expanded, setExpanded] = useState(false);
    const [context, setContext] = useState<DecryptedContext | null>(null);
    const [decrypting, setDecrypting] = useState(false);
    const [addedActions, setAddedActions] = useState<Set<ROSCDomain>>(new Set());
    const { decrypt, isVaultUnlocked } = useEncryption();

    const createdDate = assessment.createdAt?.toDate
        ? assessment.createdAt.toDate()
        : new Date(assessment.createdAt as unknown as string);

    const handleAddToTasks = async (domain: ROSCDomain, actionText: string) => {
        if (!user) return;
        try {
            await addTask({
                title: actionText,
                recurrence: { type: 'once' },
                priority: 'Medium',
                dueDate: addDays(new Date(), 7),
                source: 'ai',
                aiMeta: { sourceContext: `${DOMAIN_LABELS[domain]} · ${format(createdDate, cadenceDateFormat(cadence))} Recovery Capital check-in` },
            });
            setAddedActions(prev => new Set(prev).add(domain));
            toast.success('Task added to your ledger.', { action: { label: 'View Tasks', onClick: () => navigate('/tasks') } });
        } catch (e) {
            console.error('Failed to add task', e);
        }
    };

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
                                    {format(createdDate, cadenceDateFormat(cadence))}
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
                                        {gain >= 0 ? '▲ +' : '▼ '}{gain} {cadenceSinceLabel(cadence)}
                                    </div>
                                )}
                            </div>
                        </button>

                        <div className="space-y-5">
                            {!compact && (
                                <ROSCPillCapsules current={assessment} previous={previous} cadence={cadence} />
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
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">{cadenceCurrentLabel(cadence)}</span>
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

                                            {context.actions && (
                                                <div className="bg-fuchsia-950/30 border border-fuchsia-500/20 rounded-xl p-3">
                                                    <div className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-400 mb-1.5">Your Next Actions</div>
                                                    <div className="space-y-1.5">
                                                        {(Object.keys(DOMAIN_LABELS) as ROSCDomain[]).map((domain) => {
                                                            const actionText = context.actions?.[domain];
                                                            if (!actionText) return null;
                                                            const added = addedActions.has(domain);
                                                            return (
                                                                <div key={domain} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg p-2">
                                                                    <span className="text-xs text-fuchsia-100/80">
                                                                        <span className="font-bold text-fuchsia-300">{DOMAIN_LABELS[domain]}:</span> {actionText}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => !added && handleAddToTasks(domain, actionText)}
                                                                        disabled={added}
                                                                        aria-label={added ? `${DOMAIN_LABELS[domain]} action added to tasks` : `Add ${DOMAIN_LABELS[domain]} action to tasks`}
                                                                        className={`p-1 rounded-full transition-all flex-shrink-0 ${added ? 'text-emerald-400 bg-emerald-500/10' : 'text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20'}`}
                                                                    >
                                                                        {added ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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
                            <button onClick={handleExpand} className="p-2" aria-label="Collapse assessment details">
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
                        <span className="text-[11px] font-bold">{format(createdDate, cadence === 'weekly' ? 'MMM d' : 'MMM').toUpperCase()}</span>
                        <span className="text-[10px] opacity-80">{format(createdDate, 'yyyy')}</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">
                            Recovery Capital · {format(createdDate, cadenceDateFormat(cadence))}
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
