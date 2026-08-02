/**
 * src/contexts/EncryptionContext.tsx
 * GITHUB COMMENT:
 * [EncryptionContext.tsx]
 * FEAT: Integrated executePinRotation and executeCryptoShredding for Ticket 2.5.
 * FEAT: PROJ-39 Deferred Vault Lock (Context Gatekeeper Bypass)
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { generateSalt, generateKey, computePinHash, encrypt, decrypt, clearKey, isVaultUnlocked as checkLibUnlocked, deriveLocalBits, deriveVaultKeyWithPepper } from '../lib/crypto';
import { executeCryptoShredding, executePinRotation } from '../lib/rotation';
import { fetchVaultPepper, VaultPinLockedError } from '../lib/vaultAuth';
import { trackClientError } from '../lib/telemetry';

const SESSION_PIN_KEY = 'mrt_vault_pin';
const SESSION_PEPPER_KEY = 'mrt_vault_pepper';

interface EncryptionContextType {
  isVaultSet: boolean;
  isVaultUnlocked: boolean;
  vaultLoading: boolean;
  hasDeferredVault: boolean;
  unlockVault: (pin: string) => Promise<boolean>;
  setupVault: (pin: string) => Promise<void>;
  resetVault: () => Promise<void>;
  changePin: (oldPin: string, newPin: string, onProgress: (p: number) => void) => Promise<void>;
  encrypt: (text: string) => Promise<string>;
  decrypt: (encryptedText: string) => Promise<string>;
  lockVault: () => void;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [isVaultSet, setIsVaultSet] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [hasDeferredVault, setHasDeferredVault] = useState(false);
  const [vaultLoading, setVaultLoading] = useState(true);
  
  const [salt, setSalt] = useState<string | null>(null);
  const [verifier, setVerifier] = useState<string | null>(null);
  const [usesPepperV2, setUsesPepperV2] = useState(false);

  const performUnlock = useCallback(async (pin: string, currentSalt: string, currentVerifier: string | null, currentUsesPepperV2: boolean): Promise<boolean> => {
      try {
        if (currentVerifier) {
            const checkHash = await computePinHash(pin, currentSalt);
            if (checkHash !== currentVerifier) return false;

            if (currentUsesPepperV2) {
                // PROJ-65: derive the vault key from the local PIN-derived secret
                // combined with a rate-limited server pepper. The pepper is cached
                // in sessionStorage (same lifetime as the cached PIN) so a tab
                // reload within the same session stays fully offline-capable —
                // only the first unlock of a new session needs the network.
                let pepper = sessionStorage.getItem(SESSION_PEPPER_KEY);
                if (!pepper) {
                    pepper = await fetchVaultPepper(checkHash);
                    sessionStorage.setItem(SESSION_PEPPER_KEY, pepper);
                }
                const localBits = await deriveLocalBits(pin, currentSalt);
                await deriveVaultKeyWithPepper(localBits, pepper);
            } else {
                await generateKey(pin, currentSalt);
            }
        } else {
            // No verifier yet — legacy discovery path below always uses the
            // pre-peppered scheme until a verifier exists; this account gets
            // upgraded transparently the next time it rotates its PIN (see
            // executePinRotation).
            await generateKey(pin, currentSalt);
        }

        if (!currentVerifier && db && user) {
            const q = query(collection(db, 'journals'), where('uid', '==', user.uid), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const testDoc = snapshot.docs[0].data();
                if (testDoc.content && testDoc.isEncrypted) {
                    try {
                        const result = await decrypt(testDoc.content);
                        if (result.includes("Locked Content")) throw new Error("Key mismatch");
                        
                        const newVerifier = await computePinHash(pin, currentSalt);
                        const userDocRef = doc(db, 'users', user.uid);
                        await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
                        setVerifier(newVerifier);
                    } catch (e) {
                        // PROJ-74: fail closed. A decrypt failure here is positive
                        // evidence the entered PIN doesn't match the key that
                        // encrypted this user's existing content — unlike the
                        // "no journals yet" branch below (no evidence either way,
                        // legitimately trust-on-first-use), this must not report
                        // success. Returning `true` here previously left
                        // isVaultUnlocked stuck at `false` while claiming success,
                        // hanging VaultGate's unlock button indefinitely.
                        console.warn("Legacy Verification Failed", e);
                        return false;
                    }
                }
            } else {
                 const newVerifier = await computePinHash(pin, currentSalt);
                 const userDocRef = doc(db, 'users', user.uid);
                 await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
                 setVerifier(newVerifier);
            }
        }
        
        setIsVaultUnlocked(true);
        sessionStorage.setItem(SESSION_PIN_KEY, pin);
        return true;

      } catch (error) {
        if (error instanceof VaultPinLockedError) throw error;
        console.error("Unlock logic failed", error);
        trackClientError('vault_unlock', error instanceof Error ? error.name : 'Error');
        return false;
      }
  }, [user]);

  useEffect(() => { 
    async function checkVaultStatus() { 
      if (!user) { setVaultLoading(false); return; }
      
      if (user.email?.endsWith('.mock')) {
        setIsVaultSet(true);
        setIsVaultUnlocked(true);
        setHasDeferredVault(false);
        setVaultLoading(false);
        return;
      }

      if (!db) { setVaultLoading(false); return; }
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.encryptionSalt) {
            setIsVaultSet(true);
            setSalt(data.encryptionSalt);
            
            const currentVerifier = data.pinVerifier || null;
            if (currentVerifier) setVerifier(currentVerifier);
            const currentUsesPepperV2 = !!data.usesPepperV2;
            setUsesPepperV2(currentUsesPepperV2);

            const cachedPin = sessionStorage.getItem(SESSION_PIN_KEY);
            if (cachedPin) {
                try {
                  await performUnlock(cachedPin, data.encryptionSalt, currentVerifier, currentUsesPepperV2);
                } catch (e) {
                  // Locked out on session resume — fall through to the locked
                  // screen instead of crashing; the user re-enters their PIN
                  // and VaultGate surfaces the lockout message.
                  console.warn("Session resume unlock failed:", e);
                }
            }
          } else if (data.hasDeferredVault) {
            setIsVaultSet(false);
            setHasDeferredVault(true);
            setIsVaultUnlocked(true); // Gatekeeper bypass enabled
          } else {
            setIsVaultSet(false);
          }
        } else {
          setIsVaultSet(false);
        }
      } catch (error) {
        console.error("Error checking vault status:", error);
        trackClientError('vault_status_check', error instanceof Error ? error.name : 'Error');
      } finally {
        setVaultLoading(false);
      }
    }

    checkVaultStatus();
  }, [user, performUnlock]);

  const setupVault = useCallback(async (pin: string) => {
    if (!user || !db) return;

    try {
      setVaultLoading(true);
      const newSalt = generateSalt();
      const newVerifier = await computePinHash(pin, newSalt);

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
          encryptionSalt: newSalt,
          pinVerifier: newVerifier,
          hasDeferredVault: false // Turn off bypass once proper vault is set
      }, { merge: true });

      // PROJ-65: derive the initial vault key via the peppered scheme. If the
      // server round-trip fails (e.g. offline during setup), fall back to the
      // legacy direct derivation rather than blocking setup — this account
      // self-heals to the peppered scheme on its next PIN rotation.
      let newUsesPepperV2 = false;
      try {
        const pepper = await fetchVaultPepper(newVerifier);
        sessionStorage.setItem(SESSION_PEPPER_KEY, pepper);
        const localBits = await deriveLocalBits(pin, newSalt);
        await deriveVaultKeyWithPepper(localBits, pepper);
        await setDoc(userDocRef, { usesPepperV2: true }, { merge: true });
        newUsesPepperV2 = true;
      } catch (pepperError) {
        console.warn("Vault pepper setup failed, falling back to legacy derivation:", pepperError);
        await generateKey(pin, newSalt);
      }

      setSalt(newSalt);
      setVerifier(newVerifier);
      setUsesPepperV2(newUsesPepperV2);
      setIsVaultSet(true);
      setIsVaultUnlocked(true);
      setHasDeferredVault(false);
      sessionStorage.setItem(SESSION_PIN_KEY, pin);

    } catch (error) { console.error("Vault setup failed:", error); trackClientError('vault_setup', error instanceof Error ? error.name : 'Error'); throw error; } finally {
      setVaultLoading(false);
    }
  }, [user]);

  const resetVault = useCallback(async () => {
    if (!user || !db) return;
    try {
      setVaultLoading(true);
      await executeCryptoShredding(user.uid);

      clearKey();
      sessionStorage.removeItem(SESSION_PIN_KEY);
      sessionStorage.removeItem(SESSION_PEPPER_KEY);
      setIsVaultSet(false);
      setIsVaultUnlocked(false);
      setHasDeferredVault(false);
      setSalt(null);
      setVerifier(null);
      setUsesPepperV2(false);
    } catch (error) { console.error("Vault reset failed:", error); trackClientError('vault_reset', error instanceof Error ? error.name : 'Error'); throw error; } finally {
      setVaultLoading(false);
    }
  }, [user]);

  const changePin = useCallback(async (oldPin: string, newPin: string, onProgress: (p: number) => void) => {
    if (!user || !salt) throw new Error("Missing auth state");
    const { newSalt, newVerifier, newPepper } = await executePinRotation(user.uid, oldPin, newPin, salt, verifier, usesPepperV2, onProgress);

    setSalt(newSalt);
    setVerifier(newVerifier);
    setUsesPepperV2(true);
    sessionStorage.setItem(SESSION_PEPPER_KEY, newPepper);
    setIsVaultUnlocked(true);
    sessionStorage.setItem(SESSION_PIN_KEY, newPin);
  }, [user, salt, verifier, usesPepperV2]);

  const unlockVault = useCallback(async (pin: string): Promise<boolean> => {
    if (!salt || !user || !db) return false;
    return await performUnlock(pin, salt, verifier, usesPepperV2);
  }, [salt, user, verifier, usesPepperV2, performUnlock]);

  const lockVault = useCallback(() => {
    clearKey();
    sessionStorage.removeItem(SESSION_PIN_KEY);
    sessionStorage.removeItem(SESSION_PEPPER_KEY);
    setIsVaultUnlocked(false); 
  }, []);

  const handleEncrypt = useCallback(async (text: string) => { 
    if (user?.email?.endsWith('.mock')) return text;
    if (!checkLibUnlocked()) throw new Error("Vault is locked"); 
    return await encrypt(text); 
  }, [user]);

  const handleDecrypt = useCallback(async (text: string) => {
    if (user?.email?.endsWith('.mock')) return text;
    return await decrypt(text);
  }, [user]);

  // PROJ-98 Phase 4: memoized so every useEncryption() consumer only
  // re-renders when a value it actually reads changes.
  const value = useMemo(() => ({
    isVaultSet,
    isVaultUnlocked,
    vaultLoading,
    hasDeferredVault,
    unlockVault,
    setupVault,
    resetVault,
    changePin,
    encrypt: handleEncrypt,
    decrypt: handleDecrypt,
    lockVault
  }), [isVaultSet, isVaultUnlocked, vaultLoading, hasDeferredVault, unlockVault, setupVault, resetVault, changePin, handleEncrypt, handleDecrypt, lockVault]);

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}
