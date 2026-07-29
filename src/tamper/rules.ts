import type { Header, HttpMessage, TamperRule } from '../core/types';

export const matchesPattern = (url: string, pattern: string): boolean => {
  if (!pattern.trim()) return true;
  if (pattern.length > 2 && pattern.startsWith('/') && pattern.endsWith('/')) {
    try {
      return new RegExp(pattern.slice(1, -1)).test(url);
    } catch {
      return false;
    }
  }
  return url.toLowerCase().includes(pattern.toLowerCase());
};

const substitute = (value: string, rule: TamperRule): string => {
  if (!rule.match) return value;
  if (rule.regex) {
    try {
      return value.replace(new RegExp(rule.match, 'g'), rule.replace);
    } catch {
      return value;
    }
  }
  return value.split(rule.match).join(rule.replace);
};

const applyToHeaders = (headers: Header[], rule: TamperRule): Header[] =>
  headers.map(([key, value]) => [key, substitute(value, rule)] as Header);

export const applyTamper = (message: HttpMessage, rules: TamperRule[]): HttpMessage => {
  let next = message;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.target === 'url') next = { ...next, url: substitute(next.url, rule) };
    else if (rule.target === 'body' && next.body != null)
      next = { ...next, body: substitute(next.body, rule) };
    else if (rule.target === 'header')
      next = { ...next, headers: applyToHeaders(next.headers, rule) };
  }
  return next;
};

export const mergeSessionHeaders = (headers: Header[], session: Header[] | null): Header[] => {
  if (!session || session.length === 0) return headers;
  const lower = new Set(session.map(([key]) => key.toLowerCase()));
  const kept = headers.filter(([key]) => !lower.has(key.toLowerCase()));
  return [...kept, ...session];
};
