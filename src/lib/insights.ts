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

// Define a discriminated union for the two types of insights
export type InsightType = 'journal' | 'workbook';

// Combined type for what we save to Firestore
export type InsightPayload = 
  | ({ type: 'journal' } & AnalysisResult)
  | ({ type: 'workbook' } & WorkbookAnalysisResult);

// The hydrated object returned to the UI (includes ID and Dates)
export type SavedInsight = InsightPayload & {
  id: string;
  uid: string;
  createdAt: Date;
};

/**
 * Saves a new AI Insight to Firestore.
 * Supports both Journal Analysis and Workbook Analysis via discriminated union.
 * * @param uid - The User ID
 * @param payload - The structured result from Gemini + type ('journal' | 'workbook')
 */
export async function saveInsight(uid: string, payload: InsightPayload) {
  if (!db) throw new Error("Database not initialized");

  // We spread the payload directly. 
  // Firestore will store the 'type' field and all specific fields (mood vs pillars).
  await addDoc(collection(db, COLLECTION), {
    uid,
    createdAt: Timestamp.now(),
    ...payload
  });
}

/**
 * Fetches the history of AI Insights for a user, sorted by newest first.
 * Handles backward compatibility for old records (defaults to 'journal').
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
      
      // Backward Compatibility:
      // If 'type' is missing, it's a legacy Journal Insight.
      const type = data.type || 'journal';

      return {
        id: doc.id,
        uid: data.uid,
        type,
        createdAt: data.createdAt?.toDate() || new Date(),
        ...data
      } as SavedInsight;
    });

  } catch (e: unknown) {
    console.error("Error fetching insights:", e);
    
    // Check for Missing Index error
    const err = e as { message?: string };
    if (err.message && err.message.includes("index")) {
        console.warn("⚠️ MISSING INDEX: Open your browser console and click the Firebase link to create the index for 'insights'.");
    }
    return [];
  }
}