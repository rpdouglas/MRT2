/**
 * src/components/admin/__tests__/ErrorLogViewer.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's delete handler
 * off a raw deleteDoc + manual invalidateQueries onto useFirestoreMutation
 * (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import ErrorLogViewer from '../ErrorLogViewer';

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'admin-uid' } }),
}));

const mockGetDocs = vi.fn();
const mockDeleteDoc = vi.fn();
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(() => ({})),
    query: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    limit: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  };
});

vi.mock('../../../lib/gemini', () => ({ analyzeSystemHealth: vi.fn() }));

// react-virtuoso needs real layout measurement it doesn't get in jsdom and
// renders no rows without it — replace with a plain mapped list for tests.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: { data: unknown[]; itemContent: (index: number, item: unknown) => ReactNode }) => (
    <>{data.map((item, index) => <div key={index}>{itemContent(index, item)}</div>)}</>
  ),
}));

function renderViewer() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ErrorLogViewer />
    </QueryClientProvider>,
  );
}

describe('ErrorLogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('shows the healthy empty state when there are no errors', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderViewer();

    expect(await screen.findByText('System Healthy')).toBeInTheDocument();
  });

  it('deletes a log via deleteDoc (through useFirestoreMutation) after confirm', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: 'err-1',
        data: () => ({
          message: 'TypeError: boom',
          stack: 'TypeError: boom\nat foo.js:1',
          url: 'https://app.example.com/journal',
          userAgent: 'TestAgent/1.0',
          timestamp: { toDate: () => new Date() },
        }),
      }],
    });
    mockDeleteDoc.mockResolvedValue(undefined);

    renderViewer();

    expect(await screen.findAllByText('TypeError: boom')).toHaveLength(2);

    // No accessible name on the per-row delete button (icon-only) — it's the
    // second button on the page after "Analyze Health".
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalled());
  });
});
