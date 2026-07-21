// src/components/games/goalLadder/GoalLadder.tsx
// PROJ-72 (Recovery Games), Phase 5. A short, self-contained tap-through
// session for Ned (Pink Cloud phase) — climb a visual ladder of momentum
// prompts. No streak/reset mechanic inside the game itself, so a missed day
// never punishes anything: there's no persistent state here to break.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from '../GameShell';
import { useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { GOAL_LADDER_RUNGS } from '../../../lib/games/goalLadder/goalLadderData';

function GoalLadderGame() {
  const navigate = useNavigate();
  const { startSession, setScore, completeSession } = useGameSession();
  const { recordProgress } = useGameProgress();

  const [status, setStatus] = useState<'idle' | 'playing' | 'complete'>('idle');
  const [rung, setRung] = useState(0);

  const handleStart = () => {
    startSession('goal-ladder');
    setStatus('playing');
    setRung(0);
    setScore(0);
  };

  const handleClimb = () => {
    const next = rung + 1;
    setScore(next);
    if (next >= GOAL_LADDER_RUNGS.length) {
      setRung(next);
      setStatus('complete');
      completeSession(next);
      recordProgress({
        gameId: 'goal-ladder',
        personaTarget: 'Ned',
        score: next,
        stats: { rungsClimbed: next, totalRungs: GOAL_LADDER_RUNGS.length },
      }).catch(() => { /* best-effort — the game itself already completed for the user */ });
      return;
    }
    setRung(next);
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-12 px-4">
        <p className="text-slate-600 max-w-xs">
          Eight quick prompts — climb a rung with each one. No streak to keep, nothing to break.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-transform"
        >
          Start Climbing
        </button>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
        <p className="text-lg font-bold text-slate-800">You climbed the whole ladder.</p>
        <p className="text-slate-600">{GOAL_LADDER_RUNGS.length} rungs, {GOAL_LADDER_RUNGS.length} small wins noticed.</p>
        <button
          onClick={() => navigate('/games')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold active:scale-95 transition-transform"
        >
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-4">
      <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
        Rung {rung + 1} of {GOAL_LADDER_RUNGS.length}
      </p>
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 max-w-sm text-center">
        <p className="text-slate-800 font-medium">{GOAL_LADDER_RUNGS[rung]}</p>
      </div>
      <button
        onClick={handleClimb}
        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-transform"
      >
        Climb
      </button>
    </div>
  );
}

export default function GoalLadder() {
  return (
    <GameShell title="Goal Ladder">
      <GoalLadderGame />
    </GameShell>
  );
}
