/**
 * src/lib/messaging.ts
 * PROJ-26: The Beacon (Push Notification Engine)
 * Handles Firebase Cloud Messaging client-side token generation and permission requests.
 */
import { getMessaging, getToken, isSupported, onMessage, type Unsubscribe } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import app, { db } from "./firebase";

const FCM_SW_VERSION = 2;

export async function requestNotificationPermission(uid: string): Promise<boolean> {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn("FCM is not supported in this browser environment.");
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { return false; }

        const messaging = getMessaging(app);
        
        // VAPID KEY generated from Firebase Console -> Project Settings -> Cloud Messaging
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) { console.error("Missing VITE_FIREBASE_VAPID_KEY in environment variables."); return false; }

        // Let FCM register firebase-messaging-sw.js at its own scope — avoids conflict with the VitePWA SW.
        const currentToken = await getToken(messaging, { vapidKey });

        if (currentToken && db) {
            // Save token to Firestore to allow Cloud Functions to address this specific device
            const userRef = doc(db, 'users', uid);
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(currentToken),
                timezone: userTimezone
            });
            return true;
        } else { return false; }
    } catch (error) { console.error('An error occurred while retrieving token. ', error); return false; }
}

// Clears tokens registered against the old VitePWA SW and re-registers against the correct
// firebase-messaging-sw.js. Runs once per user on first login after the fix is deployed.
export async function refreshFcmTokenIfStale(uid: string, fcmSwVersion: number | undefined): Promise<void> {
    if (fcmSwVersion === FCM_SW_VERSION) return;
    if (!db) return;

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { fcmTokens: [], fcmSwVersion: FCM_SW_VERSION });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        await requestNotificationPermission(uid);
    }
}

// Displays an in-app toast for pushes that arrive while the tab is focused — background
// messages are already handled by public/firebase-messaging-sw.js's onBackgroundMessage.
export async function listenForForegroundMessages(): Promise<Unsubscribe | undefined> {
    const supported = await isSupported();
    if (!supported) return undefined;

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'Notification';
        const body = payload.notification?.body;
        toast(title, body ? { description: body } : undefined);
    });
}
