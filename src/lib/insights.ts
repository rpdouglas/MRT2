/**
 * src/lib/insights.ts
 * GITHUB COMMENT:
 * [insights.ts]
 * UPDATED: Extended InsightPayload to natively support rich array data from Deep Dives.
 */
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { WorkbookAnalysisResult } from "./gemini";

const COLLECTION = 'insights';

// --- DEFINITIONS ---

// Combined type for what we save to Firestore. The 'journal' variant mirrors
// the same scope_context/summary/pillars/suggested_actions base shape used by
// the 'workbook' variant (JournalAnalysisWizard's comparative and deep-pattern
// analyses both save through it), but pillars.growth replaces
// pillars.emotional_resonance — InsightsLog.tsx already reads both field names
// for exactly this reason.
export type InsightPayload =
  | {
      type: 'journal';
      scope_context: string;
      summary: string;
      pillars: { understanding: string; growth: string; blind_spots: string };
      suggested_actions: string[];
      risks?: string[];
      strengths?: string[];
      key_themes?: string[];
      hidden_correlations?: string[];
      relapse_risk_level?: string;
      trajectory?: string;
      core_triggers?: string[];
      emotional_velocity?: string;
    }
  | ({ type: 'workbook' } & WorkbookAnalysisResult);

// The hydrated object returned to the UI
export type SavedInsight = InsightPayload & { id: string; uid: string; createdAt: Date; };

/**
 * Saves a new AI Insight to Firestore.
 */
export async function saveInsight(uid: string, payload: InsightPayload) {
  if (!db) throw new Error("Database not initialized");

  await addDoc(collection(db, COLLECTION), {
    uid,
    createdAt: Timestamp.now(),
    ...payload
  });
}

/**
 * Fetches the history of AI Insights for a user.
 */
export async function getInsightHistory(uid: string): Promise<SavedInsight[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const q = query(
      collection(db, COLLECTION),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const type = data.type || 'journal';

      return {
        ...data, 
        id: doc.id,
        uid: data.uid,
        type,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as SavedInsight;
    });

  } catch (e: unknown) {
    console.error("Error fetching insights:", e);
    const err = e as { message?: string };
    if (err.message && err.message.includes("index")) {
        console.warn("⚠️ MISSING INDEX: Open your browser console and click the Firebase link to create the index for 'insights'.");
    }
    return [];
  }
}
