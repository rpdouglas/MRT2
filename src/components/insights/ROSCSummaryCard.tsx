import { Link } from 'react-router-dom';
import { SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useROSCAssessments } from '../../hooks/useROSCAssessments';
import ROSCLatestCard from './ROSCLatestCard';
import { cadenceCtaLabel, cadenceNoun } from '../../lib/roscCadence';

export default function ROSCSummaryCard() {
    const { userTier } = useAuth();
    const {
        assessments,
        isLoading,
        cadence,
        canCreateAssessment,
        hasStartedCheckIn,
    } = useROSCAssessments();

    const latest = assessments[0];
    const previous = assessments[1];

    const ctaLabel = canCreateAssessment ? cadenceCtaLabel(cadence, hasStartedCheckIn, assessments.length === 0) : null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Recovery Capital</h2>
                    <p className="text-sm text-black mt-0.5">
                        {cadence === 'weekly' ? 'Weekly' : 'Monthly'} snapshot across all four ROSC dimensions
                    </p>
                </div>
                {ctaLabel && (
                    <Link
                        to="/insights/rosc?start=1"
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-500 text-white hover:opacity-90 shadow-sm whitespace-nowrap"
                    >
                        {ctaLabel}
                    </Link>
                )}
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
                    {!canCreateAssessment && (
                        <p className="text-[10px] text-gray-400 mt-2">Check back next {cadenceNoun(cadence)} for your next snapshot.</p>
                    )}
                </div>
            ) : (
                <ROSCLatestCard
                    latest={latest}
                    previous={previous}
                    cadence={cadence}
                    isFirst={assessments.length === 1}
                />
            )}

            <Link
                to="/insights/rosc?tab=trends"
                className="flex items-center justify-center gap-1 text-xs font-bold text-fuchsia-700 hover:text-fuchsia-900 py-1"
            >
                View trends & history
                <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}
