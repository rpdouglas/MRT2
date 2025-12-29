// src/lib/crypto.ts

// --- Configuration ---
const PBKDF2_ITERATIONS = 100000;
const SALT_SIZE = 16;
const KEY_LENGTH = 256; // AES-256

// In-memory key storage (cleared on refresh)
let globalKey: CryptoKey | null = null;

/**
 * Generates a cryptographic key from a user PIN and Salt using PBKDF2.
 * @param pin - The user's 4-digit PIN
 * @param saltBase64 - The user's unique salt (stored in Firestore)
 */
export async function generateKey(pin: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Convert Salt from Base64 to Uint8Array
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false, // Key is non-extractable
    ["encrypt", "decrypt"]
  );

  globalKey = key;
  return key;
}

/**
 * Computes a secure hash of the PIN + Salt for identity verification.
 * This allows us to validate the PIN before attempting to derive the encryption key.
 * @param pin - The input PIN
 * @param saltBase64 - The user's salt
 */
export async function computePinHash(pin: string, saltBase64: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(pin + saltBase64);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypts a string using AES-GCM.
 * Returns format: "IV_HEX:CIPHERTEXT_HEX"
 */
export async function encrypt(text: string): Promise<string> {
  if (!globalKey) throw new Error("Vault is locked. Key not found.");

  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    globalKey,
    enc.encode(text)
  );

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const contentHex = Array.from(new Uint8Array(encryptedContent)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${ivHex}:${contentHex}`;
}

/**
 * Decrypts a string using AES-GCM.
 * Robustly handles legacy plain text and bad keys.
 */
export async function decrypt(encryptedPackage: string): Promise<string> {
  // 1. Check if Vault is unlocked
  if (!globalKey) {
      console.warn("Attempted decrypt without key");
      throw new Error("Vault is locked");
  }

  // 2. Handle Legacy Plain Text / Empty Data
  if (!encryptedPackage) return "";
  if (!encryptedPackage.includes(':')) {
      // If there is no IV separator, this is likely old unencrypted data.
      // Return it as-is so the user doesn't lose access.
      return encryptedPackage; 
  }

  try {
      const [ivHex, dataHex] = encryptedPackage.split(':');
      
      // 3. Validation
      if (!ivHex || !dataHex) return "[Corrupted Data]";

      const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const data = new Uint8Array(dataHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

      // --- CRITICAL FIX START ---
      // 4. Ensure data is large enough for the auth tag (16 bytes)
      // Without this check, subtle.decrypt throws a DOMException on corrupted/empty data
      if (data.byteLength < 16) {
          console.warn("Skipping decryption: Data buffer too small (corrupted entry).");
          return "[Error: Data Corrupted]";
      }
      // --- CRITICAL FIX END ---

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        globalKey,
        data
      );

      return new TextDecoder().decode(decryptedBuffer);

  } catch (error) {
      console.error("Decryption failed:", error);
      // Return a safe fallback so the UI renders instead of crashing
      return "[Locked Content - Verify PIN]"; 
  }
}

/**
 * Generates a random salt for new users.
 */
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Clears the key from memory (Lock Vault).
 */
export function clearKey() {
  globalKey = null;
}

/**
 * Check if vault is currently unlocked
 */
export function isVaultUnlocked(): boolean {
    return !!globalKey;
}   