/**
 * Firebase Storage Security Rules — emulator-based tests (PROJ-113).
 *
 * First use of Firebase Storage in this app (see storage.rules and
 * docs/projects/113_DAILY_INSPIRATIONAL_IMAGE.md §2/§3) — no existing test
 * precedent to extend, so this mirrors firestore.rules.test.ts's structure
 * against the Storage emulator (port 9199, see firebase.json) instead.
 *
 * Requires a running Storage emulator — NOT part of the default
 * `npm run test:once` sweep, since it needs real I/O against the emulator
 * rather than mocks. Run via `npm run test:rules:storage`, which
 * starts/stops the emulator for you via `firebase emulators:exec`.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
// Vite's ?raw import — same convention as firestore.rules.test.ts's import
// of firestore.rules?raw.
import storageRules from '../../storage.rules?raw';

let testEnv: RulesTestEnvironment;

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mrt2-storage-rules-test',
    storage: {
      rules: storageRules,
      host: 'localhost',
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearStorage();
});

describe('daily-images/{imageId} — PROJ-113 admin-write/authenticated-read', () => {
  it('blocks a non-admin authenticated user from uploading an image', async () => {
    const aliceStorage = testEnv.authenticatedContext(ALICE).storage();
    await assertFails(
      Promise.resolve(aliceStorage.ref('daily-images/img1.jpg').putString('fake-bytes', 'raw')),
    );
  });

  it('lets an admin (custom claim) upload an image', async () => {
    const adminStorage = testEnv.authenticatedContext(BOB, { admin: true }).storage();
    await assertSucceeds(
      Promise.resolve(adminStorage.ref('daily-images/img1.jpg').putString('fake-bytes', 'raw')),
    );
  });

  it('blocks an unauthenticated user from uploading an image', async () => {
    const anonStorage = testEnv.unauthenticatedContext().storage();
    await assertFails(
      Promise.resolve(anonStorage.ref('daily-images/img1.jpg').putString('fake-bytes', 'raw')),
    );
  });

  it('lets any authenticated user read an uploaded image', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.storage().ref('daily-images/img1.jpg').putString('fake-bytes', 'raw');
    });

    const aliceStorage = testEnv.authenticatedContext(ALICE).storage();
    await assertSucceeds(aliceStorage.ref('daily-images/img1.jpg').getDownloadURL());
  });

  it('blocks an unauthenticated user from reading an uploaded image', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.storage().ref('daily-images/img1.jpg').putString('fake-bytes', 'raw');
    });

    const anonStorage = testEnv.unauthenticatedContext().storage();
    await assertFails(anonStorage.ref('daily-images/img1.jpg').getDownloadURL());
  });
});

describe('default deny — no other Storage path is provisioned yet', () => {
  it('blocks an admin from writing to an unprovisioned path', async () => {
    const adminStorage = testEnv.authenticatedContext(BOB, { admin: true }).storage();
    await assertFails(
      Promise.resolve(adminStorage.ref('some-other-path/file.jpg').putString('fake-bytes', 'raw')),
    );
  });

  it('blocks any read of an unprovisioned path, even authenticated', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.storage().ref('some-other-path/file.jpg').putString('fake-bytes', 'raw');
    });

    const aliceStorage = testEnv.authenticatedContext(ALICE).storage();
    await assertFails(aliceStorage.ref('some-other-path/file.jpg').getDownloadURL());
  });
});
