export type HistoryEntry = {
  id: string;
  text: string;
  kind: 'password' | 'passphrase';
  entropyBits: number;
  createdAt: number;
};

const MAX_ENTRIES = 20;

let entries: HistoryEntry[] = [];
let nextId = 1;

export function record(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
  const e: HistoryEntry = {
    ...entry,
    id: String(nextId++),
    createdAt: Date.now(),
  };
  entries = [e, ...entries].slice(0, MAX_ENTRIES);
  return e;
}

export function list(): ReadonlyArray<HistoryEntry> {
  return entries;
}

export function clear(): void {
  entries = [];
}

export function remove(id: string): void {
  entries = entries.filter((e) => e.id !== id);
}
