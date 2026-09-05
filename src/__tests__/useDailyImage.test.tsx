// PROJ-113 (Daily Inspirational Image). Cloned test structure from
// readings/useDailyReading.test.tsx, which useDailyImage.ts itself was
// cloned from — same fetch/cache/mock-mode shape, different collection.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDailyImage } from '../hooks/useDailyImage';
import type { DailyImageRecord } from '../lib/db';

vi.mock('../lib/firebase', () => ({ db: {} }));

const mockGetDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({ useAuth: (...args: unknown[]) => mockUseAuth(...args) }));

const mockImage: DailyImageRecord = {
  date: '2026-09-05',
  imageId: 'img1',
  storagePath: 'daily-images/img1.jpg',
  downloadUrl: 'https://example.com/img1.jpg',
  caption: 'One day at a time.',
  assignedAt: {} as DailyImageRecord['assignedAt'],
};

let queryClient: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { uid: 'alice-uid', email: 'alice@example.com' } });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useDailyImage', () => {
  it('returns today\'s image when the Firestore doc exists', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockImage });

    const { result } = renderHook(() => useDailyImage(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.dailyImage).not.toBeNull());
    expect(result.current.dailyImage?.imageId).toBe('img1');
    expect(result.current.isError).toBe(false);
  });

  it('returns null without erroring when no daily_images doc exists yet (empty pool, Phase 4 edge case)', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const { result } = renderHook(() => useDailyImage(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dailyImage).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('surfaces isError but still returns null (never throws) when the fetch fails, e.g. offline', async () => {
    // useDailyImage's underlying useQuery retries once on failure, so both
    // attempts must reject for isError to ever settle true.
    mockGetDoc.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useDailyImage(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
    expect(result.current.dailyImage).toBeNull();
  });

  it('serves cached image without calling Firestore when cache is fresh (Subway Test)', () => {
    const today = new Date().toISOString().slice(0, 10);
    queryClient.setQueryData(['daily_images', today], mockImage);

    const { result } = renderHook(() => useDailyImage(), { wrapper: Wrapper });

    expect(result.current.dailyImage).toEqual(mockImage);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('returns a canned mock image for a .mock user and never calls Firestore (PROJ-63)', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'mock-uid', email: 'demo@mrt.mock' } });

    const { result } = renderHook(() => useDailyImage(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.dailyImage?.imageId).toBe('mock-image');
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});
