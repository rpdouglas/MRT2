/**
 * functions/src/index.ts
 * PROJ-26: The Beacon — daily milestone & habit push notifications
 * PROJ-42: Daily Readings buffer health & auto-generation
 * PROJ-BILLING: Stripe subscription sync
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getMessaging, TokenMessage } from "firebase-admin/messaging";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    MODALITY_CONFIGS,
    READING_MODALITIES,
    type ReadingModality,
} from "./prompts";

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// ─── PROJ-26 constants ────────────────────────────────────────────────────────

// Override via Firebase Functions env var if using a custom domain.
const APP_URL = process.env.APP_URL ?? "https://mrt2-app-prod.web.app";

const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

function getMilestone(totalDays: number): number | null {
    if (totalDays <= 0) return null;
    if (STANDARD_MILESTONES.includes(totalDays)) return totalDays;
    if (totalDays % 365 === 0) return totalDays;
    return null;
}

function getMilestoneLabel(totalDays: number): string {
    if (totalDays === 1) return "24 Hours";
    if (totalDays === 7) return "1 Week";
    if (totalDays === 30) return "1 Month";
    if (totalDays > 0 && totalDays % 365 === 0) {
        const years = totalDays / 365;
        return `${years} Year${years > 1 ? "s" : ""}`;
    }
    return `${totalDays} Days`;
}

// ─── PROJ-42 constants & helpers ──────────────────────────────────────────────

const BUFFER_WARN_DAYS = 30;
const BUFFER_CRITICAL_DAYS = 14;

const COPYRIGHT_TRIGGERS = [
    "Daily Reflections", "Just for Today", "Hope Faith and Courage",
    "Cocaine Anonymous World Services", "NA World Services",
    "AA World Services", "AAWS",
];

function utcDateString(d: Date): string {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function addDaysToDate(dateStr: string, n: number): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return utcDateString(d);
}

function daysRemaining(lastGeneratedDate: string): number {
    const today = utcDateString(new Date());
    const last = new Date(`${lastGeneratedDate}T00:00:00Z`);
    const now = new Date(`${today}T00:00:00Z`);
    return Math.max(0, Math.ceil((last.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function checkCopyright(text: string): string[] {
    return COPYRIGHT_TRIGGERS.filter((t) =>
        text.toLowerCase().includes(t.toLowerCase())
    );
}

interface GeneratedReading {
    date: string;
    theme: string;
    title: string;
    body: string;
    reflection: string;
    affirmation: string;
    attribution?: string;
}

function buildBatchPrompt(
    datesAndThemes: Array<{ date: string; theme: string }>,
    requiresAttribution: boolean,
): string {
    const list = datesAndThemes
        .map((d, i) => `${i + 1}. Date: ${d.date} | Theme: ${d.theme}`)
        .join("\n");

    const attributionRule = requiresAttribution
        ? '\n- "attribution": must be exactly "Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org"'
        : "";

    return `Generate exactly ${datesAndThemes.length} daily recovery readings for the following dates and themes:

${list}

Return ONLY a valid JSON array of exactly ${datesAndThemes.length} objects. Each object must have:
- "date": the YYYY-MM-DD date from the list above
- "theme": the theme from the list above
- "title": an evocative 3-7 word title (not a date, not a sentence fragment)
- "body": 200-300 words of warm, recovery-focused prose (plain text, no markdown)
- "reflection": one open-ended journaling question ending with "?"
- "affirmation": one short closing affirmation sentence${attributionRule}

Rules:
- All string values must be plain text with no markdown formatting
- body must be 200-300 words
- reflection must end with "?"
- Return ONLY the JSON array — no preamble, no explanation, no code fences`;
}

async function generateForModality(
    modality: ReadingModality,
    startDate: string,
    numDays: number,
    apiKey: string,
): Promise<{ written: number; errors: number }> {
    const config = MODALITY_CONFIGS[modality];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: config.systemPrompt,
        generationConfig: { responseMimeType: "application/json" },
    });

    const BATCH_SIZE = 10;
    let written = 0;
    let errors = 0;
    const batchNumber = Math.floor(Date.now() / 1000);

    for (let batchStart = 0; batchStart < numDays; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, numDays);
        const datesAndThemes: Array<{ date: string; theme: string }> = [];

        for (let i = batchStart; i < batchEnd; i++) {
            datesAndThemes.push({
                date: addDaysToDate(startDate, i),
                theme: config.themes[i % config.themes.length],
            });
        }

        const prompt = buildBatchPrompt(datesAndThemes, config.requiresAttribution);

        try {
            const result = await model.generateContent(prompt);
            const rawText = result.response.text();

            let readings: GeneratedReading[];
            try {
                readings = JSON.parse(rawText) as GeneratedReading[];
            } catch {
                logger.error(`JSON parse error for ${modality} batch ${batchStart}–${batchEnd}`, {
                    preview: rawText.slice(0, 300),
                });
                errors += batchEnd - batchStart;
                continue;
            }

            if (!Array.isArray(readings)) {
                logger.error(`Non-array response for ${modality} batch ${batchStart}`);
                errors += batchEnd - batchStart;
                continue;
            }

            const firestoreBatch = db.batch();
            let batchCount = 0;

            for (const r of readings) {
                if (!r.date || !r.body || !r.reflection || !r.affirmation) {
                    errors++;
                    continue;
                }

                const violations = checkCopyright(`${r.body} ${r.reflection} ${r.affirmation}`);
                if (violations.length > 0) {
                    logger.warn(`Copyright violation skipped — ${modality} ${r.date}`, { violations });
                    errors++;
                    continue;
                }

                const docId = `${modality}_${r.date}`;
                const themeForDate = datesAndThemes.find((d) => d.date === r.date)?.theme ?? r.theme ?? "";

                firestoreBatch.set(db.collection("daily_readings").doc(docId), {
                    id: docId,
                    modality,
                    date: r.date,
                    theme: r.theme || themeForDate,
                    title: r.title || r.theme || themeForDate,
                    body: r.body,
                    reflection: r.reflection,
                    affirmation: r.affirmation,
                    attribution: config.requiresAttribution
                        ? "Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org"
                        : null,
                    generatedAt: FieldValue.serverTimestamp(),
                    bufferBatch: batchNumber,
                });

                written++;
                batchCount++;
            }

            if (batchCount > 0) {
                await firestoreBatch.commit();
            }
        } catch (err) {
            logger.error(`Generation error — ${modality} batch ${batchStart}–${batchEnd}`, err);
            errors += batchEnd - batchStart;
        }

        await new Promise<void>((resolve) => setTimeout(resolve, 250));
    }

    // Update buffer_status after each modality so partial runs are tracked
    const lastDate = addDaysToDate(startDate, numDays - 1);
    await db.collection("buffer_status").doc(modality).set({
        lastGeneratedDate: lastDate,
        totalBuffered: written,
        lastBatchGeneratedAt: FieldValue.serverTimestamp(),
        nextBatchDue: addDaysToDate(lastDate, -BUFFER_WARN_DAYS),
    }, { merge: true });

    logger.info(`PROJ-42: ${modality} — ${written} readings written, ${errors} errors. Buffer through ${lastDate}.`);
    return { written, errors };
}

// ─── PROJ-26: Daily Beacon ─────────────────────────────────────────────────────

export const dailyBeacon = onSchedule({
    schedule: "0 12 * * *",
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "northamerica-northeast1",
}, async () => {
    logger.info("Starting Daily Beacon execution...", { time: new Date().toISOString() });

    try {
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

        const messagesToSend: TokenMessage[] = [];
        const staleTokensMap = new Map<string, string[]>();

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const uid = userDoc.id;
            const tokens: string[] = userData.fcmTokens || [];

            if (tokens.length === 0) continue;

            let title = "Daily Check-in";
            let body = "Take a moment for your recovery today.";
            let hasAlert = false;

            if (userData.sobrietyDate) {
                const sobDate = (userData.sobrietyDate as Timestamp).toDate();
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

            if (!hasAlert) {
                const tasksSnap = await db.collection("tasks")
                    .where("uid", "==", uid)
                    .where("status", "==", "pending")
                    .where("dueDate", "<=", Timestamp.fromDate(endOfTodayUTC))
                    .get();

                if (!tasksSnap.empty) {
                    title = "Keep the Fire Alive 🔥";
                    body = `You have ${tasksSnap.size} habit${tasksSnap.size > 1 ? "s" : ""} to complete today.`;
                    hasAlert = true;
                }
            }

            if (hasAlert) {
                tokens.forEach((token) => {
                    messagesToSend.push({
                        token,
                        notification: { title, body },
                        data: { click_action: `${APP_URL}/dashboard` },
                        webpush: { fcmOptions: { link: `${APP_URL}/dashboard` } },
                    });
                });
            }
        }

        if (messagesToSend.length === 0) {
            logger.info("No actionable alerts to send today.");
            return;
        }

        logger.info(`Dispatching ${messagesToSend.length} notifications...`);
        const batchResponse = await messaging.sendEach(messagesToSend);
        logger.info(`Sent ${batchResponse.successCount}. Failed: ${batchResponse.failureCount}`);

        if (batchResponse.failureCount > 0) {
            batchResponse.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const failedToken = messagesToSend[idx].token;
                    const errorCode = resp.error?.code;
                    if (
                        errorCode === "messaging/invalid-registration-token" ||
                        errorCode === "messaging/registration-token-not-registered"
                    ) {
                        const targetUserDoc = usersSnap.docs.find((d) =>
                            (d.data().fcmTokens || []).includes(failedToken)
                        );
                        if (targetUserDoc) {
                            const uid = targetUserDoc.id;
                            if (!staleTokensMap.has(uid)) staleTokensMap.set(uid, []);
                            staleTokensMap.get(uid)?.push(failedToken);
                        }
                    }
                }
            });

            const batch = db.batch();
            let pruneCount = 0;
            staleTokensMap.forEach((tokensToRemove, uid) => {
                batch.update(db.collection("users").doc(uid), {
                    fcmTokens: FieldValue.arrayRemove(...tokensToRemove),
                });
                pruneCount += tokensToRemove.length;
            });

            if (pruneCount > 0) {
                await batch.commit();
                logger.info(`Pruned ${pruneCount} dead tokens.`);
            }
        }
    } catch (error) {
        logger.error("Error executing Daily Beacon", error);
    }
});

// ─── PROJ-42: Buffer Health Check ─────────────────────────────────────────────

export const checkBufferHealth = onSchedule({
    schedule: "1 0 * * *",
    timeoutSeconds: 540,
    memory: "512MiB",
    region: "northamerica-northeast1",
    secrets: [geminiApiKey],
}, async () => {
    logger.info("PROJ-42: Checking daily readings buffer health...");

    const today = utcDateString(new Date());
    const modalitiesToRefill: ReadingModality[] = [];

    for (const modality of READING_MODALITIES) {
        const statusSnap = await db.collection("buffer_status").doc(modality).get();

        if (!statusSnap.exists) {
            logger.error(`PROJ-42: No buffer_status doc for ${modality} — run seed script first.`);
            continue;
        }

        const status = statusSnap.data() as { lastGeneratedDate: string };
        const remaining = daysRemaining(status.lastGeneratedDate);

        if (remaining < BUFFER_CRITICAL_DAYS) {
            logger.error(`PROJ-42: CRITICAL — ${modality} has ${remaining} days remaining.`);
            modalitiesToRefill.push(modality);
        } else if (remaining < BUFFER_WARN_DAYS) {
            logger.warn(`PROJ-42: LOW — ${modality} has ${remaining} days remaining. Refilling.`);
            modalitiesToRefill.push(modality);
        } else {
            logger.info(`PROJ-42: OK — ${modality} has ${remaining} days remaining.`);
        }
    }

    if (modalitiesToRefill.length === 0) {
        logger.info("PROJ-42: All modality buffers healthy. No generation needed.");
        return;
    }

    logger.info(`PROJ-42: Generating new buffer for: ${modalitiesToRefill.join(", ")}`);
    const apiKey = geminiApiKey.value();

    for (const modality of modalitiesToRefill) {
        const statusSnap = await db.collection("buffer_status").doc(modality).get();
        const status = statusSnap.data() as { lastGeneratedDate: string };

        // Start from the day after the last generated date (or tomorrow if buffer already expired)
        const lastDate = status.lastGeneratedDate;
        const tomorrow = addDaysToDate(today, 1);
        const startDate = lastDate >= today ? addDaysToDate(lastDate, 1) : tomorrow;

        await generateForModality(modality, startDate, 90, apiKey);
    }

    logger.info("PROJ-42: Buffer refill complete.");
});

// ─── PROJ-42: Admin Generation Endpoint ───────────────────────────────────────

interface GenerateRequest {
    modality?: string;
    startDate?: string;
    numDays?: number;
}

export const generateReadingsAdmin = onCall({
    secrets: [geminiApiKey],
    timeoutSeconds: 540,
    memory: "1GiB",
    region: "northamerica-northeast1",
}, async (request) => {
    if (!request.auth?.token.admin) {
        throw new HttpsError("permission-denied", "Admin access required.");
    }

    const { modality, startDate, numDays = 90 } = request.data as GenerateRequest;

    // Validate numDays
    if (numDays < 1 || numDays > 180) {
        throw new HttpsError("invalid-argument", "numDays must be between 1 and 180.");
    }

    // Determine start date
    const today = utcDateString(new Date());
    const resolvedStart = startDate ?? addDaysToDate(today, 1);

    // Validate startDate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedStart)) {
        throw new HttpsError("invalid-argument", "startDate must be YYYY-MM-DD.");
    }

    const apiKey = geminiApiKey.value();
    const results: Record<string, { written: number; errors: number }> = {};

    if (modality && modality !== "all") {
        if (!READING_MODALITIES.includes(modality as ReadingModality)) {
            throw new HttpsError("invalid-argument", `Unknown modality: ${modality}`);
        }
        results[modality] = await generateForModality(
            modality as ReadingModality, resolvedStart, numDays, apiKey
        );
    } else {
        for (const m of READING_MODALITIES) {
            results[m] = await generateForModality(m, resolvedStart, numDays, apiKey);
        }
    }

    return { success: true, results };
});

// ─── PROJ-BILLING: Stripe Subscription Sync ───────────────────────────────────

export const syncStripeSubscription = onDocumentWritten(
    {
        document: "users/{userId}/subscriptions/{subscriptionId}",
        region: "northamerica-northeast1",
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            logger.info("No data associated with the event.");
            return;
        }

        const beforeStatus = snapshot.before.data()?.status;
        const afterStatus = snapshot.after.data()?.status;

        if (beforeStatus === afterStatus) {
            logger.info(`Status unchanged (${afterStatus}). Exiting.`);
            return;
        }

        const userId = event.params.userId;
        const isPremium = afterStatus === "active" || afterStatus === "trialing";
        const newTier = isPremium ? "premium" : "free";

        logger.info(`Updating user ${userId} to tier: ${newTier} (Stripe: ${afterStatus || "deleted"})`);

        try {
            await db.collection("users").doc(userId).update({
                tier: newTier,
                tierSource: "Stripe-Managed",
            });
            await getAuth().setCustomUserClaims(userId, { premium: isPremium });
            logger.info(`Provisioned ${newTier} access for ${userId}.`);
        } catch (error) {
            logger.error(`Failed to provision access for ${userId}`, error);
        }
    }
);
