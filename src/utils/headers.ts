import type { Header } from '../core/types';

export const parseHeaderBlock = (raw: string): Header[] => {
  const headers: Header[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf(':');
    if (index <= 0) continue;
    headers.push([trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim()]);
  }
  return headers;
};

export const stringifyHeaders = (headers: Header[]): string =>
  headers.map(([key, value]) => `${key}: ${value}`).join('\n');

export const parseRawHeaders = (raw: string): Header[] => {
  const headers: Header[] = [];
  for (const line of raw.trim().split(/\r?\n/)) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    headers.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
  }
  return headers;
};
