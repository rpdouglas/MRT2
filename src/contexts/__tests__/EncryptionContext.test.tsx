/**
 * src/contexts/__tests__/EncryptionContext.test.tsx
 * PROJ-73 Phase 2: direct coverage of the vault orchestration layer itself
 * (setupVault/performUnlock/changePin) — every other test in the codebase
 * mocks useEncryption() wholesale, so the peppered-vs-legacy branching, the
 * pepper fallback, and the sessionStorage caching had zero coverage anywhere.
 * crypto.ts is left un-mocked (real PBKDF2/AES-GCM/HMAC round-trips via
 * jsdom's WebCrypto), matching rotation.test.ts's precedent for this
 * subsystem. Only the I/O boundaries (Auth, Firestore, vaultAuth's network
 * call, rotation.ts) are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
import * as firestore from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { EncryptionProvider, useEncryption } from '../EncryptionContext';
import * as AuthContext from '../AuthContext';
import { generateKey, generateSalt, encrypt, clearKey } from '../../lib/crypto';
import { fetchVaultPepper, VaultPinLockedError } from '../../lib/vaultAuth';
import { executePinRotation } from '../../lib/rotation';

const TEST_UID = 'test-uid-73';
const PIN = '1234';
// Valid base64 for "test-pepper-value" — same fixed mock pepper rotation.test.ts uses.
const MOCK_PEPPER = 'dGVzdC1wZXBwZXItdmFsdWU=';

vi.mock('../AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('../../lib/vaultAuth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../lib/vaultAuth')>();
    return { ...actual, fetchVaultPepper: vi.fn() };
});

vi.mock('../../lib/rotation', () => ({
    executePinRotation: vi.fn(),
    executeCryptoShredding: vi.fn(),
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual as Record<string, unknown>,
        doc: vi.fn(() => ({ __ref: 'user-doc' })),
        getDoc: vi.fn(),
        setDoc: vi.fn().mockResolvedValue(undefined),
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        limit: vi.fn(),
        getDocs: vi.fn(),
    };
});

type EncryptionResult = ReturnType<typeof useEncryption>;

function mockUserDoc(exists: boolean, data: Record<string, unknown> = {}) {
    return { exists: () => exists, data: () => data } as unknown as Awaited<ReturnType<typeof firestore.getDoc>>;
}

function mockJournalSnapshot(docs: Array<Record<string, unknown>>) {
    return {
        empty: docs.length === 0,
        docs: docs.map((data) => ({ data: () => data })),
    } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>;
}

async function renderVault(): Promise<RenderHookResult<EncryptionResult, unknown>['result']> {
    const { result } = renderHook(() => useEncryption(), { wrapper: EncryptionProvider });
    await waitFor(() => expect(result.current.vaultLoading).toBe(false));
    return result;
}

/** Sets up a fresh peppered vault, then locks it — the realistic starting
 * point for every unlock test below (mirrors setup -> lock -> unlock). */
async function setupAndLock(result: RenderHookResult<EncryptionResult, unknown>['result'], pepper: string = MOCK_PEPPER) {
    vi.mocked(fetchVaultPepper).mockResolvedValue(pepper);
    await act(async () => { await result.current.setupVault(PIN); });
    act(() => { result.current.lockVault(); });
    vi.mocked(fetchVaultPepper).mockClear();
    vi.mocked(firestore.setDoc).mockClear();
}

describe('EncryptionProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        clearKey();

        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: TEST_UID, email: 'walt@example.com' } as unknown as User,
        } as unknown as ReturnType<typeof AuthContext.useAuth>);

        // Default: no vault doc yet, so checkVaultStatus's mount effect
        // resolves isVaultSet=false quickly and doesn't interfere.
        vi.mocked(firestore.getDoc).mockResolvedValue(mockUserDoc(false));
        vi.mocked(firestore.getDocs).mockResolvedValue(mockJournalSnapshot([]));
    });

    describe('setupVault', () => {
        it('derives the peppered scheme and persists usesPepperV2', async () => {
            vi.mocked(fetchVaultPepper).mockResolvedValue(MOCK_PEPPER);
            const result = await renderVault();

            await act(async () => { await result.current.setupVault(PIN); });

            expect(fetchVaultPepper).toHaveBeenCalledTimes(1);
            expect(firestore.setDoc).toHaveBeenCalledWith(expect.anything(), { usesPepperV2: true }, { merge: true });
            expect(result.current.isVaultSet).toBe(true);
            expect(result.current.isVaultUnlocked).toBe(true);
            expect(sessionStorage.getItem('mrt_vault_pepper')).toBe(MOCK_PEPPER);

            // Real round-trip proof the peppered key actually works, not just
            // that the right functions were called.
            const cipher = await result.current.encrypt('probe');
            await expect(result.current.decrypt(cipher)).resolves.toBe('probe');
        });

        it('falls back to legacy derivation without marking usesPepperV2 if the pepper fetch fails', async () => {
            vi.mocked(fetchVaultPepper).mockRejectedValue(new Error('offline'));
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = await renderVault();

            await act(async () => { await result.current.setupVault(PIN); });

            expect(warnSpy).toHaveBeenCalledWith('Vault pepper setup failed, falling back to legacy derivation:', expect.any(Error));
            expect(firestore.setDoc).not.toHaveBeenCalledWith(expect.anything(), { usesPepperV2: true }, { merge: true });
            // Setup still succeeds via the fallback — this is documented,
            // intended behavior (self-heals on next PIN rotation), not a failure.
            expect(result.current.isVaultUnlocked).toBe(true);

            const cipher = await result.current.encrypt('probe');
            await expect(result.current.decrypt(cipher)).resolves.toBe('probe');

            warnSpy.mockRestore();
        });
    });

    describe('unlockVault (performUnlock)', () => {
        it('peppered vault with no cached pepper fetches once and unlocks', async () => {
            const result = await renderVault();
            await setupAndLock(result);
            vi.mocked(fetchVaultPepper).mockResolvedValue(MOCK_PEPPER);

            let unlockResult: boolean | undefined;
            await act(async () => { unlockResult = await result.current.unlockVault(PIN); });

            expect(unlockResult).toBe(true);
            expect(fetchVaultPepper).toHaveBeenCalledTimes(1);
            expect(sessionStorage.getItem('mrt_vault_pepper')).toBe(MOCK_PEPPER);
            expect(result.current.isVaultUnlocked).toBe(true);
        });

        it('reuses a cached pepper without re-fetching', async () => {
            const result = await renderVault();
            await setupAndLock(result);
            // lockVault() clears the session pepper cache — simulate a same-session
            // reload where it was somehow still present (or a second unlock call).
            sessionStorage.setItem('mrt_vault_pepper', MOCK_PEPPER);

            await act(async () => { await result.current.unlockVault(PIN); });

            expect(fetchVaultPepper).not.toHaveBeenCalled();
            expect(result.current.isVaultUnlocked).toBe(true);
        });

        it('legacy (pre-PROJ-65) vault never calls fetchVaultPepper on unlock', async () => {
            const result = await renderVault();
            vi.mocked(fetchVaultPepper).mockRejectedValue(new Error('offline'));
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            await act(async () => { await result.current.setupVault(PIN); }); // falls back to legacy
            warnSpy.mockRestore();
            act(() => { result.current.lockVault(); });
            vi.mocked(fetchVaultPepper).mockClear();

            await act(async () => { await result.current.unlockVault(PIN); });

            expect(fetchVaultPepper).not.toHaveBeenCalled();
            expect(result.current.isVaultUnlocked).toBe(true);
        });

        it('wrong PIN fails closed without ever contacting the pepper endpoint', async () => {
            const result = await renderVault();
            await setupAndLock(result);

            let unlockResult: boolean | undefined;
            await act(async () => { unlockResult = await result.current.unlockVault('0000'); });

            expect(unlockResult).toBe(false);
            expect(fetchVaultPepper).not.toHaveBeenCalled();
            expect(result.current.isVaultUnlocked).toBe(false);
        });

        it('propagates VaultPinLockedError instead of swallowing it', async () => {
            const result = await renderVault();
            await setupAndLock(result);
            vi.mocked(fetchVaultPepper).mockRejectedValue(new VaultPinLockedError('Too many attempts'));

            let caught: unknown;
            await act(async () => {
                try {
                    await result.current.unlockVault(PIN);
                } catch (e) {
                    caught = e;
                }
            });

            expect(caught).toBeInstanceOf(VaultPinLockedError);
            expect(result.current.isVaultUnlocked).toBe(false);
        });
    });

    describe('legacy verifier discovery (a salt exists but no pinVerifier has been stored yet)', () => {
        it('writes a fresh verifier when there are no existing journal entries', async () => {
            const salt = generateSalt();
            vi.mocked(firestore.getDoc).mockResolvedValueOnce(mockUserDoc(true, { encryptionSalt: salt }));
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(mockJournalSnapshot([]));

            const result = await renderVault();
            expect(result.current.isVaultSet).toBe(true);

            let unlockResult: boolean | undefined;
            await act(async () => { unlockResult = await result.current.unlockVault(PIN); });

            expect(unlockResult).toBe(true);
            expect(result.current.isVaultUnlocked).toBe(true);
            expect(firestore.setDoc).toHaveBeenCalledWith(expect.anything(), { pinVerifier: expect.any(String) }, { merge: true });
            // Pre-verifier accounts always use the pre-peppered discovery path.
            expect(fetchVaultPepper).not.toHaveBeenCalled();
        });

        it('verifies against an existing journal entry, decrypts it, and adopts the new verifier', async () => {
            const salt = generateSalt();
            await generateKey(PIN, salt);
            const existingCipher = await encrypt('probe entry');
            clearKey();

            vi.mocked(firestore.getDoc).mockResolvedValueOnce(mockUserDoc(true, { encryptionSalt: salt }));
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(mockJournalSnapshot([{ content: existingCipher, isEncrypted: true }]));

            const result = await renderVault();
            let unlockResult: boolean | undefined;
            await act(async () => { unlockResult = await result.current.unlockVault(PIN); });

            expect(unlockResult).toBe(true);
            expect(result.current.isVaultUnlocked).toBe(true);
            expect(firestore.setDoc).toHaveBeenCalledWith(expect.anything(), { pinVerifier: expect.any(String) }, { merge: true });
        });

        it('PROJ-74: fails closed on a decrypt mismatch instead of hanging with a mismatched return value', async () => {
            // Regression test for the bug PROJ-73's coverage surfaced: the
            // legacy-discovery catch block used to `return true` on a decrypt
            // mismatch without ever setting isVaultUnlocked, which hung
            // VaultGate's unlock button indefinitely (its `if (!success)`
            // branch never fired, so no error showed and isSubmitting never
            // reset). Fixed to `return false`, matching the normal
            // verifier-mismatch path's fail-closed behavior — a decrypt
            // failure here is positive evidence of a wrong PIN, unlike the
            // "no journals yet" branch's legitimate trust-on-first-use.
            const salt = generateSalt();
            await generateKey('9999', salt); // encrypt under a different PIN
            const foreignCipher = await encrypt('not this user\'s key');
            clearKey();

            vi.mocked(firestore.getDoc).mockResolvedValueOnce(mockUserDoc(true, { encryptionSalt: salt }));
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(mockJournalSnapshot([{ content: foreignCipher, isEncrypted: true }]));

            const result = await renderVault();
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            let unlockResult: boolean | undefined;
            await act(async () => { unlockResult = await result.current.unlockVault(PIN); });
            warnSpy.mockRestore();

            expect(unlockResult).toBe(false);
            expect(result.current.isVaultUnlocked).toBe(false);
        });
    });

    describe('changePin', () => {
        it('delegates to executePinRotation and applies the returned key material', async () => {
            const result = await renderVault();
            await setupAndLock(result);
            await act(async () => { await result.current.unlockVault(PIN); }); // re-establish salt/verifier state pre-rotation

            const NEW_SALT = 'new-salt-b64';
            const NEW_VERIFIER = 'new-verifier-hash';
            const NEW_PEPPER = 'new-pepper-b64';
            vi.mocked(executePinRotation).mockResolvedValue({ newSalt: NEW_SALT, newVerifier: NEW_VERIFIER, newPepper: NEW_PEPPER });
            const onProgress = vi.fn();

            await act(async () => { await result.current.changePin(PIN, '4321', onProgress); });

            expect(executePinRotation).toHaveBeenCalledWith(TEST_UID, PIN, '4321', expect.any(String), expect.any(String), expect.any(Boolean), onProgress);
            expect(sessionStorage.getItem('mrt_vault_pepper')).toBe(NEW_PEPPER);
            expect(sessionStorage.getItem('mrt_vault_pin')).toBe('4321');
            expect(result.current.isVaultUnlocked).toBe(true);
        });
    });

    describe('lockVault', () => {
        it('clears the session cache and flips isVaultUnlocked without touching salt/verifier state', async () => {
            const result = await renderVault();
            vi.mocked(fetchVaultPepper).mockResolvedValue(MOCK_PEPPER);
            await act(async () => { await result.current.setupVault(PIN); });

            act(() => { result.current.lockVault(); });

            expect(result.current.isVaultUnlocked).toBe(false);
            expect(result.current.isVaultSet).toBe(true); // still set up, just locked
            expect(sessionStorage.getItem('mrt_vault_pin')).toBeNull();
            expect(sessionStorage.getItem('mrt_vault_pepper')).toBeNull();
        });
    });
});
