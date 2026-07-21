// src/components/games/triggerMatch/TriggerMatch.tsx
// PROJ-72 (Recovery Games), Phase 5. Pattern-recognition practice for Walt —
// wraps the shared ScenarioMatchQuiz loop with a static H.A.L.T.-based
// trigger-category content bank. No reflection field, matching Jeopardy/Fast
// Lane's precedent that not every game needs one.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from '../GameShell';
import ScenarioMatchQuiz from '../ScenarioMatchQuiz';
import { useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { buildTriggerMatchItems } from '../../../lib/games/triggerMatch/triggerMatchData';

const ITEMS = buildTriggerMatchItems();

function TriggerMatchGame() {
  const navigate = useNavigate();
  const { startSession, completeSession } = useGameSession();
  const { recordProgress } = useGameProgress();

  const [status, setStatus] = useState<'idle' | 'playing' | 'complete'>('idle');
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  const handleStart = () => {
    startSession('trigger-match');
    setStatus('playing');
  };

  const handleComplete = (correct: number, total: number) => {
    setResult({ correct, total });
    setStatus('complete');
    completeSession(correct);
    recordProgress({
      gameId: 'trigger-match',
      personaTarget: 'Walt',
      score: correct,
      stats: { correct, total },
    }).catch(() => { /* best-effort — the game itself already completed for the user */ });
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-12 px-4">
        <p className="text-slate-600 max-w-xs">
          15 situations — match each one to the trigger category it fits best (Hungry, Angry, Lonely, Tired, Social, Environmental).
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold shadow-md active:scale-95 transition-transform"
        >
          Start
        </button>
      </div>
    );
  }

  if (status === 'complete' && result) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
        <p className="text-lg font-bold text-slate-800">
          {result.correct} of {result.total} matched.
        </p>
        <p className="text-slate-600 max-w-xs">Recognizing a pattern is the first step to planning around it.</p>
        <button
          onClick={() => navigate('/games')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold active:scale-95 transition-transform"
        >
          Back to Games
        </button>
      </div>
    );
  }

  return <ScenarioMatchQuiz items={ITEMS} onComplete={handleComplete} />;
}

export default function TriggerMatch() {
  return (
    <GameShell title="Trigger Match">
      <TriggerMatchGame />
    </GameShell>
  );
}
