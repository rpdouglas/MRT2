/**
 * src/hooks/__tests__/useSmartToolCompletions.test.ts
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSmartToolCompletions } from '../useSmartToolCompletions';
import * as AuthContext from '../../contexts/AuthContext';
import * as firestore from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        getDocs: vi.fn(),
    };
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

const mockDocs = (tagSets: string[][]) => ({
    docs: tagSets.map((tags, i) => ({ id: `doc-${i}`, data: () => ({ tags }) })),
});

describe('🧮 useSmartToolCompletions Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: { uid: 'test-uid' } } as unknown as AuthContextValue);
    });

    it('counts non-DRAFT entries per tool type and ignores DRAFT ones', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue(mockDocs([
            ['SMART Tool', 'CBA'],
            ['SMART Tool', 'CBA'],
            ['SMART Tool', 'CBA', 'DRAFT'],
            ['SMART Tool', 'ABC'],
        ]) as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useSmartToolCompletions(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.counts.CBA).toBe(2);
        expect(result.current.data?.counts.ABC).toBe(1);
    });

    it('flags hasDraftDoc for a tool type with a DRAFT-tagged entry, without counting it', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue(mockDocs([
            ['SMART Tool', 'DENTS', 'DRAFT'],
        ]) as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useSmartToolCompletions(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.hasDraftDoc.DENTS).toBe(true);
        expect(result.current.data?.counts.DENTS).toBeUndefined();
    });

    it('returns empty maps when there are no SMART Tool entries', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue(mockDocs([]) as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useSmartToolCompletions(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.counts).toEqual({});
        expect(result.current.data?.hasDraftDoc).toEqual({});
    });

    it('does not query Firestore when there is no authenticated user', async () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: null } as unknown as AuthContextValue);

        renderHook(() => useSmartToolCompletions(), { wrapper });

        await waitFor(() => expect(firestore.getDocs).not.toHaveBeenCalled());
    });
});
