// src/hooks/useDeepPatternAnalysis.ts
import { useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, type Firestore } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { processInChunks } from '../lib/utils';
import { generateDeepPatternAnalysis, type DeepPatternResult } from '../lib/gemini';

interface UseDeepPatternAnalysisReturn {
    analyze: () => Promise<void>;
    loading: boolean;
    progress: number;
    result: DeepPatternResult | null;
    error: string | null;
    reset: () => void;
}

export function useDeepPatternAnalysis(): UseDeepPatternAnalysisReturn {
    const { user } = useAuth();
    const { decrypt } = useEncryption();
    
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<DeepPatternResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(async () => {
        if (!user || !db) return;
        
        setLoading(true);
        setError(null);
        setProgress(5); // Started

        try {
            const database: Firestore = db;
            
            // 1. Fetch last 30 entries directly from Firestore
            // We fetch specific fields to minimize bandwidth
            const q = query(
                collection(database, 'journals'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(30)
            );

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                setError("Not enough journal entries to analyze.");
                setLoading(false);
                return;
            }

            setProgress(20); // Fetched

            // 2. Process & Decrypt in Chunks (Prevent UI Freezing)
            const rawDocs = snapshot.docs.map(d => d.data());
            
            const decryptedEntries = await processInChunks(
                rawDocs,
                5, // Small chunk size for decryption safety
                async (docData) => {
                    let content = docData.content || "";
                    if (docData.isEncrypted) {
                        try {
                            content = await decrypt(docData.content);
                        } catch (e) {
                            console.error("Decryption failed for an entry:", e);
                            content = "[Skipped: Decryption Error]";
                        }
                    }
                    const date = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date();
                    return `Date: ${date.toLocaleDateString()}\nMood: ${docData.moodScore}\nContent: ${content}`;
                },
                (percent) => {
                    // Map 0-100% of processing to 20-70% of total progress
                    setProgress(20 + Math.floor(percent * 0.5));
                }
            );

            const combinedText = decryptedEntries.join('\n\n---\n\n');
            
            setProgress(75); // Sending to AI

            // 3. AI Analysis
            const aiResult = await generateDeepPatternAnalysis(combinedText);
            
            setResult(aiResult);
            setProgress(100);

        } catch (err) {
            console.error("Deep Pattern Analysis Failed:", err);
            setError("Analysis failed. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [user, decrypt]);

    const reset = () => {
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return {
        analyze,
        loading,
        progress,
        result,
        error,
        reset
    };
}