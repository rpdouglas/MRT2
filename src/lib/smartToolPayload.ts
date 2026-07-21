/**
 * src/lib/smartToolPayload.ts
 * Shared parser for the SMART Tool journal envelope (`{ metadata: { type, ... }, data }`)
 * that `SmartToolContainer.tsx` stringifies into `journals/{id}.content` before encryption.
 * Used anywhere a decrypted journal entry needs to be told apart from a freeform entry.
 */
import type { SmartToolType } from './types/smart';

export interface SmartToolPayload {
    type: SmartToolType;
    data: Record<string, unknown>;
}

/** Best-effort parse of a decrypted journal `content` string as a SMART Tool envelope.
 * Returns null for freeform/legacy entries — never throws. */
export function parseSmartToolPayload(content: string): SmartToolPayload | null {
    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && parsed.metadata?.type && parsed.data) {
            return { type: parsed.metadata.type as SmartToolType, data: parsed.data as Record<string, unknown> };
        }
    } catch {
        // Not JSON — a normal freeform entry, not an error.
    }
    return null;
}
