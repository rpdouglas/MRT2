import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
// PROJ-113: first use of Firebase Storage in this app (admin-uploaded
// inspirational images) — see storage.rules and docs/projects/113_DAILY_INSPIRATIONAL_IMAGE.md.
export const storage = app ? getStorage(app) : undefined;

if (USE_EMULATORS && auth && db && storage) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  console.warn("[MRT] Using local Firebase emulators (VITE_USE_EMULATORS=true) — not the real mrt2-app-dev project.");
}

// PROJ-103: Firebase App Check. Optional and inert by default — only
// initializes if VITE_RECAPTCHA_SITE_KEY is set (Firebase Console > App
// Check registration is a manual per-environment step, not done yet for
// any environment). No Cloud Function currently sets enforceAppCheck, so
// this alone changes no request behavior; it only starts attaching tokens
// once a site key exists, ahead of that follow-up work.
// See docs/projects/103_FIREBASE_APP_CHECK.md.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (app && recaptchaSiteKey) {
  if (import.meta.env.DEV) {
    // Lets local dev/CI request a debug-flavored token instead of solving a
    // real reCAPTCHA challenge — still requires the resulting token to be
    // registered as a valid debug token in Firebase Console to actually pass
    // server-side verification. Never set outside DEV.
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("[MRT] Firebase App Check failed to initialize — continuing without it.", e);
  }
}

export default app;