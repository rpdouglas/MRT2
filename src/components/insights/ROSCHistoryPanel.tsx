import { useState } from 'react';
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
        return 'Start this month\'s check-in';
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
