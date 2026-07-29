import type { Header, Severity } from '../core/types';

export interface HeaderIssue {
  category: 'cors' | 'header' | 'cookie';
  severity: Severity;
  title: string;
  detail: string;
  evidence: string;
}

const find = (headers: Header[], name: string): string | null => {
  const target = name.toLowerCase();
  for (const [key, value] of headers) {
    if (key.toLowerCase() === target) return value;
  }
  return null;
};

const securityHeaders: { name: string; title: string; severity: Severity }[] = [
  {
    name: 'content-security-policy',
    title: 'Content-Security-Policy is missing',
    severity: 'medium',
  },
  { name: 'x-frame-options', title: 'X-Frame-Options is missing', severity: 'medium' },
  {
    name: 'strict-transport-security',
    title: 'Strict-Transport-Security is missing',
    severity: 'medium',
  },
  { name: 'x-content-type-options', title: 'X-Content-Type-Options is missing', severity: 'low' },
  { name: 'referrer-policy', title: 'Referrer-Policy is missing', severity: 'low' },
];

export const auditHeaders = (headers: Header[]): HeaderIssue[] => {
  const issues: HeaderIssue[] = [];

  for (const item of securityHeaders) {
    if (find(headers, item.name) == null) {
      issues.push({
        category: 'header',
        severity: item.severity,
        title: item.title,
        detail: 'The response does not set this security header.',
        evidence: item.name,
      });
    }
  }

  const acao = find(headers, 'access-control-allow-origin');
  const acac = find(headers, 'access-control-allow-credentials');
  if (acao === '*' && acac?.toLowerCase() === 'true') {
    issues.push({
      category: 'cors',
      severity: 'high',
      title: 'Permissive CORS with credentials',
      detail: 'Access-Control-Allow-Origin is a wildcard while credentials are allowed.',
      evidence: 'Allow-Origin: * with Allow-Credentials: true',
    });
  } else if (acao === '*') {
    issues.push({
      category: 'cors',
      severity: 'low',
      title: 'Wildcard CORS policy',
      detail: 'Access-Control-Allow-Origin is a wildcard.',
      evidence: 'Access-Control-Allow-Origin: *',
    });
  }

  return issues;
};

export const auditCookieString = (cookie: string): HeaderIssue[] => {
  const issues: HeaderIssue[] = [];
  const attributes = cookie.toLowerCase();
  const name = cookie.split('=')[0]?.trim() ?? 'cookie';
  if (!attributes.includes('secure')) {
    issues.push({
      category: 'cookie',
      severity: 'low',
      title: `Cookie "${name}" without Secure`,
      detail: 'The cookie can be sent over plain HTTP.',
      evidence: name,
    });
  }
  if (!attributes.includes('httponly')) {
    issues.push({
      category: 'cookie',
      severity: 'low',
      title: `Cookie "${name}" without HttpOnly`,
      detail: 'The cookie is readable from JavaScript.',
      evidence: name,
    });
  }
  if (!attributes.includes('samesite')) {
    issues.push({
      category: 'cookie',
      severity: 'low',
      title: `Cookie "${name}" without SameSite`,
      detail: 'The cookie has no SameSite attribute.',
      evidence: name,
    });
  }
  return issues;
};
