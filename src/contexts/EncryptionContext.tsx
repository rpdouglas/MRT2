// src/contexts/EncryptionContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    if (!salt) return false;
    
    try {
      // Step A: If we have a stored verifier, check it first. (Strict Mode)
      if (verifier) {
          const checkHash = await computePinHash(pin, salt);
          if (checkHash !== verifier) {
              console.warn("Strict Verification Failed: Invalid PIN");
              return false; // REJECT
          }
      }

      // Step B: Derive the key (If we are here, PIN is likely correct or we are in legacy mode)
      await generateKey(pin, salt);
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