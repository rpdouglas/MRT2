/**
 * src/hooks/useGuidedDraft.ts
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * sessionStorage-backed autosave for an in-progress GuidedWorkflowEngine session.
 * Plaintext, device-local, session-scoped — never sent to Firestore. Modeled on
 * useROSCAssessments.ts's sessionStorage draft pattern.
 */
import { useCallback } from 'react';
import type { SmartToolType } from '../lib/types/smart';

export interface GuidedDraft<T> {
    currentStep: number;
    stepData: Partial<T>;
}

export function useGuidedDraft<T>(toolType: SmartToolType) {
    const key = `guidedDraft_${toolType}`;

    const getDraft = useCallback((): GuidedDraft<T> | null => {
        try {
            const raw = sessionStorage.getItem(key);
            return raw ? (JSON.parse(raw) as GuidedDraft<T>) : null;
        } catch {
            return null;
        }
    }, [key]);

    const saveDraft = useCallback((currentStep: number, stepData: Partial<T>) => {
        sessionStorage.setItem(key, JSON.stringify({ currentStep, stepData }));
    }, [key]);

    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(key);
    }, [key]);

    return { getDraft, saveDraft, clearDraft };
}
