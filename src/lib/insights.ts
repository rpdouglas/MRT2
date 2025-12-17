import { 
  collection, 
  addDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
// Make sure to import the type from gemini.ts
import type { AnalysisResult } from "./gemini";

const COLLECTION = 'insights';

// Updated Signature: Accepts just the UID and the Result Object
export async function saveInsight(uid: string, result: AnalysisResult) {
  if (!db) throw new Error("Database not initialized");

  await addDoc(collection(db, COLLECTION), {
    uid,
    analysis: result.analysis,
    sentiment: result.sentiment,
    actionableSteps: result.actionableSteps,
    createdAt: Timestamp.now()
  });
}