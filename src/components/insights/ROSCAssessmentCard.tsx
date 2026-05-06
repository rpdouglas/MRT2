import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { LockClosedIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useEncryption } from '../../contexts/EncryptionContext';
import ROSCRadarChart from './ROSCRadarChart';
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

    return (
        <div className="bg-white rounded-2xl border border-fuchsia-100 shadow-sm overflow-hidden">
            <button
                onClick={handleExpand}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-fuchsia-50/40 transition-colors text-left"
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
                {expanded
                    ? <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                }
            </button>

            {expanded && (
                <div className="px-4 pb-5 border-t border-fuchsia-50 pt-4 space-y-4">
                    {!compact && (
                        <ROSCRadarChart current={assessment} previous={previous} />
                    )}

                    {assessment.journalEntriesAnalysed > 0 && (
                        <p className="text-[10px] text-gray-400 text-center">
                            Based on {assessment.journalEntriesAnalysed} journal entries
                        </p>
                    )}

                    {assessment.encryptedAIContext ? (
                        isVaultUnlocked ? (
                            decrypting ? (
                                <div className="text-center text-xs text-gray-400 py-4">Unlocking your recovery story…</div>
                            ) : context ? (
                                <div className="space-y-3">
                                    <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <SparklesIcon className="h-3.5 w-3.5 text-fuchsia-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-600">This Month</span>
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed">{context.narrative}</p>
                                    </div>

                                    {context.strengths?.length > 0 && (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1.5">Strengths</div>
                                            <ul className="space-y-1">
                                                {context.strengths.map((s, i) => (
                                                    <li key={i} className="text-xs text-emerald-800">· {s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {context.growth_areas?.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1.5">Areas to Nurture</div>
                                            <ul className="space-y-1">
                                                {context.growth_areas.map((g, i) => (
                                                    <li key={i} className="text-xs text-amber-800">· {g}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : null
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                <p className="text-xs text-gray-500 text-center">
                                    Unlock vault to read your recovery story.
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="text-center text-xs text-gray-400 py-2">
                            Upgrade to Premium for AI-powered insights on your recovery.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
