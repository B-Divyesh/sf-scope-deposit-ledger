import { describe, expect, it } from 'vitest';
import { backup, jobCsv, parseMoney, totals, validateAllocation, validateBackup } from '../src/core';
import type { Job } from '../src/types';
import { jobPdf } from '../src/pdf';

const job: Job = {
  id: 'j1', title: 'Kitchen refit', client: 'A. Client', reference: 'K-14', currency: 'USD',
  jurisdiction: 'California, sales tax excluded', deposit: 100000, receivedDate: '2026-08-01', notes: '',
  createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', allocations: [
    { id: 'a1', title: 'Materials', amount: 40000, status: 'held', dueDate: '', statusDate: '2026-08-01', note: '', createdAt: '', updatedAt: '' },
    { id: 'a2', title: 'Rough-in', amount: 25000, status: 'earned', dueDate: '', statusDate: '2026-08-05', note: '', createdAt: '', updatedAt: '' }
  ]
};

describe('ledger math', () => {
  it('keeps cents exact and reports every balance', () => {
    expect(totals(job)).toEqual({ held: 40000, earned: 25000, returned: 0, allocated: 65000, unallocated: 35000 });
    expect(parseMoney('$1,024.55')).toBe(102455);
  });
  it('prevents allocation beyond the deposit', () => {
    expect(validateAllocation(job, 35001)).toContain('more than');
    expect(validateAllocation(job, 35000)).toBeNull();
  });
});

describe('portable records', () => {
  it('quotes CSV values and states the accounting limitation', () => {
    const csv = jobCsv({ ...job, title: 'Kitchen, phase "A"' });
    expect(csv).toContain('"Kitchen, phase ""A"""');
    expect(csv).toContain('not an invoice');
  });
  it('creates a downloadable PDF document', () => {
    const bytes = new Uint8Array(jobPdf(job));
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toBe('%PDF-1.4');
    expect(bytes.byteLength).toBeGreaterThan(500);
  });
  it('accepts its own schema and rejects unknown versions', () => {
    expect(validateBackup(backup([job])).jobs).toHaveLength(1);
    expect(() => validateBackup({ schema: 2, jobs: [] })).toThrow('not supported');
  });
});
