/**
 * src/hooks/__tests__/useWorkbookAnswers.test.ts
 * QA: Verifies the TanStack Query migration for workbook_answers — the read query
 * scopes correctly by workbookId, decryption is gated strictly on the `isEncrypted`
 * flag (not a string heuristic), saves encrypt before writing with the correct doc id,
 * and successful saves invalidate the right cache key.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkbookAnswers } from '../useWorkbookAnswers';
import * as AuthContext from '../../contexts/AuthContext';
import * as EncryptionContext from '../../contexts/EncryptionContext';
import * as firestore from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

// --- MOCKS ---

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
        getDocs: vi.fn(),
        doc: vi.fn((_db, ...pathSegments: string[]) => pathSegments.join('/')),
        setDoc: vi.fn().mockResolvedValue(undefined),
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

describe('📓 useWorkbookAnswers Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();

        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'test-user-123' },
        } as unknown as AuthContextValue);

        vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
            encrypt: vi.fn().mockResolvedValue('ENCRYPTED_PAYLOAD'),
            decrypt: vi.fn().mockResolvedValue('DECRYPTED_TEXT'),
        } as unknown as EncryptionContextValue);

        vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as unknown as firestore.QuerySnapshot);
        vi.spyOn(queryClient, 'invalidateQueries');
    });

    it('1. scopes the query with a workbookId where-clause when a workbookId is provided', async () => {
        const { result } = renderHook(() => useWorkbookAnswers('12_steps'), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(firestore.where).toHaveBeenCalledWith('workbookId', '==', '12_steps');
    });

    it('2. omits the where-clause entirely when no workbookId is provided (global scope)', async () => {
        const { result } = renderHook(() => useWorkbookAnswers(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(firestore.where).not.toHaveBeenCalled();
    });

    it('3. decrypts only entries flagged isEncrypted, trusting the flag over any string heuristic', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue({
            docs: [
                makeDocSnap('wb1_q1', {
                    uid: 'test-user-123', workbookId: 'wb1', sectionId: 's1', questionId: 'q1',
                    answer: 'iv:ciphertext', isEncrypted: true, updatedAt: 'mock-timestamp',
                }),
                makeDocSnap('wb1_q2', {
                    uid: 'test-user-123', workbookId: 'wb1', sectionId: 's1', questionId: 'q2',
                    // Contains a literal colon but is NOT encrypted — the old `.includes(':')`
                    // heuristic would have misfired on this and tried to decrypt it.
                    answer: 'Meeting time: 7pm', isEncrypted: false, updatedAt: 'mock-timestamp',
                }),
            ],
        } as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useWorkbookAnswers('wb1'), { wrapper });

        await waitFor(() => expect(result.current.answers).toHaveLength(2));

        const q1 = result.current.answers.find(a => a.questionId === 'q1');
        const q2 = result.current.answers.find(a => a.questionId === 'q2');
        expect(q1?.answer).toBe('DECRYPTED_TEXT');
        expect(q2?.answer).toBe('Meeting time: 7pm');
    });

    it('4. saveAnswer encrypts the plaintext and writes to the correct doc id with merge:true', async () => {
        const { result } = renderHook(() => useWorkbookAnswers('wb1'), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.saveAnswer({ sectionId: 'sec1', questionId: 'q1', plaintext: 'my reflection' });

        expect(firestore.setDoc).toHaveBeenCalledWith(
            'users/test-user-123/workbook_answers/wb1_q1',
            expect.objectContaining({
                uid: 'test-user-123',
                workbookId: 'wb1',
                sectionId: 'sec1',
                questionId: 'q1',
                answer: 'ENCRYPTED_PAYLOAD',
                isEncrypted: true,
            }),
            { merge: true }
        );
    });

    it('5. invalidates the scoped query key after a successful save', async () => {
        const { result } = renderHook(() => useWorkbookAnswers('wb1'), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.saveAnswer({ sectionId: 'sec1', questionId: 'q1', plaintext: 'my reflection' });

        await waitFor(() => {
            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
                queryKey: ['workbook_answers', 'test-user-123', 'wb1'],
            });
        });
    });

    it('6. rejects saveAnswer when no workbookId was provided to the hook', async () => {
        const { result } = renderHook(() => useWorkbookAnswers(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            result.current.saveAnswer({ sectionId: 'sec1', questionId: 'q1', plaintext: 'x' })
        ).rejects.toThrow('workbookId is required');

        expect(firestore.setDoc).not.toHaveBeenCalled();
    });
});
