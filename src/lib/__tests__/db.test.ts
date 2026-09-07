/**
 * src/lib/__tests__/db.test.ts
 * PROJ-112: regression coverage for getOrCreateUserProfile()'s pre-update-
 * snapshot-return behavior — it returns the profile as it stood BEFORE
 * overwriting lastLogin to now, which src/contexts/AuthContext.tsx's
 * previousLastLogin capture (and so the whole Recovery Reentry feature)
 * depends on. Not documented anywhere as intentional before PROJ-112 — a
 * future refactor could "fix" this ordering without realizing it's now
 * load-bearing, which is exactly what this test guards against.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getOrCreateUserProfile } from '../db';

vi.mock('../firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: vi.fn(() => ({})),
        getDoc: vi.fn(),
        updateDoc: vi.fn().mockResolvedValue(undefined),
        setDoc: vi.fn().mockResolvedValue(undefined),
    };
});

import * as firestore from 'firebase/firestore';

function mockAuthUser(overrides: Partial<User> = {}): User {
    return { uid: 'uid-1', email: 'test@example.com', displayName: null, photoURL: null, ...overrides } as User;
}

describe('getOrCreateUserProfile (PROJ-112 regression)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the pre-update lastLogin, not the "now" value it just wrote to Firestore', async () => {
        const priorLastLogin = Timestamp.fromDate(new Date('2026-08-01T00:00:00Z'));
        vi.mocked(firestore.getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({ uid: 'uid-1', lastLogin: priorLastLogin, tier: 'free', role: 'user' }),
        } as unknown as firestore.DocumentSnapshot);

        const profile = await getOrCreateUserProfile(mockAuthUser());

        // The doc was overwritten to "now" in Firestore...
        expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { lastLogin: expect.any(Timestamp) });
        const writtenData = vi.mocked(firestore.updateDoc).mock.calls[0][1] as unknown as { lastLogin: Timestamp };
        const writtenLastLogin = writtenData.lastLogin;
        expect(writtenLastLogin.toMillis()).not.toBe(priorLastLogin.toMillis());

        // ...but the RETURNED object still carries the prior session's value.
        expect(profile.lastLogin).toBe(priorLastLogin);
    });

    it('a brand-new user (no existing doc) has no lastLogin to compare — created fresh instead', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue({ exists: () => false, data: () => undefined } as unknown as firestore.DocumentSnapshot);

        const profile = await getOrCreateUserProfile(mockAuthUser());

        expect(firestore.setDoc).toHaveBeenCalled();
        expect(firestore.updateDoc).not.toHaveBeenCalled();
        expect(profile.lastLogin).toBeInstanceOf(Timestamp);
    });
});
