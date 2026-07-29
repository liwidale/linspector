import { describe, expect, it } from 'vitest';
import { diffLines, diffStats } from '../src/attack/diff';

describe('diff', () => {
  it('marks unchanged lines as same', () => {
    const lines = diffLines('a\nb', 'a\nb');
    expect(lines.every((line) => line.kind === 'same')).toBe(true);
  });

  it('detects additions and removals', () => {
    const lines = diffLines('a\nb\nc', 'a\nx\nc');
    const stats = diffStats(lines);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(1);
  });

  it('counts pure additions', () => {
    const stats = diffStats(diffLines('a', 'a\nb\nc'));
    expect(stats.added).toBe(2);
    expect(stats.removed).toBe(0);
  });
});
