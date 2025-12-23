// src/lib/crypto.ts

/**
 * Generates a random salt for PBKDF2.
 * Returns a base64 string.
 */
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Derives an AES-GCM key from a user PIN and Salt.
 * Uses PBKDF2 with 100,000 iterations.
 */
export async function deriveKeyFromPin(pin: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using the provided CryptoKey.
 * Returns a JSON string containing { iv, data } (both base64).
 */
export async function encryptData(text: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const dataBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

  return JSON.stringify({ iv: ivBase64, data: dataBase64 });
}

/**
 * Decrypts a JSON string { iv, data } using the provided CryptoKey.
 * Returns the original plain text.
 */
export async function decryptData(encryptedJson: string, key: CryptoKey): Promise<string> {
  try {
    const { iv: ivBase64, data: dataBase64 } = JSON.parse(encryptedJson);
    
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption Error: Invalid PIN or Corrupt Data]";
  }
}