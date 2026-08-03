import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChartBarIcon, SparklesIcon, WifiIcon } from '@heroicons/react/24/outline';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { useROSCAssessments } from '../hooks/useROSCAssessments';
import ROSCCheckIn from '../components/insights/ROSCCheckIn';
import ROSCAssessmentCard from '../components/insights/ROSCAssessmentCard';
import ROSCLatestCard from '../components/insights/ROSCLatestCard';
import ROSCTrendChart from '../components/insights/ROSCTrendChart';
import { cadenceCtaLabel, cadenceNoun } from '../lib/roscCadence';
import type { ROSCCheckInAnswers } from '../lib/types/rosc';

type Tab = 'snapshot' | 'trends' | 'history';

export default function RecoveryCapital() {
    const { userTier } = useAuth();
    const { isVaultUnlocked } = useEncryption();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        assessments,
        isLoading,
        cadence,
        canCreateAssessment,
        daysUntilEligible,
        checkInStartedKey,
        hasStartedCheckIn,
        savedCheckIn,
        saveCheckInProgress,
        createAssessment,
        isCreating,
        createProgress,
        createError,
    } = useROSCAssessments();

    const [showCheckIn, setShowCheckIn] = useState(false);
    const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'snapshot');
    const isOnline = navigator.onLine;

    const ctaDisabled = !isOnline || !isVaultUnlocked || isCreating;
    const ctaDisabledReason = (() => {
        if (!isOnline) return 'Connect to complete your check-in';
        if (!isVaultUnlocked) return 'Unlock vault to begin';
        return null;
    })();

    useEffect(() => {
        if (searchParams.get('start') === '1' && canCreateAssessment && !ctaDisabled) {
            setShowCheckIn(true);
            const next = new URLSearchParams(searchParams);
            next.delete('start');
            setSearchParams(next, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCheckInStart = () => {
        localStorage.setItem(checkInStartedKey, 'true');
    };

    const handleCheckInComplete = async (answers: ROSCCheckInAnswers) => {
        setShowCheckIn(false);
        saveCheckInProgress(answers);
        await createAssessment(answers).catch(() => {});
    };

    const latest = assessments[0];
    const previous = assessments[1];

    const ctaLabel = canCreateAssessment ? cadenceCtaLabel(cadence, hasStartedCheckIn, assessments.length === 0) : null;

    if (showCheckIn) {
        return (
            <div className={`pb-24 relative min-h-screen ${THEME.insights.page}`}>
                <VibrantHeader
                    title="Recovery Capital"
                    subtitle="Take a moment to check in."
                    icon={SparklesIcon}
                    fromColor={THEME.insights.header.from}
                    viaColor={THEME.insights.header.via}
                    toColor={THEME.insights.header.to}
                    backLink="/insights/rosc"
                />
                <ROSCCheckIn
                    onComplete={handleCheckInComplete}
                    onDismiss={() => setShowCheckIn(false)}
                    onStart={handleCheckInStart}
                    initialAnswers={savedCheckIn}
                />
            </div>
        );
    }

    return (
        <div className={`pb-24 relative min-h-screen ${THEME.insights.page}`}>
            <VibrantHeader
                title="Recovery Capital"
                subtitle={`${cadence === 'weekly' ? 'Weekly' : 'Monthly'} snapshot across Health, Home, Purpose & Community`}
                icon={ChartBarIcon}
                fromColor={THEME.insights.header.from}
                viaColor={THEME.insights.header.via}
                toColor={THEME.insights.header.to}
                backLink="/insights"
            />

            <div className="max-w-4xl mx-auto px-4 mt-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Recovery Capital</h2>
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

                <div className="bg-white p-1.5 rounded-xl shadow-lg border border-fuchsia-200 flex max-w-md">
                    {(['snapshot', 'trends', 'history'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all capitalize tracking-wide ${
                                tab === t
                                    ? 'bg-gradient-to-br from-fuchsia-600 to-rose-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-xs text-gray-400">Loading your history…</div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-fuchsia-200">
                        <div className="w-12 h-12 bg-fuchsia-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <SparklesIcon className="h-6 w-6 text-fuchsia-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-700">Your first snapshot awaits</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                            Complete your first check-in to see your Recovery Capital across Health, Home, Purpose, and Community.
                        </p>
                        {userTier !== 'premium' && (
                            <p className="text-[10px] text-gray-400 mt-2">
                                Free tier shows scores · Upgrade for AI insights
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {tab === 'snapshot' && (
                            <div className="space-y-4">
                                {latest && !isCreating && (
                                    <ROSCLatestCard
                                        latest={latest}
                                        previous={previous}
                                        cadence={cadence}
                                        isFirst={assessments.length === 1}
                                    />
                                )}
                                {!canCreateAssessment && (
                                    <p className="text-center text-xs text-gray-400">
                                        Your next snapshot unlocks in {daysUntilEligible} day{daysUntilEligible === 1 ? '' : 's'}.
                                    </p>
                                )}
                            </div>
                        )}

                        {tab === 'trends' && (
                            <ROSCTrendChart assessments={assessments} cadence={cadence} />
                        )}

                        {tab === 'history' && (
                            <div className="space-y-2">
                                {assessments.length < 2 ? (
                                    <p className="text-center text-xs text-gray-400 py-6">
                                        History appears here after your next check-in.
                                    </p>
                                ) : (
                                    assessments.slice(1).map((a, i) => (
                                        <ROSCAssessmentCard
                                            key={a.id}
                                            assessment={a}
                                            previous={assessments[i + 2]}
                                            cadence={cadence}
                                            compact
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}

                {assessments.length === 0 && !canCreateAssessment && (
                    <p className="text-center text-xs text-gray-400">Check back next {cadenceNoun(cadence)} for your next snapshot.</p>
                )}
            </div>
        </div>
    );
}
