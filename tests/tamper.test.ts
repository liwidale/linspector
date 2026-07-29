import { describe, expect, it } from 'vitest';
import { applyTamper, matchesPattern, mergeSessionHeaders } from '../src/tamper/rules';
import type { HttpMessage, TamperRule } from '../src/core/types';

const base: HttpMessage = {
  method: 'GET',
  url: 'https://api.example.com/users/1',
  headers: [['Authorization', 'Bearer old']],
  body: '{"role":"user"}',
};

const rule = (partial: Partial<TamperRule>): TamperRule => ({
  id: 'r',
  enabled: true,
  target: 'url',
  match: '',
  replace: '',
  regex: false,
  ...partial,
});

describe('tamper', () => {
  it('matches substring and regex patterns', () => {
    expect(matchesPattern('https://x/api/v1', '/api/')).toBe(true);
    expect(matchesPattern('https://x/admin', '/\\/admin$/')).toBe(true);
    expect(matchesPattern('https://x/home', '/api/')).toBe(false);
    expect(matchesPattern('https://x/home', '')).toBe(true);
  });

  it('substitutes in url, body and headers', () => {
    const url = applyTamper(base, [
      rule({ target: 'url', match: '/users/1', replace: '/users/2' }),
    ]);
    expect(url.url).toContain('/users/2');

    const body = applyTamper(base, [rule({ target: 'body', match: 'user', replace: 'admin' })]);
    expect(body.body).toBe('{"role":"admin"}');

    const header = applyTamper(base, [rule({ target: 'header', match: 'old', replace: 'new' })]);
    expect(header.headers[0][1]).toBe('Bearer new');
  });

  it('merges session headers replacing duplicates', () => {
    const merged = mergeSessionHeaders(base.headers, [['authorization', 'Bearer session']]);
    expect(merged).toHaveLength(1);
    expect(merged[0][1]).toBe('Bearer session');
  });

  it('ignores disabled rules', () => {
    const result = applyTamper(base, [
      rule({ enabled: false, target: 'url', match: 'users', replace: 'x' }),
    ]);
    expect(result.url).toBe(base.url);
  });
});
