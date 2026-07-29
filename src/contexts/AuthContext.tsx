import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser, type User } from 'firebase/auth';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getOrCreateUserProfile } from '../lib/db';
import { refreshFcmTokenIfStale, listenForForegroundMessages } from '../lib/messaging';
import posthog from 'posthog-js';
import { trackClientError } from '../lib/telemetry';

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
    // Dev/screenshot-pipeline-only bypass (scripts/generate_screenshots.js drives the Vite
    // dev server with ?mockUser=<persona>). Never reachable in a production build: SEC-01,
    // Production Readiness Audit 2026-07-28.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const mockParam = params.get('mockUser');
      if (mockParam) {
        localStorage.setItem('mrt_mock_user', mockParam.toLowerCase());
      }

      const mockUserKey = localStorage.getItem('mrt_mock_user');
      if (mockUserKey) {
        const displayName = mockUserKey.charAt(0).toUpperCase() + mockUserKey.slice(1);
        const mockUserObj = {
          uid: `mock-uid-${mockUserKey}`,
          email: `${mockUserKey}@mrt.mock`,
          displayName: `${displayName} (Mock)`,
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => 'mock-token',
          getIdTokenResult: async () => ({ token: 'mock-token', claims: {}, authTime: '', expirationTime: '', signInProvider: '', signInSecondFactor: null }),
          reload: async () => {},
          toJSON: () => ({}),
          phoneNumber: null,
          photoURL: null,
        } as unknown as User;

        setUser(mockUserObj);
        setIsAdmin(mockUserKey === 'admin');
        setUserTier(mockUserKey === 'ned' || mockUserKey === 'maya' || mockUserKey === 'walt' ? 'premium' : 'free');
        setLoading(false);
        return;
      }
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubscribeSubscriptions: Unsubscribe | undefined;
    let unsubscribeForegroundMessages: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const profile = await getOrCreateUserProfile(currentUser);
          const idTokenResult = await currentUser.getIdTokenResult();
          const isAdminUser = !!idTokenResult.claims.admin || profile.role === 'admin';

          setUser(currentUser);
          setIsAdmin(isAdminUser);
          posthog.identify(currentUser.uid, { tier: profile.tier || 'free' });
          refreshFcmTokenIfStale(currentUser.uid, profile.fcmSwVersion).catch((error) => {
            console.error(error);
            trackClientError('fcm_token_refresh', error instanceof Error ? error.name : 'Error');
          });
          if (!unsubscribeForegroundMessages) {
            listenForForegroundMessages().then((unsub) => { unsubscribeForegroundMessages = unsub; }).catch((error) => {
              console.error(error);
              trackClientError('fcm_foreground_listener', error instanceof Error ? error.name : 'Error');
            });
          }

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
             }, (error) => { console.error("Subscription listener error:", error); trackClientError('subscription_listener', error.name || 'Error'); setUserTier('free'); });
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
          if (unsubscribeForegroundMessages) {
              unsubscribeForegroundMessages();
              unsubscribeForegroundMessages = undefined;
          }
        }
      } catch (error) { console.error("Error fetching user profile:", error); trackClientError('user_profile_fetch', error instanceof Error ? error.name : 'Error'); setUser(currentUser); setUserTier('free'); } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSubscriptions) { unsubscribeSubscriptions(); }
      if (unsubscribeForegroundMessages) { unsubscribeForegroundMessages(); }
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
    posthog.capture('user_logged_in', { method: 'google' });
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not initialized");
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await getOrCreateUserProfile(result.user);
    posthog.identify(result.user.uid);
    posthog.capture('user_signed_up', { method: 'email' });
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await signInWithEmailAndPassword(auth, email, pass);
    posthog.capture('user_logged_in', { method: 'email' });
  };

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

  const logout = async () => {
    localStorage.removeItem('mrt_mock_user');
    if (!auth) return;
    posthog.capture('user_logged_out');
    posthog.reset();
    await signOut(auth);
  };

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
