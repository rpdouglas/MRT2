/**
 * src/lib/__tests__/vaultAuth.test.ts
 * PROJ-73 Phase 3: fetchVaultPepper's error mapping had zero coverage —
 * confirms the FunctionsError → VaultPinLockedError/VaultPinIncorrectError
 * translation actually happens, and that everything else passes through
 * unmapped. FunctionsError is left as the real class (not mocked) so
 * `instanceof` checks in the source under test behave exactly as they do
 * against a genuine SDK failure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionsError, httpsCallable } from 'firebase/functions';
import { fetchVaultPepper, VaultPinLockedError, VaultPinIncorrectError } from '../vaultAuth';

vi.mock('../firebase', () => ({ default: {} }));

vi.mock('firebase/functions', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/functions')>();
    return {
        ...actual,
        getFunctions: vi.fn(() => ({})),
        connectFunctionsEmulator: vi.fn(),
        httpsCallable: vi.fn(),
    };
});

describe('fetchVaultPepper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the pepper on success', async () => {
        const callable = vi.fn().mockResolvedValue({ data: { pepper: 'the-pepper' } });
        vi.mocked(httpsCallable).mockReturnValue(callable as unknown as ReturnType<typeof httpsCallable>);

        await expect(fetchVaultPepper('a'.repeat(64))).resolves.toBe('the-pepper');
        expect(callable).toHaveBeenCalledWith({ pinHash: 'a'.repeat(64) });
    });

    it('maps functions/resource-exhausted to VaultPinLockedError', async () => {
        const callable = vi.fn().mockRejectedValue(new FunctionsError('resource-exhausted', 'Too many attempts.'));
        vi.mocked(httpsCallable).mockReturnValue(callable as unknown as ReturnType<typeof httpsCallable>);

        await expect(fetchVaultPepper('a'.repeat(64))).rejects.toBeInstanceOf(VaultPinLockedError);
    });

    it('maps functions/permission-denied to VaultPinIncorrectError', async () => {
        const callable = vi.fn().mockRejectedValue(new FunctionsError('permission-denied', 'Incorrect PIN.'));
        vi.mocked(httpsCallable).mockReturnValue(callable as unknown as ReturnType<typeof httpsCallable>);

        await expect(fetchVaultPepper('a'.repeat(64))).rejects.toBeInstanceOf(VaultPinIncorrectError);
    });

    it('rethrows other FunctionsError codes unmapped', async () => {
        const original = new FunctionsError('failed-precondition', 'Vault verifier not initialized.');
        const callable = vi.fn().mockRejectedValue(original);
        vi.mocked(httpsCallable).mockReturnValue(callable as unknown as ReturnType<typeof httpsCallable>);

        await expect(fetchVaultPepper('a'.repeat(64))).rejects.toBe(original);
    });

    it('rethrows a non-FunctionsError unmapped', async () => {
        const original = new Error('network down');
        const callable = vi.fn().mockRejectedValue(original);
        vi.mocked(httpsCallable).mockReturnValue(callable as unknown as ReturnType<typeof httpsCallable>);

        await expect(fetchVaultPepper('a'.repeat(64))).rejects.toBe(original);
    });
});
