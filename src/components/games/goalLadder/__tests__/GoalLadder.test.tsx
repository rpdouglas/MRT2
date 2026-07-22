/**
 * src/components/games/goalLadder/__tests__/GoalLadder.test.tsx
 * PROJ-73 Phase 4. Minimum bar per docs/projects/73_TEST_SUITE_HARDENING.md:
 * confirms the component renders and calls useGameProgress correctly on
 * completion — not full e2e (see docs/projects/72_RECOVERY_GAMES.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalLadder from '../GoalLadder';
import { GOAL_LADDER_RUNGS } from '../../../../lib/games/goalLadder/goalLadderData';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockRecordProgress = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../hooks/useGameProgress', () => ({
  useGameProgress: () => ({ recordProgress: mockRecordProgress, history: [], isLoading: false }),
}));

describe('🎮 GoalLadder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the idle intro screen with a Start Climbing button before playing', () => {
    render(<GoalLadder />);
    expect(screen.getByText('Start Climbing')).toBeInTheDocument();
  });

  it('climbs every rung and calls recordProgress with the full rung count on completion', () => {
    render(<GoalLadder />);
    fireEvent.click(screen.getByText('Start Climbing'));

    for (let i = 0; i < GOAL_LADDER_RUNGS.length; i++) {
      fireEvent.click(screen.getByText('Climb'));
    }

    expect(mockRecordProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'goal-ladder',
        personaTarget: 'Ned',
        score: GOAL_LADDER_RUNGS.length,
        stats: { rungsClimbed: GOAL_LADDER_RUNGS.length, totalRungs: GOAL_LADDER_RUNGS.length },
      }),
    );
    expect(screen.getByText('You climbed the whole ladder.')).toBeInTheDocument();
  });
});
