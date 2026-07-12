/**
 * src/hooks/__tests__/useRateLimits.test.ts
 * PURPOSE: Boundary-date coverage for AI feature rate limiting, and the
 * usage_limits.* dot-path write issued by stampUsage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { useRateLimits } from '../useRateLimits';
import * as AuthContext from '../../contexts/AuthContext';
import * as UserProfileHook from '../useUserProfile';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../useUserProfile', () => ({ useUserProfile: vi.fn() }));

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;
type UserProfileValue = ReturnType<typeof UserProfileHook.useUserProfile>;

function mockAuth(userTier: 'free' | 'premium') {
    vi.mocked(AuthContext.useAuth).mockReturnValue({ userTier } as unknown as AuthContextValue);
}

function mockProfile(usage_limits: Record<string, Timestamp> = {}, mutateAsync = vi.fn().mockResolvedValue(undefined)) {
    vi.mocked(UserProfileHook.useUserProfile).mockReturnValue({
        profile: { usage_limits },
        isLoading: false,
        patchFields: { mutateAsync, isPending: false },
    } as unknown as UserProfileValue);
    return mutateAsync;
}

describe('⏱️ useRateLimits (boundary + dot-path writes)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('premium tier always bypasses limits regardless of usage_limits state', () => {
        mockAuth('premium');
        mockProfile({ lastWeeklyInsight: Timestamp.fromDate(new Date()) });

        const { result } = renderHook(() => useRateLimits());

        expect(result.current.checkEligibility('weekly')).toEqual({ allowed: true });
        expect(result.current.checkEligibility('monthly')).toEqual({ allowed: true });
        expect(result.current.checkEligibility('all-time')).toEqual({ allowed: true });
    });

    it('weekly: blocked when last use was fewer than 7 days ago', () => {
        mockAuth('free');
        mockProfile({ lastWeeklyInsight: Timestamp.fromDate(subDays(new Date(), 3)) });

        const { result } = renderHook(() => useRateLimits());
        const eligibility = result.current.checkEligibility('weekly');

        expect(eligibility.allowed).toBe(false);
        expect(eligibility.reason).toMatch(/Available in \d+ days/);
    });

    it('weekly: allowed at exactly the 7-day boundary', () => {
        mockAuth('free');
        mockProfile({ lastWeeklyInsight: Timestamp.fromDate(subDays(new Date(), 7)) });

        const { result } = renderHook(() => useRateLimits());

        expect(result.current.checkEligibility('weekly')).toEqual({ allowed: true });
    });

    it('weekly: allowed when no prior usage is recorded', () => {
        mockAuth('free');
        mockProfile({});

        const { result } = renderHook(() => useRateLimits());

        expect(result.current.checkEligibility('weekly')).toEqual({ allowed: true });
    });

    it('monthly: blocked when last use was fewer than 30 days ago', () => {
        mockAuth('free');
        mockProfile({ lastMonthlyInsight: Timestamp.fromDate(subDays(new Date(), 29)) });

        const { result } = renderHook(() => useRateLimits());
        const eligibility = result.current.checkEligibility('monthly');

        expect(eligibility.allowed).toBe(false);
        expect(eligibility.reason).toMatch(/Available in 1 days/);
    });

    it('monthly: allowed at exactly the 30-day boundary', () => {
        mockAuth('free');
        mockProfile({ lastMonthlyInsight: Timestamp.fromDate(subDays(new Date(), 30)) });

        const { result } = renderHook(() => useRateLimits());

        expect(result.current.checkEligibility('monthly')).toEqual({ allowed: true });
    });

    it('all-time: uses lastDeepDive, independent of lastMonthlyInsight', () => {
        mockAuth('free');
        mockProfile({
            lastMonthlyInsight: Timestamp.fromDate(subDays(new Date(), 30)), // would be allowed
            lastDeepDive: Timestamp.fromDate(subDays(new Date(), 10)), // blocks all-time
        });

        const { result } = renderHook(() => useRateLimits());

        expect(result.current.checkEligibility('monthly')).toEqual({ allowed: true });
        expect(result.current.checkEligibility('all-time').allowed).toBe(false);
    });

    it('stampUsage writes the correct usage_limits.* dot-path per scope', async () => {
        mockAuth('free');
        const mutateAsync = mockProfile({});

        const { result } = renderHook(() => useRateLimits());

        await result.current.stampUsage('weekly');
        expect(mutateAsync).toHaveBeenCalledWith({ 'usage_limits.lastWeeklyInsight': expect.any(Timestamp) });

        await result.current.stampUsage('monthly');
        expect(mutateAsync).toHaveBeenCalledWith({ 'usage_limits.lastMonthlyInsight': expect.any(Timestamp) });

        await result.current.stampUsage('all-time');
        expect(mutateAsync).toHaveBeenCalledWith({ 'usage_limits.lastDeepDive': expect.any(Timestamp) });

        expect(mutateAsync).toHaveBeenCalledTimes(3);
    });

    it('stampUsage is a no-op for premium users (no write issued)', async () => {
        mockAuth('premium');
        const mutateAsync = mockProfile({});

        const { result } = renderHook(() => useRateLimits());

        await result.current.stampUsage('weekly');

        expect(mutateAsync).not.toHaveBeenCalled();
    });
});
