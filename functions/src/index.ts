/**
 * functions/src/index.ts
 * PROJ-26: The Beacon
 * Daily Cron Job to evaluate user milestones and habits, dispatching Zero-Knowledge push notifications.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getMessaging, TokenMessage } from "firebase-admin/messaging";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize the Admin SDK
initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Standard recovery milestones
const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

function getMilestone(totalDays: number): number | null {
    if (totalDays <= 0) return null;
    if (STANDARD_MILESTONES.includes(totalDays)) return totalDays;
    if (totalDays % 365 === 0) return totalDays;
    return null;
}

function getMilestoneLabel(totalDays: number): string {
    if (totalDays === 1) return '24 Hours';
    if (totalDays === 7) return '1 Week';
    if (totalDays === 30) return '1 Month';
    if (totalDays > 0 && totalDays % 365 === 0) {
        const years = totalDays / 365;
        return `${years} Year${years > 1 ? 's' : ''}`;
    }
    return `${totalDays} Days`;
}

export const dailyBeacon = onSchedule({
    schedule: "0 12 * * *", // 12:00 PM UTC (8:00 AM EST)
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "northamerica-northeast1" // Matching your existing functions
}, async () => {
    logger.info("Starting Daily Beacon execution...", { time: new Date().toISOString() });

    try {
        // 1. Fetch users who have active FCM tokens
        const usersSnap = await db.collection("users")
            .where("fcmTokens", "!=", [])
            .get();

        if (usersSnap.empty) {
            logger.info("No users with active tokens found. Exiting.");
            return;
        }

        const now = new Date();
        const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        // We will collect all messages to send in a single batch
        const messagesToSend: TokenMessage[] = [];
        const staleTokensMap = new Map<string, string[]>(); // uid -> tokens[]

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const uid = userDoc.id;
            const tokens: string[] = userData.fcmTokens || [];

            if (tokens.length === 0) continue;

            let title = "Daily Check-in";
            let body = "Take a moment for your recovery today.";
            let hasAlert = false;

            // A. Check Milestones
            if (userData.sobrietyDate) {
                const sobDate = (userData.sobrietyDate as Timestamp).toDate();
                // Normalize to UTC start of day to avoid timezone drift
                const sobStartUTC = new Date(Date.UTC(sobDate.getUTCFullYear(), sobDate.getUTCMonth(), sobDate.getUTCDate()));
                const diffTime = Math.abs(startOfTodayUTC.getTime() - sobStartUTC.getTime());
                const daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const milestone = getMilestone(daysClean);
                if (milestone) {
                    title = "🎉 Milestone Reached!";
                    body = `Happy ${getMilestoneLabel(milestone)}! Tap to view your new medallion.`;
                    hasAlert = true;
                }
            }

            // B. Check Tasks (Only if it's not a milestone day, to prevent overriding the celebration)
            if (!hasAlert) {
                // Get pending tasks due today or earlier
                const tasksSnap = await db.collection("tasks")
                    .where("uid", "==", uid)
                    .where("status", "==", "pending")
                    .where("dueDate", "<=", Timestamp.fromDate(endOfTodayUTC))
                    .get();

                if (!tasksSnap.empty) {
                    title = "Keep the Fire Alive 🔥";
                    body = `You have ${tasksSnap.size} habit${tasksSnap.size > 1 ? 's' : ''} to complete today.`;
                    hasAlert = true;
                }
            }

            // If we have something meaningful to say, queue the message for every token this user owns
            if (hasAlert) {
                tokens.forEach(token => {
                    messagesToSend.push({
                        token: token,
                        notification: {
                            title,
                            body,
                        },
                        data: {
                            click_action: "/dashboard" // Legacy PWA routing fallback
                        },
                        webpush: {
                            fcmOptions: {
                                link: "/dashboard" // Standardized HTTP v1 PWA routing
                            }
                        }
                    });
                });
            }
        }

        if (messagesToSend.length === 0) {
            logger.info("No actionable alerts to send today.");
            return;
        }

        // 2. Dispatch Notifications in batches of 500 (Firebase Admin SDK limit)
        logger.info(`Dispatching ${messagesToSend.length} notifications...`);
        
        // Since sendAll/sendMulticast is deprecated in the latest SDKs, we use sendEach
        const batchResponse = await messaging.sendEach(messagesToSend);

        logger.info(`Successfully sent ${batchResponse.successCount} messages. Failed: ${batchResponse.failureCount}`);

        // 3. Clean up Dead Tokens (The "Right to be Forgotten" & Database hygiene)
        if (batchResponse.failureCount > 0) {
            batchResponse.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const failedToken = messagesToSend[idx].token;
                    const errorCode = resp.error?.code;

                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        // Find the user who owns this token
                        const targetUserDoc = usersSnap.docs.find(d => 
                            (d.data().fcmTokens || []).includes(failedToken)
                        );
                        
                        if (targetUserDoc) {
                            const uid = targetUserDoc.id;
                            if (!staleTokensMap.has(uid)) {
                                staleTokensMap.set(uid, []);
                            }
                            staleTokensMap.get(uid)?.push(failedToken);
                        }
                    }
                }
            });

            // Execute cleanup writes
            const batch = db.batch();
            let pruneCount = 0;

            staleTokensMap.forEach((tokensToRemove, uid) => {
                const userRef = db.collection("users").doc(uid);
                batch.update(userRef, {
                    fcmTokens: FieldValue.arrayRemove(...tokensToRemove)
                });
                pruneCount += tokensToRemove.length;
            });

            if (pruneCount > 0) {
                await batch.commit();
                logger.info(`Pruned ${pruneCount} dead tokens from database.`);
            }
        }

    } catch (error) {
        logger.error("Error executing Daily Beacon", error);
    }
});


// --- PROJ-BILLING: Stripe Subscription Synchronization ---
// SRE Note: First-time deployment to a new project requires ~2 mins for Eventarc IAM propagation.
export const syncStripeSubscription = onDocumentWritten(
    {
        document: "users/{userId}/subscriptions/{subscriptionId}",
        region: "northamerica-northeast1"
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            logger.info("No data associated with the event.");
            return;
        }

        const beforeData = snapshot.before.data();
        const afterData = snapshot.after.data();

        const beforeStatus = beforeData?.status;
        const afterStatus = afterData?.status;

        // Idempotency check: only act if the status actually changed
        if (beforeStatus === afterStatus) {
            logger.info(`Status unchanged (${afterStatus}) for subscription ${event.params.subscriptionId}. Exiting.`);
            return;
        }

        const userId = event.params.userId;
        // Consider active or trialing as Premium
        const isPremium = afterStatus === "active" || afterStatus === "trialing";
        const newTier = isPremium ? "premium" : "free";

        logger.info(`Updating user ${userId} to tier: ${newTier} (Stripe Status: ${afterStatus || 'deleted'})`);

        try {
            // 1. Update Firestore Profile
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                tier: newTier,
                tierSource: "Stripe-Managed"
            });

            // 2. Update Firebase Auth Custom Claims (JWT Token)
            await getAuth().setCustomUserClaims(userId, { premium: isPremium });
            
            logger.info(`Successfully provisioned ${newTier} access for ${userId}.`);
        } catch (error) {
            logger.error(`Failed to provision access for user ${userId}`, error);
        }
    }
);
