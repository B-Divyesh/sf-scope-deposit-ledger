import type { Job } from './types';

/** A stable, realistic fixture used only in the separate demo database. */
export function sampleJobs(): Job[] {
  return [{
    id: 'demo-cedar-lane-kitchen',
    revision: 1,
    title: 'Cedar Lane kitchen refit',
    client: 'Maya Chen',
    reference: 'CL-204',
    currency: 'CAD',
    jurisdiction: 'Ontario · HST is outside this allocation trail',
    deposit: 425075,
    receivedDate: '2026-08-12',
    notes: 'Deposit held against the signed cabinet and installation scope dated 10 August 2026.',
    allocations: [
      {
        id: 'demo-materials',
        title: 'Cabinet materials and hardware',
        amount: 220000,
        status: 'held',
        dueDate: '2026-09-10',
        statusDate: '2026-08-12',
        statusHistory: [{ status: 'held', date: '2026-08-12' }],
        note: 'Released when the supplier confirms the final order.',
        createdAt: '2026-08-12T09:00:00.000Z',
        updatedAt: '2026-08-12T09:00:00.000Z'
      },
      {
        id: 'demo-site-preparation',
        title: 'Site preparation and first installation day',
        amount: 125000,
        status: 'earned',
        dueDate: '2026-08-27',
        statusDate: '2026-08-27',
        statusHistory: [
          { status: 'held', date: '2026-08-12' },
          { status: 'earned', date: '2026-08-27' }
        ],
        note: 'Billable after the old units are removed and the site is ready.',
        createdAt: '2026-08-12T09:05:00.000Z',
        updatedAt: '2026-08-27T16:30:00.000Z'
      },
      {
        id: 'demo-hardware-return',
        title: 'Changed hardware allowance',
        amount: 30000,
        status: 'returned',
        dueDate: '',
        statusDate: '2026-08-30',
        statusHistory: [
          { status: 'held', date: '2026-08-12' },
          { status: 'returned', date: '2026-08-30' }
        ],
        note: 'Returned after the client chose hardware supplied separately.',
        createdAt: '2026-08-12T09:10:00.000Z',
        updatedAt: '2026-08-30T11:00:00.000Z'
      }
    ],
    createdAt: '2026-08-12T09:00:00.000Z',
    updatedAt: '2026-08-30T11:00:00.000Z'
  }];
}
