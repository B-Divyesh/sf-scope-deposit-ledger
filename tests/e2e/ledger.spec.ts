import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const RELEASE_VERSION = '1.0.2';

async function createJob(page: import('@playwright/test').Page, title = 'Safe job') {
  await page.getByRole('button', { name: 'Record a deposit' }).click();
  await page.getByLabel(/Job or scope name/).fill(title);
  await page.getByLabel(/Client name/).fill('North Street Studio');
  await page.getByLabel(/Deposit amount/).fill('2500');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

async function expectNoSeriousAxe(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
}

test('records, allocates, persists and exports a deposit trail', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Scope Deposit Ledger/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Record a deposit' }).click();
  await page.getByLabel(/Job or scope name/).fill('Workshop cabinetry');
  await page.getByLabel(/Client name/).fill('North Street Studio');
  await page.getByLabel(/Deposit amount/).fill('2500');
  await page.getByLabel(/Tax jurisdiction/).fill('Oregon · tax excluded');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByRole('heading', { name: 'Workshop cabinetry' })).toBeVisible();

  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await page.getByLabel(/Milestone or scope item/).fill('Materials ordered');
  await page.getByLabel(/^Amount/).fill('900');
  await page.getByLabel(/Client-readable note/).fill('Released when supplier confirms the order.');
  await page.getByRole('button', { name: 'Add to trail' }).click();
  await expect(page.getByText('$1,600.00')).toBeVisible();
  await page.getByLabel('Status for Materials ordered').selectOption('earned');
  await expect(page.getByText('earned', { exact: true })).toBeVisible();
  await expect(page.getByText(/held .* → earned/)).toBeVisible();

  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await csv).suggestedFilename()).toContain('deposit-trail.csv');
  const pdf = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  expect((await pdf).suggestedFilename()).toContain('deposit-trail.pdf');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workshop cabinetry' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('reconciles an invalid cached or return license by locking and showing a quiet notice', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:scope-deposit-ledger', 'stale-license');
    localStorage.setItem('sb_license:scope-deposit-ledger:verdict', JSON.stringify({ valid: true, checkedAt: 0 }));
  });
  await page.route('https://api.sociobot.in/api/v1/products/scope-deposit-ledger/verify?license=*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': 'http://127.0.0.1:4173' }, body: JSON.stringify({ valid: false, reason: 'revoked' }) });
  });
  await page.goto('/?license=qa-invalid-token');
  await expect(page.getByText(/Unlimited license is no longer active/)).toBeVisible();
  await expect(page.getByText('Unlimited unlocked')).toHaveCount(0);
  await expect(page).not.toHaveURL(/license=/);
});

test('works offline after first load and has no serious accessibility violations', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await expectNoSeriousAxe(page);
  await context.setOffline(true);
  await expect(page.getByText(/Offline · changes still save/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Show exactly what the deposit covers.' })).toBeVisible();
});

test('rejects invalid amounts and blank scope names without changing the form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Record a deposit' }).click();
  await page.getByLabel(/Job or scope name/).fill('   ');
  await page.getByLabel(/Client name/).fill('North Street Studio');
  await page.getByLabel(/Deposit amount/).fill('1e2');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByText('Enter a job or scope name.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel(/Job or scope name/).fill('Strict parser job');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByText(/up to two decimal places/)).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel(/Deposit amount/).fill('100');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByRole('heading', { name: 'Strict parser job' })).toBeVisible();
  await expect(page.getByText('Original deposit')).toBeVisible();
  await expect(page.locator('.deposit-figure strong')).toHaveText('$100.00');

  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await page.getByLabel(/Milestone or scope item/).fill('   ');
  await page.getByLabel(/^Amount/).fill('1e2');
  await page.getByRole('button', { name: 'Add to trail' }).click();
  await expect(page.getByText('Enter a milestone or scope item.')).toBeVisible();
  await page.getByLabel(/Milestone or scope item/).fill('Materials');
  await page.getByRole('button', { name: 'Add to trail' }).click();
  await expect(page.getByText('Enter an amount greater than zero.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('rejects a malformed restore before it can replace existing local records', async ({ page }) => {
  await page.goto('/');
  await createJob(page);
  const malformed = JSON.stringify({ schema: 1, exportedAt: new Date().toISOString(), jobs: [{ id: 'bad', title: 'Broken', allocations: [] }] });
  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(malformed) });
  await expect(page.getByText('The backup contains an invalid job record.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Safe job' })).toBeVisible();
  await expect(page.getByText('$NaN')).toHaveCount(0);
});

test('has accessible populated, dialog, and dark states and a working skip link', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to ledger' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await createJob(page, 'Accessible job');
  await expectNoSeriousAxe(page);
  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await expectNoSeriousAxe(page);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Switch color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expectNoSeriousAxe(page);
  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await expectNoSeriousAxe(page);
});

test('stamps the installed start URL and active cache with this release version', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json() as { start_url: string };
  expect(manifest.start_url).toContain(`v=${RELEASE_VERSION}`);
  const cacheNames = await page.evaluate((): Promise<string[]> => globalThis.caches.keys());
  expect(cacheNames).toContain(`scope-ledger-shell-${RELEASE_VERSION}`);
});

test('keeps the populated ledger usable at a 390px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await createJob(page, 'Mobile job');
  await expect(page.getByRole('button', { name: 'Allocate scope' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  for (const target of [page.getByRole('button', { name: 'New job' }), page.getByRole('link', { name: 'Privacy' }), page.getByRole('link', { name: 'Terms' })]) {
    const box = await target.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('privacy and terms are available as direct static routes', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy stays on your device.');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A record aid, not an accountant.');
});
