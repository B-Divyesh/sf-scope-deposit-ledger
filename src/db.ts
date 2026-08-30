import { allocationStatusHistory, money, totals } from './core';
import type { Job } from './types';

const DB_NAME = 'scope-deposit-ledger';
const STORE = 'jobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not open on-device storage. Your browser may be blocking it.'));
  });
}

async function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = work(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('The ledger could not be saved on this device.'));
    tx.oncomplete = () => db.close();
  });
}

function normaliseJob(job: Job): Job {
  return {
    ...job,
    revision: Number.isSafeInteger(job.revision) && (job.revision || 0) >= 0 ? job.revision : 0,
    allocations: job.allocations.map((allocation) => ({
      ...allocation,
      statusHistory: allocationStatusHistory(allocation)
    }))
  };
}

export async function getJobs(): Promise<Job[]> {
  const jobs = await transact<Job[]>('readonly', (store) => store.getAll());
  return jobs.map(normaliseJob).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export type JobDetails = Pick<Job, 'title' | 'client' | 'reference' | 'currency' | 'jurisdiction' | 'deposit' | 'receivedDate' | 'notes'>;
export interface JobMutationResult {
  job: Job;
  conflicted: boolean;
}

export async function createJob(job: Job): Promise<Job> {
  const saved = normaliseJob({ ...job, revision: 1 });
  await transact<IDBValidKey>('readwrite', (store) => store.add(saved));
  return saved;
}

/**
 * Runs a record change inside one read/write transaction. The callback always
 * sees the latest stored job, never a tab's cached snapshot. This makes an
 * unrelated job-detail save preserve allocations and their status history.
 */
export async function mutateStoredJob(
  id: string,
  expectedRevision: number,
  change: (current: Job) => Job
): Promise<JobMutationResult> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    let result: JobMutationResult | undefined;
    let settled = false;
    const fail = (error: Error) => {
      if (!settled) {
        settled = true;
        db.close();
        reject(error);
      }
    };

    transaction.oncomplete = () => {
      db.close();
      if (result && !settled) {
        settled = true;
        resolve(result);
      } else if (!settled) fail(new Error('The ledger could not be saved on this device.'));
    };
    transaction.onerror = () => fail(new Error('The ledger could not be saved on this device.'));
    transaction.onabort = () => fail(new Error('The ledger could not be saved on this device.'));

    const read = store.get(id);
    read.onerror = () => fail(new Error('The ledger could not be saved on this device.'));
    read.onsuccess = () => {
      if (!read.result) {
        transaction.abort();
        fail(new Error('This job no longer exists. Reload to view the latest ledger.'));
        return;
      }
      const current = normaliseJob(read.result as Job);
      let changed: Job;
      try {
        changed = change(current);
      } catch (error) {
        transaction.abort();
        fail(error instanceof Error ? error : new Error('The ledger could not be saved on this device.'));
        return;
      }
      const job = normaliseJob({
        ...changed,
        id: current.id,
        createdAt: current.createdAt,
        revision: (current.revision || 0) + 1,
        updatedAt: new Date().toISOString()
      });
      const write = store.put(job);
      write.onerror = () => fail(new Error('The ledger could not be saved on this device.'));
      result = { job, conflicted: expectedRevision !== (current.revision || 0) };
    };
  });
}

export function updateJobDetails(id: string, expectedRevision: number, details: JobDetails): Promise<JobMutationResult> {
  return mutateStoredJob(id, expectedRevision, (current) => {
    const allocated = totals(current).allocated;
    if (allocated > details.deposit) {
      throw new Error(`The new deposit cannot be lower than ${money(allocated, details.currency)} already allocated.`);
    }
    return { ...current, ...details, allocations: current.allocations };
  });
}

export const removeJob = (id: string) => transact<undefined>('readwrite', (store) => store.delete(id));

export async function replaceJobs(jobs: Job[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    jobs.forEach((job) => store.put(normaliseJob(job)));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(new Error('The backup could not be restored.')); };
    tx.onabort = () => { db.close(); reject(new Error('The backup could not be restored.')); };
  });
}
