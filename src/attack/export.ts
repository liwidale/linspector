import type { HttpMessage, NetworkRecord } from '../core/types';

export const recordToHttp = (record: NetworkRecord): HttpMessage => ({
  method: record.method,
  url: record.url,
  headers: record.requestHeaders,
  body: record.requestBody,
});

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

export const toCurl = (message: HttpMessage, proxy?: string): string => {
  const lines = [`curl -X ${message.method} ${shellQuote(message.url)}`];
  for (const [key, value] of message.headers) {
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
  }
  if (message.body) lines.push(`  --data-raw ${shellQuote(message.body)}`);
  if (proxy) lines.push(`  -x ${shellQuote(proxy)} -k`);
  return lines.join(' \\\n');
};

export const toPython = (message: HttpMessage): string => {
  const headers = message.headers.map(
    ([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)},`,
  );
  const parts = [
    'import requests',
    '',
    `url = ${JSON.stringify(message.url)}`,
    'headers = {',
    ...headers,
    '}',
  ];
  if (message.body) parts.push(`data = ${JSON.stringify(message.body)}`);
  const dataArg = message.body ? ', data=data' : '';
  parts.push(
    `response = requests.request(${JSON.stringify(message.method)}, url, headers=headers${dataArg})`,
    'print(response.status_code)',
    'print(response.text)',
  );
  return parts.join('\n');
};

export const toBurp = (message: HttpMessage): string => {
  let path = message.url;
  let host = '';
  try {
    const parsed = new URL(message.url);
    path = `${parsed.pathname}${parsed.search}` || '/';
    host = parsed.host;
  } catch {
    path = message.url;
  }
  const lines = [`${message.method} ${path} HTTP/1.1`];
  if (host && !message.headers.some(([key]) => key.toLowerCase() === 'host')) {
    lines.push(`Host: ${host}`);
  }
  for (const [key, value] of message.headers) lines.push(`${key}: ${value}`);
  lines.push('');
  lines.push(message.body ?? '');
  return lines.join('\r\n');
};
