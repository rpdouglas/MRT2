/**
 * src/hooks/__tests__/useGameProgress.test.ts
 * PROJ-72 (Recovery Games), Phase 1. Verifies the game_progress read/write
 * hook: stats/reflection are encrypted before write and decrypted on read,
 * plaintext fields (score/gameId/personaTarget) pass through untouched, and
 * a successful write invalidates the exact cache key readers subscribe to.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameProgress } from '../useGameProgress';
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
        collection: vi.fn(() => 'mock-collection'),
        query: vi.fn((...args: unknown[]) => args),
        where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
        orderBy: vi.fn((field: string, direction: string) => ({ field, direction })),
        getDocs: vi.fn(),
        addDoc: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
        Timestamp: {
            now: vi.fn(() => 'mock-timestamp')
        }
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;
type EncryptionContextValue = ReturnType<typeof EncryptionContext.useEncryption>;

const makeDocSnap = (id: string, data: Record<string, unknown>) => ({ id, data: () => data });

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

describe('🎮 useGameProgress Hook', () => {
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

        vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as unknown as firestore.QuerySnapshot);
        vi.spyOn(queryClient, 'invalidateQueries');
    });

    it('1. recordProgress encrypts stats and writes plaintext metadata unchanged', async () => {
        const { result } = renderHook(() => useGameProgress(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.recordProgress({
            gameId: 'craving-buster',
            personaTarget: 'David',
            score: 42,
            stats: { rounds: 3 },
        });

        expect(firestore.addDoc).toHaveBeenCalledWith(
            'mock-collection',
            expect.objectContaining({
                uid: 'test-user-123',
                gameId: 'craving-buster',
                personaTarget: 'David',
                score: 42,
                encryptedStats: 'ENCRYPTED_PAYLOAD',
                isEncrypted: true,
            })
        );

        const writtenDoc = vi.mocked(firestore.addDoc).mock.calls[0][1] as Record<string, unknown>;
        expect(writtenDoc.encryptedReflection).toBeUndefined();
    });

    it('2. recordProgress encrypts an optional reflection when provided', async () => {
        const { result } = renderHook(() => useGameProgress(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.recordProgress({
            gameId: 'thought-challenge',
            personaTarget: 'Lisa',
            score: 10,
            stats: {},
            reflection: 'I noticed I was catastrophizing.',
        });

        expect(firestore.addDoc).toHaveBeenCalledWith(
            'mock-collection',
            expect.objectContaining({ encryptedReflection: 'ENCRYPTED_PAYLOAD' })
        );
    });

    it('3. decrypts and JSON-parses encryptedStats for each history entry', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue({
            docs: [
                makeDocSnap('doc1', {
                    uid: 'test-user-123', gameId: 'craving-buster', personaTarget: 'David',
                    score: 5, encryptedStats: 'iv:cipher', createdAt: 'mock-timestamp', isEncrypted: true,
                }),
            ],
        } as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useGameProgress(), { wrapper });

        await waitFor(() => expect(result.current.history).toHaveLength(1));
        expect(result.current.history[0].stats).toEqual({ decrypted: true });
    });

    it('4. omits reflection when encryptedReflection is not present on the doc', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue({
            docs: [
                makeDocSnap('doc1', {
                    uid: 'test-user-123', gameId: 'craving-buster', personaTarget: 'David',
                    score: 5, encryptedStats: 'iv:cipher', createdAt: 'mock-timestamp', isEncrypted: true,
                }),
            ],
        } as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useGameProgress(), { wrapper });

        await waitFor(() => expect(result.current.history).toHaveLength(1));
        expect(result.current.history[0].reflection).toBeUndefined();
    });

    it('5. invalidates the exact cache key readers subscribe to after a write', async () => {
        const { result } = renderHook(() => useGameProgress(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.recordProgress({
            gameId: 'craving-buster', personaTarget: 'David', score: 1, stats: {},
        });

        await waitFor(() => {
            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
                queryKey: ['game_progress', 'test-user-123'],
            });
        });
    });

    it('6. mock-user accounts skip the Firestore write entirely', async () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'mock-uid', email: 'persona@demo.mock' },
        } as unknown as AuthContextValue);

        const { result } = renderHook(() => useGameProgress(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.recordProgress({
            gameId: 'craving-buster', personaTarget: 'David', score: 1, stats: {},
        });

        expect(firestore.addDoc).not.toHaveBeenCalled();
    });
});
