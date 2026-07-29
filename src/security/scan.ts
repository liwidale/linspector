import { uid } from '../core/ids';
import type { Finding, Header, NetworkRecord } from '../core/types';
import { auditHeaders } from './headers';
import { looksLikeJwt, auditJwt } from './jwt';
import { detectStackTrace, scanSecrets } from './secrets';

const bearerTokens = (headers: Header[]): string[] => {
  const tokens: string[] = [];
  for (const [key, value] of headers) {
    if (key.toLowerCase() === 'authorization') {
      const token = value.replace(/^bearer\s+/i, '').trim();
      if (looksLikeJwt(token)) tokens.push(token);
    }
  }
  return tokens;
};

export const scanRecord = (record: NetworkRecord): Finding[] => {
  const findings: Finding[] = [];
  const base = { recordId: record.id, host: record.host };

  const bodies = [record.responseBody, record.requestBody].filter(Boolean) as string[];
  const haystack = bodies.join('\n');

  for (const match of scanSecrets(haystack)) {
    findings.push({
      id: uid(),
      ...base,
      category: 'secret',
      severity: match.severity,
      title: `Possible ${match.name}`,
      detail: 'A value matching a known secret pattern was found in the traffic.',
      evidence: match.evidence,
    });
  }

  const trace = detectStackTrace(record.responseBody ?? '');
  if (trace) {
    findings.push({
      id: uid(),
      ...base,
      category: 'stacktrace',
      severity: 'medium',
      title: 'Stack trace disclosure',
      detail: 'The response body leaks a server side stack trace.',
      evidence: trace,
    });
  }

  for (const token of bearerTokens(record.requestHeaders)) {
    const audit = auditJwt(token);
    for (const warning of audit.warnings) {
      findings.push({
        id: uid(),
        ...base,
        category: 'jwt',
        severity: 'medium',
        title: 'JWT weakness',
        detail: warning,
        evidence: `${token.slice(0, 24)}...`,
      });
    }
  }

  for (const issue of auditHeaders(record.responseHeaders)) {
    findings.push({ id: uid(), ...base, ...issue });
  }

  return findings;
};
