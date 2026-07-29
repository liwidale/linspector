import { describe, expect, it } from 'vitest';
import { detectStackTrace, scanSecrets } from '../src/security/secrets';

describe('secret scanner', () => {
  it('finds an AWS access key', () => {
    const matches = scanSecrets('key=AKIAIOSFODNN7EXAMPLE end');
    expect(matches.some((match) => match.name === 'AWS Access Key')).toBe(true);
  });

  it('finds a Google API key', () => {
    const matches = scanSecrets('url?key=AIzaSyA1234567890abcdefghijklmnopqrstuv');
    expect(matches.some((match) => match.name === 'Google API Key')).toBe(true);
  });

  it('returns nothing for clean text', () => {
    expect(scanSecrets('hello world, nothing to see')).toEqual([]);
  });

  it('detects python and node stack traces', () => {
    expect(detectStackTrace('Traceback (most recent call last): ...')).not.toBeNull();
    expect(detectStackTrace('at handler (/app/server.js:42:13)')).not.toBeNull();
    expect(detectStackTrace('all good')).toBeNull();
  });
});
