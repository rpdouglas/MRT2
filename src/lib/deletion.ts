/**
 * src/lib/deletion.ts
 * PURPOSE: Handles the "Right to be Forgotten" account shredding logic.
 * SECURITY: Batch deletes all metadata and encrypted blobs tied to a UID before Auth deletion.
 */
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, type Firestore, type DocumentReference } from 'firebase/firestore';

export async function executeTotalAccountAnnihilation(uid: string, onProgress?: (msg: string) => void) {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;
    const refsToDelete: DocumentReference[] = [];

    // Helper to query and collect refs
    const collectRefs = async (colName: string, isSubcollection: boolean = false) => {
        if (onProgress) onProgress(`Scanning ${colName}...`);
        try {
            let q;
            if (isSubcollection) {
                q = collection(database, 'users', uid, colName);
            } else {
                q = query(collection(database, colName), where('uid', '==', uid));
            }
            const snap = await getDocs(q);
            snap.docs.forEach(d => refsToDelete.push(d.ref));
        } catch (e) {
            console.warn(`Failed to scan ${colName} during deletion`, e);
        }
    };

    // 1. Scan Root Collections
    await collectRefs('journals');
    await collectRefs('tasks');
    await collectRefs('insights');
    await collectRefs('ai_logs');
    await collectRefs('feedback');
    
    // 2. Scan Subcollections
    await collectRefs('workbook_answers', true);
    await collectRefs('templates', true);

    // 3. Target the main user profile document
    refsToDelete.push(doc(database, 'users', uid));

    if (onProgress) onProgress(`Destroying ${refsToDelete.length} records...`);

    // 4. Execute Chunked Deletion (Max 500 per batch, using 450 for safety)
    let currentBatch = writeBatch(database);
    let opCount = 0;
    const batchPromises: Promise<void>[] = [];

    for (const ref of refsToDelete) {
        currentBatch.delete(ref);
        opCount++;
        if (opCount >= 450) {
            batchPromises.push(currentBatch.commit());
            currentBatch = writeBatch(database);
            opCount = 0;
        }
    }
    
    if (opCount > 0) {
        batchPromises.push(currentBatch.commit());
    }

    await Promise.all(batchPromises);
    
    if (onProgress) onProgress("Account data annihilated.");
}
