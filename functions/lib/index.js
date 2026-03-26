"use strict";
/**
 * functions/src/index.ts
 * PROJ-26: The Beacon
 * Daily Cron Job to evaluate user milestones and habits, dispatching Zero-Knowledge push notifications.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyBeacon = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
// Initialize the Admin SDK
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const messaging = (0, messaging_1.getMessaging)();
// Standard recovery milestones
const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];
function getMilestone(totalDays) {
    if (totalDays <= 0)
        return null;
    if (STANDARD_MILESTONES.includes(totalDays))
        return totalDays;
    if (totalDays % 365 === 0)
        return totalDays;
    return null;
}
function getMilestoneLabel(totalDays) {
    if (totalDays === 1)
        return '24 Hours';
    if (totalDays === 7)
        return '1 Week';
    if (totalDays === 30)
        return '1 Month';
    if (totalDays > 0 && totalDays % 365 === 0) {
        const years = totalDays / 365;
        return `${years} Year${years > 1 ? 's' : ''}`;
    }
    return `${totalDays} Days`;
}
exports.dailyBeacon = (0, scheduler_1.onSchedule)({
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
        // We will collect all messages to send in a single batch
        const messagesToSend = [];
        const staleTokensMap = new Map(); // uid -> tokens[]
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const uid = userDoc.id;
            const tokens = userData.fcmTokens || [];
            if (tokens.length === 0)
                continue;
            let title = "Daily Check-in";
            let body = "Take a moment for your recovery today.";
            let hasAlert = false;
            // A. Check Milestones
            if (userData.sobrietyDate) {
                const sobDate = userData.sobrietyDate.toDate();
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
                    .where("dueDate", "<=", firestore_1.Timestamp.fromDate(now))
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
                            click_action: "/dashboard" // PWA routing
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
                var _a, _b;
                if (!resp.success) {
                    const failedToken = messagesToSend[idx].token;
                    const errorCode = (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        // Find the user who owns this token
                        const targetUserDoc = usersSnap.docs.find(d => (d.data().fcmTokens || []).includes(failedToken));
                        if (targetUserDoc) {
                            const uid = targetUserDoc.id;
                            if (!staleTokensMap.has(uid)) {
                                staleTokensMap.set(uid, []);
                            }
                            (_b = staleTokensMap.get(uid)) === null || _b === void 0 ? void 0 : _b.push(failedToken);
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
                    fcmTokens: firestore_1.FieldValue.arrayRemove(...tokensToRemove)
                });
                pruneCount += tokensToRemove.length;
            });
            if (pruneCount > 0) {
                await batch.commit();
                logger.info(`Pruned ${pruneCount} dead tokens from database.`);
            }
        }
    }
    catch (error) {
        logger.error("Error executing Daily Beacon", error);
    }
});
//# sourceMappingURL=index.js.map