// src/components/games/jeopardy/Scoreboard.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game, restyled onto MRT's Tailwind system.
import type { JeopardyPlayer } from '../../../lib/games/jeopardy/types';

interface ScoreboardProps {
  players: JeopardyPlayer[];
  currentPlayerIndex: number;
}

export default function Scoreboard({ players, currentPlayerIndex }: ScoreboardProps) {
  return (
    <div className="flex justify-around gap-2 mb-4 p-4 bg-white rounded-2xl shadow-xl shadow-black/40 border border-white/10">
      {players.map((player, index) => (
        <div
          key={index}
          className={`text-center p-3 rounded-xl transition-all flex-1 ${index === currentPlayerIndex ? 'bg-indigo-50 shadow-inner' : ''}`}
        >
          <h3 className={`text-sm font-bold truncate ${index === currentPlayerIndex ? 'text-indigo-700' : 'text-slate-600'}`}>
            {player.name}
          </h3>
          <p className={`text-2xl font-black ${player.score < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ${player.score}
          </p>
          {index === currentPlayerIndex && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Current Turn</span>
          )}
        </div>
      ))}
    </div>
  );
}
