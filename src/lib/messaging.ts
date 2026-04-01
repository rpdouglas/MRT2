/**
 * src/lib/messaging.ts
 * PROJ-26: The Beacon (Push Notification Engine)
 * Handles Firebase Cloud Messaging client-side token generation and permission requests.
 */
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import app, { db } from "./firebase";

export async function requestNotificationPermission(uid: string): Promise<boolean> {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn("FCM is not supported in this browser environment.");
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { console.log("Notification permission not granted."); return false; }

        const messaging = getMessaging(app);
        
        // VAPID KEY generated from Firebase Console -> Project Settings -> Cloud Messaging
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) { console.error("Missing VITE_FIREBASE_VAPID_KEY in environment variables."); return false; }

        // Get the token, using the Service Worker registered by Vite PWA if available
        const registration = await navigator.serviceWorker.getRegistration();
        
        const currentToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

        if (currentToken && db) {
            // Save token to Firestore to allow Cloud Functions to address this specific device
            const userRef = doc(db, 'users', uid);
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(currentToken),
                timezone: userTimezone
            });
            console.log("Device securely registered for notifications.");
            return true;
        } else { console.log("No registration token available."); return false; }
    } catch (error) { console.error('An error occurred while retrieving token. ', error); return false; }
}
