/**
 * src/pages/__tests__/GamesHub.test.tsx
 * PROJ-80 (Games Hub Unified Hero restyle) / PROJ-81 (Design System
 * Alignment). Verifies the flat game list renders only active games
 * (Craving Buster/Thought Challenge stay in code but delisted), each row
 * links to its own route, and the Fast Lane chip reflects real
 * useGameSave data rather than a hardcoded placeholder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GamesHub from '../GamesHub';

const mockUseGameSave = vi.fn();
vi.mock('../../hooks/useGameSave', () => ({
  useGameSave: (gameId: string) => mockUseGameSave(gameId),
}));

vi.mock('../../contexts/LayoutContext', () => ({
  useLayout: () => ({ isOnline: true, toggleSidebar: vi.fn(), toggleSOS: vi.fn() }),
}));

function renderGamesHub() {
  return render(
    <BrowserRouter>
      <GamesHub />
    </BrowserRouter>,
  );
}

describe('GamesHub', () => {
  beforeEach(() => {
    mockUseGameSave.mockReturnValue({ save: null });
  });

  it('renders exactly the active games', () => {
    renderGamesHub();
    expect(screen.getByText('Recovery Jeopardy')).toBeInTheDocument();
    expect(screen.getByText('Fast Lane')).toBeInTheDocument();
    expect(screen.getByText('Goal Ladder')).toBeInTheDocument();
    expect(screen.getByText('Trigger Match')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Quests')).toBeInTheDocument();
    expect(screen.getByText('Daily Crossword')).toBeInTheDocument();
  });

  it('does not render Craving Buster or Thought Challenge', () => {
    renderGamesHub();
    expect(screen.queryByText('Craving Buster')).not.toBeInTheDocument();
    expect(screen.queryByText('Thought Challenge')).not.toBeInTheDocument();
  });

  it('links each row to its own game route', () => {
    renderGamesHub();
    expect(screen.getByText('Fast Lane').closest('a')).toHaveAttribute('href', '/games/fast-lane');
    expect(screen.getByText('Recovery Jeopardy').closest('a')).toHaveAttribute('href', '/games/recovery-jeopardy');
  });

  it('shows no Fast Lane progress chip when there is no save', () => {
    renderGamesHub();
    expect(screen.queryByText(/Continue/)).not.toBeInTheDocument();
  });

  it('shows a real week number on the Fast Lane chip when a save exists', () => {
    mockUseGameSave.mockReturnValue({ save: { player: { week: 4 } } });
    renderGamesHub();
    expect(screen.getByText('Continue · Week 4')).toBeInTheDocument();
  });

  it('renders the shared VibrantHeader, including the SOS button (PROJ-81 regression fix)', () => {
    renderGamesHub();
    expect(screen.getByText('Recovery Games')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emergency SOS' })).toBeInTheDocument();
  });
});
