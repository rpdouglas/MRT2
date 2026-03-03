/**
 * src/lib/rotation.ts
 * GITHUB COMMENT:
 * [rotation.ts]
 * NEW: Dedicated service for Zero-Knowledge PIN rotation and Crypto-Shredding.
 * SECURITY: Uses processInChunks to prevent UI thread freezing during massive AES-GCM operations.
 * FIX: Strong typing for Firestore database instance to resolve TS2345 in closures.
 */
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, deleteField, type Firestore } from 'firebase/firestore';
import { generateSalt, generateKey, computePinHash, encrypt, decrypt } from './crypto';
import { processInChunks } from './utils';

/**
 * Permanently deletes all encrypted user data and destroys the encryption salt.
 */
export async function executeCryptoShredding(uid: string) {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;
    
    const batchArray: Promise<void>[] = [];
    let currentBatch = writeBatch(database);
    let opCount = 0;

    const commitBatch = () => {
        if (opCount > 0) {
            batchArray.push(currentBatch.commit());
            currentBatch = writeBatch(database);
            opCount = 0;
        }
    };

    // 1. Delete Journals
    const jQ = query(collection(database, 'journals'), where('uid', '==', uid));
    const jSnap = await getDocs(jQ);
    jSnap.docs.forEach(d => {
        currentBatch.delete(d.ref);
        opCount++;
        if (opCount >= 450) commitBatch();
    });

    // 2. Delete Workbooks
    const wQ = query(collection(database, 'users', uid, 'workbook_answers'));
    const wSnap = await getDocs(wQ);
    wSnap.docs.forEach(d => {
        currentBatch.delete(d.ref);
        opCount++;
        if (opCount >= 450) commitBatch();
    });

    // 3. Clear Profile Fields
    const pRef = doc(database, 'users', uid);
    currentBatch.update(pRef, {
        encryptionSalt: deleteField(),
        pinVerifier: deleteField()
    });
    opCount++;
    commitBatch();

    await Promise.all(batchArray);
}

/**
 * Safely rotates the master encryption key across all historical data.
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

    onProgress(5);

    // 2. Fetch Data
    const jQ = query(collection(database, 'journals'), where('uid', '==', uid));
    const jSnap = await getDocs(jQ);
    const journals = jSnap.docs.map(d => ({ ref: d.ref, data: d.data() }));

    const wQ = query(collection(database, 'users', uid, 'workbook_answers'));
    const wSnap = await getDocs(wQ);
    const workbooks = wSnap.docs.map(d => ({ ref: d.ref, data: d.data() }));

    onProgress(15);

    // 3. Decrypt in memory
    await generateKey(oldPin, currentSalt); // Ensure old key is active for decryption

    const decryptedJournals = await processInChunks(journals, 20, async (item) => {
        if (item.data.isEncrypted && item.data.content) {
            const plain = await decrypt(item.data.content);
            if (plain.includes("Locked Content")) throw new Error("DECRYPTION_FAILED");
            return { ...item, plainContent: plain };
        }
        return { ...item, plainContent: null };
    }, (p) => onProgress(15 + Math.floor(p * 0.35)));

    const decryptedWorkbooks = await processInChunks(workbooks, 20, async (item) => {
        if (item.data.isEncrypted && item.data.answer) {
            const plain = await decrypt(item.data.answer);
            if (plain.includes("Locked Content")) throw new Error("DECRYPTION_FAILED");
            return { ...item, plainAnswer: plain };
        }
        return { ...item, plainAnswer: null };
    }, (p) => onProgress(50 + Math.floor(p * 0.15)));

    // 4. Generate New Key
    const newSalt = generateSalt();
    const newVerifier = await computePinHash(newPin, newSalt);
    await generateKey(newPin, newSalt); // Switches the globalKey to the new PIN

    try {
        // 5. Re-Encrypt
        const reEncryptedJournals = await processInChunks(decryptedJournals, 20, async (item) => {
            if (item.plainContent) {
                const cipher = await encrypt(item.plainContent);
                return { ref: item.ref, updates: { content: cipher } };
            }
            return null;
        }, (p) => onProgress(65 + Math.floor(p * 0.20)));

        const reEncryptedWorkbooks = await processInChunks(decryptedWorkbooks, 20, async (item) => {
            if (item.plainAnswer) {
                const cipher = await encrypt(item.plainAnswer);
                return { ref: item.ref, updates: { answer: cipher } };
            }
            return null;
        }, (p) => onProgress(85 + Math.floor(p * 0.10)));

        // 6. Batch Write
        const batchArray: Promise<void>[] = [];
        let currentBatch = writeBatch(database);
        let opCount = 0;

        const commitBatch = () => {
            if (opCount > 0) {
                batchArray.push(currentBatch.commit());
                currentBatch = writeBatch(database);
                opCount = 0;
            }
        };

        reEncryptedJournals.forEach(j => {
            if (j) {
                currentBatch.update(j.ref, j.updates);
                opCount++;
                if (opCount >= 450) commitBatch();
            }
        });

        reEncryptedWorkbooks.forEach(w => {
            if (w) {
                currentBatch.update(w.ref, w.updates);
                opCount++;
                if (opCount >= 450) commitBatch();
            }
        });

        const pRef = doc(database, 'users', uid);
        currentBatch.update(pRef, {
            encryptionSalt: newSalt,
            pinVerifier: newVerifier
        });
        opCount++;
        commitBatch();

        await Promise.all(batchArray);
        onProgress(100);

        return { newSalt, newVerifier };
    } catch (error) {
        // Safety Fallback: Rollback memory state if encryption or upload fails
        await generateKey(oldPin, currentSalt);
        throw error;
    }
}
