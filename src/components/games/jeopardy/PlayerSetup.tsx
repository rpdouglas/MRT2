// src/components/games/jeopardy/PlayerSetup.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game, restyled onto MRT's Tailwind system.
import { useState } from 'react';
import type { JeopardyPlayer } from '../../../lib/games/jeopardy/types';

interface PlayerSetupProps {
  onStartGame: (players: JeopardyPlayer[]) => void;
}

export default function PlayerSetup({ onStartGame }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(1);
  const [playerNames, setPlayerNames] = useState(['Team 1', 'Team 2', 'Team 3']);

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...playerNames];
    updated[index] = newName;
    setPlayerNames(updated);
  };

  const handleStart = () => {
    const players: JeopardyPlayer[] = playerNames.slice(0, playerCount).map((name, index) => ({
      name: name.trim() || `Team ${index + 1}`,
      score: 0,
    }));
    onStartGame(players);
  };

  return (
    <div className="p-6 bg-white/[0.07] border border-white/10 backdrop-blur-sm rounded-2xl shadow-lg text-center">
      <h2 className="text-2xl font-bold text-white mb-6">Group Setup</h2>

      <div className="mb-6">
        <label className="text-base font-semibold mb-2 block text-white/70">How many players or teams?</label>
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => setPlayerCount(num)}
              className={`py-2.5 px-5 text-lg font-bold rounded-xl transition-colors ${
                playerCount === num ? 'bg-[#C084FC] text-[#1B0F2E]' : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-base font-semibold mb-2 block text-white/70">Team names</label>
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: playerCount }).map((_, index) => (
            <input
              key={index}
              type="text"
              value={playerNames[index]}
              onChange={(e) => handleNameChange(index, e.target.value)}
              className="p-2.5 bg-white/10 border border-white/20 rounded-xl w-64 text-center text-white placeholder:text-white/40"
              placeholder={`Team ${index + 1} name`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="bg-[#C084FC] hover:bg-[#C084FC]/90 text-[#1B0F2E] font-bold py-3 px-10 rounded-xl shadow-lg shadow-[#C084FC]/30 text-lg active:scale-95 transition-transform"
      >
        Start Game
      </button>
    </div>
  );
}
