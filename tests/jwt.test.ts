import { describe, expect, it } from 'vitest';
import { auditJwt, decodeJwt, looksLikeJwt } from '../src/security/jwt';

const encode = (value: object): string =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('jwt', () => {
  it('detects jwt shaped strings', () => {
    expect(looksLikeJwt('aaaaaa.bbbbbb.cccccc')).toBe(true);
    expect(looksLikeJwt('not-a-token')).toBe(false);
  });

  it('decodes header and payload', () => {
    const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1', name: 'a' })}.sig`;
    const parts = decodeJwt(token);
    expect(parts?.header.alg).toBe('HS256');
    expect(parts?.payload.sub).toBe('1');
  });

  it('warns about alg none and missing exp', () => {
    const token = `${encode({ alg: 'none' })}.${encode({ sub: '1' })}.`;
    const audit = auditJwt(token);
    expect(audit.warnings.some((warning) => warning.includes('none'))).toBe(true);
    expect(audit.warnings.some((warning) => warning.includes('exp'))).toBe(true);
  });

  it('warns about expired tokens', () => {
    const token = `${encode({ alg: 'HS256' })}.${encode({ exp: 1 })}.sig`;
    const audit = auditJwt(token);
    expect(audit.warnings.some((warning) => warning.includes('expired'))).toBe(true);
  });
});
