/**
 * src/hooks/useRecoveryReentry.ts
 * PROJ-112: derives Recovery Reentry state (see docs/projects/112_RECOVERY_REENTRY.md)
 * from data the calling component already has loaded — no new Firestore query.
 *
 * `reentryStartedAt` (users/{uid}) is written by whichever side notices a
 * 14+ day lastLogin gap first: dailyBeacon (server, functions/src/index.ts,
 * only reaches users with a registered push token) or this hook (client
 * fallback, on the login that finally returns). Both read/write the same
 * field, so there's no divergent logic between the two paths.
 */
import { useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from './useUserProfile';
import { countActiveDaysSince, type ScorableJournal } from '../lib/gamification';

const REENTRY_THRESHOLD_DAYS = 14;
const RESURFACE_THRESHOLD_DAYS = 7;

export interface RecoveryReentryState {
    isReentry: boolean;
    daysBack: number;
    streakResurfaced: boolean;
}

export function useRecoveryReentry(journals: ScorableJournal[]): RecoveryReentryState {
    const { previousLastLogin } = useAuth();
    const { profile, patchFields } = useUserProfile();

    const reentryStartedAt = profile?.reentryStartedAt ?? null;
    const isReentry = !!reentryStartedAt;
    const daysBack = isReentry ? countActiveDaysSince(journals, reentryStartedAt.toDate()) : 0;
    const streakResurfaced = isReentry && daysBack >= RESURFACE_THRESHOLD_DAYS;

    // Client-side fallback: only reached when dailyBeacon never set this field
    // itself (no registered push token for this user) — the server-side path
    // is the primary one for anyone who has notifications enabled. Guarded on
    // `profile` (not just `previousLastLogin`) so a brand-new user's first-ever
    // login (no prior lastLogin to compare) never fires this. `patchFields` is
    // a TanStack mutation object, not stable across renders — deliberately
    // excluded from the deps array below, or this would re-fire every render.
    useEffect(() => {
        if (!profile || profile.reentryStartedAt || !previousLastLogin) return;
        const daysAway = Math.floor((Date.now() - previousLastLogin.toDate().getTime()) / (1000 * 60 * 60 * 24));
        if (daysAway >= REENTRY_THRESHOLD_DAYS) {
            patchFields.mutate({ reentryStartedAt: Timestamp.now() });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile, previousLastLogin]);

    // Same `patchFields`-instability reasoning as above.
    useEffect(() => {
        if (streakResurfaced) {
            patchFields.mutate({ reentryStartedAt: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streakResurfaced]);

    return { isReentry, daysBack, streakResurfaced };
}
