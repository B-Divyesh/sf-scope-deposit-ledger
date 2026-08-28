import './styles.css';
import { allocationStatusHistory, backup, CURRENCIES, jobCsv, makeAllocation, money, parseMoney, totals, transitionAllocation, validateAllocation, validateBackup } from './core';
import { getJobs, removeJob, replaceJobs, saveJob } from './db';
import { jobPdf } from './pdf';
import type { AllocationStatus, Job } from './types';

const SLUG = 'scope-deposit-ledger';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const BILLING = 'https://api.sociobot.in/api/v1';
const CHECKOUT_URL = `${BILLING}/products/${SLUG}/checkout`;
const CHECKOUT_STATUS_URL = '/checkout-status.json';
const FREE_JOB_LIMIT = 3;
declare const __RELEASE_VERSION__: string;

const app = document.querySelector<HTMLElement>('#ledger-app')!;
const dialog = document.querySelector<HTMLDialogElement>('#app-dialog')!;
const dialogContent = document.querySelector<HTMLElement>('#dialog-content')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const importFile = document.querySelector<HTMLInputElement>('#import-file')!;
let jobs: Job[] = [];
let selectedId = '';
let paid = false;
let licenseNotice = '';
let toastTimer = 0;

const esc = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]!);
const today = () => new Date().toISOString().slice(0, 10);
const selected = () => jobs.find((job) => job.id === selectedId);
const filename = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'deposit-trail';

function say(message: string) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function download(contents: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openModal(markup: string) {
  dialogContent.innerHTML = markup;
  dialog.showModal();
}

function closeModal() { dialog.close(); dialogContent.replaceChildren(); }

function jobForm(job?: Job) {
  const currencies = CURRENCIES.map((code) => `<option ${job?.currency === code ? 'selected' : ''}>${code}</option>`).join('');
  openModal(`<form method="dialog" data-form="job" data-id="${esc(job?.id || '')}">
    <div class="dialog-head"><div><p class="eyebrow">${job ? 'Update record' : 'New held deposit'}</p><h2 id="dialog-title">${job ? 'Edit job details' : 'Record a deposit'}</h2></div><button class="icon-button" value="cancel" aria-label="Close dialog" type="button" data-action="close">×</button></div>
    <div class="form-grid">
      <label class="wide">Job or scope name <span aria-hidden="true">*</span><input name="title" required maxlength="80" value="${esc(job?.title)}" autocomplete="off" /></label>
      <label>Client name <span aria-hidden="true">*</span><input name="client" required maxlength="80" value="${esc(job?.client)}" autocomplete="organization" /></label>
      <label>Reference <input name="reference" maxlength="40" value="${esc(job?.reference)}" placeholder="e.g. KITCHEN-04" /></label>
      <label>Deposit amount <span aria-hidden="true">*</span><input name="deposit" required inputmode="decimal" value="${job ? (job.deposit / 100).toFixed(2) : ''}" placeholder="0.00" /></label>
      <label>Currency <select name="currency">${currencies}</select></label>
      <label>Received on <span aria-hidden="true">*</span><input name="receivedDate" type="date" required value="${esc(job?.receivedDate || today())}" /></label>
      <label class="wide">Tax jurisdiction / assumptions <input name="jurisdiction" maxlength="140" value="${esc(job?.jurisdiction)}" placeholder="e.g. Ontario · tax excluded from this trail" /><small>Shown on exports. This tool does not calculate tax.</small></label>
      <label class="wide">Scope note <textarea name="notes" rows="3" maxlength="500">${esc(job?.notes)}</textarea></label>
    </div>
    <p class="form-error" role="alert"></p>
    <div class="dialog-actions"><button class="quiet-button" type="button" data-action="close">Cancel</button><button class="button" type="submit">${job ? 'Save changes' : 'Create ledger'}</button></div>
  </form>`);
}

function allocationForm(job: Job, allocationId?: string) {
  const allocation = job.allocations.find((item) => item.id === allocationId);
  const available = totals(job).unallocated + (allocation?.amount || 0);
  openModal(`<form method="dialog" data-form="allocation" data-id="${esc(allocation?.id || '')}">
    <div class="dialog-head"><div><p class="eyebrow">${esc(job.title)}</p><h2 id="dialog-title">${allocation ? 'Edit allocation' : 'Allocate held money'}</h2></div><button class="icon-button" type="button" data-action="close" aria-label="Close dialog">×</button></div>
    <p class="available-line">Available to allocate <strong>${money(available, job.currency)}</strong></p>
    <div class="form-grid">
      <label class="wide">Milestone or scope item <span aria-hidden="true">*</span><input name="title" required maxlength="100" value="${esc(allocation?.title)}" placeholder="e.g. Materials ordered" /></label>
      <label>Amount <span aria-hidden="true">*</span><input name="amount" required inputmode="decimal" value="${allocation ? (allocation.amount / 100).toFixed(2) : ''}" placeholder="0.00" /></label>
      <label>Expected / due date <input name="dueDate" type="date" value="${esc(allocation?.dueDate)}" /></label>
      <label class="wide">Client-readable note <textarea name="note" rows="3" maxlength="300" placeholder="What must happen before this becomes billable?">${esc(allocation?.note)}</textarea></label>
    </div>
    <p class="form-error" role="alert"></p>
    <div class="dialog-actions"><button class="quiet-button" type="button" data-action="close">Cancel</button><button class="button" type="submit">${allocation ? 'Save allocation' : 'Add to trail'}</button></div>
  </form>`);
}

type CheckoutState = 'checking' | 'available' | 'unavailable' | 'unreachable';

function checkoutMarkup(state: CheckoutState) {
  if (state === 'available') return `<p class="price"><strong>$29</strong> one-time purchase</p>
    <p>The free ledger includes three jobs, complete CSV/PDF exports, backup and offline use. Unlock removes the job limit on this device.</p>
    <button class="button full" data-action="checkout" type="button">Buy unlimited</button>
    <p class="merchant-note">Secure checkout and refunds are handled by Sociobot/Dodo, the merchant of record. A refunded license is revoked.</p>`;
  if (state === 'unavailable') return `<p class="checkout-message" role="status">Unlimited purchases are temporarily unavailable. Your three free ledgers, local records, exports, backup, and offline use remain available. Existing licenses can still be restored below.</p>`;
  if (state === 'unreachable') return `<p class="checkout-message" role="status">Secure checkout cannot be reached right now. Try again when you are online; your local records are unchanged.</p><button class="quiet-button full" data-action="retry-checkout" type="button">Check checkout again</button>`;
  return `<p class="checkout-message" role="status">Checking whether secure checkout is available…</p>`;
}

async function getCheckoutState(): Promise<Exclude<CheckoutState, 'checking'>> {
  try {
    // This same-origin release setting is updated only after the factory has
    // registered the hosted checkout. Probing a known 404 directly creates a
    // browser console error even when the response is handled.
    const response = await fetch(CHECKOUT_STATUS_URL, { cache: 'no-store' });
    if (!response.ok) return 'unreachable';
    const status = await response.json() as { checkout?: { enabled?: boolean } };
    return status.checkout?.enabled === true ? 'available' : 'unavailable';
  } catch {
    return 'unreachable';
  }
}

async function refreshCheckoutState() {
  const state = await getCheckoutState();
  const region = dialog.querySelector<HTMLElement>('[data-checkout-state]');
  if (region) region.innerHTML = checkoutMarkup(state);
  return state;
}

async function startCheckout() {
  const region = dialog.querySelector<HTMLElement>('[data-checkout-state]');
  if (region) region.innerHTML = checkoutMarkup('checking');
  if (await refreshCheckoutState() === 'available') location.assign(CHECKOUT_URL);
}

function licenseModal() {
  const token = localStorage.getItem(LICENSE_KEY) || '';
  openModal(`<section class="license-panel">
    <div class="dialog-head"><div><p class="eyebrow">A durable tool, once</p><h2 id="dialog-title">Unlock unlimited jobs</h2></div><button class="icon-button" type="button" data-action="close" aria-label="Close dialog">×</button></div>
    <div data-checkout-state>${checkoutMarkup('checking')}</div>
    <hr />
    <form data-form="license"><label>Have a license? Paste it here<input name="license" autocomplete="off" value="${esc(token)}" /></label><p class="form-error" role="alert"></p><button class="quiet-button full" type="submit">Verify and restore</button></form>
    <p class="legal-inline"><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
  </section>`);
  void refreshCheckoutState();
}

function summaryMarkup(job: Job) {
  const t = totals(job);
  const progress = job.deposit ? Math.min(100, Math.round((t.allocated / job.deposit) * 100)) : 0;
  return `<section class="job-sheet">
    <header class="job-heading">
      <div><p class="eyebrow">${esc(job.client)}${job.reference ? ` · ${esc(job.reference)}` : ''}</p><h2>${esc(job.title)}</h2><p>Deposit received ${new Date(`${job.receivedDate}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p></div>
      <div class="job-menu"><button class="quiet-button" data-action="edit-job" type="button">Edit job</button><button class="icon-button danger" data-action="delete-job" type="button" aria-label="Delete ${esc(job.title)}">×</button></div>
    </header>
    <div class="amount-overview">
      <div class="deposit-figure"><span>Original deposit</span><strong>${money(job.deposit, job.currency)}</strong><small>${esc(job.currency)}</small></div>
      <div class="balance-strip">
        <div><span><i class="dot held"></i>Still held</span><strong>${money(t.held, job.currency)}</strong></div>
        <div><span><i class="dot earned"></i>Earned</span><strong>${money(t.earned, job.currency)}</strong></div>
        <div><span><i class="dot returned"></i>Returned</span><strong>${money(t.returned, job.currency)}</strong></div>
        <div><span><i class="dot open"></i>Unallocated</span><strong>${money(t.unallocated, job.currency)}</strong></div>
      </div>
      <div class="progress-label"><span>${progress}% assigned to scope</span><span>${money(t.allocated, job.currency)} of ${money(job.deposit, job.currency)}</span></div><progress class="progress" value="${progress}" max="100" aria-label="${progress}% of the deposit assigned to scope">${progress}%</progress>
    </div>
    <section class="trail" aria-labelledby="trail-title">
      <div class="section-head"><div><p class="eyebrow">Held → earned → returned</p><h3 id="trail-title">Allocation trail</h3></div><button class="button" data-action="new-allocation" type="button" ${t.unallocated <= 0 ? 'disabled title="The full deposit is allocated"' : ''}>Allocate scope</button></div>
      ${job.allocations.length ? `<ol class="allocation-list">${job.allocations.map((a) => allocationMarkup(job, a)).join('')}</ol>` : `<div class="inline-empty"><span aria-hidden="true">↳</span><div><strong>No scope allocated yet</strong><p>Break the deposit into the milestones or work it is held against.</p></div><button class="quiet-button" data-action="new-allocation" type="button">Add first item</button></div>`}
    </section>
    <section class="record-notes" aria-label="Record notes"><div><span>Tax assumption</span><p>${esc(job.jurisdiction || 'Not specified. Add a jurisdiction or tax assumption before sharing.')}</p></div>${job.notes ? `<div><span>Scope note</span><p>${esc(job.notes)}</p></div>` : ''}</section>
    <div class="export-row"><div><p class="eyebrow">Client-ready trail</p><p>Exports state the tax assumption and accounting limitation.</p></div><div><button class="quiet-button" data-action="export-csv" type="button">Export CSV</button><button class="quiet-button" data-action="export-pdf" type="button">Export PDF</button></div></div>
  </section>`;
}

function allocationMarkup(job: Job, allocation: Job['allocations'][number]) {
  return `<li class="allocation-row"><span class="trail-node ${allocation.status}" aria-hidden="true"></span>
    <div class="allocation-main"><div><strong>${esc(allocation.title)}</strong><span class="status-pill ${allocation.status}">${allocation.status}</span></div>${allocation.note ? `<p>${esc(allocation.note)}</p>` : ''}<small>${allocation.dueDate ? `Expected ${new Date(`${allocation.dueDate}T12:00:00`).toLocaleDateString()}` : 'No expected date'} · Current status ${new Date(`${allocation.statusDate}T12:00:00`).toLocaleDateString()} · ${allocationStatusHistory(allocation).map((event) => `${event.status} ${event.date}`).join(' → ')}</small></div>
    <strong class="allocation-amount">${money(allocation.amount, job.currency)}</strong>
    <label class="status-select"><span class="sr-only">Status for ${esc(allocation.title)}</span><select data-action="status" data-id="${allocation.id}"><option value="held" ${allocation.status === 'held' ? 'selected' : ''}>Held</option><option value="earned" ${allocation.status === 'earned' ? 'selected' : ''}>Earned / billable</option><option value="returned" ${allocation.status === 'returned' ? 'selected' : ''}>Returned</option></select></label>
    <div class="row-actions"><button class="icon-button" data-action="edit-allocation" data-id="${allocation.id}" type="button" aria-label="Edit ${esc(allocation.title)}">✎</button><button class="icon-button danger" data-action="delete-allocation" data-id="${allocation.id}" type="button" aria-label="Delete ${esc(allocation.title)}">×</button></div>
  </li>`;
}

function render() {
  if (jobs.length && !selected()) selectedId = jobs[0].id;
  const current = selected();
  app.innerHTML = `${licenseNotice ? `<p class="license-notice" role="status">${esc(licenseNotice)} <button class="link-button" data-action="license" type="button">Review license options</button></p>` : ''}<aside class="job-index" aria-label="Jobs">
    <div class="index-head"><div><p class="eyebrow">Your ledger</p><h2>${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}</h2></div><button class="icon-button" data-action="new-job" aria-label="Add job" type="button">+</button></div>
    ${jobs.length ? `<nav aria-label="Choose a job"><ul>${jobs.map((job) => { const t = totals(job); return `<li><button class="job-tab ${job.id === selectedId ? 'active' : ''}" data-action="select-job" data-id="${job.id}" type="button"><span>${esc(job.title)}</span><small>${esc(job.client)}</small><strong>${money(t.held + t.unallocated, job.currency)} held</strong></button></li>`; }).join('')}</ul></nav>` : `<div class="index-empty"><span aria-hidden="true">01</span><p>Your first deposit starts here.</p></div>`}
    <div class="data-tools"><button class="link-button" data-action="backup" type="button">Back up all</button><button class="link-button" data-action="import" type="button">Restore</button></div>
    <button class="unlock-card ${paid ? 'is-paid' : ''}" data-action="license" type="button"><span>${paid ? 'Unlimited unlocked' : 'Free · 3 jobs'}</span><small>${paid ? 'License active on this device' : 'Check Unlimited availability →'}</small></button>
  </aside>
  ${current ? summaryMarkup(current) : `<section class="empty-ledger"><div class="empty-number">01</div><p class="eyebrow">Begin with the agreement</p><h2>Give held money a named place.</h2><p>Record the deposit, split it across agreed work, then share a balance trail your client can read without an accounting login.</p><button class="button" data-action="new-job" type="button">Record your first deposit</button><ul><li>Private on this device</li><li>PDF and CSV included</li><li>Works without a connection</li></ul></section>`}`;
}

async function mutate(job: Job, message: string) {
  job.updatedAt = new Date().toISOString();
  await saveJob(job); jobs = await getJobs(); selectedId = job.id; render(); say(message);
}

async function submitJob(form: HTMLFormElement) {
  const data = new FormData(form); const id = form.dataset.id;
  const deposit = parseMoney(String(data.get('deposit')));
  const error = form.querySelector<HTMLElement>('.form-error')!;
  const title = String(data.get('title')).trim();
  const client = String(data.get('client')).trim();
  if (!title) { error.textContent = 'Enter a job or scope name.'; return; }
  if (!client) { error.textContent = 'Enter a client name.'; return; }
  if (!Number.isInteger(deposit) || deposit <= 0) { error.textContent = 'Enter a deposit amount greater than zero using up to two decimal places.'; return; }
  const existing = jobs.find((job) => job.id === id);
  if (existing && totals(existing).allocated > deposit) { error.textContent = `The new deposit cannot be lower than ${money(totals(existing).allocated, existing.currency)} already allocated.`; return; }
  const now = new Date().toISOString();
  const job: Job = { id: existing?.id || crypto.randomUUID(), title, client, reference: String(data.get('reference')).trim(), deposit, currency: String(data.get('currency')), receivedDate: String(data.get('receivedDate')), jurisdiction: String(data.get('jurisdiction')).trim(), notes: String(data.get('notes')).trim(), allocations: existing?.allocations || [], createdAt: existing?.createdAt || now, updatedAt: now };
  try { await mutate(job, existing ? 'Job details saved.' : 'Deposit ledger created.'); closeModal(); } catch (err) { error.textContent = err instanceof Error ? err.message : 'The job could not be saved.'; }
}

async function submitAllocation(form: HTMLFormElement) {
  const job = selected(); if (!job) return;
  const data = new FormData(form); const id = form.dataset.id;
  const amount = parseMoney(String(data.get('amount'))); const error = form.querySelector<HTMLElement>('.form-error')!;
  const title = String(data.get('title')).trim();
  if (!title) { error.textContent = 'Enter a milestone or scope item.'; return; }
  const validation = validateAllocation(job, amount, id); if (validation) { error.textContent = validation; return; }
  const existing = job.allocations.find((a) => a.id === id);
  const allocation = existing ? { ...existing, title, amount, dueDate: String(data.get('dueDate')), note: String(data.get('note')).trim(), updatedAt: new Date().toISOString() } : makeAllocation({ title, amount, dueDate: String(data.get('dueDate')), note: String(data.get('note')).trim() });
  job.allocations = existing ? job.allocations.map((a) => a.id === id ? allocation : a) : [...job.allocations, allocation];
  try { await mutate(job, existing ? 'Allocation updated.' : 'Scope allocated.'); closeModal(); } catch (err) { error.textContent = err instanceof Error ? err.message : 'The allocation could not be saved.'; }
}

async function verifyLicense(token: string, showResult = false) {
  const error = dialog.querySelector<HTMLElement>('.form-error');
  try {
    const response = await fetch(`${BILLING}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('The license service is unavailable. Try again when you are online.');
    const result = await response.json() as { valid: boolean; reason: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
    paid = result.valid;
    licenseNotice = result.valid ? '' : 'Your Unlimited license is no longer active. Your local records and exports are unchanged.';
    localStorage.setItem(LICENSE_KEY, token);
    render();
    if (!result.valid) {
      if (showResult && error) error.textContent = 'This license is not active for Scope Deposit Ledger.';
      return;
    }
    if (showResult) { closeModal(); say('Unlimited jobs restored.'); }
  } catch (err) {
    if (showResult && error) error.textContent = err instanceof Error ? err.message : 'The license could not be verified.';
  }
}

async function initLicense() {
  const params = new URLSearchParams(location.search); const returned = params.get('license');
  if (returned) { localStorage.setItem(LICENSE_KEY, returned); history.replaceState({}, '', location.pathname + location.hash); }
  const token = returned || localStorage.getItem(LICENSE_KEY); if (!token) return;
  try { const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as { valid?: boolean; checkedAt?: number }; paid = cached.valid === true; if (!cached.checkedAt || Date.now() - cached.checkedAt > 86400000 || returned) void verifyLicense(token, Boolean(returned)); } catch { /* ignore damaged cache */ }
}

document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]'); if (!button) return;
  const action = button.dataset.action; const job = selected();
  if (action === 'new-job') { if (!paid && jobs.length >= FREE_JOB_LIMIT) licenseModal(); else jobForm(); }
  if (action === 'close') closeModal();
  if (action === 'select-job') { selectedId = button.dataset.id || ''; render(); }
  if (action === 'edit-job' && job) jobForm(job);
  if (action === 'new-allocation' && job) allocationForm(job);
  if (action === 'edit-allocation' && job) allocationForm(job, button.dataset.id);
  if (action === 'delete-allocation' && job) { const item = job.allocations.find((a) => a.id === button.dataset.id); if (item && confirm(`Delete “${item.title}” from this deposit trail?`)) { job.allocations = job.allocations.filter((a) => a.id !== item.id); await mutate(job, 'Allocation deleted.'); } }
  if (action === 'delete-job' && job && confirm(`Delete “${job.title}” and its complete allocation trail? This cannot be undone.`)) { await removeJob(job.id); jobs = await getJobs(); selectedId = jobs[0]?.id || ''; render(); say('Job deleted.'); }
  if (action === 'export-csv' && job) { download(jobCsv(job), `${filename(job.title)}-deposit-trail.csv`, 'text/csv;charset=utf-8'); say('CSV exported.'); }
  if (action === 'export-pdf' && job) { download(jobPdf(job), `${filename(job.title)}-deposit-trail.pdf`, 'application/pdf'); say('PDF exported.'); }
  if (action === 'backup') { download(JSON.stringify(backup(jobs), null, 2), `scope-ledger-backup-${today()}.json`, 'application/json'); say('Backup downloaded.'); }
  if (action === 'import') importFile.click();
  if (action === 'license') licenseModal();
  if (action === 'retry-checkout') void refreshCheckoutState();
  if (action === 'checkout') { event.preventDefault(); await startCheckout(); }
  if (action === 'storage-retry') location.reload();
});

document.addEventListener('change', async (event) => {
  const select = (event.target as HTMLElement).closest<HTMLSelectElement>('select[data-action="status"]'); if (!select) return;
  const job = selected(); const allocation = job?.allocations.find((a) => a.id === select.dataset.id); if (!job || !allocation) return;
  const changed = transitionAllocation(allocation, select.value as AllocationStatus, today());
  job.allocations = job.allocations.map((item) => item.id === allocation.id ? changed : item);
  await mutate(job, `Marked “${changed.title}” ${changed.status}.`);
});

document.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement; if (!form.dataset.form) return; event.preventDefault();
  if (form.dataset.form === 'job') await submitJob(form);
  if (form.dataset.form === 'allocation') await submitAllocation(form);
  if (form.dataset.form === 'license') { const token = String(new FormData(form).get('license')).trim(); if (!token) form.querySelector<HTMLElement>('.form-error')!.textContent = 'Paste your license token first.'; else { localStorage.setItem(LICENSE_KEY, token); await verifyLicense(token, true); } }
});

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0]; if (!file) return;
  try { const data = validateBackup(JSON.parse(await file.text())); if (!confirm(`Replace this device’s ledger with ${data.jobs.length} job${data.jobs.length === 1 ? '' : 's'} from the backup?`)) return; await replaceJobs(data.jobs); jobs = await getJobs(); selectedId = jobs[0]?.id || ''; render(); say('Backup restored.'); }
  catch (err) { say(err instanceof Error ? err.message : 'That backup could not be read.'); }
  finally { importFile.value = ''; }
});

const network = document.querySelector<HTMLElement>('#network-state')!;
function networkState() { network.innerHTML = navigator.onLine ? '<span aria-hidden="true">●</span> On-device' : '<span aria-hidden="true">●</span> Offline · changes still save'; network.classList.toggle('offline', !navigator.onLine); }
addEventListener('online', networkState); addEventListener('offline', networkState); networkState();

const themeButton = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
function setTheme(theme: string) { document.documentElement.dataset.theme = theme; themeButton.textContent = theme === 'night' ? 'Day' : 'Night'; localStorage.setItem('scope-ledger-theme', theme); }
themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'night' ? 'day' : 'night'));
setTheme(localStorage.getItem('scope-ledger-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'));

if ('serviceWorker' in navigator) navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(__RELEASE_VERSION__)}`).then((registration) => {
  registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) { say('A fresh version is ready. Reload to update.'); } }); });
}).catch(() => { /* app remains usable without install support */ });

async function start() {
  try { await initLicense(); jobs = await getJobs(); selectedId = jobs[0]?.id || ''; render(); }
  catch (err) { app.innerHTML = `<section class="storage-error" role="alert"><p class="eyebrow">Storage unavailable</p><h2>Your ledger could not open.</h2><p>${esc(err instanceof Error ? err.message : 'Check this browser’s site-storage settings and reload.')}</p><button class="button" data-action="storage-retry" type="button">Try again</button></section>`; }
}
void start();
