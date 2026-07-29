import { describe, expect, it } from 'vitest';
import { clampStatus, parseDomains } from '../src/store/settings';

describe('settings helpers', () => {
  it('parses domain lists from mixed separators', () => {
    expect(parseDomains('a.com, b.com\n  c.com \n\n')).toEqual(['a.com', 'b.com', 'c.com']);
    expect(parseDomains('')).toEqual([]);
  });

  it('clamps status codes to a valid range', () => {
    expect(clampStatus(-5)).toBe(0);
    expect(clampStatus(999)).toBe(599);
    expect(clampStatus(302.7)).toBe(302);
    expect(clampStatus(Number.NaN)).toBe(0);
  });
});
