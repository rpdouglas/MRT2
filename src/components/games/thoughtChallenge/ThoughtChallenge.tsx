// src/components/games/thoughtChallenge/ThoughtChallenge.tsx
// PROJ-72 (Recovery Games), Phase 5. A CBT-style reframing game for Lisa
// (sponsor/service burnout) — wraps the shared ScenarioMatchQuiz loop with
// the burnout-thought content bank and an optional free-text reflection
// after the quiz, matching the "recordReflection" pattern other CBT flows use.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from '../GameShell';
import ScenarioMatchQuiz from '../ScenarioMatchQuiz';
import { useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { buildThoughtChallengeItems } from '../../../lib/games/thoughtChallenge/thoughtChallengeData';

const ITEMS = buildThoughtChallengeItems();

function ThoughtChallengeGame() {
  const navigate = useNavigate();
  const { startSession, completeSession } = useGameSession();
  const { recordProgress } = useGameProgress();

  const [status, setStatus] = useState<'idle' | 'playing' | 'complete'>('idle');
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const handleStart = () => {
    startSession('thought-challenge');
    setStatus('playing');
  };

  const handleComplete = (correct: number, total: number) => {
    setResult({ correct, total });
    setStatus('complete');
    completeSession(correct);
    recordProgress({
      gameId: 'thought-challenge',
      personaTarget: 'Lisa',
      score: correct,
      stats: { correct, total },
    }).catch(() => { /* best-effort — the game itself already completed for the user */ });
  };

  const handleSaveReflection = () => {
    if (!reflection.trim() || !result) return;
    recordProgress({
      gameId: 'thought-challenge',
      personaTarget: 'Lisa',
      score: result.correct,
      stats: { correct: result.correct, total: result.total },
      reflection: reflection.trim(),
    }).then(() => setReflectionSaved(true))
      .catch(() => { /* best-effort */ });
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-12 px-4">
        <p className="text-slate-600 max-w-xs">
          15 quick thoughts, sponsor-and-service flavored. Match each one to the thinking pattern it fits.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md active:scale-95 transition-transform"
        >
          Start
        </button>
      </div>
    );
  }

  if (status === 'complete' && result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 px-4">
        <p className="text-lg font-bold text-slate-800 text-center">
          {result.correct} of {result.total} matched.
        </p>
        <div className="w-full max-w-sm">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Anything you want to reframe from today? (optional)
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            disabled={reflectionSaved}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-50"
            placeholder="A thought you noticed today, and a more useful way to see it..."
          />
          {!reflectionSaved ? (
            <button
              onClick={handleSaveReflection}
              disabled={!reflection.trim()}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save reflection
            </button>
          ) : (
            <p className="mt-2 text-sm text-emerald-600 font-semibold">Saved.</p>
          )}
        </div>
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

export default function ThoughtChallenge() {
  return (
    <GameShell title="Thought Challenge">
      <ThoughtChallengeGame />
    </GameShell>
  );
}
