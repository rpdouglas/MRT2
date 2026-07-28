// src/components/games/triggerMatch/TriggerMatch.tsx
// PROJ-72 (Recovery Games), Phase 5. Pattern-recognition practice for Walt —
// wraps the shared ScenarioMatchQuiz loop with a static H.A.L.T.-based
// trigger-category content bank. No reflection field, matching Jeopardy/Fast
// Lane's precedent that not every game needs one.
//
// PROJ-87: self-contained dark-immersive shell (like GoalLadder.tsx/
// RecoveryJeopardy.tsx) instead of GameShell — GameShell/GameHeader/
// GameFooter stay light-mode for their other consumers (CravingBuster,
// ThoughtChallenge, FastLane). Accent is Walt's existing Games Hub persona
// color (#60A5FA).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyIcon, HomeIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { GameSessionProvider, useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import ScenarioMatchQuiz from '../ScenarioMatchQuiz';
import { buildTriggerMatchItems } from '../../../lib/games/triggerMatch/triggerMatchData';

const ITEMS = buildTriggerMatchItems();
const ACCENT = '#60A5FA';

function TriggerMatchGame() {
  const navigate = useNavigate();
  const { startSession, completeSession, phase, score, pauseSession, resumeSession, resetSession } = useGameSession();
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

  const handleExit = () => {
    resetSession();
    navigate('/games');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(160deg,#2E1A47_0%,#1B0F2E_100%)] text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#60A5FA]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-2xl mx-auto px-4 py-4 gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Trigger Match</h1>
          {status !== 'idle' && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <TrophyIcon className="h-4 w-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold font-mono">{score}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          {status === 'idle' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <p className="text-white/70 max-w-xs text-[15px] leading-relaxed">
                15 situations — match each one to the trigger category it fits best (Hungry, Angry, Lonely, Tired, Social, Environmental).
              </p>
              <button
                onClick={handleStart}
                className="px-6 py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: ACCENT, color: '#1B0F2E' }}
              >
                Start
              </button>
            </div>
          )}

          {status === 'playing' && (
            <ScenarioMatchQuiz items={ITEMS} onComplete={handleComplete} theme={{ mode: 'dark', accent: ACCENT }} />
          )}

          {status === 'complete' && result && (
            <div className="flex flex-col items-center text-center gap-3 py-8">
              <p className="text-2xl font-black text-white">
                {result.correct} of {result.total} matched.
              </p>
              <p className="text-white/70 text-sm max-w-xs">Recognizing a pattern is the first step to planning around it.</p>
              <button
                onClick={() => navigate('/games')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold active:scale-95 transition-transform"
              >
                Back to Games
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 shrink-0">
          <button
            onClick={handleExit}
            aria-label="Exit to Games"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 active:scale-95 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">Exit</span>
          </button>

          {phase === 'playing' && (
            <button
              onClick={pauseSession}
              aria-label="Pause"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 active:scale-95 transition-colors"
            >
              <PauseIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Pause</span>
            </button>
          )}

          {phase === 'paused' && (
            <button
              onClick={resumeSession}
              aria-label="Resume"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 active:scale-95 transition-colors"
              style={{ color: ACCENT }}
            >
              <PlayIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Resume</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TriggerMatch() {
  return (
    <GameSessionProvider>
      <TriggerMatchGame />
    </GameSessionProvider>
  );
}
