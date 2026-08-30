import type { Allocation, AppBackup, Job, AllocationStatus, StatusEvent } from './types';

export const CURRENCIES = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'INR'] as const;

export function parseMoney(value: string): number {
  // Money is entered by people, not calculated from free-form text. Never
  // "clean" an invalid value: doing so can turn 1e2 into 12 without notice.
  const symbols = new Intl.NumberFormat().formatToParts(1234567.89);
  const decimal = symbols.find((part) => part.type === 'decimal')?.value || '.';
  const group = (symbols.find((part) => part.type === 'group')?.value || ',').replaceAll('\u00a0', ' ').replaceAll('\u202f', ' ');
  let input = value.trim().replaceAll('\u00a0', ' ').replaceAll('\u202f', ' ');
  if (!input) return Number.NaN;

  // Permit a conventional currency symbol or one of this product's currency
  // codes only at an edge. Anything else is invalid rather than discarded.
  input = input.replace(/^(?:[\p{Sc}]|USD|CAD|GBP|EUR|AUD|NZD|INR)\s*/u, '');
  input = input.replace(/\s*(?:[\p{Sc}]|USD|CAD|GBP|EUR|AUD|NZD|INR)$/u, '');
  if (!input) return Number.NaN;

  const escapedGroup = group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedDecimal = decimal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const integer = `(?:\\d+|\\d{1,3}(?:${escapedGroup}\\d{3})+)`;
  const match = input.match(new RegExp(`^(-?)(${integer})(?:${escapedDecimal}(\\d{1,2}))?$`));
  if (!match) return Number.NaN;

  const whole = match[2].split(group).join('');
  const fraction = (match[3] || '').padEnd(2, '0');
  const cents = Number(whole) * 100 + Number(fraction || '0');
  return Number.isSafeInteger(cents) ? (match[1] ? -cents : cents) : Number.NaN;
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

/** Returns a complete trail, including a compatible one-event trail for old records. */
export function allocationStatusHistory(allocation: Allocation): StatusEvent[] {
  const history = allocation.statusHistory;
  if (history?.length) return history;
  return [{ status: allocation.status, date: allocation.statusDate }];
}

export function transitionAllocation(allocation: Allocation, status: AllocationStatus, date: string): Allocation {
  const history = allocationStatusHistory(allocation);
  if (allocation.status === status) return { ...allocation, statusHistory: history };
  return {
    ...allocation,
    status,
    statusDate: date,
    statusHistory: [...history, { status, date }],
    updatedAt: new Date().toISOString()
  };
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
    [], ['Milestone', 'Amount', 'Status', 'Due date', 'Status date', 'Status history', 'Note']
  ];
  job.allocations.forEach((a) => rows.push([
    a.title, (a.amount / 100).toFixed(2), a.status, a.dueDate, a.statusDate,
    allocationStatusHistory(a).map((event) => `${event.status} (${event.date})`).join(' → '), a.note
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
  if (data.schema !== 1 || !Array.isArray(data.jobs) || !validTimestamp(data.exportedAt)) throw new Error('This backup version is not supported.');
  const jobIds = new Set<string>();
  for (const job of data.jobs) validateJob(job, jobIds);
  return data as AppBackup;
}

const validText = (value: unknown, required = false) => typeof value === 'string' && (!required || value.trim().length > 0);
const validInteger = (value: unknown, positive = false) => typeof value === 'number' && Number.isSafeInteger(value) && (!positive || value > 0);
function validDate(value: unknown, optional = false) {
  if (typeof value !== 'string') return false;
  if (optional && value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
const validTimestamp = (value: unknown) => typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));

function validateJob(job: unknown, jobIds: Set<string>) {
  if (!job || typeof job !== 'object') throw new Error('The backup contains an invalid job record.');
  const record = job as Partial<Job>;
  const id = record.id as string;
  const deposit = record.deposit as number;
  if (!validText(record.id, true) || jobIds.has(id) || !validText(record.title, true) || !validText(record.client, true)
    || !validText(record.reference) || !validInteger(record.deposit, true) || !CURRENCIES.includes(record.currency as typeof CURRENCIES[number])
    || !validDate(record.receivedDate) || !validText(record.jurisdiction) || !validText(record.notes) || !validTimestamp(record.createdAt)
    || !validTimestamp(record.updatedAt) || (record.revision !== undefined && (!validInteger(record.revision) || record.revision < 0))
    || !Array.isArray(record.allocations)) throw new Error('The backup contains an invalid job record.');
  jobIds.add(id);
  const allocationIds = new Set<string>();
  let allocated = 0;
  for (const allocation of record.allocations) {
    if (!allocation || typeof allocation !== 'object') throw new Error('The backup contains an invalid allocation record.');
    const item = allocation as Partial<Allocation>;
    const allocationId = item.id as string;
    const amount = item.amount as number;
    if (!validText(item.id, true) || allocationIds.has(allocationId) || !validText(item.title, true) || !validInteger(item.amount, true)
      || !['held', 'earned', 'returned'].includes(item.status || '') || !validDate(item.dueDate, true) || !validDate(item.statusDate)
      || !validText(item.note) || !validTimestamp(item.createdAt) || !validTimestamp(item.updatedAt)) throw new Error('The backup contains an invalid allocation record.');
    if (item.statusHistory !== undefined) {
      if (!Array.isArray(item.statusHistory) || item.statusHistory.length === 0 || !item.statusHistory.every(validStatusEvent)) throw new Error('The backup contains an invalid allocation record.');
      const latest = item.statusHistory[item.statusHistory.length - 1];
      if (latest.status !== item.status || latest.date !== item.statusDate) throw new Error('The backup contains an invalid allocation record.');
    }
    allocationIds.add(allocationId);
    allocated += amount;
  }
  if (allocated > deposit) throw new Error('The backup allocates more than the recorded deposit.');
}

function validStatusEvent(value: unknown): value is StatusEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<StatusEvent>;
  return ['held', 'earned', 'returned'].includes(event.status || '') && validDate(event.date);
}

export function makeAllocation(input: Pick<Allocation, 'title' | 'amount' | 'dueDate' | 'note'>): Allocation {
  const now = new Date().toISOString();
  const statusDate = now.slice(0, 10);
  return { ...input, id: crypto.randomUUID(), status: 'held', statusDate, statusHistory: [{ status: 'held', date: statusDate }], createdAt: now, updatedAt: now };
}
