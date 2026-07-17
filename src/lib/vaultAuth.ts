/**
 * src/lib/vaultAuth.ts
 * PROJ-65: Client wrapper for the verifyVaultPin Cloud Function.
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

interface VerifyVaultPinResponse {
    pepper: string;
}

export class VaultPinLockedError extends Error {}
export class VaultPinIncorrectError extends Error {}

/**
 * Exchanges a locally-computed PIN hash (never the raw PIN) for the
 * rate-limited server pepper used to derive the actual vault key.
 * Throws VaultPinLockedError if the account is in a lockout window, or
 * VaultPinIncorrectError if the hash doesn't match the stored verifier.
 */
export async function fetchVaultPepper(pinHash: string): Promise<string> {
    const fn = httpsCallable<{ pinHash: string }, VerifyVaultPinResponse>(getFunctionsInstance(), 'verifyVaultPin');
    try {
        const result = await fn({ pinHash });
        return result.data.pepper;
    } catch (error) {
        if (error instanceof FunctionsError) {
            if (error.code === 'functions/resource-exhausted') throw new VaultPinLockedError(error.message);
            if (error.code === 'functions/permission-denied') throw new VaultPinIncorrectError(error.message);
        }
        throw error;
    }
}
