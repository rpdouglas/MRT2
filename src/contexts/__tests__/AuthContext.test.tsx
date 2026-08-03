/**
 * src/contexts/__tests__/AuthContext.test.tsx
 * PROJ-101 Phase 4: first direct unit coverage of AuthContext.tsx. Previously
 * this file had zero dedicated tests despite being part of the auth/ZK-adjacent
 * surface — every other test in the codebase mocks useAuth() wholesale instead
 * (matching EncryptionContext.test.tsx's own note about a parallel gap it closed
 * for PROJ-73). e2e/security/mockuser-prod.spec.ts already covers the
 * mockUser bypass's production-*build* gate; this file covers the DEV-mode
 * runtime behavior itself, which that e2e test doesn't exercise.
 *
 * Mocking strategy: only the I/O boundaries are mocked (firebase/auth's
 * onAuthStateChanged, ../lib/db's getOrCreateUserProfile, ../lib/messaging,
 * posthog-js, ../lib/telemetry) — matching EncryptionContext.test.tsx's own
 * precedent. `db` from ../lib/firebase is mocked to null specifically to skip
 * the Stripe-subscriptions onSnapshot branch, which is unrelated to what this
 * file tests and would otherwise require mocking firebase/firestore too.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import { AuthProvider, useAuth } from '../AuthContext';
import * as dbLib from '../../lib/db';
import * as telemetry from '../../lib/telemetry';

vi.mock('../../lib/firebase', () => ({ auth: {}, db: null }));

vi.mock('firebase/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/auth')>();
    return { ...actual, onAuthStateChanged: vi.fn() };
});

vi.mock('../../lib/db', () => ({ getOrCreateUserProfile: vi.fn() }));

vi.mock('../../lib/messaging', () => ({
    refreshFcmTokenIfStale: vi.fn().mockResolvedValue(undefined),
    listenForForegroundMessages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('posthog-js', () => ({
    default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));

vi.mock('../../lib/telemetry', () => ({
    trackClientError: vi.fn(),
    trackAdminRoleFallbackUsed: vi.fn(),
}));

type AuthStateCallback = (user: User | null) => void;

function mockAuthUser(claims: Record<string, unknown> = {}, overrides: Partial<User> = {}): User {
    return {
        uid: 'uid-1',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdTokenResult: vi.fn().mockResolvedValue({ claims }),
        ...overrides,
    } as unknown as User;
}

describe('AuthContext', () => {
    let authStateCallback: AuthStateCallback | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        window.history.pushState({}, '', '/');
        authStateCallback = null;

        vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth, cb) => {
            authStateCallback = cb as AuthStateCallback;
            return vi.fn();
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('isAdmin OR logic (PROJ-99 Phase 5: custom claim vs. role fallback)', () => {
        it('resolves isAdmin true from the custom claim alone and does not fire the fallback-used telemetry', async () => {
            vi.mocked(dbLib.getOrCreateUserProfile).mockResolvedValue({ role: 'user', tier: 'free' } as unknown as Awaited<ReturnType<typeof dbLib.getOrCreateUserProfile>>);

            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
            await waitFor(() => expect(authStateCallback).not.toBeNull());

            await act(async () => { authStateCallback!(mockAuthUser({ admin: true })); });
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.isAdmin).toBe(true);
            expect(telemetry.trackAdminRoleFallbackUsed).not.toHaveBeenCalled();
        });

        it('resolves isAdmin true from the role fallback alone and fires the fallback-used telemetry', async () => {
            vi.mocked(dbLib.getOrCreateUserProfile).mockResolvedValue({ role: 'admin', tier: 'free' } as unknown as Awaited<ReturnType<typeof dbLib.getOrCreateUserProfile>>);

            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
            await waitFor(() => expect(authStateCallback).not.toBeNull());

            await act(async () => { authStateCallback!(mockAuthUser({})); });
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.isAdmin).toBe(true);
            expect(telemetry.trackAdminRoleFallbackUsed).toHaveBeenCalledTimes(1);
        });

        it('resolves isAdmin false when neither the claim nor the role grant it', async () => {
            vi.mocked(dbLib.getOrCreateUserProfile).mockResolvedValue({ role: 'user', tier: 'free' } as unknown as Awaited<ReturnType<typeof dbLib.getOrCreateUserProfile>>);

            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
            await waitFor(() => expect(authStateCallback).not.toBeNull());

            await act(async () => { authStateCallback!(mockAuthUser({})); });
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.isAdmin).toBe(false);
            expect(telemetry.trackAdminRoleFallbackUsed).not.toHaveBeenCalled();
        });
    });

    describe('onAuthStateChanged handling', () => {
        it('clears user/isAdmin/userTier on a null (logged-out) user', async () => {
            vi.mocked(dbLib.getOrCreateUserProfile).mockResolvedValue({ role: 'admin', tier: 'premium' } as unknown as Awaited<ReturnType<typeof dbLib.getOrCreateUserProfile>>);

            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
            await waitFor(() => expect(authStateCallback).not.toBeNull());

            await act(async () => { authStateCallback!(mockAuthUser({})); });
            await waitFor(() => expect(result.current.user).not.toBeNull());
            expect(result.current.isAdmin).toBe(true);

            await act(async () => { authStateCallback!(null); });
            await waitFor(() => expect(result.current.user).toBeNull());

            expect(result.current.isAdmin).toBe(false);
            expect(result.current.userTier).toBe('free');
            expect(result.current.loading).toBe(false);
        });

        it('fails closed but still resolves loading when the profile fetch throws', async () => {
            vi.mocked(dbLib.getOrCreateUserProfile).mockRejectedValue(new Error('Firestore unavailable'));
            const user = mockAuthUser({});

            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
            await waitFor(() => expect(authStateCallback).not.toBeNull());

            await act(async () => { authStateCallback!(user); });
            await waitFor(() => expect(result.current.loading).toBe(false));

            // The catch block still sets the Firebase Auth user (so the app
            // isn't stuck logged-out) but defaults the tier and never
            // resolves isAdmin true off a profile it couldn't fetch.
            expect(result.current.user).toBe(user);
            expect(result.current.userTier).toBe('free');
            expect(result.current.isAdmin).toBe(false);
            expect(telemetry.trackClientError).toHaveBeenCalledWith('user_profile_fetch', 'Error');
        });
    });

    describe('mockUser DEV-only bypass (SEC-01)', () => {
        it('activates the mock user from the ?mockUser query param when DEV is true', async () => {
            vi.stubEnv('DEV', true);
            window.history.pushState({}, '', '/?mockUser=ned');

            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.user?.uid).toBe('mock-uid-ned');
            expect(result.current.userTier).toBe('premium');
            expect(result.current.isAdmin).toBe(false);
            // The DEV bypass short-circuits before ever registering a real
            // onAuthStateChanged listener.
            expect(firebaseAuth.onAuthStateChanged).not.toHaveBeenCalled();
        });

        it('does NOT activate the mock user bypass when DEV is false', async () => {
            vi.stubEnv('DEV', false);
            window.history.pushState({}, '', '/?mockUser=ned');

            renderHook(() => useAuth(), { wrapper: AuthProvider });

            // Falls through to the real onAuthStateChanged registration
            // instead of the mockUser shortcut — asserted directly, since
            // AuthProvider withholds its children (and so this hook's own
            // render) until `loading` resolves, which nothing here drives.
            await waitFor(() => expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledTimes(1));
            expect(localStorage.getItem('mrt_mock_user')).toBeNull();
        });
    });
});
