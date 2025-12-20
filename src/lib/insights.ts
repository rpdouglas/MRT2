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
import type { AnalysisResult } from "./gemini";

const COLLECTION = 'insights';

/**
 * Saves a new AI Insight to Firestore.
 * Updated to support the new "Recovery Compass" data structure.
 * @param uid - The User ID
 * @param result - The structured result from Gemini
 */
export async function saveInsight(uid: string, result: AnalysisResult) {
  if (!db) throw new Error("Database not initialized");

  await addDoc(collection(db, COLLECTION), {
    uid,
    createdAt: Timestamp.now(),
    
    // --- New Recovery Compass Fields ---
    sentiment: result.sentiment,
    mood: result.mood,
    summary: result.summary,                 // Replaces old 'analysis'
    risk_analysis: result.risk_analysis,
    positive_reinforcement: result.positive_reinforcement,
    tool_suggestions: result.tool_suggestions, // Replaces old 'actionableSteps'
    
    // Note: We no longer save 'analysis' or 'actionableSteps' because 
    // they don't exist on the new result object.
  });
}

/**
 * Fetches the history of AI Insights for a user, sorted by newest first.
 * Used by the Dashboard to show the "Latest Insight".
 */
export async function getInsightHistory(uid: string) {
  if (!db) throw new Error("Database not initialized");

  try {
    const q = query(
      collection(db, COLLECTION),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Safely convert Firestore Timestamp to JS Date
      createdAt: doc.data().createdAt?.toDate() || new Date() 
    }));

  } catch (e: any) {
    console.error("Error fetching insights:", e);
    // If we hit a Missing Index error (common with new collections),
    // warn the user to check the console.
    if (e.message && e.message.includes("index")) {
        console.warn("⚠️ MISSING INDEX: Open your browser console and click the Firebase link to create the index for 'insights'.");
    }
    return [];
  }
}