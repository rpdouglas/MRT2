// src/components/games/GameHeader.tsx
// PROJ-72 (Recovery Games), Phase 1 foundation. Game-scoped header rendered
// inside GameShell, below the app's own VibrantHeader — shows which game is
// active and the current in-session score. No red/alarm styling per the
// template's Somatic Check.
import { TrophyIcon } from '@heroicons/react/24/outline';
import { useGameSession } from '../../contexts/GameSessionContext';

interface GameHeaderProps {
  title: string;
}

export default function GameHeader({ title }: GameHeaderProps) {
  const { score, phase } = useGameSession();

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="flex items-center gap-2">
        {phase !== 'idle' && (
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <TrophyIcon className="h-4 w-4" />
            <span className="text-sm font-bold">{score}</span>
          </div>
        )}
      </div>
    </div>
  );
}
