/**
 * src/hooks/useAutoSave.ts
 * PURPOSE: Handles debounced encryption and Firestore writes for workbook answers.
 * SECURITY: Encrypts data client-side before saving.
 * METADATA: Preserves workbook/section/question IDs.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useEncryption } from '../contexts/EncryptionContext';
import type { WorkbookAnswer } from '../lib/db';

interface AutoSaveProps { uid: string; workbookId: string; sectionId: string; questionId: string; value: string; }

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave({ uid, workbookId, sectionId, questionId, value }: AutoSaveProps) {
    const { encrypt } = useEncryption();
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const lastSavedValue = useRef<string>(''); // To prevent saving identical values
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // The actual save function
    const performSave = useCallback(async (textToSave: string) => {
        if (!db || !textToSave.trim()) return;
        
        setStatus('saving');
        try {
            // 1. Encrypt
            const encryptedAnswer = await encrypt(textToSave);
            
            // 2. Prepare Payload (Strict Typing)
            const docId = `${workbookId}_${questionId}`;
            const payload: WorkbookAnswer = {
                uid,
                workbookId,
                sectionId,
                questionId,
                answer: encryptedAnswer,
                isEncrypted: true,
                updatedAt: Timestamp.now()
            };

            // 3. Write to Firestore
            const ref = doc(db, 'users', uid, 'workbook_answers', docId);
            await setDoc(ref, payload, { merge: true });

            if (isMounted.current) { setStatus('saved'); setLastSavedAt(new Date()); lastSavedValue.current = textToSave; }
        } catch (error) { console.error("Auto-save failed:", error); if (isMounted.current) setStatus('error'); }
    }, [uid, workbookId, sectionId, questionId, encrypt]);

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
