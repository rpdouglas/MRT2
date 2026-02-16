/**
 * GITHUB COMMENT:
 * [EncryptionContext.tsx]
 * CLEANUP: Removed redundant 'no-console' eslint-disable directives.
 * MAINTAINED: resetVault logic and zero-knowledge security protocols.
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
                console.log("🔐 Found cached PIN, attempting auto-unlock...");
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
  }, [user, performUnlock]); // Added performUnlock dependency

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
      sessionStorage.setItem(SESSION_PIN_KEY, pin); // Cache on setup

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
      sessionStorage.removeItem(SESSION_PIN_KEY); // Clear Cache
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
    sessionStorage.removeItem(SESSION_PIN_KEY); // Clear Cache
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
