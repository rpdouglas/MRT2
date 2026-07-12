/**
 * src/components/journal/__tests__/JournalInsights.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's raw getDocs
 * call onto useFirestoreQuery, sharing the ['journals', uid] cache entry
 * with Dashboard.tsx/useAnchorStatus.ts (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import JournalInsights from '../JournalInsights';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(() => ({})),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
  };
});

function makeDoc(moodScore: number, daysAgo: number, content = 'a fine day of recovery') {
  const createdAt = Timestamp.fromDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));
  return { data: () => ({ moodScore, createdAt, content }) };
}

function renderInsights() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <JournalInsights />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('JournalInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('fetches journals for the current uid and renders the entry count', async () => {
    mockGetDocs.mockResolvedValue({ docs: [makeDoc(8, 1), makeDoc(6, 2), makeDoc(7, 3)] });

    renderInsights();

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    expect(mockGetDocs).toHaveBeenCalled();
  });

  it('shows a zero state with no journal entries', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderInsights();

    await waitFor(() => expect(screen.getByText('Entries')).toBeInTheDocument());
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
