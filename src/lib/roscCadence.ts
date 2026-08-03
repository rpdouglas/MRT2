import { Timestamp } from 'firebase/firestore';
import { differenceInDays, isSameMonth, addDays, startOfMonth, addMonths, format } from 'date-fns';

export type ROSCCadence = 'weekly' | 'monthly';

export const ROSC_LOOKBACK_DAYS: Record<ROSCCadence, number> = {
    weekly: 7,
    monthly: 30,
};

export function getROSCCadence(userTier?: string): ROSCCadence {
    return userTier === 'premium' ? 'weekly' : 'monthly';
}

export function toDateSafe(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    const parsed = new Date(value as string | number);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function canCreateForCadence(cadence: ROSCCadence, latest: Date | null, now: Date): boolean {
    if (!latest) return true;
    if (cadence === 'weekly') return differenceInDays(now, latest) >= ROSC_LOOKBACK_DAYS.weekly;
    return !isSameMonth(latest, now);
}

export function nextEligibleAt(cadence: ROSCCadence, latest: Date): Date {
    if (cadence === 'weekly') return addDays(latest, ROSC_LOOKBACK_DAYS.weekly);
    return startOfMonth(addMonths(latest, 1));
}

export function daysUntilEligible(cadence: ROSCCadence, latest: Date, now: Date): number {
    const eligible = nextEligibleAt(cadence, latest);
    return Math.max(0, differenceInDays(eligible, now));
}

/** Cadence-scoped key for check-in draft persistence — weekly uses ISO week-year/week so it doesn't collide across a Dec/Jan boundary. */
export function roscPeriodKey(cadence: ROSCCadence, now: Date): string {
    return cadence === 'weekly' ? format(now, "RRRR-'W'II") : format(now, 'yyyy-MM');
}

export const cadenceNoun = (cadence: ROSCCadence): string => (cadence === 'weekly' ? 'week' : 'month');

export const cadenceSinceLabel = (cadence: ROSCCadence): string => (cadence === 'weekly' ? 'this week' : 'this month');

export const cadencePreviousLabel = (cadence: ROSCCadence): string => (cadence === 'weekly' ? 'Last week' : 'Last month');

export const cadenceCurrentLabel = (cadence: ROSCCadence): string => (cadence === 'weekly' ? 'This week' : 'This month');

export const cadenceDateFormat = (cadence: ROSCCadence): string => (cadence === 'weekly' ? 'MMM d, yyyy' : 'MMMM yyyy');

export function cadenceCtaLabel(cadence: ROSCCadence, hasStartedCheckIn: boolean, isFirst: boolean): string {
    if (hasStartedCheckIn) return 'Continue your check-in';
    if (isFirst) return 'Start your first check-in';
    return `Start this ${cadenceNoun(cadence)}'s check-in`;
}
