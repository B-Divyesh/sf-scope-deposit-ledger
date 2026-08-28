import type { Allocation, AppBackup, Job } from './types';

export const CURRENCIES = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'INR'] as const;

export function parseMoney(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (!cleaned || !Number.isFinite(Number(cleaned))) return Number.NaN;
  return Math.round(Number(cleaned) * 100);
}

export function money(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, minimumFractionDigits: 2
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

export function totals(job: Job) {
  const held = job.allocations.filter((a) => a.status === 'held').reduce((n, a) => n + a.amount, 0);
  const earned = job.allocations.filter((a) => a.status === 'earned').reduce((n, a) => n + a.amount, 0);
  const returned = job.allocations.filter((a) => a.status === 'returned').reduce((n, a) => n + a.amount, 0);
  const allocated = held + earned + returned;
  return { held, earned, returned, allocated, unallocated: job.deposit - allocated };
}

export function validateAllocation(job: Job, amount: number, editingId?: string): string | null {
  if (!Number.isInteger(amount) || amount <= 0) return 'Enter an amount greater than zero.';
  const other = job.allocations.filter((a) => a.id !== editingId).reduce((n, a) => n + a.amount, 0);
  if (other + amount > job.deposit) {
    return `This is more than the ${money(job.deposit - other, job.currency)} still available to allocate.`;
  }
  return null;
}

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function jobCsv(job: Job): string {
  const rows: Array<Array<string | number>> = [
    ['Scope deposit trail'],
    ['Job', job.title], ['Client', job.client], ['Reference', job.reference],
    ['Deposit received', job.receivedDate], ['Deposit amount', (job.deposit / 100).toFixed(2)],
    ['Currency', job.currency], ['Tax jurisdiction / assumption', job.jurisdiction || 'Not specified'],
    [], ['Milestone', 'Amount', 'Status', 'Due date', 'Status date', 'Note']
  ];
  job.allocations.forEach((a) => rows.push([
    a.title, (a.amount / 100).toFixed(2), a.status, a.dueDate, a.statusDate, a.note
  ]));
  const t = totals(job);
  rows.push([], ['Held balance', (t.held / 100).toFixed(2)], ['Earned', (t.earned / 100).toFixed(2)],
    ['Returned', (t.returned / 100).toFixed(2)], ['Unallocated', (t.unallocated / 100).toFixed(2)],
    [], ['Notice', 'This allocation trail is a factual project record, not an invoice, tax calculation, or accounting advice.']);
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function backup(jobs: Job[]): AppBackup {
  return { schema: 1, exportedAt: new Date().toISOString(), jobs };
}

export function validateBackup(value: unknown): AppBackup {
  if (!value || typeof value !== 'object') throw new Error('The selected file is not a ledger backup.');
  const data = value as Partial<AppBackup>;
  if (data.schema !== 1 || !Array.isArray(data.jobs)) throw new Error('This backup version is not supported.');
  for (const job of data.jobs) {
    if (!job || typeof job.id !== 'string' || typeof job.title !== 'string' || !Array.isArray(job.allocations)) {
      throw new Error('The backup contains an invalid job record.');
    }
  }
  return data as AppBackup;
}

export function makeAllocation(input: Pick<Allocation, 'title' | 'amount' | 'dueDate' | 'note'>): Allocation {
  const now = new Date().toISOString();
  return { ...input, id: crypto.randomUUID(), status: 'held', statusDate: now.slice(0, 10), createdAt: now, updatedAt: now };
}
