export type AllocationStatus = 'held' | 'earned' | 'returned';

export interface Allocation {
  id: string;
  title: string;
  amount: number;
  status: AllocationStatus;
  dueDate: string;
  statusDate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  reference: string;
  currency: string;
  jurisdiction: string;
  deposit: number;
  receivedDate: string;
  notes: string;
  allocations: Allocation[];
  createdAt: string;
  updatedAt: string;
}

export interface AppBackup {
  schema: 1;
  exportedAt: string;
  jobs: Job[];
}
