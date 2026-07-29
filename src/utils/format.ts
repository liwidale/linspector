export const formatDuration = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;

export const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour12: false });

export const prettyJson = (raw: string | null): string => {
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

export const shortUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    return path.length > 1 ? path : '/';
  } catch {
    return url;
  }
};
