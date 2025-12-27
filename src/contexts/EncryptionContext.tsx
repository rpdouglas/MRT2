// src/contexts/EncryptionContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { 
    generateSalt, 
    generateKey, 
    computePinHash,
    encrypt, 
    decrypt, 
    clearKey, 
    isVaultUnlocked as checkLibUnlocked 
} from '../lib/crypto';

interface EncryptionContextType {
  isVaultSet: boolean;       // Does the user have a PIN setup?
  isVaultUnlocked: boolean;  // Is the PIN currently entered?
  vaultLoading: boolean;
  unlockVault: (pin: string) => Promise<boolean>;
  setupVault: (pin: string) => Promise<void>;
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
  const [verifier, setVerifier] = useState<string | null>(null); // Stored Hash of PIN

  // 1. Check if user has a vault set up (fetch salt & verifier)
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
            // If verification hash exists (New Users), load it.
            if (data.pinVerifier) {
                setVerifier(data.pinVerifier);
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
  }, [user]);

  // 2. Setup Vault (First time PIN creation)
  const setupVault = async (pin: string) => {
    if (!user || !db) return;
    
    try {
      setVaultLoading(true);
      const newSalt = generateSalt();
      
      // A. Generate Key for Memory
      await generateKey(pin, newSalt);
      
      // B. Generate Verification Hash for Storage
      const newVerifier = await computePinHash(pin, newSalt);
      
      // C. Save Salt & Verifier to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { 
          encryptionSalt: newSalt,
          pinVerifier: newVerifier
      }, { merge: true });

      setSalt(newSalt);
      setVerifier(newVerifier);
      setIsVaultSet(true);
      setIsVaultUnlocked(true);
    } catch (error) {
      console.error("Vault setup failed:", error);
      throw error;
    } finally {
      setVaultLoading(false);
    }
  };

  // 3. Unlock Vault (Enter PIN)
  const unlockVault = async (pin: string): Promise<boolean> => {
    if (!salt || !user || !db) return false;
    
    try {
      // --- STRATEGY A: Standard Strict Verification (New Users) ---
      if (verifier) {
          const checkHash = await computePinHash(pin, salt);
          if (checkHash !== verifier) {
              console.warn("Strict Verification Failed: Invalid PIN");
              return false; // REJECT
          }
          await generateKey(pin, salt);
          setIsVaultUnlocked(true);
          return true;
      }

      // --- STRATEGY B: Legacy Fallback & Auto-Migration (Existing Users) ---
      // We don't have a hash, so we must try to decrypt actual data to verify the PIN.
      console.log("Legacy User detected: Attempting canary decryption...");
      
      // 1. Generate key tentatively
      await generateKey(pin, salt);

      // 2. Fetch ONE encrypted journal entry to test the key
      const q = query(collection(db, 'journals'), where('uid', '==', user.uid), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
          const testDoc = snapshot.docs[0].data();
          if (testDoc.content && testDoc.isEncrypted) {
              try {
                  // 3. The Test: Try to decrypt
                  // AES-GCM throws an error if the key is wrong (Authentication Tag mismatch)
                  await decrypt(testDoc.content); 
                  
                  // 4. Success! We verified the PIN works. Now MIGRATING user to secure flow.
                  console.log("Legacy Migration: Generating pinVerifier...");
                  const newVerifier = await computePinHash(pin, salt);
                  const userDocRef = doc(db, 'users', user.uid);
                  await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
                  setVerifier(newVerifier); // Update local state

              } catch (e) {
                  console.error("Legacy Verification Failed: Wrong PIN", e);
                  clearKey(); // Wipe the bad key
                  return false; // REJECT
              }
          }
      } else {
          // No data to verify against? Assume correct and migrate to lock it in.
          const newVerifier = await computePinHash(pin, salt);
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
          setVerifier(newVerifier);
      }

      setIsVaultUnlocked(true);
      return true;

    } catch (error) {
      console.error("Unlock failed", error);
      return false;
    }
  };

  const lockVault = useCallback(() => {
    clearKey(); // Clear internal lib key
    setIsVaultUnlocked(false);
  }, []);

  // 4. Helper Wrappers
  const handleEncrypt = useCallback(async (text: string) => {
    if (!checkLibUnlocked()) throw new Error("Vault is locked");
    return await encrypt(text);
  }, []);

  const handleDecrypt = useCallback(async (text: string) => {
    // We allow decrypt calls to pass through to the lib even if locked
    // because the lib handles graceful fallbacks for plain text/legacy data.
    return await decrypt(text);
  }, []);

  const value = {
    isVaultSet,
    isVaultUnlocked,
    vaultLoading,
    unlockVault,
    setupVault,
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