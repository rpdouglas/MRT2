// src/components/games/GameFooter.tsx
// PROJ-72 (Recovery Games), Phase 1 foundation. Session controls (pause/
// resume, exit to hub) for whatever game GameShell is currently hosting.
// Anti-shame: exiting mid-game is a neutral "Exit" action, never framed as
// quitting/failing — see docs/projects/72_RECOVERY_GAMES.md §4 Somatic Check.
import { useNavigate } from 'react-router-dom';
import { PauseIcon, PlayIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useGameSession } from '../../contexts/GameSessionContext';

export default function GameFooter() {
  const navigate = useNavigate();
  const { phase, pauseSession, resumeSession, resetSession } = useGameSession();

  const handleExit = () => {
    resetSession();
    navigate('/games');
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 border border-slate-200">
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
        aria-label="Exit to Games"
      >
        <HomeIcon className="h-5 w-5" />
        <span className="text-sm font-semibold">Exit</span>
      </button>

      {phase === 'playing' && (
        <button
          onClick={pauseSession}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
          aria-label="Pause"
        >
          <PauseIcon className="h-5 w-5" />
          <span className="text-sm font-semibold">Pause</span>
        </button>
      )}

      {phase === 'paused' && (
        <button
          onClick={resumeSession}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors active:scale-95"
          aria-label="Resume"
        >
          <PlayIcon className="h-5 w-5" />
          <span className="text-sm font-semibold">Resume</span>
        </button>
      )}
    </div>
  );
}
