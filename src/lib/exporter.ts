// src/lib/exporter.ts
import { decrypt } from './crypto';
import type { FullUserData, JournalEntry, Task } from './db';
import { processInChunks } from './utils';
import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';

// Type definition for jspdf-autotable extension
interface jsPDFWithAutoTable extends jsPDF { lastAutoTable: { finalY: number; };
  autoTable: (options: UserOptions) => void;
}

/**
 * Decrypts sensitive fields in the user data using the shared chunk processor.
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
    (p) => onProgress(Math.floor(p * 0.6)) // Map to 0-60% range
  );

  // Decrypt Workbook Answers
  // TD-26: this previously checked for a nested `entry.answers` map
  // ({[questionId]: {isEncrypted, text}}) that never matched the real
  // users/{uid}/workbook_answers doc shape — one flat doc per question
  // ({workbookId, sectionId, questionId, answer, isEncrypted}), confirmed
  // via src/lib/workbookAnswers.ts and fetchAllUserData in db.ts. The branch
  // never fired, so a real export's workbook `answer` field shipped as raw
  // ciphertext — silently, unlike journals/game-progress above, which do
  // decrypt correctly. Mirrors the journal decrypt pattern exactly now.
  const decryptedWorkbooks = await processInChunks(
    data.workbookAnswers,
    20,
    async (ans) => {
      const anyAns = ans as Record<string, unknown>;
      if (anyAns.isEncrypted && typeof anyAns.answer === 'string') {
        try {
          const plainText = await decrypt(anyAns.answer);
          return { ...anyAns, answer: plainText, isEncrypted: false };
        } catch (e) {
          console.error(`Failed to decrypt workbook answer ${String(anyAns.id)}`, e);
          return { ...anyAns, answer: "[DECRYPTION FAILED]", isEncrypted: true };
        }
      }
      return anyAns;
    },
    (p) => onProgress(60 + Math.floor(p * 0.2)) // Map to 60-80% range
  );

  // Decrypt Recovery Games history (PROJ-72 Phase 7)
  const decryptedGameProgress = await processInChunks(
    data.gameProgress,
    20,
    async (record) => {
      const raw = record as Record<string, unknown>;
      const { encryptedStats, encryptedReflection, ...rest } = raw;
      const result: Record<string, unknown> = { ...rest };

      if (typeof encryptedStats === 'string') {
        try {
          result.stats = JSON.parse(await decrypt(encryptedStats));
        } catch (e) {
          console.error(`Failed to decrypt game_progress stats ${String(rest.id)}`, e);
          result.stats = '[DECRYPTION FAILED]';
        }
      }

      if (typeof encryptedReflection === 'string') {
        try {
          result.reflection = await decrypt(encryptedReflection);
        } catch (e) {
          console.error(`Failed to decrypt game_progress reflection ${String(rest.id)}`, e);
          result.reflection = '[DECRYPTION FAILED]';
        }
      }

      return result;
    },
    (p) => onProgress(80 + Math.floor(p * 0.2)) // Map to 80-100% range
  );

  return { ...data, journals: decryptedJournals, workbookAnswers: decryptedWorkbooks, gameProgress: decryptedGameProgress };
}

/**
 * Generates a JSON file blob.
 */
export function generateJSON(data: FullUserData): Blob { const jsonStr = JSON.stringify(data, null, 2); return new Blob([jsonStr], { type: "application/json" }); }

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

  const taskRows = data.tasks.map(t => {
    // Safely access 'category'
    const category = (t as Task & { category?: string }).category || 'General';

    return [
      t.title,
      category,
      t.priority,
      t.isRecurring ? t.frequency : 'One-time',
      t.status || 'Pending'
    ];
  });

  autoTable(doc, { startY: 25, head: [['Title', 'Category', 'Priority', 'Frequency', 'Status']], body: taskRows, });

  // 4. Recovery Games (PROJ-72 Phase 7)
  if (data.gameProgress.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Recovery Games", 14, 20);

    const gameRows = data.gameProgress.map((g) => {
      const record = g as Record<string, unknown>;
      const createdAt = record.createdAt as { toDate?: () => Date } | undefined;
      const date = createdAt?.toDate ? createdAt.toDate().toLocaleDateString() : 'Unknown';
      const gameId = typeof record.gameId === 'string' ? record.gameId : 'Unknown';
      const score = typeof record.score === 'number' ? String(record.score) : '-';
      return [date, gameId, score];
    });

    autoTable(doc, { startY: 25, head: [['Date', 'Game', 'Score']], body: gameRows });
  }

  return doc.output('blob');
}