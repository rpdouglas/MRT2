/**
 * src/lib/__tests__/deletion.rules.test.ts
 * PROJ-115. Emulator-backed integration test for executeTotalAccountAnnihilation
 * — the mocked unit tests in deletion.test.ts prove the function *scans* the
 * right collections, but can't prove a real delete actually succeeds against
 * real Firestore security rules. This is exactly the gap a zk-audit flagged:
 * ai_logs/client_errors/feedback had no owner-delete (or owner-read/list,
 * which a delete-by-query needs too) rule at all before PROJ-115 fixed
 * firestore.rules alongside this — a real Firestore batch containing a
 * rules-denied delete fails *atomically* (nothing in that batch is applied),
 * which a mocked test can never catch since mocks don't enforce rules.
 *
 * Also verifies the deliberate boundary documented in deletion.ts's header:
 * Stripe/Play-Billing collections are locked against ANY client mutation by
 * design and must survive untouched, not be silently skipped by accident.
 *
 * Requires a running Firestore emulator (port 8080, see firebase.json) — NOT
 * part of the default `npm run test:once` sweep (see vite.config.ts's test
 * exclude list). Run via `npm run test:rules`, which starts/stops the
 * emulator for you via `firebase emulators:exec` (shares vitest.rules.config.ts
 * and the emulator session with firestore.rules.test.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, it, expect, vi } from 'vitest';
import {
    initializeTestEnvironment,
    type RulesTestEnvironment,
    type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import firestoreRules from '../../../firestore.rules?raw';

// RulesTestContext.firestore() is typed against the legacy compat namespace
// (firebase.firestore.Firestore), not the modular firebase/firestore
// package's Firestore type — even though the returned instance is, at
// runtime, fully compatible with modular functions like doc()/setDoc()
// (the documented behavior of @firebase/rules-unit-testing). Aliasing to
// its own real return type here avoids a cross-package type mismatch that
// a same-named modular Firestore import would trigger.
type TestFirestore = ReturnType<RulesTestContext['firestore']>;

// executeTotalAccountAnnihilation imports `db` from '../firebase' at module
// load time — mocked here to a getter (re-read on every access, not
// captured once at mock-definition time) so it can be pointed at the real
// rules-test-environment Firestore instance once initializeTestEnvironment
// resolves in beforeEach. vi.mock is hoisted above this file's imports by
// Vitest's compiler regardless of physical order, so the static import of
// executeTotalAccountAnnihilation below still picks up the mocked module.
let testDb: TestFirestore | undefined;
vi.mock('../firebase', () => ({
    get db() { return testDb; },
}));

import { executeTotalAccountAnnihilation } from '../deletion';

let testEnv: RulesTestEnvironment;

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

function seedAsAdmin(fn: (ctx: RulesTestContext) => Promise<void>) {
    return testEnv.withSecurityRulesDisabled(fn);
}

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'mrt2-deletion-rules-test',
        firestore: {
            rules: firestoreRules,
            host: 'localhost',
            port: 8080,
        },
    });
});

afterAll(async () => {
    await testEnv.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
    testDb = testEnv.authenticatedContext(ALICE).firestore();
});

const ROOT_COLLECTIONS = [
    'journals', 'tasks', 'mat_doses', 'insights', 'ai_logs',
    'client_errors', 'service', 'game_progress', 'game_saves', 'feedback',
];
const SUBCOLLECTIONS = ['workbook_answers', 'templates', 'rosc_assessments'];

// Locked against ANY client mutation by design (see deletion.ts's header
// comment) — must survive deletion untouched, not be silently skipped by
// accident. Seeded and asserted-present for Alice too, not just Bob, so
// this documents "deliberately left alone" rather than "happens to still
// exist because nothing tried."
const LOCKED_BILLING_PATHS = (uid: string): string[][] => [
    ['users', uid, 'checkout_sessions', 'doc1'],
    ['users', uid, 'subscriptions', 'doc1'],
    ['users', uid, 'payments', 'doc1'],
    ['users', uid, 'playPurchases', `${uid}-token`],
    ['playPurchaseIndex', `${uid}-token`],
];

// Every path a full deletion should touch for a given uid, as segment
// arrays ready to spread into doc(firestore, ...segments).
function pathsFor(uid: string): string[][] {
    const paths: string[][] = [];
    for (const colName of ROOT_COLLECTIONS) {
        paths.push([colName, `${uid}-doc`]);
    }
    for (const colName of SUBCOLLECTIONS) {
        paths.push(['users', uid, colName, 'doc1']);
    }
    paths.push(['user_reading_preferences', uid]);
    paths.push(['users', uid]);
    return paths;
}

async function seedFullAccount(db: TestFirestore, uid: string) {
    for (const colName of ROOT_COLLECTIONS) {
        await setDoc(doc(db, colName, `${uid}-doc`), { uid });
    }
    for (const colName of SUBCOLLECTIONS) {
        await setDoc(doc(db, 'users', uid, colName, 'doc1'), { some: 'data' });
    }
    await setDoc(doc(db, 'users', uid, 'checkout_sessions', 'doc1'), { some: 'data' });
    await setDoc(doc(db, 'users', uid, 'subscriptions', 'doc1'), { some: 'data' });
    await setDoc(doc(db, 'users', uid, 'payments', 'doc1'), { some: 'data' });
    await setDoc(doc(db, 'users', uid, 'playPurchases', `${uid}-token`), { status: 'verified' });
    await setDoc(doc(db, 'playPurchaseIndex', `${uid}-token`), { uid });
    await setDoc(doc(db, 'user_reading_preferences', uid), { modality: 'na' });
    await setDoc(doc(db, 'users', uid), { tier: 'free', role: 'user' });
}

describe('executeTotalAccountAnnihilation — real Firestore rules enforcement (PROJ-115)', () => {
    it("deletes every one of Alice's documents, without touching Bob's, and deliberately leaves locked billing records alone for both", async () => {
        await seedAsAdmin(async (ctx) => {
            await seedFullAccount(ctx.firestore(), ALICE);
            await seedFullAccount(ctx.firestore(), BOB);
        });

        await executeTotalAccountAnnihilation(ALICE);

        await seedAsAdmin(async (ctx) => {
            for (const segments of pathsFor(ALICE)) {
                const snap = await getDoc(doc(ctx.firestore(), ...(segments as [string, ...string[]])));
                expect(snap.exists(), `expected ${segments.join('/')} to be deleted`).toBe(false);
            }
            for (const segments of pathsFor(BOB)) {
                const snap = await getDoc(doc(ctx.firestore(), ...(segments as [string, ...string[]])));
                expect(snap.exists(), `expected ${segments.join('/')} to survive untouched`).toBe(true);
            }
            for (const uid of [ALICE, BOB]) {
                for (const segments of LOCKED_BILLING_PATHS(uid)) {
                    const snap = await getDoc(doc(ctx.firestore(), ...(segments as [string, ...string[]])));
                    expect(snap.exists(), `expected locked billing doc ${segments.join('/')} to survive untouched`).toBe(true);
                }
            }
        });
    });
});
