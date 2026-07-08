/**
 * src/lib/types/smart.ts
 * PROJ-27: The CBT Engine
 * Strict type definitions for SMART Recovery tools to ensure consistent data structure
 * within the zero-knowledge journal storage.
 */

export type SmartToolType = 
    | 'CBA' 
    | 'ABC' 
    | 'DENTS' 
    | 'FIVE_QUESTIONS' 
    | 'LIFESTYLE_BALANCE' 
    | 'PERSONIFY' 
    | 'SELF_COMPASSION' 
    | 'SMART_GOAL'
    | 'BOUNDARIES'
    | 'THOUGHT_RECORD';

export interface SmartToolMetadata {
    type: SmartToolType;
    version: string;
    lastSaved: string; // ISO String
}

export interface CBAPayload {
    behavior: string;
    advantagesDoing: string[];
    disadvantagesDoing: string[];
    advantagesStopping: string[];
    disadvantagesStopping: string[];
}

export interface ABCPayload {
    activatingEvent: string;  // Step A
    beliefs: string;          // Step B
    consequences: string;     // Step C
    dispute: string;          // Step D — the Disputation step (most critical)
    effectiveBelief: string;  // Step E — the new rational belief
}

/** Tag applied to SMART Tool journal entries that hold a partial (in-progress) guided-flow save. */
export const DRAFT_TAG = 'DRAFT' as const;

export interface DENTSPayload { deny: string; escape: string; neutralize: string; tasks: string; swap: string; }

export interface FiveQuestionsPayload { q1: string; q2: string; q3: string; q4: string; q5: string; }

export interface LifestyleBalancePayload { physical: number; mental: number; relationships: number; work: number; spiritual: number; leisure: number; }

export interface PersonifyPayload { personas: Array<{ id: number; name: string; action: string; result: string; }>;
}

export interface SelfCompassionPayload { kindness: string; humanity: string; mindfulness: string; }

export interface SmartGoalPayload {
    specific: string;
    measurable: string;
    achievable: string;
    realistic: string;
    timeBound: string;
    tasks: Array<{
        id: number;
        text: string;
        completed: boolean;
    }>;
}

export interface BoundariesPayload { boundaries: Array<{ id: number; who: string; what: string; how: string; type: 'Small' | 'Large'; }>;
}

export interface ThoughtRecordPayload {
    situation: string;              // Column 1 — what happened
    automaticThoughts: string;      // Column 2 — the immediate thought
    emotions: Array<{                // Column 3 — emotions + intensity, before the reframe
        emotion: string;
        intensity: number;          // 0-100
    }>;
    evidenceFor: string;             // Column 4 — evidence supporting the thought
    evidenceAgainst: string;         // Column 5 — evidence challenging the thought
    balancedThought: string;         // Column 6 — the reframed thought
    outcomeEmotions: Array<{         // Column 7 — same emotions as Column 3, re-rated after the reframe
        emotion: string;
        intensity: number;
    }>;
    distortionType?: string;        // Optional: identified cognitive distortion (Step 5)
}
