import { decrypt } from './crypto';
import type { FullUserData, JournalEntry } from './db';
import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';

// Type definition for jspdf-autotable extension
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
  autoTable: (options: UserOptions) => void;
}

/**
 * Helper to process an array in chunks to prevent UI blocking.
 */
async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (item: T) => Promise<R>,
  onProgress?: (progress: number) => void
): Promise<R[]> {
  const results: R[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    // Process chunk in parallel
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    
    processed += chunk.length;
    if (onProgress) {
      onProgress(Math.round((processed / items.length) * 100));
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * Decrypts sensitive fields in the user data.
 */
export async function prepareDataForExport(
  data: FullUserData, 
  onProgress: (percent: number) => void
): Promise<FullUserData> {
  
  // Decrypt Journals
  const decryptedJournals = await processInChunks(
    data.journals,
    20, // Batch size
    async (entry) => {
      if (entry.isEncrypted && entry.content) {
        try {
          const plainText = await decrypt(entry.content);
          return { ...entry, content: plainText, isEncrypted: false };
        } catch (e) {
          console.error(`Failed to decrypt journal ${entry.id}`, e);
          return { ...entry, content: "[DECRYPTION FAILED]", isEncrypted: true };
        }
      }
      return entry;
    },
    (p) => onProgress(Math.floor(p * 0.8)) // Map to 0-80% range
  );

  // Decrypt Workbook Answers
  // (Workbook structure is complex, usually 'answer' field is encrypted)
  const decryptedWorkbooks = await processInChunks(
    data.workbookAnswers,
    20,
    async (ans) => {
      // Check if this answer record matches our encryption pattern
      // Usually answer: { text: "...", isEncrypted: true }
      const anyAns = ans as Record<string, unknown>;
      // We assume simple key-value structure where values might be encrypted objects
      // For the export, we just iterate values
      const newAns = { ...anyAns };
      
      // Need to handle specific schema structure from WorkbookSession
      // If it's the 'answers' map:
      if (newAns.answers && typeof newAns.answers === 'object') {
         const ansMap = newAns.answers as Record<string, unknown>;
         const decryptedMap: Record<string, unknown> = {};
         
         for (const [key, val] of Object.entries(ansMap)) {
             if (val && typeof val === 'object' && 'isEncrypted' in val && (val as {isEncrypted: boolean}).isEncrypted) {
                 try {
                     // FIX: Double cast via unknown to allow access to 'text' property safely
                     const text = await decrypt((val as unknown as {text: string}).text);
                     decryptedMap[key] = text;
                 } catch {
                     decryptedMap[key] = "[LOCKED]";
                 }
             } else {
                 decryptedMap[key] = val;
             }
         }
         newAns.answers = decryptedMap;
      }
      return newAns;
    },
    (p) => onProgress(80 + Math.floor(p * 0.2)) // Map to 80-100% range
  );

  return {
    ...data,
    journals: decryptedJournals,
    workbookAnswers: decryptedWorkbooks
  };
}

/**
 * Generates a JSON file blob.
 */
export function generateJSON(data: FullUserData): Blob {
  const jsonStr = JSON.stringify(data, null, 2);
  return new Blob([jsonStr], { type: "application/json" });
}

/**
 * Generates a formatted PDF using jsPDF (Dynamic Import).
 */
export async function generatePDF(data: FullUserData): Promise<Blob> {
  // Dynamic Import to save bundle size
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.width;

  // 1. Title Page
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text("My Recovery Toolkit", pageWidth / 2, 40, { align: "center" });
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Personal Data Export", pageWidth / 2, 50, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 60, { align: "center" });
  
  if (data.profile?.email) {
    doc.text(`User: ${data.profile.email}`, pageWidth / 2, 65, { align: "center" });
  }

  doc.text("CONFIDENTIAL: This document contains unencrypted personal data.", pageWidth / 2, 80, { align: "center" });

  // 2. Journals Table
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Journal Entries", 14, 20);

  const journalRows = data.journals.map((j: JournalEntry) => {
    const date = j.createdAt?.toDate ? j.createdAt.toDate().toLocaleDateString() : 'Unknown';
    const mood = j.moodScore ? `${j.moodScore}/10` : '-';
    // Clean content slightly for PDF
    const content = j.content.replace(/\*\*/g, '').substring(0, 500) + (j.content.length > 500 ? '...' : '');
    return [date, mood, content];
  });

  autoTable(doc, {
    startY: 25,
    head: [['Date', 'Mood', 'Entry']],
    body: journalRows,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 15 },
      2: { cellWidth: 'auto' }
    }
  });

  // 3. Tasks
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Active Quests & Habits", 14, 20);

  const taskRows = data.tasks.map(t => [
    t.title,
    // FIX: Cast to any to bypass missing 'category' property definition in Task type
    (t as any).category,
    t.priority,
    t.isRecurring ? t.frequency : 'One-time',
    t.status || 'Pending'
  ]);

  autoTable(doc, {
    startY: 25,
    head: [['Title', 'Category', 'Priority', 'Frequency', 'Status']],
    body: taskRows,
  });

  return doc.output('blob');
}