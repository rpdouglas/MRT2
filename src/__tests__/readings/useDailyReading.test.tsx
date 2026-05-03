import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDailyReading, useAllDailyReadings } from '../../hooks/useDailyReading';
import type { DailyReading } from '../../lib/db';
import type { Timestamp } from 'firebase/firestore';

vi.mock('../../lib/firebase', () => ({ db: {} }));

const mockGetDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

const mockReading: DailyReading = {
  id: 'twelve-step-aa_2026-05-03',
  modality: 'twelve-step-aa',
  date: '2026-05-03',
  theme: 'Surrender',
  title: 'One Day at a Time',
  body: 'In recovery, we learn to let go.',
  reflection: 'What does surrender mean to you today?',
  affirmation: 'I am enough.',
  bufferBatch: 1,
  generatedAt: {} as Timestamp,
};

function localDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

let queryClient: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useDailyReading', () => {
  it('returns the reading when the Firestore doc exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: mockReading.id,
      data: () => mockReading,
    });

    const { result } = renderHook(() => useDailyReading('twelve-step-aa'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.modality).toBe('twelve-step-aa');
    expect(result.current.data?.theme).toBe('Surrender');
  });

  it('returns null when the Firestore doc does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const { result } = renderHook(() => useDailyReading('twelve-step-aa'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('is idle and does not fetch when modality is null', () => {
    const { result } = renderHook(() => useDailyReading(null), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('serves cached reading without calling Firestore when cache is fresh', () => {
    const today = localDateString();
    queryClient.setQueryData(['daily-reading', 'twelve-step-aa', today], mockReading);

    const { result } = renderHook(() => useDailyReading('twelve-step-aa'), { wrapper: Wrapper });

    expect(result.current.data).toEqual(mockReading);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});

describe('useAllDailyReadings', () => {
  it('returns one result per modality', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const { result } = renderHook(
      () => useAllDailyReadings(['twelve-step-aa', 'smart-recovery']),
      { wrapper: Wrapper },
    );

    await waitFor(() => result.current.every(r => r.isSuccess));
    expect(result.current).toHaveLength(2);
  });

  it('returns empty array for empty modalities list', () => {
    const { result } = renderHook(() => useAllDailyReadings([]), { wrapper: Wrapper });
    expect(result.current).toHaveLength(0);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});
