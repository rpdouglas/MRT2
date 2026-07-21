// src/lib/games/cravingBuster.ts
// PROJ-72 (Recovery Games), Phase 2. Pure scoring/config for the Craving
// Buster mini-game — kept separate from the component so it's independently
// testable, per docs/projects/72_RECOVERY_GAMES.md Part B.
//
// Deliberately shorter and mechanically distinct from UrgeSurfer's static
// 5-minute 5-4-3-2-1 checklist: a ~96s breathing-rhythm tap game (8 cycles of
// 4s inhale / 4s hold / 4s exhale), scored on how many exhale windows the
// user taps in rhythm with.
export const CRAVING_BUSTER_TOTAL_CYCLES = 8;
export const CRAVING_BUSTER_PHASE_DURATIONS = { inhale: 4, hold: 4, exhale: 4 } as const;

export interface CravingBusterStats extends Record<string, unknown> {
  tapsHit: number;
  tapsTotal: number;
  rhythmAccuracy: number; // 0-100
}

export function calculateCravingBusterStats(tapsHit: number, tapsTotal: number): CravingBusterStats {
  const total = Math.max(tapsTotal, 0);
  const hit = Math.min(Math.max(tapsHit, 0), total);
  const rhythmAccuracy = total > 0 ? Math.round((hit / total) * 100) : 0;
  return { tapsHit: hit, tapsTotal: total, rhythmAccuracy };
}
