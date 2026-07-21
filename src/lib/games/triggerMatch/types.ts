// src/lib/games/triggerMatch/types.ts
// PROJ-72 (Recovery Games), Phase 5.
export type TriggerCategory = 'Hungry' | 'Angry' | 'Lonely' | 'Tired' | 'Social' | 'Environmental';

export interface TriggerMatchScenario {
  situation: string;
  category: TriggerCategory;
  explanation: string;
}

export interface TriggerMatchStats {
  correct: number;
  total: number;
}
