/**
 * GITHUB COMMENT:
 * [AuthContext.tsx]
 * FIXED: react-refresh/only-export-components warning by adding the required eslint-disable directive.
 * MAINTAINED: Google Drive OAuth scope logic and driveAccessToken state.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getOrCreateUserProfile } from '../lib/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  driveAccessToken: string | null;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          await getOrCreateUserProfile(currentUser);
          setUser(currentUser);
        } else {
          setUser(null);
          setDriveAccessToken(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(currentUser); 
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Auth not initialized");
    const provider = new GoogleAuthProvider();
    
    // Request access to create/edit backup files in user's Drive
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

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    driveAccessToken,
    loginWithGoogle,
    signupWithEmail,
    loginWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}