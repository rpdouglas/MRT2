import { test, expect } from '../fixtures/emulator';

/**
 * Golden Path 2 — The Vault Test. The single most important test in this
 * suite: the only automated, browser-level confirmation that the
 * Zero-Knowledge boundary actually holds end-to-end, not just that the
 * unit-level crypto functions work in isolation.
 *
 * Set a PIN, write a journal entry, lock the vault, verify the entry is
 * unreachable without the PIN, unlock, verify it's restored.
 */
test('journal content is unreadable while the vault is locked, and restored on unlock', async ({ page }) => {
  const pin = '1234';
  const entryText = `E2E vault test entry ${Date.now()}`;

  // PROJ-73: EncryptionContext.setupVault() silently falls back to the
  // pre-PROJ-65 unpeppered derivation if the verifyVaultPin Cloud Function
  // call fails (e.g. the Functions emulator isn't running) — a fallback
  // this test would otherwise never detect, since it only observes the
  // resulting key material working, not which derivation produced it.
  // Fail loudly instead so this test actually proves the peppered scheme
  // (the current production default for every new vault) is exercised.
  const pepperFallbackWarnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.text().includes('Vault pepper setup failed')) pepperFallbackWarnings.push(msg.text());
  });

  await page.goto('/journal');

  // First visit to a VaultGate-wrapped route with no vault set up yet ->
  // the "Secure My Journal" setup form, not the unlock form.
  await page.getByPlaceholder('New Security PIN').fill(pin);
  await page.getByPlaceholder('Confirm PIN').fill(pin);
  const verifyVaultPinResponse = page.waitForResponse((resp) => resp.url().includes('verifyVaultPin'));
  await page.getByRole('button', { name: 'Secure My Journal' }).click();

  // The actual PROJ-73 assertion: the real verifyVaultPin Cloud Function
  // call succeeded (proving the Functions emulator + peppered derivation
  // ran end-to-end), and the silent-fallback warning never fired.
  const pepperResponse = await verifyVaultPinResponse;
  expect(pepperResponse.ok()).toBe(true);
  expect(pepperFallbackWarnings).toEqual([]);

  // Write and save an entry.
  await page.getByRole('textbox').first().fill(entryText);
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText(entryText)).toBeVisible({ timeout: 10_000 });

  // Lock the vault via the sidebar action (sidebar is closed by default on
  // mobile viewports — open it first), then revisit the History tab
  // directly — a bare /journal reload defaults back to the Write tab,
  // which would never show the entry regardless of lock state.
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.getByText('Lock Vault').click();
  await page.goto('/journal?tab=history');

  // VaultGate wraps the entire route — locked means the PIN-entry screen
  // renders instead of JournalHistory. This is the actual ZK assertion:
  // the plaintext must not be reachable in the DOM at all while locked.
  await expect(page.getByPlaceholder('Enter PIN')).toBeVisible();
  await expect(page.getByText(entryText)).not.toBeVisible();

  // Unlock and confirm the entry is restored.
  await page.getByPlaceholder('Enter PIN').fill(pin);
  await page.getByRole('button', { name: 'Unlock Vault' }).click();
  await expect(page.getByText(entryText)).toBeVisible({ timeout: 10_000 });
});
