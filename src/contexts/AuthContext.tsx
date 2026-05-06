import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser, type User } from 'firebase/auth';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getOrCreateUserProfile } from '../lib/db';
import { refreshFcmTokenIfStale } from '../lib/messaging';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userTier: 'free' | 'premium';
  driveAccessToken: string | null;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  reauthenticateWithEmail: (password: string) => Promise<void>;
  reauthenticateWithGoogle: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubscribeSubscriptions: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const profile = await getOrCreateUserProfile(currentUser);
          setUser(currentUser);
          setIsAdmin(profile.role === 'admin' || currentUser.email === 'rpdouglas@gmail.com');
          refreshFcmTokenIfStale(currentUser.uid, profile.fcmSwVersion).catch(console.error);
          
          // Phase 2: Listen directly to the Stripe extension's 'subscriptions' subcollection
          if (db) {
             const subsRef = collection(db, 'users', currentUser.uid, 'subscriptions');
             const q = query(subsRef, where('status', 'in', ['active', 'trialing']));
             
             unsubscribeSubscriptions = onSnapshot(q, (snapshot) => {
                 if (!snapshot.empty) {
                     setUserTier('premium');
                 } else {
                     // Fallback to static profile tier just in case, but default free
                     setUserTier(profile.tier || 'free');
                 }
             }, (error) => { console.error("Subscription listener error:", error); setUserTier('free'); });
          } else {
             setUserTier(profile.tier || 'free');
          }

        } else {
          setUser(null);
          setIsAdmin(false);
          setUserTier('free');
          setDriveAccessToken(null);
          if (unsubscribeSubscriptions) {
              unsubscribeSubscriptions();
          }
        }
      } catch (error) { console.error("Error fetching user profile:", error); setUser(currentUser); setUserTier('free'); } finally {
        setLoading(false);
      }
    });

    return () => { unsubscribeAuth(); if (unsubscribeSubscriptions) { unsubscribeSubscriptions(); }
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Auth not initialized");
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setDriveAccessToken(credential.accessToken);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not initialized");
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await getOrCreateUserProfile(result.user);
  };

  const loginWithEmail = async (email: string, pass: string) => { if (!auth) throw new Error("Auth not initialized"); await signInWithEmailAndPassword(auth, email, pass); };

  const reauthenticateWithEmail = async (password: string) => {
      if (!auth || !user || !user.email) throw new Error("Not authenticated");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
  };

  const reauthenticateWithGoogle = async () => {
      if (!auth || !user) throw new Error("Not authenticated");
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      await reauthenticateWithPopup(user, provider);
  };

  const deleteAccount = async () => { if (!auth || !user) throw new Error("Not authenticated"); await deleteUser(user); setUser(null); setUserTier('free'); };

  const logout = async () => { if (!auth) return; await signOut(auth); };

  const value = {
    user,
    loading,
    isAdmin,
    userTier,
    driveAccessToken,
    loginWithGoogle,
    signupWithEmail,
    loginWithEmail,
    reauthenticateWithEmail,
    reauthenticateWithGoogle,
    deleteAccount,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
