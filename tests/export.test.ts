import { describe, expect, it } from 'vitest';
import { toBurp, toCurl, toPython } from '../src/attack/export';
import type { HttpMessage } from '../src/core/types';

const message: HttpMessage = {
  method: 'POST',
  url: 'https://api.example.com/users?id=1',
  headers: [
    ['Content-Type', 'application/json'],
    ['Authorization', 'Bearer abc'],
  ],
  body: '{"name":"a"}',
};

describe('export', () => {
  it('builds a curl command with headers, body and proxy', () => {
    const curl = toCurl(message, 'http://127.0.0.1:8080');
    expect(curl).toContain('curl -X POST');
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain('--data-raw');
    expect(curl).toContain('-x');
  });

  it('builds a python requests snippet', () => {
    const python = toPython(message);
    expect(python).toContain('import requests');
    expect(python).toContain('requests.request("POST"');
  });

  it('builds a raw burp request with host and path', () => {
    const burp = toBurp(message);
    expect(burp.startsWith('POST /users?id=1 HTTP/1.1')).toBe(true);
    expect(burp).toContain('Host: api.example.com');
    expect(burp).toContain('{"name":"a"}');
  });
});
