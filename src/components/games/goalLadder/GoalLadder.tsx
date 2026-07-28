// src/components/games/goalLadder/GoalLadder.tsx
// PROJ-72 (Recovery Games), Phase 5. A short, self-contained tap-through
// session for Ned (Pink Cloud phase) — climb a visual ladder of momentum
// prompts. No streak/reset mechanic inside the game itself, so a missed day
// never punishes anything: there's no persistent state here to break.
//
// Self-contained immersive screen (like UrgeSurfer.tsx) rather than a
// GameShell consumer — GameShell/GameHeader/GameFooter stay light-mode for
// their other consumers (CravingBuster, ThoughtChallenge, TriggerMatch);
// this game gets its own dark treatment matching Ned's persona color.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyIcon, HomeIcon, PauseIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { GameSessionProvider, useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { GOAL_LADDER_RUNGS } from '../../../lib/games/goalLadder/goalLadderData';
import LadderProgress from './LadderProgress';

function GoalLadderGame() {
  const navigate = useNavigate();
  const { startSession, setScore, completeSession, phase, score, pauseSession, resumeSession, resetSession } = useGameSession();
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

  const handleExit = () => {
    resetSession();
    navigate('/games');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(160deg,#2E1A47_0%,#1B0F2E_100%)] text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#2DD4BF]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-[420px] mx-auto px-4 py-4 gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Goal Ladder</h1>
          {status !== 'idle' && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <TrophyIcon className="h-4 w-4 text-[#2DD4BF]" />
              <span className="text-sm font-semibold font-mono">{score}/{GOAL_LADDER_RUNGS.length}</span>
            </div>
          )}
        </div>

        <LadderProgress rung={rung} total={GOAL_LADDER_RUNGS.length} className="mx-auto shrink-0" />

        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          {status === 'idle' && (
            <>
              <p className="text-white/70 max-w-xs text-[15px] leading-relaxed">
                Eight quick prompts — climb a rung with each one. No streak to keep, nothing to break.
              </p>
              <button
                onClick={handleStart}
                className="px-6 py-3.5 rounded-xl bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#1B0F2E] font-bold shadow-lg shadow-[#2DD4BF]/30 active:scale-95 transition-transform"
              >
                Start Climbing
              </button>
            </>
          )}

          {status === 'playing' && (
            <>
              <p className="text-xs font-semibold text-[#2DD4BF] uppercase tracking-wide font-mono">
                Rung {rung + 1} of {GOAL_LADDER_RUNGS.length}
              </p>
              <div className="rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm p-6 max-w-sm shadow-lg">
                <p className="text-white font-medium text-[15px] leading-relaxed">{GOAL_LADDER_RUNGS[rung]}</p>
              </div>
              <button
                onClick={handleClimb}
                className="px-6 py-3.5 rounded-xl bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#1B0F2E] font-bold shadow-lg shadow-[#2DD4BF]/30 active:scale-95 transition-transform"
              >
                Climb
              </button>
            </>
          )}

          {status === 'complete' && (
            <>
              <div className="bg-[#2DD4BF]/20 p-4 rounded-full inline-block border border-[#2DD4BF]/30 shadow-lg shadow-[#2DD4BF]/20">
                <CheckCircleIcon className="h-10 w-10 text-[#2DD4BF]" />
              </div>
              <p className="text-2xl font-black text-white">You climbed the whole ladder.</p>
              <p className="text-white/70 text-sm">{GOAL_LADDER_RUNGS.length} rungs, {GOAL_LADDER_RUNGS.length} small wins noticed.</p>
              <button
                onClick={() => navigate('/games')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold active:scale-95 transition-transform"
              >
                Back to Games
              </button>
            </>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#2DD4BF] hover:bg-white/10 active:scale-95 transition-colors"
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

export default function GoalLadder() {
  return (
    <GameSessionProvider>
      <GoalLadderGame />
    </GameSessionProvider>
  );
}
