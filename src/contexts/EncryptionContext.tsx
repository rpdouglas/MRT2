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
    
    try {
      if (verifier) {
          const checkHash = await computePinHash(pin, salt);
          if (checkHash !== verifier) return false;
          await generateKey(pin, salt);
          setIsVaultUnlocked(true);
          return true;
      }

      await generateKey(pin, salt);
      const q = query(collection(db, 'journals'), where('uid', '==', user.uid), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
          const testDoc = snapshot.docs[0].data();
          if (testDoc.content && testDoc.isEncrypted) {
              try {
                  const result = await decrypt(testDoc.content);
                  if (result.includes("Locked Content")) throw new Error("Key mismatch");
                  const newVerifier = await computePinHash(pin, salt);
                  const userDocRef = doc(db, 'users', user.uid);
                  await setDoc(userDocRef, { pinVerifier: newVerifier }, { merge: true });
                  setVerifier(newVerifier);
              } catch (e) {
                  console.warn("Legacy Verification Failed", e);
                  return true; 
              }
          }
      } else {
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
    clearKey();
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