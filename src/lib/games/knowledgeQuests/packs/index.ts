// src/lib/games/knowledgeQuests/packs/index.ts
// PROJ-72 (Recovery Games), Phase 6. The registry of Knowledge Quest content
// packs. Adding a future pack is one new file here + one entry in this
// array — no GamesHub or route changes needed, which is the "decoupled"
// property the spec asked for.
import type { KnowledgeQuestPack } from '../types';
import { stressPack } from './stress';
import { habitLoopsPack } from './habitLoops';
import { sleepPack } from './sleep';

export const KNOWLEDGE_QUEST_PACKS: KnowledgeQuestPack[] = [stressPack, habitLoopsPack, sleepPack];
