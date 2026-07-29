const backing = new Map<string, string>();

const storage: Storage = {
  get length() {
    return backing.size;
  },
  clear: () => backing.clear(),
  getItem: (key) => (backing.has(key) ? (backing.get(key) as string) : null),
  key: (index) => [...backing.keys()][index] ?? null,
  removeItem: (key) => void backing.delete(key),
  setItem: (key, value) => void backing.set(key, String(value)),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  writable: true,
  configurable: true,
});
