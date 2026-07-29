import { describe, expect, it } from 'vitest';
import { formatDuration, prettyJson, shortUrl } from '../src/utils/format';
import { methodColor, statusColor } from '../src/utils/colors';

describe('format helpers', () => {
  it('formats durations in ms and seconds', () => {
    expect(formatDuration(42)).toBe('42 ms');
    expect(formatDuration(1500)).toBe('1.50 s');
  });

  it('pretty prints valid json and passes through invalid json', () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson('not json')).toBe('not json');
    expect(prettyJson(null)).toBe('');
  });

  it('extracts the path and query from a url', () => {
    expect(shortUrl('https://api.example.com/users?id=1')).toBe('/users?id=1');
    expect(shortUrl('https://api.example.com')).toBe('/');
    expect(shortUrl('::broken::')).toBe('::broken::');
  });
});

describe('color helpers', () => {
  it('maps methods to colors', () => {
    expect(methodColor('GET')).toBe('#34c759');
    expect(methodColor('post')).toBe('#0a84ff');
    expect(methodColor('WEIRD')).toBe('#8e8e93');
  });

  it('maps statuses to colors', () => {
    expect(statusColor(0)).toBe('#ff453a');
    expect(statusColor(204)).toBe('#34c759');
    expect(statusColor(301)).toBe('#ff9f0a');
    expect(statusColor(500)).toBe('#ff453a');
  });
});
