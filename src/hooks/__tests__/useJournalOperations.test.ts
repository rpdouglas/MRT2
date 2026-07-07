/**
 * src/hooks/__tests__/useJournalOperations.test.ts
 * GITHUB COMMENT:
 * [useJournalOperations.test.ts]
 * QA: Implemented strict unit tests for Journal CRUD operations.
 * Verifies that Firebase mutations trigger React Query cache invalidation.
 * FIX: Replaced explicit 'any' types with 'unknown' or proper interfaces to satisfy linting rules.
 * FIX: Separated type imports to satisfy 'verbatimModuleSyntax'.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJournalOperations } from '../useJournalOperations';
import * as AuthContext from '../../contexts/AuthContext';
import * as firestore from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

// --- MOCKS ---

// Mock Firebase Config
vi.mock('../../lib/firebase', () => ({
    db: { type: 'mock-db' }
}));

// Mock Auth Context
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock Firestore SDK
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        doc: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        Timestamp: {
            now: vi.fn(() => 'mock-timestamp')
        }
    };
});

// --- SETUP ---

// Create a real QueryClient for the wrapper, but we will spy on it
const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

// FIX: Use createElement instead of JSX to avoid parsing errors in .ts file
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

// Helper type to mock Auth Context return
type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

describe('📓 useJournalOperations Hook', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        
        // Default Auth State: User is logged in
        // FIX: Cast via unknown to avoid 'any'
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'test-user-123' },
            loading: false,
            isAdmin: false,
            driveAccessToken: null,
            loginWithGoogle: vi.fn(),
            signupWithEmail: vi.fn(),
            loginWithEmail: vi.fn(),
            logout: vi.fn()
        } as unknown as AuthContextValue);

        // Spy on the invalidation method
        vi.spyOn(queryClient, 'invalidateQueries');
    });

    it('1. should add a journal entry and invalidate cache', async () => {
        const { result } = renderHook(() => useJournalOperations(), { wrapper });

        const payload = {
            content: 'Encrypted Content',
            moodScore: 8,
            sentiment: 'Positive',
            weather: { temp: 20, condition: 'Sunny' },
            tags: ['Recovery'],
            isEncrypted: true
        };

        // FIX: Cast via unknown to avoid 'any'
        vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'new-doc-id' } as unknown as firestore.DocumentReference);

        const ref = await result.current.addJournal(payload);
        expect(ref).toEqual({ id: 'new-doc-id' });

        // Verify Firebase Call
        expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'journals');
        expect(firestore.addDoc).toHaveBeenCalledWith(
            undefined, // Collection ref (mocked return of collection())
            expect.objectContaining({ uid: 'test-user-123', content: payload.content, moodScore: 8, isEncrypted: true })
        );

        // Verify Cache Invalidation (Critical for Ticket 3.1 Fix)
        await waitFor(() => {
            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journals'] });
        });
    });

    it('2. should update a journal entry and invalidate cache', async () => {
        const { result } = renderHook(() => useJournalOperations(), { wrapper });

        const updatePayload = {
            id: 'journal-123',
            content: 'Updated Content',
            moodScore: 5,
            tags: ['Update'],
            isEncrypted: true
        };

        // FIX: Cast via unknown to avoid 'any'
        vi.mocked(firestore.doc).mockReturnValue('mock-doc-ref' as unknown as firestore.DocumentReference);
        vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

        await result.current.updateJournal(updatePayload);

        // Verify Firebase Call
        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'journals', 'journal-123');
        expect(firestore.updateDoc).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({ content: 'Updated Content', moodScore: 5 })
        );

        // Verify Cache Invalidation
        await waitFor(() => {
            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journals'] });
        });
    });

    it('3. should delete a journal entry and invalidate cache', async () => {
        const { result } = renderHook(() => useJournalOperations(), { wrapper });

        // FIX: Cast via unknown to avoid 'any'
        vi.mocked(firestore.doc).mockReturnValue('mock-doc-ref' as unknown as firestore.DocumentReference);
        vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined);

        await result.current.deleteJournal('journal-123');

        expect(firestore.deleteDoc).toHaveBeenCalledWith('mock-doc-ref');

        await waitFor(() => {
            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journals'] });
        });
    });

    it('4. should throw error if user is not authenticated', async () => {
        // Override Auth State to null
        // FIX: Cast via unknown to avoid 'any'
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: null, // No user
            loading: false
        } as unknown as AuthContextValue);

        const { result } = renderHook(() => useJournalOperations(), { wrapper });

        await expect(result.current.addJournal({
            content: 'fail',
            moodScore: 1,
            sentiment: 'none',
            weather: null,
            tags: [],
            isEncrypted: false
        })).rejects.toThrow("Not authenticated");

        expect(firestore.addDoc).not.toHaveBeenCalled();
    });
});
