import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Local-only test harness: set VITE_USE_EMULATORS=true (e.g. in a
// gitignored .env.local) to point the app at `firebase emulators:start`
// instead of the real mrt2-app-dev project. Never set in committed env
// files — this must never affect a real deploy.
const USE_EMULATORS = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true';

// 1. Construct config directly from individual environment variables
// These will be injected by Vite during the build
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 2. Initialize (Safe Check)
// We check if apiKey exists to ensure we aren't crashing on empty config
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : undefined;

if (!app) {
  console.error("Firebase failed to initialize. Missing API Key.");
}

export const auth = app ? getAuth(app) : undefined;
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : undefined;

if (USE_EMULATORS && auth && db) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  console.warn("[MRT] Using local Firebase emulators (VITE_USE_EMULATORS=true) — not the real mrt2-app-dev project.");
}

export default app;