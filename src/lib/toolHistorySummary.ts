/**
 * src/lib/toolHistorySummary.ts
 * PROJ-50 §5: Tools Hub Redesign
 * Small helpers for presenting a decrypted SMART Tool journal payload as a
 * readable list — no per-tool renderer, just enough structure to pick a
 * one-line headline and humanize field labels generically.
 */
import type { SmartToolType } from './types/smart';

/** The single field (when one exists) that best summarizes a completion at a glance. Tools with no natural single-string field (arrays, scores) are omitted — callers fall back to the entry's date. */
export const HEADLINE_FIELD: Partial<Record<SmartToolType, string>> = {
    CBA: 'behavior',
    ABC: 'activatingEvent',
    DENTS: 'scenario',
    THOUGHT_RECORD: 'situation',
    FIVE_QUESTIONS: 'thought',
    SMART_GOAL: 'specific',
};

/** camelCase / PascalCase field name -> "Title Case" label, e.g. "activatingEvent" -> "Activating Event". */
export function humanizeKey(key: string): string {
    const spaced = key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
