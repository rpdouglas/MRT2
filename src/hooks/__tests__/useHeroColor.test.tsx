import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useHeroColor } from '../useHeroColor';

vi.mock('../../lib/firebase', () => ({ db: {} }));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { uid: 'test-uid-123' } }),
}));

const mockSetDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

let queryClient: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useHeroColor', () => {
  it('writes the chosen color to users/{uid} with a merge write', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useHeroColor(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.updateHeroColor.mutateAsync('emerald');
    });

    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), { heroColor: 'emerald' }, { merge: true });
  });

  it('optimistically writes the new color into the profile cache before the mutation resolves', async () => {
    queryClient.setQueryData(['profile', 'test-uid-123'], { uid: 'test-uid-123', heroColor: 'amber' });
    let resolveSetDoc: () => void = () => {};
    mockSetDoc.mockReturnValueOnce(new Promise<void>((resolve) => { resolveSetDoc = resolve; }));

    const { result } = renderHook(() => useHeroColor(), { wrapper: Wrapper });

    act(() => { result.current.updateHeroColor.mutate('violet'); });

    await waitFor(() => {
      expect(queryClient.getQueryData(['profile', 'test-uid-123'])).toMatchObject({ heroColor: 'violet' });
    });

    resolveSetDoc();
    await waitFor(() => expect(result.current.updateHeroColor.isSuccess).toBe(true));
  });

  it('rolls back the optimistic cache write if the Firestore write fails', async () => {
    queryClient.setQueryData(['profile', 'test-uid-123'], { uid: 'test-uid-123', heroColor: 'amber' });
    mockSetDoc.mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => useHeroColor(), { wrapper: Wrapper });

    act(() => { result.current.updateHeroColor.mutate('rose'); });

    await waitFor(() => expect(result.current.updateHeroColor.isError).toBe(true));

    expect(queryClient.getQueryData(['profile', 'test-uid-123'])).toMatchObject({ heroColor: 'amber' });
  });
});
