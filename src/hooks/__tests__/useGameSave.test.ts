/**
 * src/hooks/__tests__/useGameSave.test.ts
 * PROJ-72 (Recovery Games), Phase 4. Verifies the game_saves read/write
 * hook: the whole state blob is encrypted before write and decrypted on
 * read, the doc ID is a deterministic `${uid}_${gameId}` upsert target, and
 * a mock-user account skips the Firestore write entirely (mirrors
 * useGameProgress.test.ts's coverage shape).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameSave } from '../useGameSave';
import * as AuthContext from '../../contexts/AuthContext';
import * as EncryptionContext from '../../contexts/EncryptionContext';
import * as firestore from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

vi.mock('../../lib/firebase', () => ({
    db: { type: 'mock-db' }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../contexts/EncryptionContext', () => ({
    useEncryption: vi.fn()
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: vi.fn((_db: unknown, _collection: string, id: string) => ({ __id: id })),
        getDoc: vi.fn(),
        setDoc: vi.fn().mockResolvedValue(undefined),
        deleteDoc: vi.fn().mockResolvedValue(undefined),
        Timestamp: {
            now: vi.fn(() => 'mock-timestamp')
        }
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;
type EncryptionContextValue = ReturnType<typeof EncryptionContext.useEncryption>;

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

describe('🎮 useGameSave Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();

        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'test-user-123', email: 'user@example.com' },
        } as unknown as AuthContextValue);

        vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
            encrypt: vi.fn().mockResolvedValue('ENCRYPTED_PAYLOAD'),
            decrypt: vi.fn().mockResolvedValue('{"decrypted":true}'),
        } as unknown as EncryptionContextValue);

        vi.mocked(firestore.getDoc).mockResolvedValue({ exists: () => false } as unknown as firestore.DocumentSnapshot);
    });

    it('saveGame encrypts the whole state blob and upserts under a deterministic doc ID', async () => {
        const { result } = renderHook(() => useGameSave('fast-lane'), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.saveGame({ gameId: 'fast-lane', state: { week: 3 } });

        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'game_saves', 'test-user-123_fast-lane');
        expect(firestore.setDoc).toHaveBeenCalledWith(
            { __id: 'test-user-123_fast-lane' },
            expect.objectContaining({
                uid: 'test-user-123',
                gameId: 'fast-lane',
                encryptedState: 'ENCRYPTED_PAYLOAD',
                isEncrypted: true,
            })
        );
    });

    it('decrypts and JSON-parses the save when one exists', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({ encryptedState: 'iv:cipher' }),
        } as unknown as firestore.DocumentSnapshot);

        const { result } = renderHook(() => useGameSave('fast-lane'), { wrapper });

        await waitFor(() => expect(result.current.save).toEqual({ decrypted: true }));
    });

    it('returns null when no save exists', async () => {
        const { result } = renderHook(() => useGameSave('fast-lane'), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.save).toBeNull();
    });

    it('clearSave deletes the save document', async () => {
        const { result } = renderHook(() => useGameSave('fast-lane'), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.clearSave();

        expect(firestore.deleteDoc).toHaveBeenCalledWith({ __id: 'test-user-123_fast-lane' });
    });

    it('mock-user accounts skip the Firestore write entirely', async () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'mock-uid', email: 'persona@demo.mock' },
        } as unknown as AuthContextValue);

        const { result } = renderHook(() => useGameSave('fast-lane'), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.saveGame({ gameId: 'fast-lane', state: {} });

        expect(firestore.setDoc).not.toHaveBeenCalled();
    });
});
