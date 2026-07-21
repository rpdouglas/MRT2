// src/components/games/GameShell.tsx
// PROJ-72 (Recovery Games), Phase 1 foundation. Composes the session
// provider + header + footer around a single game's content — every
// concrete game (Phase 2+) wraps its screen in this instead of hand-rolling
// layout/session plumbing per game.
import type { ReactNode } from 'react';
import { GameSessionProvider } from '../../contexts/GameSessionContext';
import GameHeader from './GameHeader';
import GameFooter from './GameFooter';

interface GameShellProps {
  title: string;
  children: ReactNode;
}

export default function GameShell({ title, children }: GameShellProps) {
  return (
    <GameSessionProvider>
      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
        <GameHeader title={title} />
        <div className="flex-1">{children}</div>
        <GameFooter />
      </div>
    </GameSessionProvider>
  );
}
