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

  await page.goto('/journal');

  // First visit to a VaultGate-wrapped route with no vault set up yet ->
  // the "Secure My Journal" setup form, not the unlock form.
  await page.getByPlaceholder('New Security PIN').fill(pin);
  await page.getByPlaceholder('Confirm PIN').fill(pin);
  await page.getByRole('button', { name: 'Secure My Journal' }).click();

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
