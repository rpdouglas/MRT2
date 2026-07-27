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
import * as crypto from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp, type QueryDocumentSnapshot, type DocumentData } from "firebase-admin/firestore";
import { getMessaging, TokenMessage } from "firebase-admin/messaging";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    MODALITY_CONFIGS,
    READING_MODALITIES,
    type ReadingModality,
} from "./prompts";
import { generateLayout, type CrosswordResultWord } from "crossword-layout-generator";
import {
    CROSSWORDESE_DENYLIST,
    pickTheme,
    buildWordSelectionPrompt,
    buildCluePolishPrompt,
} from "./crosswordPrompts";

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const vaultPepperSecret = defineSecret("VAULT_PEPPER");

// ─── PROJ-65 constants ────────────────────────────────────────────────────────
// Escalating lockout applied to failed vault-PIN verification attempts.
// Deliberately gives a few free retries (David persona — crisis-state fat-fingering)
// before any friction, then escalates fast enough that offline-equivalent guessing
// across the 10,000-combination PIN space is infeasible within any reasonable window.
export function computeLockoutSeconds(attemptCount: number): number | null {
    if (attemptCount >= 12) return 24 * 60 * 60;
    if (attemptCount >= 8) return 15 * 60;
    if (attemptCount >= 5) return 60;
    return null;
}

// ─── PROJ-26 constants ────────────────────────────────────────────────────────

// Override via Firebase Functions env var if using a custom domain.
const APP_URL = process.env.APP_URL ?? "https://mrt2-app-prod.web.app";

const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

export function getMilestone(totalDays: number): number | null {
    if (totalDays <= 0) return null;
    if (STANDARD_MILESTONES.includes(totalDays)) return totalDays;
    if (totalDays % 365 === 0) return totalDays;
    return null;
}

export function getMilestoneLabel(totalDays: number): string {
    if (totalDays === 1) return "24 Hours";
    if (totalDays === 7) return "1 Week";
    if (totalDays === 30) return "1 Month";
    if (totalDays > 0 && totalDays % 365 === 0) {
        const years = totalDays / 365;
        return `${years} Year${years > 1 ? "s" : ""}`;
    }
    return `${totalDays} Days`;
}

export interface BeaconAlert { title: string; body: string; }

export function computeMilestoneAlert(sobrietyDate: Timestamp | undefined, startOfTodayUTC: Date): BeaconAlert | null {
    if (!sobrietyDate) return null;
    const sobDate = sobrietyDate.toDate();
    const sobStartUTC = new Date(Date.UTC(sobDate.getUTCFullYear(), sobDate.getUTCMonth(), sobDate.getUTCDate()));
    const diffTime = Math.abs(startOfTodayUTC.getTime() - sobStartUTC.getTime());
    const daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const milestone = getMilestone(daysClean);
    if (!milestone) return null;
    return {
        title: "🎉 Milestone Reached!",
        body: `Happy ${getMilestoneLabel(milestone)}! Tap to view your new medallion.`,
    };
}

export function computeHabitAlert(pendingTaskCount: number): BeaconAlert | null {
    if (pendingTaskCount <= 0) return null;
    return {
        title: "Keep the Fire Alive 🔥",
        body: `You have ${pendingTaskCount} habit${pendingTaskCount > 1 ? "s" : ""} to complete today.`,
    };
}

export interface BeaconUserDoc { id: string; data: () => DocumentData; }

export interface BeaconBatchResult {
    messages: TokenMessage[];
    tokenToUid: Map<string, string>;
    usersProcessed: number;
    usersFailed: number;
}

// Isolated per-user so one malformed record (e.g. a bad sobrietyDate) can't abort
// processing for every user that comes after it in the batch.
export async function processUserBatch(
    userDocs: BeaconUserDoc[],
    startOfTodayUTC: Date,
    getPendingTaskCount: (uid: string) => Promise<number>
): Promise<BeaconBatchResult> {
    const messages: TokenMessage[] = [];
    const tokenToUid = new Map<string, string>();
    let usersProcessed = 0;
    let usersFailed = 0;

    for (const userDoc of userDocs) {
        usersProcessed++;
        const uid = userDoc.id;
        try {
            const userData = userDoc.data();
            const tokens: string[] = (userData.fcmTokens as string[]) || [];
            if (tokens.length === 0) continue;

            tokens.forEach((token) => tokenToUid.set(token, uid));

            let alert = computeMilestoneAlert(userData.sobrietyDate as Timestamp | undefined, startOfTodayUTC);
            if (!alert) {
                const pendingCount = await getPendingTaskCount(uid);
                alert = computeHabitAlert(pendingCount);
            }

            if (alert) {
                const { title, body } = alert;
                tokens.forEach((token) => {
                    messages.push({
                        token,
                        notification: { title, body },
                        data: { click_action: `${APP_URL}/dashboard` },
                        webpush: { fcmOptions: { link: `${APP_URL}/dashboard` } },
                    });
                });
            }
        } catch (userError) {
            usersFailed++;
            logger.error(`dailyBeacon: failed to process user ${uid}`, userError);
        }
    }

    return { messages, tokenToUid, usersProcessed, usersFailed };
}

interface BeaconSendResponse { success: boolean; error?: { code?: string }; }

// Maps each failed, permanently-invalid token back to its owning uid so dead tokens
// can be pruned from Firestore without re-scanning every fetched user doc.
export function identifyStaleTokensByUser(
    responses: BeaconSendResponse[],
    tokens: string[],
    tokenToUid: Map<string, string>
): Map<string, string[]> {
    const staleTokensMap = new Map<string, string[]>();
    responses.forEach((resp, idx) => {
        if (resp.success) return;
        const failedToken = tokens[idx];
        const errorCode = resp.error?.code;
        if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
        ) {
            const uid = tokenToUid.get(failedToken);
            if (uid) {
                if (!staleTokensMap.has(uid)) staleTokensMap.set(uid, []);
                staleTokensMap.get(uid)?.push(failedToken);
            }
        }
    });
    return staleTokensMap;
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

export function buildBatchPrompt(
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

const BEACON_USER_BATCH_SIZE = 300;
const BEACON_BATCH_WARN_THRESHOLD = 20;

export const dailyBeacon = onSchedule({
    schedule: "0 12 * * *",
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "northamerica-northeast1",
}, async () => {
    logger.info("Starting Daily Beacon execution...", { time: new Date().toISOString() });

    try {
        const now = new Date();
        const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const messagesToSend: TokenMessage[] = [];
        // Maps each dispatched token back to its owning uid, so a failed send can be pruned
        // without re-scanning every fetched user doc (also survives pagination below).
        const tokenToUid = new Map<string, string>();
        let usersProcessed = 0;
        let usersFailed = 0;
        let batchesProcessed = 0;
        let lastDoc: QueryDocumentSnapshot<DocumentData> | undefined;

        // Paginated so a growing user base can't blow past the function's timeout/memory
        // budget with a single unbounded query.
        for (;;) {
            let usersQuery = db.collection("users")
                .where("fcmTokens", "!=", [])
                .limit(BEACON_USER_BATCH_SIZE);
            if (lastDoc) {
                usersQuery = usersQuery.startAfter(lastDoc);
            }

            const usersSnap = await usersQuery.get();
            if (usersSnap.empty) break;

            batchesProcessed++;
            if (batchesProcessed === BEACON_BATCH_WARN_THRESHOLD) {
                logger.warn(`dailyBeacon: processed ${batchesProcessed} batches (${usersProcessed} users so far) — consider a fan-out/pub-sub architecture if this keeps growing.`);
            }

            const batchResult = await processUserBatch(
                usersSnap.docs,
                startOfTodayUTC,
                async (uid) => {
                    const tasksSnap = await db.collection("tasks")
                        .where("uid", "==", uid)
                        .where("status", "==", "pending")
                        .where("dueDate", "<=", Timestamp.fromDate(endOfTodayUTC))
                        .get();
                    return tasksSnap.size;
                }
            );
            messagesToSend.push(...batchResult.messages);
            batchResult.tokenToUid.forEach((uid, token) => tokenToUid.set(token, uid));
            usersProcessed += batchResult.usersProcessed;
            usersFailed += batchResult.usersFailed;

            lastDoc = usersSnap.docs[usersSnap.docs.length - 1];
            if (usersSnap.size < BEACON_USER_BATCH_SIZE) break;
        }

        if (usersFailed > 0) {
            logger.warn(`dailyBeacon: ${usersFailed} of ${usersProcessed} users failed processing and were skipped.`);
        }

        if (messagesToSend.length === 0) {
            logger.info("No actionable alerts to send today.");
            return;
        }

        logger.info(`Dispatching ${messagesToSend.length} notifications...`);
        const batchResponse = await messaging.sendEach(messagesToSend);
        logger.info(`Sent ${batchResponse.successCount}. Failed: ${batchResponse.failureCount}`);

        if (batchResponse.failureCount > 0) {
            const staleTokensMap = identifyStaleTokensByUser(
                batchResponse.responses,
                messagesToSend.map((m) => m.token),
                tokenToUid
            );

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

// ─── PROJ-79: Daily Crossword ──────────────────────────────────────────────────
// Nightly, offline generation of the next day's crossword — zero AI cost at
// runtime, one puzzle per calendar date, shared by all users. See
// docs/projects/79_DAILY_CROSSWORD.md and the source spec,
// docs/reports/SPEC-crossword-001 (1).md, §4. The AI selects words and
// writes clues only (Stage 1: cheap-tier word selection, Stage 2: cheap-tier
// clue polish); grid layout is deterministic (crossword-layout-generator),
// never AI-computed. Deliberately a synchronous generateContent() call, not
// the Gemini Batch API the source spec proposed — see the /planning
// technical-impact writeup for docs/projects/79_DAILY_CROSSWORD.md: batch
// mode's async submit/poll semantics don't fit a single onSchedule
// invocation without new two-phase infrastructure, and this is one small
// nightly call, not a bulk multi-day job like the readings buffer.

const CROSSWORD_GENERATOR_VERSION = "1.0.0";
const CROSSWORD_PROMPT_VERSION = "1";
const CROSSWORD_RECENCY_WINDOW_DAYS = 45; // within the source spec's 30-60 day guard range
const CROSSWORD_MIN_PLACED_WORDS = 8; // source spec §4.5 target: 8-10 answers

interface CrosswordWordCandidate {
    answer: string;
    clue: string;
    themed: boolean;
    difficulty: "easy" | "mid" | "advanced";
}

interface CrosswordPolishedWord extends CrosswordWordCandidate {
    clueStyle: "dictionary" | "recovery" | "reflective" | "metaphor";
    hint: string | null;
}

async function getRecentThemesAndWords(cutoffDate: string): Promise<{ themes: string[]; words: string[] }> {
    const snap = await db.collection("crossword_puzzles")
        .where("date", ">=", cutoffDate)
        .get();

    const themes: string[] = [];
    const words: string[] = [];
    snap.forEach((docSnap) => {
        const data = docSnap.data() as { theme?: string; words?: Array<{ answer?: string }> };
        if (data.theme) themes.push(data.theme);
        for (const w of data.words ?? []) {
            if (w.answer) words.push(w.answer);
        }
    });
    return { themes, words };
}

// Source spec §4.9: crosswordese/filler-word guard, letters-only/length
// sanity, and de-duplication. Exported for unit testing.
export function validateCrosswordCandidates(
    candidates: CrosswordWordCandidate[],
    excludeWords: readonly string[],
): CrosswordWordCandidate[] {
    const excludeSet = new Set(excludeWords.map((w) => w.toUpperCase()));
    const denylistSet = new Set(CROSSWORDESE_DENYLIST.map((w) => w.toUpperCase()));
    const seen = new Set<string>();
    const valid: CrosswordWordCandidate[] = [];

    for (const c of candidates) {
        const answer = (c.answer ?? "").toUpperCase().trim();
        if (!/^[A-Z]{3,12}$/.test(answer)) continue;
        if (denylistSet.has(answer)) continue;
        if (excludeSet.has(answer)) continue;
        if (seen.has(answer)) continue;
        seen.add(answer);
        valid.push({ ...c, answer });
    }
    return valid;
}

// Source spec §4.9: no duplicate clue wording within the same puzzle.
export function hasDuplicateClues(words: Array<{ clue: string }>): boolean {
    const seen = new Set<string>();
    for (const w of words) {
        const key = w.clue.trim().toLowerCase();
        if (seen.has(key)) return true;
        seen.add(key);
    }
    return false;
}

function stripCodeFence(text: string): string {
    return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function generateCrosswordForDate(date: string, apiKey: string): Promise<boolean> {
    const { themes: recentThemes, words: recentWords } = await getRecentThemesAndWords(
        addDaysToDate(date, -CROSSWORD_RECENCY_WINDOW_DAYS),
    );
    const theme = pickTheme(recentThemes);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" },
    });

    // Stage 1: word selection (cheap tier)
    const selectionResult = await model.generateContent(buildWordSelectionPrompt(theme, recentWords));
    let candidates: CrosswordWordCandidate[];
    try {
        candidates = JSON.parse(stripCodeFence(selectionResult.response.text())) as CrosswordWordCandidate[];
    } catch {
        logger.error(`PROJ-79: word-selection JSON parse error for ${date}`);
        return false;
    }
    if (!Array.isArray(candidates)) {
        logger.error(`PROJ-79: non-array word-selection response for ${date}`);
        return false;
    }

    const validCandidates = validateCrosswordCandidates(candidates, recentWords);
    if (validCandidates.length < CROSSWORD_MIN_PLACED_WORDS) {
        logger.error(`PROJ-79: only ${validCandidates.length} valid candidates for ${date} — aborting, will retry next run.`);
        return false;
    }

    // Stage 2: clue polish (cheap tier by default)
    const polishResult = await model.generateContent(buildCluePolishPrompt(theme, validCandidates));
    let polished: { theme_intro: string; words: CrosswordPolishedWord[]; insight_card: { text: string; framework_tags: string[] } };
    try {
        polished = JSON.parse(stripCodeFence(polishResult.response.text())) as typeof polished;
    } catch {
        logger.error(`PROJ-79: clue-polish JSON parse error for ${date}`);
        return false;
    }
    if (!Array.isArray(polished.words) || hasDuplicateClues(polished.words)) {
        logger.error(`PROJ-79: invalid or duplicate-clue polish response for ${date}`);
        return false;
    }

    // Grid layout — deterministic, non-AI (source spec §4.5)
    const layout = generateLayout(polished.words.map((w) => ({ answer: w.answer, clue: w.clue })));
    const placed = layout.result.filter((w: CrosswordResultWord) => w.orientation !== "none");
    if (placed.length < CROSSWORD_MIN_PLACED_WORDS) {
        logger.error(`PROJ-79: layout only placed ${placed.length} words for ${date} — aborting, will retry next run.`);
        return false;
    }

    const words = placed.map((p: CrosswordResultWord) => {
        const source = polished.words.find((w) => w.answer === p.answer);
        return {
            answer: p.answer,
            clue: p.clue,
            clueStyle: source?.clueStyle ?? "dictionary",
            hint: source?.hint ?? null,
            themed: source?.themed ?? false,
            difficulty: source?.difficulty ?? "mid",
            number: p.position ?? 0,
            row: (p.starty ?? 1) - 1,
            col: (p.startx ?? 1) - 1,
            direction: p.orientation as "across" | "down",
        };
    });

    await db.collection("crossword_puzzles").doc(date).set({
        date,
        theme,
        themeIntro: polished.theme_intro,
        generatorVersion: CROSSWORD_GENERATOR_VERSION,
        promptVersion: CROSSWORD_PROMPT_VERSION,
        words,
        insightCard: {
            text: polished.insight_card?.text ?? "",
            frameworkTags: polished.insight_card?.framework_tags ?? [],
        },
        grid: { rows: layout.rows, cols: layout.cols },
        generatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`PROJ-79: crossword generated for ${date} — theme "${theme}", ${words.length} words.`);
    return true;
}

export const generateDailyCrossword = onSchedule({
    schedule: "0 6 * * *",
    timeoutSeconds: 120,
    memory: "512MiB",
    region: "northamerica-northeast1",
    secrets: [geminiApiKey],
}, async () => {
    // Checks today's doc as well as tomorrow's — generating only "tomorrow"
    // relative to each run means today's puzzle never self-heals after a
    // missed night (or the very first deploy), permanently skipping that
    // date. Checking both keeps the "stay one day ahead" buffer while
    // closing that gap.
    const today = utcDateString(new Date());
    const tomorrow = addDaysToDate(today, 1);

    for (const date of [today, tomorrow]) {
        const existing = await db.collection("crossword_puzzles").doc(date).get();
        if (existing.exists) {
            logger.info(`PROJ-79: crossword for ${date} already exists — skipping.`);
            continue;
        }

        const ok = await generateCrosswordForDate(date, geminiApiKey.value());
        if (!ok) {
            logger.error(`PROJ-79: failed to generate crossword for ${date}.`);
        }
    }
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

// SECURITY WARNING: This function executes onDocumentWritten and trust-updates user subscription tiers
// without internal caller verification. This is secure ONLY because write rules for the
// "users/{userId}/subscriptions/{subscriptionId}" subcollection are locked to "allow write: if false"
// in firestore.rules (preventing client-side writes; only writable by admin SDK/Stripe extensions).
// DO NOT modify firestore.rules to allow client writes without implementing caller validation here.
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

// ─── AI Proxy: Secure Server-Side Gemini Execution ───────────────────────────

interface AIProxyRequest {
    analysisType: string;
    dataPayload: unknown;
}

function getDaysDiff(d1: Date, d2: Date): number {
    return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

function getModelForType(analysisType: string): string {
    switch (analysisType) {
        case "journal_analysis":
        case "workbook_coach":
        case "cbt_coaching_prompt":
        case "cba_reflection":
        case "audio_analysis":
            return "gemini-3.5-flash-lite";
        default:
            return "gemini-2.5-flash";
    }
}

interface JournalAnalysisPayload { content: string }
interface DeepPatternPayload { journalHistory: string }
interface ComparativePayload { currentSet: string; previousSet: string | null; scope: string }
interface SystemHealthPayload { errorLogs: string }
interface WorkbookAnalysisPayload { workbookTitle: string; questionsAndAnswers: { q: string; a: string }[] }
interface ROSCPayload { answers: string }
interface WorkbookCoachPayload { context: string; userAnswer: string }
interface CBTCoachingPayload { context: string; input: string }
interface CBAPayload { behavior: string; quadrants: { advantagesDoing: string[]; disadvantagesDoing: string[]; advantagesStopping: string[]; disadvantagesStopping: string[] } }
interface AudioAnalysisPayload { base64Audio: string; mimeType: string }

function getPromptForType(analysisType: string, dataPayload: unknown): { prompt: string; systemPrompt?: string } {
    switch (analysisType) {
        case "journal_analysis": {
            const payload = dataPayload as JournalAnalysisPayload;
            return {
                prompt: `Analyze this journal entry: "${payload.content}"`,
                systemPrompt: `You are a warm, peer-support recovery coach. You are reading a journal entry written by a user in recovery.
Analyze the entry and extract:
1. Overall emotional sentiment (Positive, Neutral, or Negative).
2. A mood score from 1 to 10.
3. A one-sentence compassionate summary.
4. Two actionable next steps.
5. Up to two potential risks/triggers.

Return JSON format:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "moodScore": number,
  "summary": "compassionate summary...",
  "actionableSteps": ["step 1", "step 2"],
  "risks": ["risk 1", "risk 2"]
}`,
            };
        }

        case "deep_pattern_analysis": {
            const payload = dataPayload as DeepPatternPayload;
            return {
                prompt: `Perform a "Deep Pattern Recognition" analysis on the following 90 days of journal entries.
JOURNAL DATA:
${payload.journalHistory}`,
                systemPrompt: `You are an expert recovery coach. Use your advanced reasoning to identify subtle correlations, triggers, and emotional velocity.
Return a JSON object with this EXACT structure:
{
    "pattern_summary": "A comprehensive paragraph describing the user's psychological landscape over this period.",
    "core_triggers": ["Trigger 1", "Trigger 2", "Trigger 3"],
    "emotional_velocity": "A brief description (MAX 15 words) of how quickly their mood shifts.",
    "hidden_correlations": ["Correlation 1", "Correlation 2"],
    "relapse_risk_level": "Low" | "Moderate" | "High" | "Critical",
    "long_term_advice": ["Action 1", "Action 2", "Action 3"],
    "action_contexts": ["Why Action 1 is recommended.", "Why Action 2 is recommended.", "Why Action 3 is recommended."]
}
IMPORTANT: Provide EXACTLY 3 distinct, high-impact "long_term_advice" items and a matching "action_contexts" array of the same length.`,
            };
        }

        case "comparative_analysis": {
            const payload = dataPayload as ComparativePayload;
            let promptContext = "";
            if (payload.scope === "all-time") {
                promptContext = `Perform a holistic review of this entire journal history. Identify long-term patterns and the overall arc of recovery.
JOURNAL DATA:
${payload.currentSet}`;
            } else {
                promptContext = `Perform a Comparative Review between two time periods (${payload.scope}).
Compare the "Current Period" against the "Previous Period" to identify trajectory.

CURRENT PERIOD:
${payload.currentSet}

PREVIOUS PERIOD:
${payload.previousSet || "No data available for previous period."}`;
            }
            return {
                prompt: promptContext,
                systemPrompt: `You are a wise and empathetic Recovery Coach specialized in pattern recognition.
Return a JSON object with this EXACT structure:
{
    "trajectory": "Improving" | "Stable" | "Declining" | "Fluctuating",
    "key_themes": ["Theme 1", "Theme 2"],
    "comparison_summary": "Comparison narrative...",
    "wins": ["Win 1", "Win 2"],
    "blind_spots": ["Blind spot 1"],
    "actionable_advice": ["Advice 1", "Advice 2"],
    "action_contexts": ["One-sentence context for Advice 1.", "One-sentence context for Advice 2."]
}`,
            };
        }

        case "system_health_analysis": {
            const payload = dataPayload as SystemHealthPayload;
            return {
                prompt: `Analyze these raw client-side error logs:
${payload.errorLogs}`,
                systemPrompt: `You are a Senior React & Firebase Engineer. Triage these errors, group duplicates, and identify root causes.
Return a JSON object with this EXACT structure:
{
    "status": "Critical" | "Warning" | "Stable",
    "summary": "A 1-sentence executive summary of the system health.",
    "top_issues": [
        {
            "error_signature": "signature",
            "occurrence_count": number,
            "suspected_root_cause": "technical explanation",
            "suggested_fix": "code recommendation"
        }
    ],
    "environment_patterns": "Note any patterns."
}`,
            };
        }

        case "workbook_analysis": {
            const payload = dataPayload as WorkbookAnalysisPayload;
            const qaString = payload.questionsAndAnswers.map((qa) => `Q: ${qa.q}\nA: ${qa.a}`).join("\n\n");
            return {
                prompt: `Workbook Title: ${payload.workbookTitle}
QUESTIONS & ANSWERS:
${qaString}`,
                systemPrompt: `You are a supportive recovery companion. Review this completed workbook session.
Return a JSON object with this EXACT structure:
{
  "scope_context": "${payload.workbookTitle} Analysis",
  "summary": "Compassionate overview of their answers...",
  "pillars": {
    "understanding": "Analysis of their comprehension of the material...",
    "emotional_resonance": "Emotional strengths or breakthroughs noted in their responses...",
    "blind_spots": "Potential areas of avoidance, rationalization, or struggle..."
  },
  "suggested_actions": ["Action Step 1", "Action Step 2", "Action Step 3"],
  "action_contexts": ["Context for Action 1", "Context for Action 2", "Context for Action 3"]
}`,
            };
        }

        case "rosc_assessment": {
            const payload = dataPayload as ROSCPayload;
            return {
                prompt: `Perform a Recovery Capital (ROSC) Assessment based on this month's check-in:
${payload.answers}`,
                systemPrompt: `Analyze the user's answers across the 4 SAMHSA domains (Health, Home, Purpose, Community) and rate them.
Return a JSON object with this EXACT structure:
{
  "scores": {
    "health": { "score": number, "evidence": ["evidence"] },
    "home": { "score": number, "evidence": ["evidence"] },
    "purpose": { "score": number, "evidence": ["evidence"] },
    "community": { "score": number, "evidence": ["evidence"] }
  },
  "trajectory": "Improving" | "Stable" | "Declining" | "Insufficient Data",
  "narrative": "Compassionate overview...",
  "strengths": ["Domain: strength"],
  "growth_areas": ["Domain: growth suggestion"]
}`,
            };
        }

        case "workbook_coach": {
            const payload = dataPayload as WorkbookCoachPayload;
            return {
                prompt: `Question: ${payload.context}
User's Answer: "${payload.userAnswer}"`,
                systemPrompt: `The user is working on a recovery workbook. Provide a brief, encouraging, and insightful comment (max 2 sentences).`,
            };
        }

        case "cbt_coaching_prompt": {
            const payload = dataPayload as CBTCoachingPayload;
            return {
                prompt: `Step Context: ${payload.context}
User's Input: "${payload.input}"`,
                systemPrompt: `The user is completing an interactive CBT worksheet step. Write ONE follow-up question (max 15 words) that helps them go one layer deeper into this step.`,
            };
        }

        case "cba_reflection": {
            const payload = dataPayload as CBAPayload;
            return {
                prompt: `Behavior: ${payload.behavior}
Advantages of doing: ${payload.quadrants.advantagesDoing.join("; ")}
Disadvantages of doing: ${payload.quadrants.disadvantagesDoing.join("; ")}
Advantages of stopping: ${payload.quadrants.advantagesStopping.join("; ")}
Disadvantages of stopping: ${payload.quadrants.disadvantagesStopping.join("; ")}`,
                systemPrompt: `Reflect on this Cost-Benefit Analysis behavior. Write ONE sentence (max 30 words) reflecting back a pattern or tension you notice.`,
            };
        }

        case "audio_analysis": {
            return {
                prompt: `Listen to this audio journal entry.`,
                systemPrompt: `Transcribe the audio verbatim, analyze sentiment, and generate tags.
Return JSON format:
{
  "transcription": "Verbatim transcription...",
  "sentiment_label": "Positive" | "Neutral" | "Negative",
  "mood_score": 1-10,
  "tags": ["tag1", "tag2"]
}`,
            };
        }

        default:
            throw new Error(`Unknown analysisType: ${analysisType}`);
    }
}

export const generateAIInsights = onCall({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "northamerica-northeast1",
}, async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;

    const { analysisType, dataPayload } = request.data as AIProxyRequest;
    if (!analysisType || !dataPayload) {
        throw new HttpsError("invalid-argument", "Missing analysisType or dataPayload.");
    }

    // 2. Fetch User Profile and Enforce Rate Limits
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
        throw new HttpsError("not-found", "User profile not found.");
    }
    const userData = userDoc.data() || {};
    const userTier = userData.tier || "free";

    if (userTier === "free") {
        const limits = userData.usage_limits || {};
        const now = new Date();

        if (analysisType === "deep_pattern_analysis") {
            const lastDeepDive = limits.lastDeepDive ? (limits.lastDeepDive as Timestamp).toDate() : null;
            if (lastDeepDive) {
                const diff = getDaysDiff(now, lastDeepDive);
                if (diff < 30) {
                    throw new HttpsError("resource-exhausted", `Available in ${30 - diff} days. Upgrade to unlock.`);
                }
            }
        } else if (analysisType === "rosc_assessment") {
            const lastROSCAssessment = limits.lastROSCAssessment ? (limits.lastROSCAssessment as Timestamp).toDate() : null;
            if (lastROSCAssessment) {
                const diff = getDaysDiff(now, lastROSCAssessment);
                if (diff < 30) {
                    throw new HttpsError("resource-exhausted", `Available in ${30 - diff} days. Upgrade to unlock.`);
                }
            }
        } else if (analysisType === "comparative_analysis") {
            const compPayload = dataPayload as ComparativePayload;
            if (compPayload.scope === "weekly") {
                const lastWeeklyInsight = limits.lastWeeklyInsight ? (limits.lastWeeklyInsight as Timestamp).toDate() : null;
                if (lastWeeklyInsight) {
                    const diff = getDaysDiff(now, lastWeeklyInsight);
                    if (diff < 7) {
                        throw new HttpsError("resource-exhausted", `Available in ${7 - diff} days. Upgrade to unlock.`);
                    }
                }
            } else if (compPayload.scope === "monthly" || compPayload.scope === "all-time") {
                const field = compPayload.scope === "monthly" ? "lastMonthlyInsight" : "lastDeepDive";
                const lastRun = limits[field] ? (limits[field] as Timestamp).toDate() : null;
                if (lastRun) {
                    const diff = getDaysDiff(now, lastRun);
                    if (diff < 30) {
                        throw new HttpsError("resource-exhausted", `Available in ${30 - diff} days. Upgrade to unlock.`);
                    }
                }
            }
        }
    }

    // 3. Prepare AI Prompts and Model Selection
    const { prompt, systemPrompt } = getPromptForType(analysisType, dataPayload);
    const modelName = getModelForType(analysisType);
    const apiKey = geminiApiKey.value();
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.7, topP: 0.8, topK: 40, maxOutputTokens: 8192 },
            ...(systemPrompt && { systemInstruction: systemPrompt }),
        });

        let text = "";

        if (analysisType === "audio_analysis") {
            const audioPayload = dataPayload as AudioAnalysisPayload;
            if (!audioPayload.base64Audio || !audioPayload.mimeType) {
                throw new HttpsError("invalid-argument", "Missing base64Audio or mimeType.");
            }
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: audioPayload.mimeType,
                        data: audioPayload.base64Audio,
                    },
                },
                { text: prompt },
            ]);
            text = (await result.response).text();
        } else {
            const result = await model.generateContent(prompt);
            text = (await result.response).text();
        }

        if (!text) {
            throw new HttpsError("internal", "Received empty response from AI model.");
        }

        // 4. Update Server-Side Usage Timestamp
        if (userTier === "free") {
            const stampField =
                analysisType === "deep_pattern_analysis" || (analysisType === "comparative_analysis" && (dataPayload as ComparativePayload).scope === "all-time")
                    ? "lastDeepDive"
                    : (analysisType === "comparative_analysis" && (dataPayload as ComparativePayload).scope === "monthly")
                    ? "lastMonthlyInsight"
                    : (analysisType === "comparative_analysis" && (dataPayload as ComparativePayload).scope === "weekly")
                    ? "lastWeeklyInsight"
                    : analysisType === "rosc_assessment"
                    ? "lastROSCAssessment"
                    : null;

            if (stampField) {
                await db.collection("users").doc(uid).update({
                    [`usage_limits.${stampField}`]: FieldValue.serverTimestamp(),
                });
            }
        }

        return { text };
    } catch (error) {
        logger.error("AI Insight generation failed:", error);
        throw new HttpsError("internal", error instanceof Error ? error.message : "AI Generation failed.");
    }
});

export interface VaultPinAttemptState {
    exists: boolean;
    pinVerifier?: string;
    pendingVerifier?: string;
    attempts?: { count?: number; lockedUntil?: Timestamp };
}

export type VaultPinAttemptDecision =
    | { ok: true; attemptsReset: { count: 0 } }
    | { ok: false; reason: "not-found" | "not-initialized" | "locked" }
    | { ok: false; reason: "wrong-pin"; attemptsUpdate: { count: number; lockedUntil?: Timestamp } };

/**
 * PROJ-73: the rate-limit and verifier-matching decision logic extracted
 * from verifyVaultPin's transaction body (visibility-only, zero behavior
 * change — same pattern already used for buildBatchPrompt/processUserBatch
 * in this file) so it's unit-testable without mocking a Firestore
 * transaction. Takes already-fetched document state; the caller still owns
 * the actual tx.get()/tx.set() calls and their exact write shape.
 */
export function evaluateVaultPinAttempt(state: VaultPinAttemptState, pinHash: string, now: Timestamp): VaultPinAttemptDecision {
    if (!state.exists) {
        return { ok: false, reason: "not-found" };
    }

    if (state.attempts?.lockedUntil && state.attempts.lockedUntil.toMillis() > now.toMillis()) {
        return { ok: false, reason: "locked" };
    }

    // A rotation-in-progress (src/lib/rotation.ts) needs the pepper for its
    // NEW verifier before that verifier has been committed to pinVerifier
    // (it only lives in pendingRotation until the rotation's final,
    // all-documents-migrated commit). Accepting either the current verifier
    // or a pending one lets legitimate old-key and new-key fetches both
    // succeed mid-rotation without changing the resumability model —
    // pendingRotation is only ever set by a client that already locally
    // validated the old PIN before starting the rotation, so this doesn't
    // widen the guessable space.
    if (!state.pinVerifier && !state.pendingVerifier) {
        return { ok: false, reason: "not-initialized" };
    }

    if (pinHash !== state.pinVerifier && pinHash !== state.pendingVerifier) {
        const newCount = (state.attempts?.count ?? 0) + 1;
        const lockoutSeconds = computeLockoutSeconds(newCount);
        return {
            ok: false,
            reason: "wrong-pin",
            attemptsUpdate: {
                count: newCount,
                ...(lockoutSeconds ? { lockedUntil: Timestamp.fromMillis(now.toMillis() + lockoutSeconds * 1000) } : {}),
            },
        };
    }

    return { ok: true, attemptsReset: { count: 0 } };
}

/**
 * PROJ-73: extracted alongside evaluateVaultPinAttempt for the same reason —
 * pins down the exact pepper-derivation formula so a change to it fails a
 * fast unit test instead of surfacing only via external security review
 * (as happened for two other PROJ-65 bugs, see docs/ACTIVE_CYCLE.md).
 */
export function deriveVaultPepper(pepperSecretValue: string, pinHash: string): string {
    return crypto.createHmac("sha256", pepperSecretValue).update(pinHash).digest("base64");
}

/**
 * PROJ-65: Vault PIN Brute-Force Hardening.
 * Verifies a client-supplied PIN hash (never the raw PIN) against the stored
 * pinVerifier under a per-uid rate limit, and on success returns
 * HMAC-SHA256(VAULT_PEPPER, pinHash) — a secret the client combines with its
 * local PBKDF2 output to derive the actual vault key. The pepper never
 * touches Firestore, so a Firestore-only breach cannot recover it; it's only
 * reachable via this authenticated, rate-limited call.
 */
export const verifyVaultPin = onCall({
    secrets: [vaultPepperSecret],
    region: "northamerica-northeast1",
}, async (request) => {
  try {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;

    const { pinHash } = request.data as { pinHash?: string };
    if (!pinHash || typeof pinHash !== "string" || !/^[0-9a-f]{64}$/.test(pinHash)) {
        throw new HttpsError("invalid-argument", "Missing or malformed pinHash.");
    }

    const userRef = db.collection("users").doc(uid);

    // IMPORTANT: a Firestore transaction callback that throws discards every
    // write queued via tx.set()/tx.update() in that same callback — it's a
    // full rollback, not just an early return. Recording a failed attempt's
    // incremented counter and then throwing to reject the call inside the
    // same transaction would silently discard that increment, making the
    // rate limiter a no-op. So the transaction only ever returns a result
    // descriptor (never throws for an expected outcome); the actual
    // HttpsError is thrown afterward, once the write has safely committed.
    type VerifyResult =
        | { ok: true; pepper: string }
        | { ok: false; reason: "not-found" | "locked" | "not-initialized" | "wrong-pin" };

    const result: VerifyResult = await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data() || {};
        const now = Timestamp.now();

        const decision = evaluateVaultPinAttempt({
            exists: snap.exists,
            pinVerifier: data.pinVerifier as string | undefined,
            pendingVerifier: (data.pendingRotation as { verifier?: string } | undefined)?.verifier,
            attempts: data.pinAttempts as { count?: number; lockedUntil?: Timestamp } | undefined,
        }, pinHash, now);

        if (decision.ok) {
            tx.set(userRef, {
                pinAttempts: { ...decision.attemptsReset, lastAttemptAt: FieldValue.serverTimestamp() },
            }, { merge: true });
            return { ok: true, pepper: deriveVaultPepper(vaultPepperSecret.value(), pinHash) };
        }

        if (decision.reason === "wrong-pin") {
            tx.set(userRef, {
                pinAttempts: { ...decision.attemptsUpdate, lastAttemptAt: FieldValue.serverTimestamp() },
            }, { merge: true });
            return { ok: false, reason: "wrong-pin" };
        }

        return decision;
    });

    if (!result.ok) {
        if (result.reason === "not-found") throw new HttpsError("not-found", "User profile not found.");
        if (result.reason === "locked") throw new HttpsError("resource-exhausted", "Too many attempts. Try again later.");
        if (result.reason === "not-initialized") throw new HttpsError("failed-precondition", "Vault verifier not initialized.");
        throw new HttpsError("permission-denied", "Incorrect PIN.");
    }

    return { pepper: result.pepper };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error("verifyVaultPin failed unexpectedly:", err);
    throw err;
  }
});
