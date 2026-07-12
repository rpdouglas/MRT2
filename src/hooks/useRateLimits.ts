import { useAuth } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { useUserProfile } from './useUserProfile';
import { differenceInDays } from 'date-fns';

export function useRateLimits() {
    const { userTier } = useAuth();
    const { profile, isLoading, patchFields } = useUserProfile();

    const checkEligibility = (scope: 'weekly' | 'monthly' | 'all-time') => {
        // VIP / Supporter Bypass
        if (userTier === 'premium') return { allowed: true };

        const limits = profile?.usage_limits || {};
        const now = new Date();

        if (scope === 'weekly' && limits.lastWeeklyInsight) {
            const diff = differenceInDays(now, limits.lastWeeklyInsight.toDate());
            if (diff < 7) return { allowed: false, reason: `Available in ${7 - diff} days. Upgrade to unlock.` };
        }
        
        if ((scope === 'monthly' || scope === 'all-time')) {
            const lastRun = scope === 'monthly' ? limits.lastMonthlyInsight : limits.lastDeepDive;
            if (lastRun) {
                const diff = differenceInDays(now, lastRun.toDate());
                if (diff < 30) return { allowed: false, reason: `Available in ${30 - diff} days. Upgrade to unlock.` };
            }
        }

        return { allowed: true };
    };

    const stampUsage = async (scope: 'weekly' | 'monthly' | 'all-time') => {
        if (userTier === 'premium') return;
        const field = scope === 'weekly' ? 'lastWeeklyInsight' : scope === 'monthly' ? 'lastMonthlyInsight' : 'lastDeepDive';
        await patchFields.mutateAsync({
            [`usage_limits.${field}`]: Timestamp.now()
        });
    };

    return {
        checkEligibility,
        stampUsage,
        isStamping: patchFields.isPending,
        loadingLimits: isLoading
    };
}
