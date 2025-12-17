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

export interface AIInsight {
  id?: string;
  uid: string;
  analysisText: string; // The text returned by Gemini
  suggestedActions: string[]; // Parsed actionable items
  dateRangeStart: Date;
  dateRangeEnd: Date;
  createdAt: Date;
}

const COLLECTION = 'insights';

// Save a new AI Analysis
export async function saveInsight(
  uid: string, 
  analysisText: string, 
  suggestedActions: string[],
  startDate: Date,
  endDate: Date
) {
  if (!db) throw new Error("Database not initialized");

  await addDoc(collection(db, COLLECTION), {
    uid,
    analysisText,
    suggestedActions,
    dateRangeStart: Timestamp.fromDate(startDate),
    dateRangeEnd: Timestamp.fromDate(endDate),
    createdAt: Timestamp.now()
  });
}

// Get Insight History (The Log)
export async function getInsightHistory(uid: string) {
  if (!db) throw new Error("Database not initialized");

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dateRangeStart: doc.data().dateRangeStart.toDate(),
    dateRangeEnd: doc.data().dateRangeEnd.toDate(),
    createdAt: doc.data().createdAt.toDate()
  })) as AIInsight[];
}