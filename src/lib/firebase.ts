import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. Load Config from Environment Variables (Vite Logic)
const getFirebaseConfig = () => {
  // In Vite, env vars are accessed via import.meta.env
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  
  if (!configStr) {
    // In local dev, if .env isn't set up yet, this warns you.
    console.error("Missing VITE_FIREBASE_CONFIG. Check your .env file.");
    return {}; 
  }

  try {
    return JSON.parse(configStr);
  } catch (error) {
    console.error("Failed to parse Firebase Config JSON", error);
    return {};
  }
};

const firebaseConfig = getFirebaseConfig();

// 2. Initialize Core Services
// We check if config is valid to prevent white-screen crashes on load
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : undefined;

export const auth = app ? getAuth(app) : undefined;
export const db = app ? getFirestore(app) : undefined;
export const googleProvider = new GoogleAuthProvider();

export default app;