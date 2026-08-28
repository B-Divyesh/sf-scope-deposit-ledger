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

export async function getJobs(): Promise<Job[]> {
  const jobs = await transact<Job[]>('readonly', (store) => store.getAll());
  return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const saveJob = (job: Job) => transact<IDBValidKey>('readwrite', (store) => store.put(job));
export const removeJob = (id: string) => transact<undefined>('readwrite', (store) => store.delete(id));

export async function replaceJobs(jobs: Job[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    jobs.forEach((job) => store.put(job));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(new Error('The backup could not be restored.'));
  });
}
