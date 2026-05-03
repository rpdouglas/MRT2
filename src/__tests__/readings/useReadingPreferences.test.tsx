import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useReadingPreferences, ALL_MODALITIES } from '../../hooks/useReadingPreferences';

vi.mock('../../lib/firebase', () => ({ db: {} }));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { uid: 'test-uid-123' } }),
}));

const mockGetDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  arrayUnion: vi.fn((id: string) => [id]),
}));

const mockGetDayOfYear = vi.fn();
vi.mock('date-fns', () => ({
  getDayOfYear: (...args: unknown[]) => mockGetDayOfYear(...args),
}));

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
  mockGetDayOfYear.mockReturnValue(0);
});

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useReadingPreferences — activeModality rotation', () => {
  it('selects the correct modality by day-of-year index', async () => {
    // Day 0 % 7 = 0 → 'twelve-step-aa'
    mockGetDayOfYear.mockReturnValue(0);
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'test-uid-123',
        selectedModalities: ALL_MODALITIES,
        lastReadDate: '',
        readingHistory: [],
      }),
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.activeModality).toBe('twelve-step-aa');
  });

  it('rotates to a different modality on a different day', async () => {
    // Day 3 % 7 = 3 → 'recovery-dharma'
    mockGetDayOfYear.mockReturnValue(3);
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'test-uid-123',
        selectedModalities: ALL_MODALITIES,
        lastReadDate: '',
        readingHistory: [],
      }),
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.activeModality).toBe('recovery-dharma');
  });

  it('wraps around when day-of-year exceeds modality count', async () => {
    // Day 7 % 7 = 0 → 'twelve-step-aa' (full rotation)
    mockGetDayOfYear.mockReturnValue(7);
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'test-uid-123',
        selectedModalities: ALL_MODALITIES,
        lastReadDate: '',
        readingHistory: [],
      }),
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.activeModality).toBe('twelve-step-aa');
  });

  it('returns null activeModality when selectedModalities is empty', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'test-uid-123',
        selectedModalities: [],
        lastReadDate: '',
        readingHistory: [],
      }),
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.activeModality).toBeNull();
  });
});

describe('useReadingPreferences — hasReadToday', () => {
  it('is true when lastReadDate is today', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'test-uid-123',
        selectedModalities: ALL_MODALITIES,
        lastReadDate: localDateString(),
        readingHistory: [],
      }),
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.hasReadToday).toBe(true);
  });

  it('is false when lastReadDate is a past date', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'test-uid-123',
        selectedModalities: ALL_MODALITIES,
        lastReadDate: '2020-01-01',
        readingHistory: [],
      }),
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.hasReadToday).toBe(false);
  });
});

describe('useReadingPreferences — defaults', () => {
  it('defaults to ALL_MODALITIES when no Firestore doc exists', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());

    expect(result.current.preferences?.selectedModalities).toEqual(ALL_MODALITIES);
  });
});
