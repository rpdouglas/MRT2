/**
 * src/contexts/GameSessionContext.tsx
 * PROJ-72 (Recovery Games), Phase 1: Architecture & Foundation.
 *
 * Ephemeral, in-session-only state for whichever game is currently being
 * played (phase/score/timer-adjacent data) — deliberately NOT persisted here.
 * Completed results are written to the encrypted `game_progress` collection
 * via useGameProgress, per the ZK strategy in
 * docs/projects/72_RECOVERY_GAMES.md §2 (Context, not Zustand — see the
 * /planning Strategy A decision: no new state-management dependency).
 *
 * Scoped to the games subtree only (wraps GameShell, not the whole app in
 * App.tsx) — most users never open a game, so this provider shouldn't add a
 * context layer to every screen.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type GameSessionPhase = 'idle' | 'playing' | 'paused' | 'complete';

interface GameSessionContextType {
  activeGameId: string | null;
  phase: GameSessionPhase;
  score: number;
  startSession: (gameId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: (finalScore: number) => void;
  resetSession: () => void;
  setScore: (score: number) => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
}

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [phase, setPhase] = useState<GameSessionPhase>('idle');
  const [score, setScore] = useState(0);

  const startSession = useCallback((gameId: string) => {
    setActiveGameId(gameId);
    setPhase('playing');
    setScore(0);
  }, []);

  const pauseSession = useCallback(() => setPhase('paused'), []);
  const resumeSession = useCallback(() => setPhase('playing'), []);

  const completeSession = useCallback((finalScore: number) => {
    setScore(finalScore);
    setPhase('complete');
  }, []);

  const resetSession = useCallback(() => {
    setActiveGameId(null);
    setPhase('idle');
    setScore(0);
  }, []);

  const value = {
    activeGameId,
    phase,
    score,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    resetSession,
    setScore,
  };

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
}
