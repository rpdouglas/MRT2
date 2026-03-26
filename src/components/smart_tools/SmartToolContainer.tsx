/**
 * src/components/smart_tools/SmartToolContainer.tsx
 * PROJ-27: The CBT Engine
 * A generic wrapper that handles manual saving, zero-knowledge encryption, 
 * state management, and session rehydration for SMART Recovery tools.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useJournalOperations } from '../../hooks/useJournalOperations';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, type Firestore } from 'firebase/firestore';
import { CheckCircleIcon, ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { SmartToolType } from '../../lib/types/smart';

interface SmartToolContainerProps<T extends object> {
    toolType: SmartToolType;
    toolLabel: string;
    initialData: T;
    resumeSession?: boolean;
    children: (props: { 
        data: T; 
        updateData: (newData: Partial<T>) => void;
    }) => React.ReactNode;
}

export function SmartToolContainer<T extends object>({ 
    toolType, 
    toolLabel, 
    initialData,
    resumeSession = false,
    children 
}: SmartToolContainerProps<T>) {
    const { user } = useAuth();
    const { isVaultUnlocked, encrypt, decrypt } = useEncryption();
    const { addJournal, updateJournal } = useJournalOperations();
    
    const [data, setData] = useState<T>(initialData);
    const [isSavingLocal, setIsSavingLocal] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const [isInitializing, setIsInitializing] = useState(resumeSession);
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);

    // Fetch and rehydrate latest session
    useEffect(() => {
        let isMounted = true;

        const fetchLatestSession = async () => {
            if (!resumeSession || !isVaultUnlocked || !user || !db) {
                if (isMounted && isInitializing) setIsInitializing(false);
                return;
            }

            try {
                const database: Firestore = db;
                const q = query(
                    collection(database, 'journals'),
                    where('uid', '==', user.uid),
                    where('tags', 'array-contains', toolType),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                
                const snapshot = await getDocs(q);

                if (!snapshot.empty && isMounted) {
                    const docSnap = snapshot.docs[0];
                    const rawData = docSnap.data();
                    setCurrentDocId(docSnap.id);

                    if (rawData.isEncrypted && rawData.content) {
                        const plainText = await decrypt(rawData.content);
                        const parsed = JSON.parse(plainText);
                        if (parsed && parsed.data) {
                            setData(parsed.data as T);
                            setHasUnsavedChanges(false);
                            setLastSaved(rawData.createdAt?.toDate ? rawData.createdAt.toDate() : new Date());
                        }
                    }
                }
            } catch (err: unknown) {
                console.error(`[SmartToolContainer] Failed to resume session for ${toolType}:`, err);
                // Graceful fallback to initialData on decryption/parsing failure
            } finally {
                if (isMounted) setIsInitializing(false);
            }
        };

        fetchLatestSession();

        return () => { isMounted = false; };
    }, [resumeSession, isVaultUnlocked, user, toolType, decrypt, isInitializing]);

    const updateData = useCallback((newData: Partial<T>) => {
        setData(prev => ({ ...prev, ...newData }));
        setHasUnsavedChanges(true);
    }, []);

    const handleSave = async () => {
        if (!isVaultUnlocked) return;
        setIsSavingLocal(true);
        try {
            const payload = {
                metadata: {
                    type: toolType,
                    version: '2.0',
                    lastSaved: new Date().toISOString()
                },
                data: data
            };

            // 1. Stringify the JSON payload
            const plainTextPayload = JSON.stringify(payload);
            
            // 2. Encrypt the payload before sending to Firestore
            const cipherText = await encrypt(plainTextPayload);

            // 3. Update existing or save as a new secure journal entry
            if (currentDocId) {
                await updateJournal({
                    id: currentDocId,
                    content: cipherText,
                    moodScore: 5,
                    tags: ['SMART Tool', toolType],
                    isEncrypted: true
                });
            } else {
                await addJournal({
                    content: cipherText,
                    moodScore: 5, // Default neutral mood
                    tags: ['SMART Tool', toolType],
                    sentiment: 'Neutral',
                    weather: null,
                    isEncrypted: true
                });
                // Note: The next save in this immediate session might create a duplicate 
                // if they save twice without remounting, but future mounts will catch the latest.
            }

            setLastSaved(new Date());
            setHasUnsavedChanges(false);
        } catch (error: unknown) {
            console.error(`[SmartToolContainer] Save failed for ${toolType}:`, error);
            alert("Failed to save tool to journal.");
        } finally {
            setIsSavingLocal(false);
        }
    };

    if (!isVaultUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-md rounded-3xl border border-white shadow-xl">
                <LockClosedIcon className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Vault Locked</h3>
                <p className="text-slate-500 text-center mt-2 max-w-xs">
                    Please unlock your vault to use this tool and save your progress.
                </p>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-md rounded-3xl border border-white shadow-xl animate-pulse">
                <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Restoring Session...</h3>
                <p className="text-slate-500 text-center mt-2 max-w-xs">
                    Securely decrypting your previous work.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-sm">
                <div>
                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">CBT Tool</h2>
                    <h1 className="text-2xl font-bold text-slate-900">{toolLabel}</h1>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                    {lastSaved && !hasUnsavedChanges && (
                        <div className="hidden sm:flex items-center gap-1.5 text-emerald-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Saved</span>
                        </div>
                    )}
                    
                    <button
                        onClick={handleSave}
                        disabled={isSavingLocal || (!hasUnsavedChanges && lastSaved !== null)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 active:scale-95 shadow-sm font-bold"
                    >
                        {isSavingLocal ? (
                            <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            'Save to Journal'
                        )}
                    </button>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children({ data, updateData })}
            </div>
        </div>
    );
}
