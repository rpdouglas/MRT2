# MRT Remediation Implementation Plan: AI Security, Offline Cache & Telemetry

This plan outlines the architecture, code changes, and verification steps for implementing the three approved remediation items from the codebase gaps audit.

---

## 1. Firebase Cloud Functions AI Proxy (`generateAIInsights`)

To secure the Gemini API key from exposure in client bundles, all generative AI logic will be moved to a secure Firebase Cloud Function. Prompt templates are constructed server-side, preventing prompt injection or quota abuse.

### A. Server-Side Changes (`functions/src/index.ts`)
We will export a new HTTPS Callable Function:
```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateAIInsights = onCall({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "northamerica-northeast1",
}, async (request) => {
    // 1. Authenticate user
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;

    const { analysisType, dataPayload } = request.data;
    const apiKey = geminiApiKey.value();
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Validate rate limits and tier permissions server-side
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data() || {};
    const userTier = userData.tier || "free";
    
    // Server-side limit validation for Free Tier
    if (userTier === "free") {
        const limits = userData.usage_limits || {};
        const now = new Date();
        // Compare dates and throw HttpsError("resource-exhausted") if limited...
    }

    // 3. Construct prompt templates and call Gemini
    let prompt = "";
    let modelName = "gemini-3-flash-preview";

    switch (analysisType) {
        case "journal_analysis":
            prompt = `Analyze this journal entry: ${dataPayload.content}...`;
            modelName = "gemini-2.5-flash-lite";
            break;
        case "deep_pattern_analysis":
            prompt = `Analyze 90 days of journals: ${dataPayload.journalHistory}...`;
            modelName = "gemini-3.1-pro-preview";
            break;
        // Other types: comparative, workbook, rosc, cba, coaching
    }

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return { text: response.text() };
});
```

### B. Client-Side Changes (`src/lib/gemini.ts`)
Rewrite `src/lib/gemini.ts` to call the HTTPS proxy function:
```typescript
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "./firebase";

const functions = getFunctions(app);

export async function generateJournalAnalysis(content: string): Promise<AIAnalysisResult> {
    const proxy = httpsCallable(functions, "generateAIInsights");
    const result = await proxy({
        analysisType: "journal_analysis",
        dataPayload: { content }
    });
    return JSON.parse(result.data.text) as AIAnalysisResult;
}
```

---

## 2. Firestore Persistent Local Cache (`src/lib/firebase.ts`)

Enables multi-tab persistent IndexedDB caching so the app can boot completely offline without throwing database connection errors.

### Code Changes
Modify `src/lib/firebase.ts` to replace `getFirestore` with `initializeFirestore`:
```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = { ... };
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : undefined;

export const auth = app ? getAuth(app) : undefined;

// Enable persistent multi-tab local cache
export const db = app 
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : undefined;

export const googleProvider = new GoogleAuthProvider();
```

---

## 3. PostHog Decryption Error Telemetry (`src/lib/crypto.ts`)

Captures HMAC mismatches and key corruption issues in production, allowing developers to monitor Vault health without compromising user privacy.

### Code Changes
Update the `decrypt` function in `src/lib/crypto.ts` to capture exceptions and log them to PostHog:
```typescript
import posthog from "posthog-js";

export async function decrypt(encryptedPackage: string): Promise<string> {
  if (!globalKey) throw new Error("Vault is locked");

  if (!encryptedPackage) return "";
  if (!encryptedPackage.includes(':')) return encryptedPackage; // Legacy plain text

  try {
    const parts = encryptedPackage.split(':');
    const iv = Uint8Array.from(parts[0].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ciphertext = Uint8Array.from(parts[1].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      globalKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    
    // Capture anonymized metric in PostHog
    posthog.capture("vault_decryption_failed", {
        error_name: error instanceof Error ? error.name : "UnknownError",
        error_message: error instanceof Error ? error.message : "unknown"
    });
    
    throw error;
  }
}
```

---

## 4. Verification Plan

1.  **VitePress Compilation**: Run `npm run docs:build` to verify user guides.
2.  **QA Validation**: Run `npm run check` to verify linting and tests pass successfully.
3.  **Local Emulators Run**: Start the Firebase Local Emulators suite with `firebase emulators:start` to test Cloud Function deployments locally.
