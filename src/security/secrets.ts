import type { Severity } from '../core/types';

export interface SecretPattern {
  name: string;
  severity: Severity;
  regex: RegExp;
}

export interface SecretMatch {
  name: string;
  severity: Severity;
  evidence: string;
}

export const secretPatterns: SecretPattern[] = [
  { name: 'AWS Access Key', severity: 'high', regex: /AKIA[0-9A-Z]{16}/g },
  {
    name: 'AWS Secret Key',
    severity: 'high',
    regex: /aws_secret_access_key\s*[=:]\s*['"]?[A-Za-z0-9/+]{40}/gi,
  },
  { name: 'Google API Key', severity: 'high', regex: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'Slack Token', severity: 'high', regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
  { name: 'GitHub Token', severity: 'high', regex: /gh[pousr]_[0-9A-Za-z]{36,}/g },
  { name: 'Stripe Key', severity: 'high', regex: /[sr]k_(live|test)_[0-9A-Za-z]{16,}/g },
  {
    name: 'Private Key Block',
    severity: 'high',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
  },
  { name: 'Bearer Token', severity: 'medium', regex: /bearer\s+[A-Za-z0-9._-]{20,}/gi },
  {
    name: 'Generic API Key',
    severity: 'medium',
    regex: /(?:api[_-]?key|secret|token|password)\s*[=:]\s*['"][A-Za-z0-9._-]{12,}['"]/gi,
  },
  { name: 'Basic Auth Header', severity: 'medium', regex: /basic\s+[A-Za-z0-9+/=]{16,}/gi },
];

export const stackTracePatterns: RegExp[] = [
  /Traceback \(most recent call last\)/,
  /\bat\s+[\w$.<>]+\s+\([^)]+:\d+:\d+\)/,
  /Exception in thread/,
  /\bstack trace:/i,
  /^\s*File "[^"]+", line \d+/m,
  /\b(?:NullPointerException|SQLException|RuntimeException)\b/,
];

const clip = (value: string): string => (value.length > 80 ? `${value.slice(0, 80)}...` : value);

export const scanSecrets = (text: string): SecretMatch[] => {
  if (!text) return [];
  const found = new Map<string, SecretMatch>();
  for (const pattern of secretPatterns) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(text)) !== null) {
      const key = `${pattern.name}:${match[0]}`;
      if (!found.has(key)) {
        found.set(key, {
          name: pattern.name,
          severity: pattern.severity,
          evidence: clip(match[0]),
        });
      }
      if (match.index === pattern.regex.lastIndex) pattern.regex.lastIndex += 1;
    }
  }
  return [...found.values()];
};

export const detectStackTrace = (text: string): string | null => {
  if (!text) return null;
  for (const pattern of stackTracePatterns) {
    const match = pattern.exec(text);
    if (match) return clip(match[0]);
  }
  return null;
};
