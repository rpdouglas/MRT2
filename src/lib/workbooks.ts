// REMOVED 'updateDoc' from the import list below
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Data structure for Firestore:
// users/{uid}/workbook_answers/{workbookId}_{sectionId}
// Document contains: { [questionId]: "Answer text", lastUpdated: timestamp }

export interface WorkbookProgress {
  [questionId: string]: string;
}

export async function saveAnswer(uid: string, workbookId: string, sectionId: string, questionId: string, answer: string) {
  if (!db) throw new Error("Firestore database is not initialized");

  const docId = `${workbookId}_${sectionId}`;
  const docRef = doc(db, 'users', uid, 'workbook_answers', docId);

  // Use setDoc with merge: true to create if not exists or update if exists
  await setDoc(docRef, {
    [questionId]: answer,
    lastUpdated: new Date()
  }, { merge: true });
}

export async function getSectionAnswers(uid: string, workbookId: string, sectionId: string): Promise<WorkbookProgress> {
  if (!db) throw new Error("Firestore database is not initialized");

  const docId = `${workbookId}_${sectionId}`;
  const docRef = doc(db, 'users', uid, 'workbook_answers', docId);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return snapshot.data() as WorkbookProgress;
  }
  return {};
}

// Helper to check completion status for a section
export async function getSectionCompletion(uid: string, workbookId: string, sectionId: string, totalQuestions: number): Promise<number> {
  const answers = await getSectionAnswers(uid, workbookId, sectionId);
  const answeredCount = Object.keys(answers).filter(k => k !== 'lastUpdated').length;
  
  if (totalQuestions === 0) return 0;
  
  return Math.round((answeredCount / totalQuestions) * 100);
}