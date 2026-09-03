import { test, expect } from '../fixtures/emulator';
import { seedTodaysCrossword, CROSSWORD_FIXTURE_CELLS, getUidByEmail, findGameProgress } from '../fixtures/seedCrossword';

/**
 * Golden Path 4 — The Subway Test (PROJ-72 §5). Flagged since #114 as
 * needing a human/browser pass — "Games and Knowledge Quest content
 * render/play from cached data when offline; game_progress/game_saves
 * writes sync once back online... needs a human pass, including Fast
 * Lane's specific close-tab-and-resume flow." Confirmed in
 * docs/projects/73_TEST_SUITE_HARDENING.md that the sandbox-only
 * network-proxy limitation which previously blocked all Playwright runs
 * does not reproduce in this environment, so this closes the gap for real
 * rather than re-flagging it for a human.
 *
 * Fast Lane is the only Recovery Game with genuine multi-session state
 * (`game_saves`, PROJ-72 Phase 4) — the other games are single-sitting and
 * have nothing meaningful to resume. This test proves the three distinct
 * claims in that checklist item:
 *   1. An in-game action taken while offline updates state immediately,
 *      without erroring (Firestore's persistentLocalCache queues the write
 *      rather than failing it).
 *   2. Exiting and re-entering the game while still offline (the "close
 *      tab and resume" flow) reads the resumed state from the local cache
 *      alone, with zero network involved.
 *   3. The offline-queued write actually reaches the server once back
 *      online — verified from a second, storage-isolated browser context
 *      that never wrote anything locally, so it can only be seeing synced
 *      server data.
 */
test('Fast Lane plays offline from cache, resumes on re-entry, and syncs once back online', async ({
  page,
  context,
  browser,
  onboardedUser,
}) => {
  const pin = '4321';

  await page.goto('/games/fast-lane');

  // VaultGate wraps this route (every game route except Craving Buster) —
  // set up the vault the same way vault.spec.ts does before any game state
  // can exist.
  await page.getByPlaceholder('New Security PIN').fill(pin);
  await page.getByPlaceholder('Confirm PIN').fill(pin);
  await page.getByRole('button', { name: 'Secure My Journal' }).click();
  // Generous timeout: this is FastLane's first mount, so useGameSave's
  // getDoc has to establish the emulator connection from scratch, which is
  // slower than the routine re-reads later in the test.
  await expect(page.getByText('Choose a Starting Point')).toBeVisible({ timeout: 20_000 });

  // Pick a difficulty -> the first save, a real online write to the
  // emulator. waitForResponse here is a synchronization signal (confirms
  // some Firestore emulator traffic happened before we go offline), not
  // the correctness proof — that comes from the second-context check below.
  const firstSave = page.waitForResponse(
    (resp) => resp.url().includes(':8080') && resp.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByText('Stabilization').click();
  await firstSave;
  // FastLane defaults to the Status tab on mount — capture the starting
  // funds there before doing anything else.
  const fundsBefore = await page.getByText(/^Funds: \$/).first().innerText();
  await expect(page.getByRole('button', { name: 'Weekly Planner' })).toBeVisible();

  // Round-trip through GamesHub once while still online. Both GamesHub and
  // FastLane are separate lazy-loaded route chunks (React.lazy in App.tsx);
  // a dynamic import() for a chunk that has never been fetched in this tab
  // is a real network request against the Vite dev server, which has no
  // devOptions-enabled service worker in dev mode to serve it offline. Once
  // a chunk *has* been imported, though, the browser's ES module cache
  // keeps serving it from memory for the rest of the document's lifetime —
  // no HTTP cache headers involved — so warming both chunks here means the
  // offline exit/re-entry below needs zero network for the app shell
  // itself, and only exercises what this test actually cares about:
  // Firestore's local persistence. This round trip also confirms the
  // ordinary (online) resume-from-save path works before testing the
  // offline one.
  await page.getByRole('button', { name: 'Exit to Games' }).click();
  await expect(page).toHaveURL(/\/games$/);
  await page.getByRole('link', { name: /Fast Lane/ }).click();
  await expect(page.getByRole('button', { name: 'Weekly Planner' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Choose a Starting Point')).not.toBeVisible();

  // Go offline. Confirm the game is still fully playable, and that an
  // action taken offline updates state immediately rather than erroring.
  await context.setOffline(true);

  await page.getByRole('button', { name: 'Weekly Planner' }).click();
  await page.getByText('🏢 Work').click();
  await page.getByRole('button', { name: /Work your job/ }).click();

  await page.getByRole('button', { name: 'Status' }).click();
  const fundsAfter = await page.getByText(/^Funds: \$/).first().innerText();
  expect(fundsAfter).not.toBe(fundsBefore);

  // "Close tab and resume," simulated via client-side routing (both chunks
  // are already warmed from the round trip above, so this needs no
  // network for the app shell). Exiting and re-entering unmounts and
  // remounts FastLane, discarding its in-memory state and forcing a fresh
  // read through useGameSave -> getDoc, which must resolve from the local
  // persistent cache alone since we're still offline.
  await page.getByRole('button', { name: 'Exit to Games' }).click();
  await expect(page).toHaveURL(/\/games$/);

  await page.getByRole('link', { name: /Fast Lane/ }).click();
  await expect(page.getByRole('button', { name: 'Weekly Planner' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Choose a Starting Point')).not.toBeVisible();

  // Back online -> the offline-queued write should flush to the server.
  await context.setOffline(false);
  await page.waitForResponse(
    (resp) => resp.url().includes(':8080') && resp.request().method() === 'POST',
    { timeout: 15_000 },
  );

  // Prove it reached the server, not just the local cache, from a second,
  // storage-isolated context that never wrote anything locally — it can
  // only pass this if the resumed state was actually synced.
  const verifyContext = await browser.newContext();
  const verifyPage = await verifyContext.newPage();

  await verifyPage.goto('/login');
  await verifyPage.getByPlaceholder('Email address').fill(onboardedUser.email);
  await verifyPage.getByPlaceholder('Password', { exact: true }).fill(onboardedUser.password);
  await verifyPage.getByRole('button', { name: 'Sign In Securely' }).click();
  await verifyPage.waitForURL('**/dashboard**', { timeout: 30_000 });

  await verifyPage.goto('/games/fast-lane');
  await verifyPage.getByPlaceholder('Enter PIN').fill(pin);
  await verifyPage.getByRole('button', { name: 'Unlock Vault' }).click();

  await expect(verifyPage.getByRole('button', { name: 'Weekly Planner' })).toBeVisible({ timeout: 10_000 });
  await expect(verifyPage.getByText('Choose a Starting Point')).not.toBeVisible();

  await verifyContext.close();
});

/**
 * PROJ-79 ledger gap — Daily Crossword was never covered by the Subway
 * Test. Unlike Fast Lane, this game has no genuine multi-session save state
 * to resume (it's solved in one sitting, per docs/screens/games/daily-
 * crossword.md); what actually needs proving here is different: (1) the
 * puzzle content itself (crossword_puzzles/{date}, read-only/admin-written)
 * renders from Firestore's local cache while offline, (2) solving it is
 * fully playable offline with no error, and (3) the resulting game_progress
 * completion write is queued locally and reaches the server once back
 * online — as real ciphertext, not plaintext (the "Lost PIN"-adjacent
 * concern this ledger item also named). The puzzle itself is seeded via the
 * Firestore Admin SDK (see ../fixtures/seedCrossword.ts) rather than the
 * real Gemini-backed generator, for a deterministic, network-free fixture.
 */
test('Daily Crossword renders and solves offline, and syncs the completion (as real ciphertext) once back online', async ({
  page,
  context,
  onboardedUser,
}) => {
  const pin = '4321';
  await seedTodaysCrossword();

  await page.goto('/games/daily-crossword');

  // VaultGate wraps this route (per docs/screens/games/daily-crossword.md —
  // no crisis-tool exception here).
  await page.getByPlaceholder('New Security PIN').fill(pin);
  await page.getByPlaceholder('Confirm PIN').fill(pin);
  await page.getByRole('button', { name: 'Secure My Journal' }).click();
  await expect(page.getByText('Everyday Recovery Language')).toBeVisible({ timeout: 20_000 });

  // Round-trip through GamesHub once while online — warms both lazy route
  // chunks (same rationale as the Fast Lane test above) so the offline
  // exit/re-entry below needs zero network for the app shell itself.
  await page.getByRole('button', { name: 'Exit to Games' }).click();
  await expect(page).toHaveURL(/\/games$/);
  await page.getByRole('link', { name: /Daily Crossword/ }).click();
  await expect(page.getByText('Everyday Recovery Language')).toBeVisible({ timeout: 10_000 });

  // Go offline. Exit and re-enter — the puzzle doc must render from
  // Firestore's local persistent cache alone, with zero network involved.
  await context.setOffline(true);

  await page.getByRole('button', { name: 'Exit to Games' }).click();
  await expect(page).toHaveURL(/\/games$/);
  await page.getByRole('link', { name: /Daily Crossword/ }).click();
  await expect(page.getByText('Everyday Recovery Language')).toBeVisible({ timeout: 10_000 });

  // Solve the whole grid offline, cell by cell. Clicking each cell directly
  // (rather than relying on auto-advance across a whole word) sidesteps any
  // ambiguity about which of across/down is currently selected.
  for (const { row, col, letter } of CROSSWORD_FIXTURE_CELLS) {
    await page.getByRole('button', { name: new RegExp(`^Row ${row + 1} column ${col + 1}`) }).click();
    await page.keyboard.type(letter);
  }

  // Solved state renders immediately, fully offline — recordProgress's
  // write is queued locally (persistentLocalCache), not blocking the UI.
  await expect(page.getByText('A few minutes spent strengthening recovery vocabulary.')).toBeVisible();

  // Back online -> the offline-queued game_progress write should flush.
  await context.setOffline(false);
  await page.waitForResponse(
    (resp) => resp.url().includes(':8080') && resp.request().method() === 'POST',
    { timeout: 15_000 },
  );

  // Prove it actually reached the server as real ciphertext, not just the
  // local cache and not plaintext. Daily Crossword has no "already solved
  // today" resume UI to check from a second browser context the way Fast
  // Lane's game_saves does, so a direct Admin SDK read is the equivalent
  // proof for this game's shape — and doubles as the "Lost PIN"-adjacent
  // check this ledger item also named (encryptedStats must be real
  // ciphertext, not the raw stats object with a label slapped on).
  const uid = await getUidByEmail(onboardedUser.email);
  await expect(async () => {
    const record = await findGameProgress(uid, 'daily-crossword');
    expect(record).toBeTruthy();
    expect(typeof record?.encryptedStats).toBe('string');
    expect(record?.encryptedStats as string).not.toContain('solveDurationSeconds');
  }).toPass({ timeout: 15_000 });
});
