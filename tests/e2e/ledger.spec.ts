import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test('works offline after first load and has no serious accessibility violations', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await context.setOffline(true);
  await expect(page.getByText(/Offline · changes still save/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Show exactly what the deposit covers.' })).toBeVisible();
});

test('privacy and terms are available as direct static routes', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy stays on your device.');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A record aid, not an accountant.');
});
