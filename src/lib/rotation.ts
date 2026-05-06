/**
 * src/lib/rotation.ts
 * NEW: Dedicated service for Zero-Knowledge PIN rotation and Crypto-Shredding.
 * SECURITY: Uses cursor-based pagination and batching to prevent memory overflow (PROJ-31).
 * FIX: Strong typing for Firestore database instance to resolve TS2345 in closures.
 */
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, deleteField, limit, startAfter, type Firestore, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { generateSalt, generateKey, computePinHash, encrypt, decrypt } from './crypto';

const BATCH_SIZE = 50;

/**
 * Permanently deletes all encrypted user data and destroys the encryption salt.
 */
export async function executeCryptoShredding(uid: string) {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;
    
    let opCount = 0;
    let currentBatch = writeBatch(database);
    const batchArray: Promise<void>[] = [];

    const commitBatch = () => {
        if (opCount > 0) {
            batchArray.push(currentBatch.commit());
            currentBatch = writeBatch(database);
            opCount = 0;
        }
    };

    // 1. Delete Journals (Cursor-based deletion)
    let lastJDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreJournals = true;
    while (hasMoreJournals) {
        let jQ = query(collection(database, 'journals'), where('uid', '==', uid), limit(500));
        if (lastJDoc) jQ = query(collection(database, 'journals'), where('uid', '==', uid), startAfter(lastJDoc), limit(500));
        
        const jSnap = await getDocs(jQ);
        if (jSnap.empty) {
            hasMoreJournals = false;
        } else {
            jSnap.docs.forEach(d => { 
                currentBatch.delete(d.ref); 
                opCount++; 
                if (opCount >= 450) commitBatch(); 
            });
            lastJDoc = jSnap.docs[jSnap.docs.length - 1];
        }
    }

    // 2. Delete Workbooks
    let lastWDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreWorkbooks = true;
    while (hasMoreWorkbooks) {
        let wQ = query(collection(database, 'users', uid, 'workbook_answers'), limit(500));
        if (lastWDoc) wQ = query(collection(database, 'users', uid, 'workbook_answers'), startAfter(lastWDoc), limit(500));
        
        const wSnap = await getDocs(wQ);
        if (wSnap.empty) {
            hasMoreWorkbooks = false;
        } else {
            wSnap.docs.forEach(d => { 
                currentBatch.delete(d.ref); 
                opCount++; 
                if (opCount >= 450) commitBatch(); 
            });
            lastWDoc = wSnap.docs[wSnap.docs.length - 1];
        }
    }

    // 3. Delete ROSC Assessments
    let lastRoscDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreRosc = true;
    while (hasMoreRosc) {
        let rQ = query(collection(database, 'users', uid, 'rosc_assessments'), limit(500));
        if (lastRoscDoc) rQ = query(collection(database, 'users', uid, 'rosc_assessments'), startAfter(lastRoscDoc), limit(500));

        const rSnap = await getDocs(rQ);
        if (rSnap.empty) {
            hasMoreRosc = false;
        } else {
            rSnap.docs.forEach(d => {
                currentBatch.delete(d.ref);
                opCount++;
                if (opCount >= 450) commitBatch();
            });
            lastRoscDoc = rSnap.docs[rSnap.docs.length - 1];
        }
    }

    // 4. Clear Profile Fields
    const pRef = doc(database, 'users', uid);
    currentBatch.update(pRef, { encryptionSalt: deleteField(), pinVerifier: deleteField() });
    opCount++;
    commitBatch();

    await Promise.all(batchArray);
}

/**
 * Safely rotates the master encryption key across all historical data using memory-safe chunking.
 */
export async function executePinRotation(
    uid: string,
    oldPin: string,
    newPin: string,
    currentSalt: string,
    currentVerifier: string | null,
    onProgress: (p: number) => void
): Promise<{ newSalt: string, newVerifier: string }> {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;

    // 1. Validate Old PIN
    if (currentVerifier) {
        const checkHash = await computePinHash(oldPin, currentSalt);
        if (checkHash !== currentVerifier) {
            throw new Error("INCORRECT_PIN");
        }
    }

    onProgress(2);

    // 2. Count Total Documents (for accurate progress bar)
    // In Firestore, we use size of aggregate query, but for simplicity and to save reads, 
    // we'll estimate progress based on batches processed. We will track total processed.
    let processedDocs = 0;
    // Assuming a rough estimate of total documents to drive the UI. 
    // For exact progress, you would run a COUNT() query here. We will set a generic progress flow.

    // 3. Generate New Key Material
    const newSalt = generateSalt();
    const newVerifier = await computePinHash(newPin, newSalt);

    try {
        // --- PROCESS JOURNALS ---
        let lastJDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let hasMoreJournals = true;
        
        while (hasMoreJournals) {
            let jQ = query(collection(database, 'journals'), where('uid', '==', uid), limit(BATCH_SIZE));
            if (lastJDoc) jQ = query(collection(database, 'journals'), where('uid', '==', uid), startAfter(lastJDoc), limit(BATCH_SIZE));
            
            const jSnap = await getDocs(jQ);
            if (jSnap.empty) {
                hasMoreJournals = false;
                continue;
            }

            const currentBatch = writeBatch(database);
            
            for (const document of jSnap.docs) {
                const data = document.data();
                if (data.isEncrypted && data.content) {
                    // Decrypt with OLD key
                    await generateKey(oldPin, currentSalt);
                    const plain = await decrypt(data.content);
                    if (plain.includes("Locked Content")) throw new Error("DECRYPTION_FAILED");
                    
                    // Encrypt with NEW key
                    await generateKey(newPin, newSalt);
                    const cipher = await encrypt(plain);
                    currentBatch.update(document.ref, { content: cipher });
                }
            }
            
            await currentBatch.commit();
            lastJDoc = jSnap.docs[jSnap.docs.length - 1];
            processedDocs += jSnap.docs.length;
            
            // Artificial progress scaling for UI (maxes out around 45% for journals)
            onProgress(Math.min(45, 5 + Math.floor((processedDocs / 100) * 5))); 
        }

        // --- PROCESS WORKBOOKS ---
        let lastWDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let hasMoreWorkbooks = true;
        let workbookProcessed = 0;

        while (hasMoreWorkbooks) {
            let wQ = query(collection(database, 'users', uid, 'workbook_answers'), limit(BATCH_SIZE));
            if (lastWDoc) wQ = query(collection(database, 'users', uid, 'workbook_answers'), startAfter(lastWDoc), limit(BATCH_SIZE));
            
            const wSnap = await getDocs(wQ);
            if (wSnap.empty) {
                hasMoreWorkbooks = false;
                continue;
            }

            const currentBatch = writeBatch(database);
            
            for (const document of wSnap.docs) {
                const data = document.data();
                if (data.isEncrypted && data.answer) {
                    // Decrypt with OLD key
                    await generateKey(oldPin, currentSalt);
                    const plain = await decrypt(data.answer);
                    if (plain.includes("Locked Content")) throw new Error("DECRYPTION_FAILED");
                    
                    // Encrypt with NEW key
                    await generateKey(newPin, newSalt);
                    const cipher = await encrypt(plain);
                    currentBatch.update(document.ref, { answer: cipher });
                }
            }
            
            await currentBatch.commit();
            lastWDoc = wSnap.docs[wSnap.docs.length - 1];
            workbookProcessed += wSnap.docs.length;
            
            // Artificial progress scaling for UI (scales from 45% to 90%)
            onProgress(Math.min(90, 45 + Math.floor((workbookProcessed / 100) * 5)));
        }

        // --- PROCESS ROSC ASSESSMENTS ---
        let lastRoscDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let hasMoreRosc = true;

        while (hasMoreRosc) {
            let rQ = query(collection(database, 'users', uid, 'rosc_assessments'), limit(BATCH_SIZE));
            if (lastRoscDoc) rQ = query(collection(database, 'users', uid, 'rosc_assessments'), startAfter(lastRoscDoc), limit(BATCH_SIZE));

            const rSnap = await getDocs(rQ);
            if (rSnap.empty) {
                hasMoreRosc = false;
                continue;
            }

            const currentBatch = writeBatch(database);

            for (const document of rSnap.docs) {
                const data = document.data();
                if (data.encryptedAIContext) {
                    await generateKey(oldPin, currentSalt);
                    const plain = await decrypt(data.encryptedAIContext);
                    if (plain.includes("Locked Content")) throw new Error("DECRYPTION_FAILED");

                    await generateKey(newPin, newSalt);
                    const cipher = await encrypt(plain);
                    currentBatch.update(document.ref, { encryptedAIContext: cipher });
                }
            }

            await currentBatch.commit();
            lastRoscDoc = rSnap.docs[rSnap.docs.length - 1];
        }

        // 4. Finalize Profile Updates
        await generateKey(newPin, newSalt); // Ensure app state rests on the new key
        const pRef = doc(database, 'users', uid);
        await writeBatch(database).update(pRef, { encryptionSalt: newSalt, pinVerifier: newVerifier }).commit();

        onProgress(100);
        return { newSalt, newVerifier };

    } catch (error) {
        // Safety Fallback: Rollback memory state to the old key
        await generateKey(oldPin, currentSalt);
        throw error;
    }
}