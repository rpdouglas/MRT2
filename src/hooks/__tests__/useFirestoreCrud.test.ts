/**
 * src/hooks/__tests__/useFirestoreCrud.test.ts
 * PROJ-59: unit tests for the shared query/mutation primitives extracted
 * from useTaskOperations/useJournalOperations/useWorkbookAnswers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFirestoreQuery, useFirestoreMutation, useFirestoreCrud } from '../useFirestoreCrud';
import * as AuthContext from '../../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

describe('useFirestoreCrud primitives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { uid: 'test-user-123' },
      loading: false,
    } as unknown as AuthContextValue);
  });

  describe('useFirestoreQuery', () => {
    it('calls the fetcher with the current uid and is enabled once a user is present', async () => {
      const fetcher = vi.fn().mockResolvedValue(['a', 'b']);
      const { result } = renderHook(() => useFirestoreQuery(['things', 'test-user-123'], fetcher), { wrapper });

      await waitFor(() => expect(result.current.data).toEqual(['a', 'b']));
      expect(fetcher).toHaveBeenCalledWith('test-user-123');
    });

    it('stays disabled when there is no user', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({ user: null, loading: false } as unknown as AuthContextValue);
      const fetcher = vi.fn().mockResolvedValue([]);

      renderHook(() => useFirestoreQuery(['things', undefined], fetcher), { wrapper });

      await new Promise((r) => setTimeout(r, 10));
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('useFirestoreMutation', () => {
    it('rejects when there is no authenticated user', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({ user: null, loading: false } as unknown as AuthContextValue);
      const mutationFn = vi.fn();

      const { result } = renderHook(() => useFirestoreMutation(['things', undefined], { mutationFn }), { wrapper });

      await expect(result.current.mutateAsync({})).rejects.toThrow('Not authenticated');
      expect(mutationFn).not.toHaveBeenCalled();
    });

    it('invalidates the matching queryKey on settle', async () => {
      const queryKey = ['things', 'test-user-123'];
      queryClient.setQueryData(queryKey, ['existing']);
      const mutationFn = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirestoreMutation(queryKey, { mutationFn }), { wrapper });

      await result.current.mutateAsync({ label: 'new' });

      expect(mutationFn).toHaveBeenCalledWith('test-user-123', { label: 'new' });
      await waitFor(() => {
        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
      });
    });

    it('applies an optimistic update and rolls back on error', async () => {
      const queryKey = ['things', 'test-user-123'];
      queryClient.setQueryData(queryKey, ['existing']);
      const mutationFn = vi.fn().mockRejectedValue(new Error('boom'));

      const { result } = renderHook(
        () =>
          useFirestoreMutation<{ label: string }>(queryKey, {
            mutationFn,
            optimisticUpdate: (previous, args) => [...(previous as string[]), args.label],
          }),
        { wrapper },
      );

      await expect(result.current.mutateAsync({ label: 'new' })).rejects.toThrow('boom');

      // Optimistic value applied, then rolled back after the rejection.
      await waitFor(() => {
        expect(queryClient.getQueryData(queryKey)).toEqual(['existing']);
      });
    });
  });

  describe('useFirestoreCrud', () => {
    it('exposes data/isLoading from the read and an invalidate helper', async () => {
      const fetcher = vi.fn().mockResolvedValue(['a']);
      const { result } = renderHook(() => useFirestoreCrud(['things', 'test-user-123'], fetcher), { wrapper });

      await waitFor(() => expect(result.current.data).toEqual(['a']));
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.invalidate).toBe('function');
    });
  });
});
