/**
 * src/lib/insights.ts
 * GITHUB COMMENT:
 * [insights.ts]
 * UPDATED: Added 'strengths' field to InsightPayload to support Weekly/Monthly wins.
 */
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import type { AnalysisResult, WorkbookAnalysisResult } from "./gemini";

const COLLECTION = 'insights';

// --- DEFINITIONS ---

export type InsightType = 'journal' | 'workbook';

// Combined type for what we save to Firestore
export type InsightPayload = 
  | ({ type: 'journal'; strengths?: string[] } & AnalysisResult)
  | ({ type: 'workbook' } & WorkbookAnalysisResult);

// The hydrated object returned to the UI
export type SavedInsight = InsightPayload & {
  id: string;
  uid: string;
  createdAt: Date;
};

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