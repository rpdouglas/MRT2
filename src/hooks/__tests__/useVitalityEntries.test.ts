/**
 * src/hooks/__tests__/useVitalityEntries.test.ts
 * PROJ-60: Regression guard for the ZK boundary fix folded into the Vitality
 * split — prior to this hook, Vitality.tsx wrote journal content via a raw
 * addDoc() that never called encrypt() and never set isEncrypted, so
 * recovery-relevant notes (movement/nutrition/breathwork reflections) landed
 * in Firestore as plaintext. These tests assert every save now goes through
 * encrypt() and is written with isEncrypted:true.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useVitalityEntries } from '../useVitalityEntries';
import * as AuthContext from '../../contexts/AuthContext';
import * as crypto from '../../lib/crypto';
import { useJournalOperations } from '../useJournalOperations';
import { useTodaysVitalityLogs } from '../useTodaysVitalityLogs';

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../lib/crypto', () => ({
    encrypt: vi.fn(),
}));

vi.mock('../useJournalOperations', () => ({
    useJournalOperations: vi.fn(),
}));

vi.mock('../useTodaysVitalityLogs', () => ({
    useTodaysVitalityLogs: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

describe('🌬️ useVitalityEntries — ZK boundary regression guard', () => {
    const addJournal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();

        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'test-user-123' },
        } as unknown as AuthContextValue);

        vi.mocked(useJournalOperations).mockReturnValue({
            addJournal,
            updateJournal: vi.fn(),
            deleteJournal: vi.fn(),
            isSaving: false,
            isDeleting: false,
        });

        vi.mocked(useTodaysVitalityLogs).mockReturnValue([]);
        vi.mocked(crypto.encrypt).mockResolvedValue('mock-iv:mock-ciphertext');
        addJournal.mockResolvedValue({ id: 'new-doc-id' });
    });

    it('encrypts content and writes isEncrypted:true — never raw plaintext', async () => {
        const { result } = renderHook(() => useVitalityEntries(), { wrapper });

        await result.current.saveVitalityEntry('Movement', 'Movement Log 🏃', '*Activity:* Walk', 'Felt good', ['Walk']);

        expect(crypto.encrypt).toHaveBeenCalledWith(expect.stringContaining('Movement Log'));

        await waitFor(() => {
            expect(addJournal).toHaveBeenCalledWith(expect.objectContaining({
                content: 'mock-iv:mock-ciphertext',
                isEncrypted: true,
                tags: expect.arrayContaining(['Vitality', 'Movement', 'Walk']),
                sentiment: 'Pending',
                weather: null,
            }));
        });

        // The plaintext body must never reach addJournal directly.
        const writtenContent = addJournal.mock.calls[0][0].content;
        expect(writtenContent).not.toContain('Movement Log');
        expect(writtenContent).not.toContain('Felt good');
    });

    it('does not call addJournal if encryption fails (vault locked)', async () => {
        vi.mocked(crypto.encrypt).mockRejectedValueOnce(new Error('Vault is locked. Key not found.'));
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        const { result } = renderHook(() => useVitalityEntries(), { wrapper });
        await result.current.saveVitalityEntry('Mindfulness', 'Breathwork Session 🌬️', 'details', 'note', ['Breathing']);

        expect(addJournal).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Failed to save entry.');
    });

    it('preserves the literal "Vitality" tag relied on by gamification.ts', async () => {
        const { result } = renderHook(() => useVitalityEntries(), { wrapper });
        await result.current.saveVitalityEntry('Nutrition', 'Fuel Log 🍎', 'details', '', ['Lunch']);

        await waitFor(() => {
            const tags = addJournal.mock.calls[0][0].tags as string[];
            expect(tags).toContain('Vitality');
        });
    });
});
