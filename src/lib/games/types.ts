// src/lib/games/types.ts
// PROJ-72 (Recovery Games), Phase 1: Architecture & Foundation.
// Every mini-game implements IRecoveryGame<TStats, TReflection>. Generics
// replace the informal master plan's `stats: any` / `reflectionPayload: any` /
// `exportData(): any` — see docs/projects/72_RECOVERY_GAMES.md §4 conflict item 2.
import type { GamePersonaTarget } from '../db';

export interface GameExportPayload {
  gameId: string;
  score: number;
  stats: Record<string, unknown>;
  reflection?: string;
  completedAt: string; // ISO date string
}

export interface IRecoveryGame<TStats extends Record<string, unknown>, TReflection = never> {
  id: string;
  title: string;
  personaTarget: GamePersonaTarget;
  initialize: () => void;
  start: () => void;
  pause: () => void;
  complete: (score: number, stats: TStats) => void;
  // Routes to game_progress via useGameProgress — only games with a reflective
  // component (e.g. Thought Challenge) implement this.
  recordReflection?: (reflectionPayload: TReflection) => void;
  exportData: () => GameExportPayload;
  destroy: () => void;
}
