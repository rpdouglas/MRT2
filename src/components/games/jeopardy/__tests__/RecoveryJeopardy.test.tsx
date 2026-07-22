/**
 * src/components/games/jeopardy/__tests__/RecoveryJeopardy.test.tsx
 * PROJ-73 Phase 4. Minimum bar per docs/projects/73_TEST_SUITE_HARDENING.md:
 * confirms the component renders and calls useGameProgress correctly on
 * completion (see docs/projects/72_RECOVERY_GAMES.md Phase 3).
 *
 * The real content-heavy sub-components (JeopardyBoard, QuestionModal,
 * FinalJeopardy) are stubbed to deterministic controls so the test can drive
 * the real round/scoring state machine in RecoveryJeopardy.tsx itself
 * (setup -> jeopardy -> double -> final -> complete) without re-testing
 * board rendering or wagering UI, which have their own coverage elsewhere
 * (jeopardyData.test.ts, scoring.test.ts). PlayerSetup and Scoreboard are
 * left real — both are simple enough not to need stubbing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecoveryJeopardy from '../RecoveryJeopardy';
import type { JeopardyCategory, JeopardyQuestion, JeopardyPlayer } from '../../../../lib/games/jeopardy/types';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockRecordProgress = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../hooks/useGameProgress', () => ({
  useGameProgress: () => ({ recordProgress: mockRecordProgress, history: [], isLoading: false }),
}));

const STUB_CATEGORY: JeopardyCategory = { name: 'Test Category', questions: [] };
const STUB_QUESTION: JeopardyQuestion = { question: 'Test Question', answer: 'Test Answer', value: 200 };

vi.mock('../JeopardyBoard', () => ({
  default: ({ onSelectQuestion }: { onSelectQuestion: (category: JeopardyCategory, question: JeopardyQuestion) => void }) => (
    <button onClick={() => onSelectQuestion(STUB_CATEGORY, STUB_QUESTION)}>Answer Question</button>
  ),
}));

vi.mock('../QuestionModal', () => ({
  default: ({ onAnswer }: { onAnswer: (wasCorrect: boolean) => void }) => (
    <button onClick={() => onAnswer(true)}>Answer Correct</button>
  ),
}));

vi.mock('../FinalJeopardy', () => ({
  default: ({ players, onComplete }: { players: JeopardyPlayer[]; onComplete: (finalPlayers: JeopardyPlayer[]) => void }) => (
    <button onClick={() => onComplete(players)}>Complete Game</button>
  ),
}));

const QUESTIONS_PER_ROUND = 30; // matches TOTAL_QUESTIONS_PER_ROUND in RecoveryJeopardy.tsx

function answerOneQuestion() {
  fireEvent.click(screen.getByText('Answer Question'));
  fireEvent.click(screen.getByText('Answer Correct'));
}

function playThroughToFinalRound() {
  fireEvent.click(screen.getByText('Start Game')); // PlayerSetup default: 1 player, "Team 1"
  for (let i = 0; i < QUESTIONS_PER_ROUND * 2; i++) {
    answerOneQuestion();
  }
}

describe('🎮 RecoveryJeopardy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the Group Setup screen with a Start Game button before playing', () => {
    render(<RecoveryJeopardy />);
    expect(screen.getByText('Group Setup')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  it('drives through both rounds into Final Jeopardy and calls recordProgress with the winner on completion', () => {
    render(<RecoveryJeopardy />);
    playThroughToFinalRound();

    expect(screen.getByText('Complete Game')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Complete Game'));

    expect(mockRecordProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'recovery-jeopardy',
        personaTarget: 'Lisa',
        stats: expect.objectContaining({
          winner: 'Team 1',
          players: [{ name: 'Team 1', score: expect.any(Number) }],
        }),
      }),
    );
  });
});
