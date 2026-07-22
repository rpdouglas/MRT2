/**
 * src/components/games/thoughtChallenge/__tests__/ThoughtChallenge.test.tsx
 * PROJ-73 Phase 4. Minimum bar per docs/projects/73_TEST_SUITE_HARDENING.md:
 * confirms the component renders and calls useGameProgress correctly on
 * completion, including the optional reflection save (see
 * docs/projects/72_RECOVERY_GAMES.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThoughtChallenge from '../ThoughtChallenge';
import { buildThoughtChallengeItems } from '../../../../lib/games/thoughtChallenge/thoughtChallengeData';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockRecordProgress = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../hooks/useGameProgress', () => ({
  useGameProgress: () => ({ recordProgress: mockRecordProgress, history: [], isLoading: false }),
}));

const ITEMS = buildThoughtChallengeItems();

function playThroughAllItems() {
  fireEvent.click(screen.getByText('Start'));
  for (const item of ITEMS) {
    fireEvent.click(screen.getByText(item.correctOption));
    fireEvent.click(screen.getByText(/^(Next|Finish)$/));
  }
}

describe('🎮 ThoughtChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the idle intro screen with a Start button before playing', () => {
    render(<ThoughtChallenge />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('calls recordProgress with the correct gameId/persona/score on completion', () => {
    render(<ThoughtChallenge />);
    playThroughAllItems();

    expect(mockRecordProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'thought-challenge',
        personaTarget: 'Lisa',
        score: ITEMS.length,
        stats: { correct: ITEMS.length, total: ITEMS.length },
      }),
    );
    expect(screen.getByText(`${ITEMS.length} of ${ITEMS.length} matched.`)).toBeInTheDocument();
  });

  it('saves an optional reflection as a second recordProgress call, attached to the same result', async () => {
    render(<ThoughtChallenge />);
    playThroughAllItems();
    mockRecordProgress.mockClear();

    fireEvent.change(screen.getByPlaceholderText(/A thought you noticed today/), {
      target: { value: 'Sponsors need rest too.' },
    });
    fireEvent.click(screen.getByText('Save reflection'));

    expect(mockRecordProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'thought-challenge',
        personaTarget: 'Lisa',
        reflection: 'Sponsors need rest too.',
      }),
    );
    await waitFor(() => expect(screen.getByText('Saved.')).toBeInTheDocument());
  });
});
