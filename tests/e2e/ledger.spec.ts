import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const RELEASE_VERSION = '1.0.6';

async function createJob(page: import('@playwright/test').Page, title = 'Safe job') {
  await page.getByRole('button', { name: 'Record a deposit' }).click();
  await page.getByLabel(/Job or scope name/).fill(title);
  await page.getByLabel(/Client name/).fill('North Street Studio');
  await page.getByLabel(/Deposit amount/).fill('2500');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

async function expectNoAxeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

async function readStoredJob(page: import('@playwright/test').Page, title: string) {
  return page.evaluate(async (jobTitle) => new Promise<{
    title: string;
    notes: string;
    allocations: Array<{ title: string; status: string; statusHistory?: Array<{ status: string }> }>;
  } | undefined>((resolve, reject) => {
    const request = indexedDB.open('scope-deposit-ledger');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction('jobs', 'readonly');
      const jobs = transaction.objectStore('jobs').getAll();
      jobs.onerror = () => reject(jobs.error);
      jobs.onsuccess = () => {
        request.result.close();
        resolve(jobs.result.find((job) => job.title === jobTitle));
      };
    };
  }), title);
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

test('merges a stale job-detail save without losing newer allocations or their status history', async ({ page, context }) => {
  await page.goto('/');
  await createJob(page, 'Concurrent ledger');

  const secondTab = await context.newPage();
  await secondTab.goto('/');
  await expect(secondTab.getByRole('heading', { name: 'Concurrent ledger' })).toBeVisible();

  // Keep this form's revision and allocation snapshot stale, exactly as an
  // operator can when they start an unrelated scope-note edit in another tab.
  await secondTab.getByRole('button', { name: 'Edit job' }).click();
  await secondTab.getByLabel('Scope note').fill('Client approved the revised cabinet finish.');

  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await page.getByLabel(/Milestone or scope item/).fill('Materials');
  await page.getByLabel(/^Amount/).fill('400');
  await page.getByRole('button', { name: 'Add to trail' }).click();
  await page.getByLabel('Status for Materials').selectOption('earned');
  await expect(page.getByText(/held .* → earned/)).toBeVisible();
  await expect(secondTab.getByText('Ledger updated in another tab.')).toBeVisible();

  await secondTab.getByRole('button', { name: 'Save changes' }).click();
  await expect(secondTab.getByText('Another tab changed this job.')).toBeVisible();
  await expect(secondTab.getByRole('button', { name: 'Review latest trail' })).toBeVisible();
  await page.reload();

  await expect(page.getByText('Materials', { exact: true })).toBeVisible();
  await expect(page.getByText(/held .* → earned/)).toBeVisible();
  await expect(page.getByText('Client approved the revised cabinet finish.')).toBeVisible();

  const stored = await readStoredJob(page, 'Concurrent ledger');
  expect(stored?.notes).toBe('Client approved the revised cabinet finish.');
  expect(stored?.allocations).toHaveLength(1);
  expect(stored?.allocations[0]).toMatchObject({
    title: 'Materials',
    status: 'earned',
    statusHistory: [{ status: 'held' }, { status: 'earned' }]
  });
  await secondTab.close();
});

test('reconciles an invalid cached or return license by locking and keeping a quiet notice after reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:scope-deposit-ledger', 'stale-license');
    localStorage.setItem('sb_license:scope-deposit-ledger:verdict', JSON.stringify({ valid: true, checkedAt: 0 }));
  });
  await page.route('https://api.sociobot.in/api/v1/products/scope-deposit-ledger/verify?license=*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': 'http://127.0.0.1:4173' }, body: JSON.stringify({ valid: false, reason: 'revoked' }) });
  });
  await page.goto('/?license=qa-invalid-token');
  await expect(page.getByText(/Unlimited license is no longer active/)).toBeVisible();
  await expect(page.getByText('Unlimited active')).toHaveCount(0);
  await expect(page).not.toHaveURL(/license=/);
  await page.reload();
  await expect(page.getByText(/Unlimited license is no longer active/)).toBeVisible();
  await expect(page.getByText('Unlimited active')).toHaveCount(0);
});

test('does not advertise an unbuyable Unlimited checkout when the verifier 404 is returned', async ({ page }) => {
  const checkoutRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url() === 'https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout') checkoutRequests.push(request.url());
  });
  await page.route('**/checkout-status.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ checkout: { enabled: false, last_error: { error: 'enabled factory product', status: 404 } } })
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Free · 3 jobs/ }).click();
  await expect(page.getByText(/Unlimited purchases are temporarily unavailable/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy unlimited' })).toHaveCount(0);
  await expect(page.locator(`a[href="https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout"]`)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Verify and restore' })).toBeVisible();
  expect(checkoutRequests).toEqual([]);
});

test('works offline after first load and has no serious accessibility violations', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await expectNoAxeViolations(page);
  await context.setOffline(true);
  await expect(page.getByText(/Offline · changes still save/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Track deposits against agreed work.' })).toBeVisible();
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
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Switch color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await expectNoAxeViolations(page);
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
  const footer = page.getByRole('contentinfo');
  for (const target of [page.getByRole('button', { name: 'New job' }), footer.getByRole('link', { name: 'Privacy' }), footer.getByRole('link', { name: 'Terms' })]) {
    const box = await target.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('states the job, audience, and sample action on the first phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Track deposits against agreed work.' })).toBeVisible();
  await expect(page.getByText(/For solo trades and service operators/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByText('Saved on your device')).toBeVisible();
  await expect(page.getByText('Works offline after your first visit')).toBeVisible();
  await expect(page.getByText('Three jobs and all exports are free')).toBeVisible();
  const actionBox = await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
  expect(actionBox && actionBox.y + actionBox.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('uses route-specific titles, metadata, landmarks, and accessible legal and not-found pages', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Scope Deposit Ledger');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://scope-deposit-ledger.sociobot.in/demo');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText('Demo — sample data, nothing is saved to your ledger.')).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Scope Deposit Ledger');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('See what stays on your device.');
  await expectNoAxeViolations(page);

  await page.goto('/terms/');
  await expect(page).toHaveTitle('Terms — Scope Deposit Ledger');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Use this as a deposit record.');
  await expectNoAxeViolations(page);

  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Scope Deposit Ledger');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page was not found.');
  await expect(page.getByRole('link', { name: 'Return to the ledger' })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('loads the offline fallback under a strict style policy without console errors', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/offline.html', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': "default-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'" }
    });
  });
  await page.goto('/offline.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Open your saved ledger.');
  await expect(page.getByRole('link', { name: 'Return to your ledger' })).toBeVisible();
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).fontSize)).toBe('18px');
  await expectNoAxeViolations(page);
  expect(errors).toEqual([]);
  await context.close();
});

test('removes interface motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Edit job' }).click();
  expect(await page.getByRole('dialog').evaluate((element) => ({
    animation: getComputedStyle(element).animationName,
    transition: getComputedStyle(element).transitionDuration
  }))).toEqual({ animation: 'none', transition: '0s' });
  expect(await page.locator('.progress').evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s');
});
