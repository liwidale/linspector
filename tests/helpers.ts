import type { NetworkRecord, RequestKind } from '../src/core/types';

let counter = 0;

export const makeRecord = (overrides: Partial<NetworkRecord> = {}): NetworkRecord => {
  counter += 1;
  return {
    id: `record-${counter}`,
    kind: 'fetch' as RequestKind,
    method: 'GET',
    url: 'https://api.example.com/users',
    host: 'api.example.com',
    status: 200,
    statusText: 'OK',
    ok: true,
    duration: 42,
    startedAt: Date.now(),
    requestHeaders: [],
    responseHeaders: [],
    requestBody: null,
    responseBody: '{"ok":true}',
    responseType: 'application/json',
    error: null,
    ...overrides,
  };
};
