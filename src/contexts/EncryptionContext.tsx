import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { generateSalt, deriveKeyFromPin, encryptData, decryptData } from '../lib/crypto';

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

// FIX: validation error "Fast refresh only works when a file only exports components"
// This pattern is standard for Contexts, so we disable the warning for this line.
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
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string | null>(null);

  // 1. Check if user has a vault set up (fetch salt)
  useEffect(() => {
    async function checkVaultStatus() {
      // Check if db is initialized
      if (!user || !db) {
        setVaultLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().encryptionSalt) {
          setIsVaultSet(true);
          setSalt(userDoc.data().encryptionSalt);
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
    // Check if db is initialized
    if (!user || !db) return;
    
    try {
      setVaultLoading(true);
      const newSalt = generateSalt();
      const key = await deriveKeyFromPin(pin, newSalt);
      
      // Save Salt to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { encryptionSalt: newSalt }, { merge: true });

      setSalt(newSalt);
      setCryptoKey(key); // Keep key in memory
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
      const key = await deriveKeyFromPin(pin, salt);
      setCryptoKey(key);
      setIsVaultUnlocked(true);
      return true;
    } catch (error) {
      console.error("Unlock failed", error);
      return false;
    }
  };

  const lockVault = () => {
    setCryptoKey(null);
    setIsVaultUnlocked(false);
  };

  // 4. Helper Wrappers
  const encrypt = useCallback(async (text: string) => {
    if (!cryptoKey) throw new Error("Vault is locked");
    return await encryptData(text, cryptoKey);
  }, [cryptoKey]);

  const decrypt = useCallback(async (text: string) => {
    if (!cryptoKey) throw new Error("Vault is locked");
    return await decryptData(text, cryptoKey);
  }, [cryptoKey]);

  const value = {
    isVaultSet,
    isVaultUnlocked,
    vaultLoading,
    unlockVault,
    setupVault,
    encrypt,
    decrypt,
    lockVault
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}