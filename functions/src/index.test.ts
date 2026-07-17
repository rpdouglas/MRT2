import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import {
    getMilestone,
    getMilestoneLabel,
    computeMilestoneAlert,
    computeHabitAlert,
    processUserBatch,
    identifyStaleTokensByUser,
    buildBatchPrompt,
    computeLockoutSeconds,
    type BeaconUserDoc,
} from "./index";
import { MODALITY_CONFIGS, READING_MODALITIES, type ReadingModality } from "./prompts";

describe("getMilestone", () => {
    it("returns null for zero or negative days", () => {
        expect(getMilestone(0)).toBeNull();
        expect(getMilestone(-5)).toBeNull();
    });

    it("matches standard milestone boundaries", () => {
        expect(getMilestone(1)).toBe(1);
        expect(getMilestone(7)).toBe(7);
        expect(getMilestone(30)).toBe(30);
        expect(getMilestone(365)).toBe(365);
    });

    it("matches yearly multiples beyond the standard list", () => {
        expect(getMilestone(730)).toBe(730);
        expect(getMilestone(1095)).toBe(1095);
    });

    it("returns null for non-milestone days", () => {
        expect(getMilestone(2)).toBeNull();
        expect(getMilestone(29)).toBeNull();
        expect(getMilestone(400)).toBeNull();
    });
});

describe("getMilestoneLabel", () => {
    it("labels the well-known short milestones", () => {
        expect(getMilestoneLabel(1)).toBe("24 Hours");
        expect(getMilestoneLabel(7)).toBe("1 Week");
        expect(getMilestoneLabel(30)).toBe("1 Month");
    });

    it("labels yearly milestones with pluralization", () => {
        expect(getMilestoneLabel(365)).toBe("1 Year");
        expect(getMilestoneLabel(730)).toBe("2 Years");
    });

    it("falls back to a day count for anything else", () => {
        expect(getMilestoneLabel(60)).toBe("60 Days");
    });
});

describe("computeMilestoneAlert", () => {
    const startOfTodayUTC = new Date(Date.UTC(2026, 6, 9));

    it("returns null when no sobrietyDate is set", () => {
        expect(computeMilestoneAlert(undefined, startOfTodayUTC)).toBeNull();
    });

    it("returns an alert on a milestone day", () => {
        const sobrietyDate = Timestamp.fromDate(new Date(Date.UTC(2026, 5, 9))); // 30 days before
        const alert = computeMilestoneAlert(sobrietyDate, startOfTodayUTC);
        expect(alert).not.toBeNull();
        expect(alert?.body).toContain("1 Month");
    });

    it("returns null on a non-milestone day", () => {
        const sobrietyDate = Timestamp.fromDate(new Date(Date.UTC(2026, 5, 24))); // 15 days before
        expect(computeMilestoneAlert(sobrietyDate, startOfTodayUTC)).toBeNull();
    });
});

describe("computeHabitAlert", () => {
    it("returns null when there are no pending habits", () => {
        expect(computeHabitAlert(0)).toBeNull();
    });

    it("pluralizes correctly for exactly one pending habit", () => {
        expect(computeHabitAlert(1)?.body).toBe("You have 1 habit to complete today.");
    });

    it("pluralizes correctly for multiple pending habits", () => {
        expect(computeHabitAlert(3)?.body).toBe("You have 3 habits to complete today.");
    });
});

function fakeUserDoc(id: string, data: Record<string, unknown>): BeaconUserDoc {
    return { id, data: () => data };
}

describe("processUserBatch", () => {
    const startOfTodayUTC = new Date(Date.UTC(2026, 6, 9));

    it("skips users with no fcmTokens without calling the task lookup", async () => {
        const calls: string[] = [];
        const result = await processUserBatch(
            [fakeUserDoc("u1", { fcmTokens: [] })],
            startOfTodayUTC,
            async (uid) => { calls.push(uid); return 0; }
        );
        expect(result.messages).toHaveLength(0);
        expect(calls).toHaveLength(0);
        expect(result.usersProcessed).toBe(1);
        expect(result.usersFailed).toBe(0);
    });

    it("dispatches one message per token when a habit alert fires", async () => {
        const result = await processUserBatch(
            [fakeUserDoc("u1", { fcmTokens: ["tok-a", "tok-b"] })],
            startOfTodayUTC,
            async () => 2
        );
        expect(result.messages).toHaveLength(2);
        expect(result.messages.map((m) => m.token)).toEqual(["tok-a", "tok-b"]);
        expect(result.tokenToUid.get("tok-a")).toBe("u1");
        expect(result.tokenToUid.get("tok-b")).toBe("u1");
    });

    it("does not query pending tasks when a milestone alert already fired", async () => {
        const sobrietyDate = Timestamp.fromDate(new Date(Date.UTC(2026, 6, 8))); // 1 day before
        const calls: string[] = [];
        const result = await processUserBatch(
            [fakeUserDoc("u1", { fcmTokens: ["tok-a"], sobrietyDate })],
            startOfTodayUTC,
            async (uid) => { calls.push(uid); return 5; }
        );
        expect(calls).toHaveLength(0);
        expect(result.messages[0].notification?.title).toContain("Milestone");
    });

    it("isolates a failure in one user so subsequent users still get processed (Phase 4 regression test)", async () => {
        const userDocs: BeaconUserDoc[] = [
            {
                id: "bad-user",
                data: () => { throw new Error("corrupt document"); },
            },
            fakeUserDoc("good-user", { fcmTokens: ["tok-good"] }),
        ];

        const result = await processUserBatch(userDocs, startOfTodayUTC, async () => 1);

        expect(result.usersProcessed).toBe(2);
        expect(result.usersFailed).toBe(1);
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].token).toBe("tok-good");
        expect(result.tokenToUid.get("tok-good")).toBe("good-user");
    });

    it("does not send anything when no user has an actionable alert", async () => {
        const result = await processUserBatch(
            [fakeUserDoc("u1", { fcmTokens: ["tok-a"] })],
            startOfTodayUTC,
            async () => 0
        );
        expect(result.messages).toHaveLength(0);
    });
});

describe("identifyStaleTokensByUser", () => {
    const tokenToUid = new Map([
        ["tok-1", "uid-1"],
        ["tok-2", "uid-1"],
        ["tok-3", "uid-2"],
    ]);
    const tokens = ["tok-1", "tok-2", "tok-3"];

    it("groups invalid tokens by owning uid", () => {
        const responses = [
            { success: false, error: { code: "messaging/invalid-registration-token" } },
            { success: true },
            { success: false, error: { code: "messaging/registration-token-not-registered" } },
        ];
        const result = identifyStaleTokensByUser(responses, tokens, tokenToUid);
        expect(result.get("uid-1")).toEqual(["tok-1"]);
        expect(result.get("uid-2")).toEqual(["tok-3"]);
    });

    it("ignores failures with unrelated error codes", () => {
        const responses = [
            { success: false, error: { code: "messaging/quota-exceeded" } },
            { success: true },
            { success: true },
        ];
        const result = identifyStaleTokensByUser(responses, tokens, tokenToUid);
        expect(result.size).toBe(0);
    });

    it("ignores a failed token with no known owner", () => {
        const responses = [{ success: false, error: { code: "messaging/invalid-registration-token" } }];
        const result = identifyStaleTokensByUser(responses, ["unknown-token"], tokenToUid);
        expect(result.size).toBe(0);
    });

    it("returns an empty map when everything succeeded", () => {
        const responses = tokens.map(() => ({ success: true }));
        const result = identifyStaleTokensByUser(responses, tokens, tokenToUid);
        expect(result.size).toBe(0);
    });
});

describe("MODALITY_CONFIGS (prompts.ts static config)", () => {
    it.each(READING_MODALITIES)("%s has a non-empty systemPrompt, label, and at least one theme", (modality) => {
        const config = MODALITY_CONFIGS[modality];
        expect(config.systemPrompt.trim().length).toBeGreaterThan(0);
        expect(config.label.trim().length).toBeGreaterThan(0);
        expect(config.themes.length).toBeGreaterThan(0);
    });

    it("only recovery-dharma requires attribution", () => {
        const requiring = READING_MODALITIES.filter((m) => MODALITY_CONFIGS[m].requiresAttribution);
        expect(requiring).toEqual(["recovery-dharma"]);
    });

    it("12-Step modality prompts forbid their own trademarked name from appearing in the reading body", () => {
        const trademarkByModality: Record<string, string> = {
            "twelve-step-aa": "Alcoholics Anonymous",
            "twelve-step-na": "Narcotics Anonymous",
            "twelve-step-ca": "Cocaine Anonymous",
        };
        for (const [modality, name] of Object.entries(trademarkByModality)) {
            const prompt = MODALITY_CONFIGS[modality as ReadingModality].systemPrompt;
            expect(prompt).toContain("Do NOT use the trademarked name");
            expect(prompt).toContain(name);
        }
    });
});

describe("buildBatchPrompt", () => {
    it("interpolates every date/theme pair into a numbered list", () => {
        const prompt = buildBatchPrompt(
            [
                { date: "2026-07-01", theme: "Gratitude" },
                { date: "2026-07-02", theme: "Service" },
            ],
            false,
        );

        expect(prompt).toContain("1. Date: 2026-07-01 | Theme: Gratitude");
        expect(prompt).toContain("2. Date: 2026-07-02 | Theme: Service");
        expect(prompt).toContain("Generate exactly 2 daily recovery readings");
        expect(prompt).toContain("valid JSON array of exactly 2 objects");
    });

    it("includes the exact Recovery Dharma attribution instruction only when requiresAttribution is true", () => {
        const withAttribution = buildBatchPrompt([{ date: "2026-07-01", theme: "Impermanence" }], true);
        const withoutAttribution = buildBatchPrompt([{ date: "2026-07-01", theme: "Impermanence" }], false);

        expect(withAttribution).toContain(
            '"attribution": must be exactly "Adapted from the Recovery Dharma book, licensed CC BY-SA 4.0 — recoverydharma.org"'
        );
        expect(withoutAttribution).not.toContain("attribution");
    });

    it("threads each modality's own requiresAttribution flag through correctly", () => {
        for (const modality of READING_MODALITIES) {
            const config = MODALITY_CONFIGS[modality];
            const prompt = buildBatchPrompt([{ date: "2026-07-01", theme: config.themes[0] }], config.requiresAttribution);
            expect(prompt).toContain(config.themes[0]);
            expect(prompt.includes("attribution")).toBe(config.requiresAttribution);
        }
    });
});

describe("computeLockoutSeconds (PROJ-65 vault-PIN rate limiting)", () => {
    it("gives a few free retries before any lockout", () => {
        expect(computeLockoutSeconds(1)).toBeNull();
        expect(computeLockoutSeconds(4)).toBeNull();
    });

    it("escalates through short, then long, then day-long lockouts", () => {
        expect(computeLockoutSeconds(5)).toBe(60);
        expect(computeLockoutSeconds(7)).toBe(60);
        expect(computeLockoutSeconds(8)).toBe(15 * 60);
        expect(computeLockoutSeconds(11)).toBe(15 * 60);
        expect(computeLockoutSeconds(12)).toBe(24 * 60 * 60);
    });

    it("never de-escalates as attempts keep climbing", () => {
        expect(computeLockoutSeconds(50)).toBe(24 * 60 * 60);
    });
});
