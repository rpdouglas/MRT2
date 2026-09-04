/**
 * src/hooks/__tests__/useMatDoseLog.test.ts
 * PROJ-111. Covers the deterministic-doc-ID upsert, the encrypt-before-write
 * ZK boundary on the optional note (the raw-doc security check this
 * feature's threat model exists to catch), and todaysDose/compliance-rate
 * derivation from the fetched window.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { format, subDays } from 'date-fns';
import * as firestore from 'firebase/firestore';
import * as AuthContext from '../../contexts/AuthContext';
import { useMatDoseLog } from '../useMatDoseLog';
import { generateKey, generateSalt, clearKey } from '../../lib/crypto';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual as Record<string, unknown>,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        doc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn().mockResolvedValue(undefined),
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('💊 useMatDoseLog', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        clearKey();
        await generateKey('1234', generateSalt());
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: { uid: 'user_1', email: 'user@test.com' } } as unknown as AuthContextValue);
        vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
        vi.mocked(firestore.doc).mockImplementation((_db, _col, id) => ({ __id: id }) as unknown as ReturnType<typeof firestore.doc>);
    });

    it('logs a bare dose (no note) as plaintext, isEncrypted: false, at the deterministic ${uid}_${date} doc', async () => {
        const { result } = renderHook(() => useMatDoseLog(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await result.current.logDose();

        const today = format(new Date(), 'yyyy-MM-dd');
        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'mat_doses', `user_1_${today}`);
        expect(firestore.setDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ uid: 'user_1', date: today, isEncrypted: false }),
            { merge: true }
        );
        const [, payload] = vi.mocked(firestore.setDoc).mock.calls[0];
        expect(payload).not.toHaveProperty('encryptedNote');
    });

    it('encrypts a dose note before writing it — raw doc never carries the plaintext (ZK boundary)', async () => {
        const { result } = renderHook(() => useMatDoseLog(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const plaintextNote = 'Felt a little nauseous this morning';
        await result.current.logDose(plaintextNote);

        const [, payload] = vi.mocked(firestore.setDoc).mock.calls[0];
        expect(payload).toHaveProperty('isEncrypted', true);
        const written = payload as { encryptedNote?: string };
        expect(written.encryptedNote).toBeDefined();
        expect(written.encryptedNote).not.toBe(plaintextNote);
        expect(written.encryptedNote).not.toContain(plaintextNote);
    });

    it('re-logging the same day upserts (merge: true) rather than creating a second doc', async () => {
        const { result } = renderHook(() => useMatDoseLog(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await result.current.logDose();
        await result.current.logDose('a follow-up note');

        expect(firestore.setDoc).toHaveBeenCalledTimes(2);
        const today = format(new Date(), 'yyyy-MM-dd');
        expect(firestore.doc).toHaveBeenNthCalledWith(1, expect.anything(), 'mat_doses', `user_1_${today}`);
        expect(firestore.doc).toHaveBeenNthCalledWith(2, expect.anything(), 'mat_doses', `user_1_${today}`);
    });

    it('todaysDose reflects a fetched doc whose date matches today', async () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        vi.mocked(firestore.getDocs).mockResolvedValue({
            docs: [
                { id: `user_1_${today}`, data: () => ({ uid: 'user_1', date: today, isEncrypted: false }) },
                { id: `user_1_${format(subDays(new Date(), 1), 'yyyy-MM-dd')}`, data: () => ({ uid: 'user_1', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), isEncrypted: false }) },
            ],
        } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

        const { result } = renderHook(() => useMatDoseLog(), { wrapper });

        await waitFor(() => expect(result.current.todaysDose).not.toBeNull());
        expect(result.current.todaysDose?.date).toBe(today);
    });

    it('getComplianceRate derives from the fetched window (forgiving day-count math)', async () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        vi.mocked(firestore.getDocs).mockResolvedValue({
            docs: [
                { id: `user_1_${today}`, data: () => ({ uid: 'user_1', date: today, isEncrypted: false }) },
                { id: `user_1_${yesterday}`, data: () => ({ uid: 'user_1', date: yesterday, isEncrypted: false }) },
            ],
        } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

        const { result } = renderHook(() => useMatDoseLog(), { wrapper });

        await waitFor(() => expect(result.current.doses).toHaveLength(2));
        expect(result.current.getComplianceRate(7)).toBe(Math.round((2 / 7) * 100));
    });
});
