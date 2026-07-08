/**
 * src/hooks/useAutoSave.ts
 * PURPOSE: Debounces question input and delegates the encrypted Firestore write
 * to the `saveAnswer` mutation from useWorkbookAnswers.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveProps {
    sectionId: string;
    questionId: string;
    value: string;
    saveAnswer: (params: { sectionId: string; questionId: string; plaintext: string }) => Promise<void>;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave({ sectionId, questionId, value, saveAnswer }: AutoSaveProps) {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const lastSavedValue = useRef<string>(''); // To prevent saving identical values
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // The actual save function
    const performSave = useCallback(async (textToSave: string) => {
        if (!textToSave.trim()) return;

        setStatus('saving');
        try {
            await saveAnswer({ sectionId, questionId, plaintext: textToSave });

            if (isMounted.current) { setStatus('saved'); setLastSavedAt(new Date()); lastSavedValue.current = textToSave; }
        } catch (error) { console.error("Auto-save failed:", error); if (isMounted.current) setStatus('error'); }
    }, [sectionId, questionId, saveAnswer]);

    // Debounce Effect
    useEffect(() => {
        // Don't save if empty or same as last save
        if (!value.trim() || value === lastSavedValue.current) return;

        const handler = setTimeout(() => {
            performSave(value);
        }, 2000); // 2 second debounce

        return () => clearTimeout(handler);
    }, [value, performSave]);

    return { status, lastSavedAt };
}
