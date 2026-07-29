export interface StorageEntry {
  key: string;
  value: string;
}

export const readLocalStorage = (): StorageEntry[] => {
  const entries: StorageEntry[] = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key == null) continue;
      entries.push({ key, value: localStorage.getItem(key) ?? '' });
    }
  } catch {
    return entries;
  }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
};

export const writeLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    void 0;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    void 0;
  }
};

export const readCookies = (): StorageEntry[] => {
  if (!document.cookie) return [];
  return document.cookie
    .split('; ')
    .map((pair) => {
      const index = pair.indexOf('=');
      return index < 0
        ? { key: pair, value: '' }
        : { key: pair.slice(0, index), value: pair.slice(index + 1) };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
};
