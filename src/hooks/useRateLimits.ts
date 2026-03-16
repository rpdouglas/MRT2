import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import type { UserProfile } from '../lib/db';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';

export function useRateLimits() {
    const { user, userTier } = useAuth();
    const queryClient = useQueryClient();

    // Use React Query to fetch profile, keeping it cached and synchronized
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', user?.uid],
        queryFn: async () => {
            if (!user || !db) return null;
            const snap = await getDoc(doc(db, 'users', user.uid));
            return snap.exists() ? (snap.data() as UserProfile) : null;
        },
        enabled: !!user
    });

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

    const stampUsageMutation = useMutation({
        mutationFn: async (scope: 'weekly' | 'monthly' | 'all-time') => {
            if (!user || !db || userTier === 'premium') return;
            const field = scope === 'weekly' ? 'lastWeeklyInsight' : scope === 'monthly' ? 'lastMonthlyInsight' : 'lastDeepDive';
            await updateDoc(doc(db, 'users', user.uid), {
                [`usage_limits.${field}`]: Timestamp.now()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
        }
    });

    return { 
        checkEligibility, 
        stampUsage: stampUsageMutation.mutateAsync, 
        isStamping: stampUsageMutation.isPending, 
        loadingLimits: isLoading 
    };
}
