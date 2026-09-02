/**
 * Firestore Security Rules — emulator-based tests (PROJ-99 Phase 2).
 *
 * Requires a running Firestore emulator (port 8080, see firebase.json) — NOT
 * part of the default `npm run test:once` sweep (see vite.config.ts's test
 * exclude list), since it needs real I/O against the emulator rather than
 * mocks. Run via `npm run test:rules`, which starts/stops the emulator for
 * you via `firebase emulators:exec`.
 *
 * Covers three things the audit found had zero automated coverage despite
 * being security-critical: ownership enforcement (regression guard for
 * existing behavior), the new PROJ-99 shape/size validation, and the
 * tier/role self-escalation blocks on `users/{userId}`.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
// Vite's ?raw import (typed via vite/client, no Node fs/types needed here —
// this file lives under src/, governed by tsconfig.app.json's browser-only
// type scope, not the Node-typed tsconfig used for e2e/functions).
import firestoreRules from '../../firestore.rules?raw';

let testEnv: RulesTestEnvironment;

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mrt2-rules-test',
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
});

// withSecurityRulesDisabled's bypass only applies inside the callback's own
// execution — a Firestore instance pulled out and used after the callback
// returns is back to enforcing rules normally. Every seed helper below
// performs its write(s) inside the callback for that reason.
function seedAsAdmin(fn: (ctx: RulesTestContext) => Promise<void>) {
  return testEnv.withSecurityRulesDisabled(fn);
}

describe('journals — ownership', () => {
  it('lets a user create their own journal entry', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'journals', 'entry1'), {
        uid: ALICE,
        content: 'IV:cipher',
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      }),
    );
  });

  it('blocks a user from creating a journal entry tagged with someone else\'s uid', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'journals', 'entry1'), {
        uid: BOB,
        content: 'IV:cipher',
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      }),
    );
  });

  it("blocks a user from reading another user's journal entry", async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'journals', 'entry1'), {
        uid: BOB,
        content: 'IV:cipher',
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(getDoc(doc(aliceDb, 'journals', 'entry1')));
  });

  it('blocks an unauthenticated request entirely', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anonDb, 'journals', 'entry1'), {
        uid: ALICE,
        content: 'IV:cipher',
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      }),
    );
  });
});

describe('journals — shape/size validation (PROJ-99 Phase 1)', () => {
  it('rejects a create with a non-string content field', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'journals', 'entry1'), {
        uid: ALICE,
        content: 12345,
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      }),
    );
  });

  it('rejects a create missing createdAt', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'journals', 'entry1'), {
        uid: ALICE,
        content: 'IV:cipher',
        moodScore: 5,
        tags: [],
      }),
    );
  });

  it('rejects a create whose content exceeds the 50KB ceiling', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'journals', 'entry1'), {
        uid: ALICE,
        content: 'x'.repeat(51200),
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      }),
    );
  });

  it('accepts a create whose content is comfortably under the ceiling', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'journals', 'entry1'), {
        uid: ALICE,
        content: 'x'.repeat(1000),
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      }),
    );
  });

  it('allows updating an existing entry that predates the size rule, even if it exceeds today\'s ceiling', async () => {
    // Seed a document larger than the 50KB create-time ceiling, bypassing
    // rules entirely — simulating data written before this rule existed.
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'journals', 'legacy-entry'), {
        uid: ALICE,
        content: 'x'.repeat(60000),
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    // Re-encrypting under a new PIN (rotation) only touches `content`, and
    // the resulting document is still oversized by today's ceiling — this
    // must still succeed, since size is a create-time-only check.
    await assertSucceeds(
      updateDoc(doc(aliceDb, 'journals', 'legacy-entry'), {
        content: 'y'.repeat(60000),
      }),
    );
  });

  it('rejects an update that breaks shape (e.g. content becomes non-string)', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'journals', 'entry1'), {
        uid: ALICE,
        content: 'IV:cipher',
        moodScore: 5,
        tags: [],
        createdAt: Timestamp.now(),
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(aliceDb, 'journals', 'entry1'), { content: 42 }),
    );
  });
});

describe('game_saves — ownership + shape/size validation', () => {
  it('lets a user create their own game save', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'game_saves', `${ALICE}_fast-lane`), {
        uid: ALICE,
        gameId: 'fast-lane',
        encryptedState: 'IV:cipher',
        updatedAt: Timestamp.now(),
        isEncrypted: true,
      }),
    );
  });

  it("blocks a user from reading another user's game save", async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'game_saves', `${BOB}_fast-lane`), {
        uid: BOB,
        gameId: 'fast-lane',
        encryptedState: 'IV:cipher',
        updatedAt: Timestamp.now(),
        isEncrypted: true,
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(getDoc(doc(aliceDb, 'game_saves', `${BOB}_fast-lane`)));
  });

  it('rejects a create whose encryptedState exceeds the 200KB ceiling', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'game_saves', `${ALICE}_fast-lane`), {
        uid: ALICE,
        gameId: 'fast-lane',
        encryptedState: 'x'.repeat(204800),
        updatedAt: Timestamp.now(),
        isEncrypted: true,
      }),
    );
  });

  it('rejects a create missing gameId', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'game_saves', `${ALICE}_fast-lane`), {
        uid: ALICE,
        encryptedState: 'IV:cipher',
        updatedAt: Timestamp.now(),
        isEncrypted: true,
      }),
    );
  });
});

describe('users/{userId} — tier/role self-escalation blocks', () => {
  it('lets a user create their own profile at the safe defaults', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'users', ALICE), {
        tier: 'free',
        role: 'user',
        email: 'alice@example.com',
      }),
    );
  });

  it('blocks a user from self-granting premium tier on create', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'users', ALICE), {
        tier: 'premium',
        role: 'user',
        email: 'alice@example.com',
      }),
    );
  });

  it('blocks a user from self-granting the admin role on create', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'users', ALICE), {
        tier: 'free',
        role: 'admin',
        email: 'alice@example.com',
      }),
    );
  });

  it('blocks a user from updating their own tier field later', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE), { tier: 'free', role: 'user', email: 'a@b.com' });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(aliceDb, 'users', ALICE), { tier: 'premium' }));
  });

  it('blocks a user from updating their own role field later', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE), { tier: 'free', role: 'user', email: 'a@b.com' });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(aliceDb, 'users', ALICE), { role: 'admin' }));
  });

  it('blocks a user from resetting their own pinAttempts field', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE), {
        tier: 'free',
        role: 'user',
        email: 'a@b.com',
        pinAttempts: { count: 12, lockedUntil: Timestamp.now() },
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(aliceDb, 'users', ALICE), { pinAttempts: { count: 0, lockedUntil: null } }),
    );
  });

  it('blocks a user from resetting their own lastWorkbookCoachCall field (PROJ-106 anti-abuse floor)', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE), {
        tier: 'free',
        role: 'user',
        email: 'a@b.com',
        lastWorkbookCoachCall: Timestamp.now(),
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(aliceDb, 'users', ALICE), { lastWorkbookCoachCall: null }),
    );
  });

  it('lets a user update unrelated profile fields freely', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE), { tier: 'free', role: 'user', email: 'a@b.com' });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(aliceDb, 'users', ALICE), { displayName: 'Alice', timezone: 'America/Toronto' }),
    );
  });

  it("lets an admin (custom claim) update another user's role field", async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE), { tier: 'free', role: 'user', email: 'a@b.com' });
    });

    const asAdmin = testEnv.authenticatedContext(BOB, { admin: true }).firestore();
    await assertSucceeds(updateDoc(doc(asAdmin, 'users', ALICE), { role: 'admin' }));
  });
});

describe('users/{userId}/playPurchases — PROJ-105 Play Billing', () => {
  it('lets a user create their own play purchase record', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'users', ALICE, 'playPurchases', 'token-123'), {
        purchaseToken: 'token-123',
        productId: 'premium.monthly',
        createdAt: Timestamp.now(),
        verified: false,
      }),
    );
  });

  it("blocks a user from reading another user's play purchase record", async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE, 'playPurchases', 'token-123'), {
        purchaseToken: 'token-123',
        productId: 'premium.monthly',
        createdAt: Timestamp.now(),
        verified: false,
      });
    });

    const bobDb = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(bobDb, 'users', ALICE, 'playPurchases', 'token-123')));
  });

  it('blocks a user from self-verifying their own play purchase record', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE, 'playPurchases', 'token-123'), {
        purchaseToken: 'token-123',
        productId: 'premium.monthly',
        createdAt: Timestamp.now(),
        verified: false,
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(aliceDb, 'users', ALICE, 'playPurchases', 'token-123'), { verified: true, status: 'active' }),
    );
  });

  it('blocks a user from deleting their own play purchase record', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE, 'playPurchases', 'token-123'), {
        purchaseToken: 'token-123',
        productId: 'premium.monthly',
        createdAt: Timestamp.now(),
        verified: false,
      });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(deleteDoc(doc(aliceDb, 'users', ALICE, 'playPurchases', 'token-123')));
  });
});

describe('playPurchaseIndex — PROJ-105 RTDN lookup pointer', () => {
  it('lets a user create their own token->uid pointer doc', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'playPurchaseIndex', 'token-123'), { uid: ALICE }),
    );
  });

  it("blocks a user from creating a pointer doc tagged with someone else's uid", async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'playPurchaseIndex', 'token-123'), { uid: BOB }),
    );
  });

  it('blocks a user from reading any pointer doc, including their own', async () => {
    await seedAsAdmin(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'playPurchaseIndex', 'token-123'), { uid: ALICE });
    });

    const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(getDoc(doc(aliceDb, 'playPurchaseIndex', 'token-123')));
  });
});
