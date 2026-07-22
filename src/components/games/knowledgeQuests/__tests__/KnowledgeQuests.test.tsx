/**
 * src/components/games/knowledgeQuests/__tests__/KnowledgeQuests.test.tsx
 * PROJ-73 Phase 4. Minimum bar per docs/projects/73_TEST_SUITE_HARDENING.md:
 * confirms the component renders and calls useGameProgress correctly on
 * completion, including the pack-picker → quiz → "Try Another Pack" loop
 * (see docs/projects/72_RECOVERY_GAMES.md Phase 6).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KnowledgeQuests from '../KnowledgeQuests';
import { KNOWLEDGE_QUEST_PACKS } from '../../../../lib/games/knowledgeQuests/packs';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockRecordProgress = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../hooks/useGameProgress', () => ({
  useGameProgress: () => ({ recordProgress: mockRecordProgress, history: [], isLoading: false }),
}));

const FIRST_PACK = KNOWLEDGE_QUEST_PACKS[0];

function playThroughFirstPack() {
  fireEvent.click(screen.getByText(FIRST_PACK.title));
  for (const item of FIRST_PACK.items) {
    fireEvent.click(screen.getByText(item.correctOption));
    fireEvent.click(screen.getByText(/^(Next|Finish)$/));
  }
}

describe('🎮 KnowledgeQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the pack picker with every registered pack before a pack is chosen', () => {
    render(<KnowledgeQuests />);
    for (const pack of KNOWLEDGE_QUEST_PACKS) {
      expect(screen.getByText(pack.title)).toBeInTheDocument();
    }
  });

  it('calls recordProgress with the correct gameId/persona/packId on completion', () => {
    render(<KnowledgeQuests />);
    playThroughFirstPack();

    expect(mockRecordProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'knowledge-quests',
        personaTarget: 'All',
        score: FIRST_PACK.items.length,
        stats: { packId: FIRST_PACK.id, correct: FIRST_PACK.items.length, total: FIRST_PACK.items.length },
      }),
    );
  });

  it('"Try Another Pack" returns to the picker without re-recording progress', () => {
    render(<KnowledgeQuests />);
    playThroughFirstPack();
    mockRecordProgress.mockClear();

    fireEvent.click(screen.getByText('Try Another Pack'));

    for (const pack of KNOWLEDGE_QUEST_PACKS) {
      expect(screen.getByText(pack.title)).toBeInTheDocument();
    }
    expect(mockRecordProgress).not.toHaveBeenCalled();
  });
});
