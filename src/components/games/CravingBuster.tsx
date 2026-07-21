/**
 * src/components/games/CravingBuster.tsx
 * PROJ-72 (Recovery Games), Phase 2. The first real IRecoveryGame — a short
 * (~96s), scored, breathing-rhythm tap game distinct from UrgeSurfer's static
 * 5-minute 5-4-3-2-1 checklist (see docs/projects/72_RECOVERY_GAMES.md Part B).
 *
 * Reachable from the SOS modal AND from GamesHub. Deliberately NOT wrapped in
 * VaultGate (App.tsx) — matches UrgeSurfer's crisis-tool precedent, so David
 * never hits a PIN prompt between tapping SOS and reaching a calming activity.
 * Completion always succeeds locally; persisting the score to game_progress
 * is a best-effort side effect gated on the vault already being unlocked.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from './GameShell';
import { useGameSession } from '../../contexts/GameSessionContext';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useWakeLock } from '../../hooks/useWakeLock';
import { triggerHaptic } from '../../lib/haptics';
import {
  CRAVING_BUSTER_TOTAL_CYCLES,
  CRAVING_BUSTER_PHASE_DURATIONS,
  calculateCravingBusterStats,
  type CravingBusterStats,
} from '../../lib/games/cravingBuster';

type BreathPhase = 'inhale' | 'hold' | 'exhale';
const PHASE_ORDER: BreathPhase[] = ['inhale', 'hold', 'exhale'];

const PHASE_COPY: Record<BreathPhase, string> = {
  inhale: 'Breathe in…',
  hold: 'Hold…',
  exhale: 'Tap as you breathe out',
};

function CravingBusterGame() {
  const navigate = useNavigate();
  const { startSession, completeSession, phase: sessionPhase } = useGameSession();
  const { recordProgress } = useGameProgress();
  const { isVaultUnlocked } = useEncryption();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const [status, setStatus] = useState<'idle' | 'playing' | 'complete'>('idle');
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [tapsHit, setTapsHit] = useState(0);
  const [canTap, setCanTap] = useState(false);
  const [tappedThisCycle, setTappedThisCycle] = useState(false);
  const [finalStats, setFinalStats] = useState<CravingBusterStats | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(0);
  const phaseIndexRef = useRef(0);
  const cycleCountRef = useRef(0);
  const tapsHitRef = useRef(0);
  const tappedThisCycleRef = useRef(false);
  const sessionPhaseRef = useRef(sessionPhase);

  useEffect(() => { sessionPhaseRef.current = sessionPhase; }, [sessionPhase]);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    releaseWakeLock();
    const stats = calculateCravingBusterStats(tapsHitRef.current, cycleCountRef.current);
    setFinalStats(stats);
    setStatus('complete');
    completeSession(stats.rhythmAccuracy);

    if (isVaultUnlocked) {
      recordProgress({
        gameId: 'craving-buster',
        personaTarget: 'David',
        score: stats.rhythmAccuracy,
        stats,
      }).catch(() => { /* best-effort — the game itself already completed for the user */ });
    }
  }, [completeSession, isVaultUnlocked, recordProgress, releaseWakeLock]);

  const applyPhase = useCallback((index: number) => {
    phaseIndexRef.current = index;
    const p = PHASE_ORDER[index];
    setBreathPhase(p);
    const duration = CRAVING_BUSTER_PHASE_DURATIONS[p];
    timeLeftRef.current = duration;
    triggerHaptic(p);

    if (p === 'exhale') {
      tappedThisCycleRef.current = false;
      setTappedThisCycle(false);
      setCanTap(true);
    } else {
      setCanTap(false);
    }
  }, []);

  const handleStart = useCallback(() => {
    startSession('craving-buster');
    requestWakeLock();
    cycleCountRef.current = 0;
    tapsHitRef.current = 0;
    setCycleCount(0);
    setTapsHit(0);
    setStatus('playing');
    applyPhase(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (sessionPhaseRef.current === 'paused') return;

      if (timeLeftRef.current <= 1) {
        const finishingExhale = PHASE_ORDER[phaseIndexRef.current] === 'exhale';
        if (finishingExhale) {
          cycleCountRef.current += 1;
          setCycleCount(cycleCountRef.current);
          if (cycleCountRef.current >= CRAVING_BUSTER_TOTAL_CYCLES) {
            finish();
            return;
          }
        }
        applyPhase((phaseIndexRef.current + 1) % PHASE_ORDER.length);
      } else {
        timeLeftRef.current -= 1;
      }
    }, 1000);
  }, [applyPhase, finish, requestWakeLock, startSession]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  const handleTap = () => {
    if (sessionPhase !== 'playing' || !canTap || tappedThisCycleRef.current) return;
    tappedThisCycleRef.current = true;
    setTappedThisCycle(true);
    tapsHitRef.current += 1;
    setTapsHit(tapsHitRef.current);
    triggerHaptic('tap');
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-12 px-4">
        <p className="text-slate-600 max-w-xs">
          A short breathing rhythm — about 90 seconds. Tap the circle each time you breathe out.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md active:scale-95 transition-transform"
        >
          Start
        </button>
      </div>
    );
  }

  if (status === 'complete' && finalStats) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
        <p className="text-lg font-bold text-slate-800">Nice work.</p>
        <p className="text-slate-600">
          You stayed with {finalStats.tapsHit} of {finalStats.tapsTotal} breaths ({finalStats.rhythmAccuracy}%).
        </p>
        <button
          onClick={() => navigate('/games')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold active:scale-95 transition-transform"
        >
          Back to Games
        </button>
      </div>
    );
  }

  const scale = breathPhase === 'inhale' ? 1.4 : breathPhase === 'hold' ? 1.4 : 0.9;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-4">
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Cycle {Math.min(cycleCount + 1, CRAVING_BUSTER_TOTAL_CYCLES)} of {CRAVING_BUSTER_TOTAL_CYCLES}
      </p>
      <button
        onClick={handleTap}
        disabled={!canTap}
        aria-label={canTap ? 'Tap to breathe out' : PHASE_COPY[breathPhase]}
        className="h-40 w-40 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg transition-transform duration-[4000ms] ease-in-out flex items-center justify-center text-white font-bold disabled:cursor-default"
        style={{ transform: `scale(${scale})` }}
      >
        {PHASE_COPY[breathPhase]}
      </button>
      {tappedThisCycle && breathPhase === 'exhale' && (
        <p className="text-emerald-600 text-sm font-semibold">Tapped ✓</p>
      )}
      <p className="text-xs text-slate-400">{tapsHit} tapped in rhythm so far</p>
    </div>
  );
}

export default function CravingBuster() {
  return (
    <GameShell title="Craving Buster">
      <CravingBusterGame />
    </GameShell>
  );
}
