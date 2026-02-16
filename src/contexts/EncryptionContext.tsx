/**
 * src/contexts/EncryptionContext.tsx
 * GITHUB COMMENT:
 * [EncryptionContext.tsx]
 * UPDATED: Integrated sessionStorage PIN caching and wrapped performUnlock in useCallback.
 * PURPOSE: Reduces re-unlock friction during active browser sessions while maintaining Zero-Knowledge integrity.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteField, 
  collection, 
  query, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { 
    generateSalt, 
    generateKey, 
    computePinHash,
    encrypt, 
    decrypt, 
    clearKey, 
    isVaultUnlocked as checkLibUnlocked 
} from '../lib/crypto';

const SESSION_PIN_KEY = 'mrt_vault_pin';

interface EncryptionContextType {
  isVaultSet: boolean;
  isVaultUnlocked: boolean;
  vaultLoading: boolean;
  unlockVault: (pin: string) => Promise<boolean>;
  setupVault: (pin: string) => Promise<void>;
  resetVault: () => Promise<void>;
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
  const [vaultLoading, setVaultLoading] = useState(true);
  
  const [salt, setSalt] = useState<string | null>(null);
  const [verifier, setVerifier] = useState<string | null>(null);

  /**
   * Performs the actual cryptographic unlock and session caching.
   */
  const performUnlock = useCallback(async (pin: string, currentSalt: string, currentVerifier: string | null): Promise<boolean> => {
      try {
        // 1. Verify PIN if verifier exists
        if (currentVerifier) {
            const checkHash = await computePinHash(pin, currentSalt);
            if (checkHash !== currentVerifier) return false;
        }

        // 2. Generate Key in Web Crypto API
        await generateKey(pin, currentSalt);

        // 3. Self-Healing / Legacy Check
        if (!currentVerifier && db && user) {
            const q = query(collection(db, 'journals'), where('uid', '==', user.uid), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const testDoc = snapshot.docs[0].data();
                if (testDoc.content && testDoc.isEncrypted) {
                    try {
                        const result = await decrypt(testDoc.content);
                        if (result.includes("Locked Content")) throw new Error("Key mismatch");
                        
                        // Create verifier for next time to speed up future unlocks
                        const newVerifier = await computePinHash(pin, currentSalt);
                        const userDocRef = doc(db, 'users', user.uid);
                        await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
                        setVerifier(newVerifier);
                    } catch (e) {
                        console.warn("Legacy Verification Failed", e);
                        return true; 
                    }
                }
            } else {
                 // No data yet, create verifier immediately
                 const newVerifier = await computePinHash(pin, currentSalt);
                 const userDocRef = doc(db, 'users', user.uid);
                 await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
                 setVerifier(newVerifier);
            }
        }
        
        setIsVaultUnlocked(true);
        // Save to Session Storage for PWA navigation resilience
        sessionStorage.setItem(SESSION_PIN_KEY, pin);
        return true;

      } catch (error) {
          console.error("Unlock logic failed", error);
          return false;
      }
  }, [user]);

  // Initial Load & Auto-Unlock from Session Storage
  useEffect(() => {
    async function checkVaultStatus() {
      if (!user || !db) {
        setVaultLoading(false);
        return;
      }
      
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

            // --- AUTO UNLOCK CHECK ---
            const cachedPin = sessionStorage.getItem(SESSION_PIN_KEY);
            if (cachedPin) {
                await performUnlock(cachedPin, data.encryptionSalt, currentVerifier);
            }
          } else {
            setIsVaultSet(false);
          }
        } else {
          setIsVaultSet(false);
        }
      } catch (error) {
        console.error("Error checking vault status:", error);
      } finally {
        setVaultLoading(false);
      }
    }

    checkVaultStatus();
  }, [user, performUnlock]);

  const setupVault = async (pin: string) => {
    if (!user || !db) return;
    
    try {
      setVaultLoading(true);
      const newSalt = generateSalt();
      await generateKey(pin, newSalt);
      const newVerifier = await computePinHash(pin, newSalt);
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { 
          encryptionSalt: newSalt,
          pinVerifier: newVerifier
      }, { merge: true });

      setSalt(newSalt);
      setVerifier(newVerifier);
      setIsVaultSet(true);
      setIsVaultUnlocked(true);
      sessionStorage.setItem(SESSION_PIN_KEY, pin);

    } catch (error) {
      console.error("Vault setup failed:", error);
      throw error;
    } finally {
      setVaultLoading(false);
    }
  };

  const resetVault = async () => {
    if (!user || !db) return;
    try {
      setVaultLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        encryptionSalt: deleteField(),
        pinVerifier: deleteField()
      }, { merge: true });
      
      clearKey();
      sessionStorage.removeItem(SESSION_PIN_KEY);
      setIsVaultSet(false);
      setIsVaultUnlocked(false);
      setSalt(null);
      setVerifier(null);
    } catch (error) {
      console.error("Vault reset failed:", error);
      throw error;
    } finally {
      setVaultLoading(false);
    }
  };

  const unlockVault = async (pin: string): Promise<boolean> => {
    if (!salt || !user || !db) return false;
    return await performUnlock(pin, salt, verifier);
  };

  const lockVault = useCallback(() => {
    clearKey();
    sessionStorage.removeItem(SESSION_PIN_KEY);
    setIsVaultUnlocked(false);
  }, []);

  const handleEncrypt = useCallback(async (text: string) => {
    if (!checkLibUnlocked()) throw new Error("Vault is locked");
    return await encrypt(text);
  }, []);

  const handleDecrypt = useCallback(async (text: string) => {
    return await decrypt(text);
  }, []);

  const value = {
    isVaultSet,
    isVaultUnlocked,
    vaultLoading,
    unlockVault,
    setupVault,
    resetVault,
    encrypt: handleEncrypt,
    decrypt: handleDecrypt,
    lockVault
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}