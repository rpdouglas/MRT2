/**
 * src/components/journal/__tests__/JournalAnalysisWizard.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's raw
 * addDoc(collection(db,'insights')) calls onto useFirestoreMutation +
 * lib/insights.ts's existing saveInsight (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JournalAnalysisWizard from '../JournalAnalysisWizard';
import type { JournalEntry } from '../JournalEditor';
import { Timestamp } from 'firebase/firestore';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' }, userTier: 'free' }),
}));

vi.mock('../../../hooks/useTaskOperations', () => ({
  useTaskOperations: () => ({ addTask: vi.fn() }),
}));

vi.mock('../../../hooks/useRateLimits', () => ({
  useRateLimits: () => ({
    checkEligibility: () => ({ allowed: true }),
    stampUsage: vi.fn().mockResolvedValue(undefined),
    loadingLimits: false,
  }),
}));

vi.mock('../../../hooks/useDeepPatternAnalysis', () => ({
  useDeepPatternAnalysis: () => ({
    analyze: vi.fn().mockResolvedValue(undefined),
    progress: 0,
    result: null,
    error: null,
  }),
}));

const mockGenerateComparativeAnalysis = vi.fn();
vi.mock('../../../lib/gemini', () => ({
  generateComparativeAnalysis: (...args: unknown[]) => mockGenerateComparativeAnalysis(...args),
}));

const mockSaveInsight = vi.fn();
vi.mock('../../../lib/insights', () => ({
  saveInsight: (...args: unknown[]) => mockSaveInsight(...args),
}));

function makeEntries(count: number): JournalEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `entry-${i}`,
    content: `Entry ${i}`,
    moodScore: 5,
    createdAt: Timestamp.now(),
    tags: [],
  }));
}

function renderWizard(onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <JournalAnalysisWizard isOpen onClose={onClose} entries={makeEntries(10)} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
  return { onClose };
}

describe('JournalAnalysisWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs a weekly analysis and saves the result via saveInsight, not a raw Firestore call', async () => {
    mockGenerateComparativeAnalysis.mockResolvedValue({
      trajectory: 'Improving',
      key_themes: ['sleep'],
      comparison_summary: 'Doing better this week.',
      wins: ['Consistent journaling'],
      blind_spots: ['Late nights'],
      actionable_advice: ['Go to bed earlier'],
    });
    const { onClose } = renderWizard();

    fireEvent.click(screen.getByText('Begin Analysis'));

    expect(await screen.findByText('Save to Insights Log')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save to Insights Log'));

    await waitFor(() => expect(mockSaveInsight).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        type: 'journal',
        summary: 'Doing better this week.',
        pillars: expect.objectContaining({ understanding: 'sleep', growth: 'Consistent journaling', blind_spots: 'Late nights' }),
      }),
    ));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('resets back to the selection step when reopened', async () => {
    mockGenerateComparativeAnalysis.mockResolvedValue({
      trajectory: 'Stable',
      key_themes: [],
      comparison_summary: 'Summary',
      wins: [],
      blind_spots: [],
      actionable_advice: [],
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <JournalAnalysisWizard isOpen onClose={vi.fn()} entries={makeEntries(10)} />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText('Begin Analysis'));
    expect(await screen.findByText('Save to Insights Log')).toBeInTheDocument();

    // Close then reopen — should land back on the selection step.
    rerender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <JournalAnalysisWizard isOpen={false} onClose={vi.fn()} entries={makeEntries(10)} />
        </BrowserRouter>
      </QueryClientProvider>,
    );
    rerender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <JournalAnalysisWizard isOpen onClose={vi.fn()} entries={makeEntries(10)} />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Begin Analysis')).toBeInTheDocument();
  });
});
