/**
 * src/lib/analytics.ts
 * GITHUB COMMENT:
 * [analytics.ts]
 * NEW: Dedicated service for logging system metrics.
 * HANDLES: Asynchronous writes to 'ai_logs' collection for Gemini token usage tracking.
 */
import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface TokenUsage {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
}

export interface AILogEntry {
    uid: string;
    model: string;
    context: string; // e.g., 'journal_analysis', 'workbook_coach'
    timestamp: Timestamp;
    usage: TokenUsage;
}

/**
 * Logs AI usage metrics to Firestore.
 * This is a "fire-and-forget" operation to avoid blocking the UI.
 * * @param uid - User ID (or 'anonymous')
 * @param model - Model name (e.g. 'gemini-2.5-flash')
 * @param context - Feature context triggering the call
 * @param usage - Token counts from the API response
 */
export async function logAIUsage(
    uid: string, 
    model: string, 
    context: string, 
    usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
) {
    if (!db) return;

    try {
        const usageData: TokenUsage = {
            promptTokens: usage?.promptTokenCount || 0,
            candidatesTokens: usage?.candidatesTokenCount || 0,
            totalTokens: usage?.totalTokenCount || 0
        };

        const entry: AILogEntry = {
            uid,
            model,
            context,
            timestamp: Timestamp.now(),
            usage: usageData
        };

        // Fire and forget - do not await
        addDoc(collection(db, 'ai_logs'), entry).catch(err => {
            console.warn("Failed to log AI usage:", err);
        });

    } catch (error) {
        // Silently fail to not disrupt user experience
        console.warn("Analytics error:", error);
    }
}