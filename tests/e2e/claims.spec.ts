import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const PRODUCT_ORIGIN = 'http://127.0.0.1:4173';
const CHECKOUT_URL = 'https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout';
const DEMO_DB = 'demo:scope-deposit-ledger';
const REAL_DB = 'scope-deposit-ledger';

async function createJob(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: 'New job' }).click();
  await page.getByLabel(/Job or scope name/).fill(title);
  await page.getByLabel(/Client name/).fill('North Street Studio');
  await page.getByLabel(/Deposit amount/).fill('100');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

async function readJobs(page: import('@playwright/test').Page, dbName = DEMO_DB) {
  return page.evaluate(async (name) => new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const tx = request.result.transaction('jobs', 'readonly');
      const all = tx.objectStore('jobs').getAll();
      all.onerror = () => reject(all.error);
      all.onsuccess = () => {
        request.result.close();
        resolve(all.result);
      };
    };
  }), dbName);
}

async function downloadText(download: import('@playwright/test').Download) {
  const path = await download.path();
  if (!path) throw new Error('Download did not produce a local file.');
  return (await readFile(path)).toString('utf8');
}

function pdfStrings(source: string): string {
  return [...source.matchAll(/<FEFF([0-9A-F]+)> Tj/g)].map((match) => {
    const bytes = Uint8Array.from((match[1].match(/.{1,2}/g) || []).map((pair) => Number.parseInt(pair, 16)));
    return new TextDecoder('utf-16be').decode(bytes);
  }).join('\n');
}

test('@claim:demo-isolation sample changes reset and never alter the normal ledger', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Record a deposit' }).click();
  await page.getByLabel(/Job or scope name/).fill('Real customer job');
  await page.getByLabel(/Client name/).fill('Rina Patel');
  await page.getByLabel(/Deposit amount/).fill('700');
  await page.getByRole('button', { name: 'Create ledger' }).click();
  expect((await readJobs(page, REAL_DB)).map((job) => job.title)).toEqual(['Real customer job']);

  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved to your ledger.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cedar Lane kitchen refit' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Scope note').fill('Changed only inside the sample.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changed only inside the sample.')).toBeVisible();

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText(/Deposit held against the signed cabinet/)).toBeVisible();
  await expect(page.getByText('Changed only inside the sample.')).toHaveCount(0);
  expect((await readJobs(page, REAL_DB)).map((job) => job.title)).toEqual(['Real customer job']);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  expect((await readJobs(page, REAL_DB)).map((job) => job.title)).toEqual(['Real customer job']);
  await expect(page.getByRole('heading', { name: 'Real customer job' })).toBeVisible();
});

test('@claim:ledger-details records the client, scope, deposit, date, currency, and tax assumption', async ({ page }) => {
  await page.goto('/demo');
  const jobs = await readJobs(page);
  expect(jobs).toHaveLength(1);
  expect(jobs[0]).toMatchObject({
    title: 'Cedar Lane kitchen refit',
    client: 'Maya Chen',
    deposit: 425075,
    receivedDate: '2026-08-12',
    currency: 'CAD',
    jurisdiction: 'Ontario · HST is outside this allocation trail'
  });
  await expect(page.getByText('Original deposit')).toBeVisible();
  await expect(page.locator('.deposit-figure strong')).toContainText('4,250.75');
});

test('@claim:allocation-limit rejects an amount above the balance and accepts the exact boundary', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Allocate scope' }).click();
  await page.getByLabel(/Milestone or scope item/).fill('Final cabinet fitting');
  await page.getByLabel(/^Amount/).fill('500.76');
  await page.getByRole('button', { name: 'Add to trail' }).click();
  await expect(page.getByText(/more than.*500\.75.*available/)).toBeVisible();
  await page.getByLabel(/^Amount/).fill('500.75');
  await page.getByRole('button', { name: 'Add to trail' }).click();
  await expect(page.getByText('100% assigned to scope')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Allocate scope' })).toBeDisabled();
});

test('@claim:status-history keeps dated held, earned, and returned changes', async ({ page }) => {
  await page.goto('/demo');
  const materials = page.locator('.allocation-row').filter({ hasText: 'Cabinet materials and hardware' });
  await page.getByLabel('Status for Cabinet materials and hardware').selectOption('earned');
  await expect(materials).toContainText(/held 2026-08-12 → earned/);
  await page.getByLabel('Status for Cabinet materials and hardware').selectOption('returned');
  await expect(materials).toContainText(/held 2026-08-12 → earned .* → returned/);
  await page.reload();
  await expect(page.locator('.allocation-row').filter({ hasText: 'Cabinet materials and hardware' })).toContainText(/held 2026-08-12 → earned .* → returned/);
  const allocation = ((await readJobs(page))[0].allocations as Array<{ statusHistory: Array<{ status: string }> }>)[0];
  expect(allocation.statusHistory.map((event) => event.status)).toEqual(['held', 'earned', 'returned']);
});

test('@claim:csv-export exports a complete client-readable CSV trail', async ({ page }) => {
  await page.goto('/demo');
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('cedar-lane-kitchen-refit-deposit-trail.csv');
  const csv = await downloadText(download);
  expect(csv).toContain('"Cedar Lane kitchen refit"');
  expect(csv).toContain('"Cabinet materials and hardware","2200.00"');
  expect(csv).toContain('"Ontario · HST is outside this allocation trail"');
  expect(csv).toContain('not an invoice, tax calculation, or accounting advice');
});

test('@claim:pdf-export exports a complete client-readable PDF trail', async ({ page }) => {
  await page.goto('/demo');
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('cedar-lane-kitchen-refit-deposit-trail.pdf');
  const source = await downloadText(download);
  expect(source.startsWith('%PDF-1.4')).toBe(true);
  const text = pdfStrings(source);
  expect(text).toContain('Cedar Lane kitchen refit');
  expect(text).toContain('Maya Chen');
  expect(text).toContain('Cabinet materials and hardware');
  expect(text).toContain('Ontario · HST is outside this allocation trail');
  expect(text).toContain('not an invoice');
});

test('@claim:json-backup restores the complete ledger and status history', async ({ page }) => {
  await page.goto('/demo');
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up all' }).click();
  const download = await event;
  const backup = await downloadText(download);
  const parsed = JSON.parse(backup) as { jobs: Array<{ allocations: Array<{ statusHistory: unknown[] }> }> };
  expect(parsed.jobs[0].allocations).toHaveLength(3);
  expect(parsed.jobs[0].allocations[1].statusHistory).toHaveLength(2);

  page.once('dialog', (prompt) => prompt.accept());
  await page.getByRole('button', { name: 'Delete Cedar Lane kitchen refit' }).click();
  await expect(page.getByRole('heading', { name: 'Cedar Lane kitchen refit' })).toHaveCount(0);
  page.once('dialog', (prompt) => prompt.accept());
  await page.locator('#import-file').setInputFiles({ name: 'ledger.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await expect(page.getByRole('heading', { name: 'Cedar Lane kitchen refit' })).toBeVisible();
  await expect(page.getByText(/held 2026-08-12 → earned 2026-08-27/)).toBeVisible();
});

test('@claim:on-device-data keeps ledger records in the demo browser database', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Scope note').fill('Stored only in this browser profile.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  expect((await readJobs(page))[0].notes).toBe('Stored only in this browser profile.');
  const databases = await page.evaluate(() => indexedDB.databases());
  expect(databases.map((database) => database.name)).toContain(DEMO_DB);
  expect(databases.map((database) => database.name)).not.toContain(REAL_DB);
  expect(requests.every((url) => new URL(url).origin === PRODUCT_ORIGIN)).toBe(true);
});

test('@claim:offline-reload reloads the populated sample after the network is removed', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/demo');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await expect(page.getByRole('heading', { name: 'Cedar Lane kitchen refit' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · changes still save')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cedar Lane kitchen refit' })).toBeVisible();
  await context.close();
});

test('@claim:cross-tab-merge preserves a newer allocation trail during a stale detail save', async ({ page, context }) => {
  await page.goto('/demo');
  const secondTab = await context.newPage();
  await secondTab.goto('/demo');
  await secondTab.getByRole('button', { name: 'Edit job' }).click();
  await secondTab.getByLabel('Scope note').fill('Approved in the second tab.');

  await page.getByLabel('Status for Cabinet materials and hardware').selectOption('earned');
  await expect(page.locator('.allocation-row').filter({ hasText: 'Cabinet materials and hardware' })).toContainText(/held 2026-08-12 → earned/);
  await secondTab.getByRole('button', { name: 'Save changes' }).click();
  await expect(secondTab.getByText('Another tab changed this job.')).toBeVisible();
  await secondTab.reload();
  await expect(secondTab.getByText('Approved in the second tab.')).toBeVisible();
  await expect(secondTab.locator('.allocation-row').filter({ hasText: 'Cabinet materials and hardware' })).toContainText(/held 2026-08-12 → earned/);
  await secondTab.close();
});

test('@claim:free-core allows three jobs and keeps exports available without a license', async ({ page }) => {
  await page.route('**/checkout-status.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ checkout: { enabled: false } })
  }));
  await page.goto('/demo');
  await createJob(page, 'Second free job');
  await createJob(page, 'Third free job');
  await expect(page.getByText('3 jobs')).toBeVisible();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await event).suggestedFilename()).toContain('deposit-trail.csv');
  await page.getByRole('button', { name: 'New job' }).click();
  await expect(page.getByRole('heading', { name: 'Buy or restore Unlimited' })).toBeVisible();
  await expect(page.getByText(/three free ledgers.*exports.*backup.*offline use remain available/)).toBeVisible();
});

test('@claim:license-daily-check checks once per day and keeps an invalid-license notice after reload', async ({ page }) => {
  let verifyRequests = 0;
  await page.addInitScript(() => {
    const licenseKey = 'demo:sb_license:scope-deposit-ledger';
    const verdictKey = `${licenseKey}:verdict`;
    if (!localStorage.getItem(licenseKey)) localStorage.setItem(licenseKey, 'stale-demo-license');
    if (!localStorage.getItem(verdictKey)) localStorage.setItem(verdictKey, JSON.stringify({ valid: true, checkedAt: 0 }));
  });
  await page.route('https://api.sociobot.in/api/v1/products/scope-deposit-ledger/verify?license=*', async (route) => {
    verifyRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': PRODUCT_ORIGIN },
      body: JSON.stringify({ valid: false, reason: 'revoked', expires_at: null })
    });
  });
  await page.goto('/demo');
  await expect(page.getByText(/Unlimited license is no longer active/)).toBeVisible();
  expect(verifyRequests).toBe(1);
  await page.reload();
  await expect(page.getByText(/Unlimited license is no longer active/)).toBeVisible();
  expect(verifyRequests).toBe(1);
});

test('@claim:no-tracking completes a sample flow without trackers, CDN code, cookies, or third-party requests', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByLabel('Status for Cabinet materials and hardware').selectOption('earned');
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await event;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === PRODUCT_ORIGIN)).toBe(true);
  expect(await context.cookies()).toEqual([]);
  expect(await page.locator('script[src^="http"], link[rel="stylesheet"][href^="http"]').count()).toBe(0);
});

test('@claim:paid-offer shows the $29 one-time terms and opens Sociobot checkout only when enabled', async ({ browser }) => {
  // The production worker intentionally caches the release's same-origin
  // checkout status. Block it here so this recorded enabled-state fixture is
  // the source the page actually consumes.
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.route('**/checkout-status.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ checkout: { enabled: true } })
  }));
  await page.route(CHECKOUT_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>Sociobot checkout fixture</title><h1>Hosted checkout</h1>'
  }));
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'Pay $29 once when checkout is available.' })).toBeVisible();
  await expect(page.getByText(/Unlimited removes the three-job limit/)).toBeVisible();
  await page.getByRole('button', { name: 'Check purchase or restore options' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('$29', { exact: true })).toBeVisible();
  await expect(dialog).toContainText('one-time purchase');
  await expect(dialog.getByRole('button', { name: 'Buy unlimited' })).toBeVisible();
  await Promise.all([
    page.waitForURL(CHECKOUT_URL),
    dialog.getByRole('button', { name: 'Buy unlimited' }).click()
  ]);
  await expect(page.getByRole('heading', { name: 'Hosted checkout' })).toBeVisible();
  await context.close();
});
