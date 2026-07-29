const KEY = 'linspector.state.v1';

export const load = <T>(fallback: T): T => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const save = (value: unknown): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    void 0;
  }
};

export const clear = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    void 0;
  }
};
