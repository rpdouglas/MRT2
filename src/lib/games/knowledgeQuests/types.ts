// src/lib/games/knowledgeQuests/types.ts
// PROJ-72 (Recovery Games), Phase 6.
import type { ScenarioMatchItem } from '../../../components/games/ScenarioMatchQuiz';

export interface KnowledgeQuestPack {
  id: string;
  title: string;
  description: string;
  items: ScenarioMatchItem[];
}
