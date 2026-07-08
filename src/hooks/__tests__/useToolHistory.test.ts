/**
 * src/hooks/__tests__/useToolHistory.test.ts
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useToolHistory } from '../useToolHistory';
import * as AuthContext from '../../contexts/AuthContext';
import * as EncryptionContext from '../../contexts/EncryptionContext';
import * as firestore from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../contexts/EncryptionContext', () => ({ useEncryption: vi.fn() }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        getDocs: vi.fn(),
    };
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;
type EncryptionContextValue = ReturnType<typeof EncryptionContext.useEncryption>;

const encEntry = (data: Record<string, unknown>) => `ENC:${JSON.stringify({ data })}`;

const mockDocs = (docs: Array<{ id: string; tags: string[]; content: string; isEncrypted?: boolean; createdAt?: Date }>) => ({
    docs: docs.map(d => ({
        id: d.id,
        data: () => ({
            tags: d.tags,
            content: d.content,
            isEncrypted: d.isEncrypted ?? true,
            createdAt: d.createdAt ? { toDate: () => d.createdAt } : undefined,
        }),
    })),
});

describe('📜 useToolHistory Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: { uid: 'test-uid' } } as unknown as AuthContextValue);
        vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
            isVaultUnlocked: true,
            decrypt: vi.fn(async (cipher: string) => cipher.replace(/^ENC:/, '')),
        } as unknown as EncryptionContextValue);
    });

    it('returns decrypted, parsed entries excluding DRAFT-tagged ones', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue(mockDocs([
            { id: 'doc-1', tags: ['SMART Tool', 'CBA'], content: encEntry({ behavior: 'Drinking' }), createdAt: new Date('2026-01-01') },
            { id: 'doc-2', tags: ['SMART Tool', 'CBA', 'DRAFT'], content: encEntry({ behavior: 'Isolating' }) },
        ]) as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useToolHistory('CBA'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data?.[0]).toMatchObject({ id: 'doc-1', data: { behavior: 'Drinking' } });
    });

    it('skips a non-encrypted or contentless doc gracefully', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue(mockDocs([
            { id: 'doc-1', tags: ['SMART Tool', 'CBA'], content: '', isEncrypted: false },
        ]) as unknown as firestore.QuerySnapshot);

        const { result } = renderHook(() => useToolHistory('CBA'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });

    it('is disabled when the vault is locked', async () => {
        vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
            isVaultUnlocked: false,
            decrypt: vi.fn(),
        } as unknown as EncryptionContextValue);

        renderHook(() => useToolHistory('CBA'), { wrapper });

        await waitFor(() => expect(firestore.getDocs).not.toHaveBeenCalled());
    });

    it('is disabled when toolType is undefined', async () => {
        renderHook(() => useToolHistory(undefined), { wrapper });

        await waitFor(() => expect(firestore.getDocs).not.toHaveBeenCalled());
    });
});
