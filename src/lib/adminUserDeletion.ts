/**
 * src/lib/adminUserDeletion.ts
 * PROJ-121: Client wrapper for the admin-only deleteUserAccount Cloud
 * Function. Mirrors vaultAuth.ts's httpsCallable wrapper pattern.
 */
import { getFunctions, httpsCallable, connectFunctionsEmulator, FunctionsError } from 'firebase/functions';
import app from './firebase';

const USE_EMULATORS = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true';

let functionsInstance: ReturnType<typeof getFunctions> | null = null;

function getFunctionsInstance() {
    if (!functionsInstance) {
        if (!app) {
            throw new Error("Firebase app is not initialized");
        }
        functionsInstance = getFunctions(app, 'northamerica-northeast1');
        if (USE_EMULATORS) {
            connectFunctionsEmulator(functionsInstance, "127.0.0.1", 5001);
        }
    }
    return functionsInstance;
}

export interface DeleteUserAccountRequest {
    targetUid: string;
    purgeFirestoreData: boolean;
    deleteAuthRecord: boolean;
}

interface DeleteUserAccountResponse {
    success: boolean;
    documentsDeletedCount: number;
}

export class AdminDeletionError extends Error {}

/**
 * Deletes another user's data and/or Auth record. Admin-only (enforced
 * server-side via the caller's `admin` custom claim) — this always calls
 * the Cloud Function, never Firestore directly, since firestore.rules
 * deliberately does not grant admin delete rights on most user-data
 * collections (see docs/projects/121_ADMIN_USER_DELETION.md).
 */
export async function deleteUserAccount(request: DeleteUserAccountRequest): Promise<DeleteUserAccountResponse> {
    const fn = httpsCallable<DeleteUserAccountRequest, DeleteUserAccountResponse>(getFunctionsInstance(), 'deleteUserAccount');
    try {
        const result = await fn(request);
        return result.data;
    } catch (error) {
        if (error instanceof FunctionsError) {
            throw new AdminDeletionError(error.message);
        }
        throw error;
    }
}
