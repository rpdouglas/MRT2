import { describe, it, expect, beforeEach } from 'vitest';
import { generateKey, encrypt, decrypt, clearKey, isVaultUnlocked, generateSalt, computePinHash } from './crypto';

describe('🛡️ Zero-Knowledge Security Engine', () => {

    const TEST_PIN = "1234";
    const TEST_SALT = generateSalt();

    beforeEach(() => {
        // Ensure vault is locked before each test
        clearKey();
    });

    it('should generate a unique salt', () => {
        const salt1 = generateSalt();
        const salt2 = generateSalt();
        expect(salt1).not.toBe(salt2);
        expect(salt1.length).toBeGreaterThan(10);
    });

    it('should derive a key and unlock the vault', async () => { expect(isVaultUnlocked()).toBe(false); await generateKey(TEST_PIN, TEST_SALT); expect(isVaultUnlocked()).toBe(true); });

    it('should successfully encrypt and decrypt text (Round Trip)', async () => {
        await generateKey(TEST_PIN, TEST_SALT);
        
        const secretMessage = "My deepest darkest secret";
        const cipherText = await encrypt(secretMessage);

        expect(cipherText).not.toBe(secretMessage);
        expect(cipherText).toContain(':'); // Checks for IV:Data format

        const plainText = await decrypt(cipherText);
        expect(plainText).toBe(secretMessage);
    });

    it('should FAIL to encrypt if vault is locked', async () => {
        clearKey(); // Ensure locked
        await expect(encrypt("Should fail")).rejects.toThrow(/Vault is locked/);
    });

    it('should return Safe Fallback when decrypting with wrong key', async () => {
        // 1. Encrypt with User A's PIN
        await generateKey("1111", TEST_SALT);
        const secret = "User A Data";
        const cipherText = await encrypt(secret);

        // 2. Clear and switch to User B (Attacker/Wrong PIN)
        clearKey();
        await generateKey("9999", TEST_SALT); // Different key derived

        // 3. Attempt to decrypt
        // FIX: Expect the safe fallback string, NOT a crash
        const result = await decrypt(cipherText);
        expect(result).toBe("[Locked Content - Verify PIN]");
    });

    it('should generate consistent PIN hashes for verification', async () => {
        const hash1 = await computePinHash(TEST_PIN, TEST_SALT);
        const hash2 = await computePinHash(TEST_PIN, TEST_SALT);
        
        expect(hash1).toBe(hash2);
        
        const wrongHash = await computePinHash("0000", TEST_SALT);
        expect(hash1).not.toBe(wrongHash);
    });

    it('should clear the key from memory when locked', async () => {
        await generateKey(TEST_PIN, TEST_SALT);
        expect(isVaultUnlocked()).toBe(true);
        
        clearKey();
        expect(isVaultUnlocked()).toBe(false);
    });
});
