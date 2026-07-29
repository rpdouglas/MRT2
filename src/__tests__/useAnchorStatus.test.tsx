import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAnchorStatus } from '../hooks/useAnchorStatus';

vi.mock('../lib/firebase', () => ({ db: {} }));

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({ useAuth: (...args: unknown[]) => mockUseAuth(...args) }));

vi.mock('../hooks/useTimeOfDay', () => ({ useTimeOfDay: () => 'morning' }));

const mockGetProfile = vi.fn();
vi.mock('../lib/db', () => ({ getProfile: (...args: unknown[]) => mockGetProfile(...args) }));

const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  Timestamp: { fromDate: vi.fn((d: Date) => d) },
}));

function todaySnapDocs(tags: string[]) {
  return {
    docs: [
      {
        data: () => ({
          uid: 'test-uid',
          content: 'entry',
          moodScore: 3,
          tags,
          createdAt: { toDate: () => new Date() },
        }),
      },
    ],
  };
}

let queryClient: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' } });
});

describe('useAnchorStatus', () => {
  it('returns both badges false while unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    expect(result.current).toEqual({ needsCheckIn: false, needsReading: false });
  });

  it('does not expose a needsIntent field (Intent card was removed)', async () => {
    mockGetProfile.mockResolvedValue({ anchorSettings: { notifyCheckIn: true, notifyReading: true } });
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());

    expect(result.current).not.toHaveProperty('needsIntent');
  });

  it('needsCheckIn is true when no Anchor journal entry exists today', async () => {
    mockGetProfile.mockResolvedValue({ anchorSettings: { notifyCheckIn: true, notifyReading: true } });
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.needsCheckIn).toBe(true));
  });

  it('needsCheckIn is false when an Anchor entry tagged with the current time-of-day exists today', async () => {
    mockGetProfile.mockResolvedValue({ anchorSettings: { notifyCheckIn: true, notifyReading: true } });
    mockGetDocs.mockResolvedValue(todaySnapDocs(['Anchor', 'morning']));

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.needsCheckIn).toBe(false));
  });

  it('respects notifyCheckIn=false by suppressing the badge regardless of completion', async () => {
    mockGetProfile.mockResolvedValue({ anchorSettings: { notifyCheckIn: false, notifyReading: true } });
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.needsCheckIn).toBe(false));
  });

  it('needsReading is false when lastReadingDate is today', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    mockGetProfile.mockResolvedValue({
      anchorSettings: { notifyCheckIn: true, notifyReading: true, lastReadingDate: todayStr },
    });
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.needsReading).toBe(false));
  });

  it('needsReading is true when lastReadingDate is missing', async () => {
    mockGetProfile.mockResolvedValue({ anchorSettings: { notifyCheckIn: true, notifyReading: true } });
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.needsReading).toBe(true));
  });

  it('defaults notify settings to true when anchorSettings is entirely unset', async () => {
    mockGetProfile.mockResolvedValue({});
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useAnchorStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.needsCheckIn).toBe(true));
    expect(result.current.needsReading).toBe(true);
  });
});
