/**
 * src/components/games/triggerMatch/__tests__/TriggerMatch.test.tsx
 * PROJ-73 Phase 4. Minimum bar per docs/projects/73_TEST_SUITE_HARDENING.md:
 * confirms the component renders and calls useGameProgress correctly on
 * completion (see docs/projects/72_RECOVERY_GAMES.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TriggerMatch from '../TriggerMatch';
import { buildTriggerMatchItems } from '../../../../lib/games/triggerMatch/triggerMatchData';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockRecordProgress = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../hooks/useGameProgress', () => ({
  useGameProgress: () => ({ recordProgress: mockRecordProgress, history: [], isLoading: false }),
}));

const ITEMS = buildTriggerMatchItems();

describe('🎮 TriggerMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the idle intro screen with a Start button before playing', () => {
    render(<TriggerMatch />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('calls recordProgress with the correct gameId/persona/score on completion', () => {
    render(<TriggerMatch />);
    fireEvent.click(screen.getByText('Start'));

    for (const item of ITEMS) {
      fireEvent.click(screen.getByText(item.correctOption));
      fireEvent.click(screen.getByText(/^(Next|Finish)$/));
    }

    expect(mockRecordProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'trigger-match',
        personaTarget: 'Walt',
        score: ITEMS.length,
        stats: { correct: ITEMS.length, total: ITEMS.length },
      }),
    );
    expect(screen.getByText(`${ITEMS.length} of ${ITEMS.length} matched.`)).toBeInTheDocument();
  });
});
