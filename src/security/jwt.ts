export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface JwtAudit {
  parts: JwtParts | null;
  warnings: string[];
}

const decodeSegment = (segment: string): Record<string, unknown> => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
  return JSON.parse(json) as Record<string, unknown>;
};

export const looksLikeJwt = (value: string): boolean =>
  /^[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]*$/.test(value.trim());

export const decodeJwt = (token: string): JwtParts | null => {
  const segments = token.trim().split('.');
  if (segments.length !== 3) return null;
  try {
    return {
      header: decodeSegment(segments[0]),
      payload: decodeSegment(segments[1]),
      signature: segments[2],
    };
  } catch {
    return null;
  }
};

export const auditJwt = (token: string): JwtAudit => {
  const parts = decodeJwt(token);
  if (!parts) return { parts: null, warnings: ['Token is not a valid JWT structure.'] };

  const warnings: string[] = [];
  const alg = String(parts.header.alg ?? '').toLowerCase();
  if (alg === 'none') warnings.push('Algorithm is "none", the signature is not verified.');
  if (alg.startsWith('hs'))
    warnings.push('HMAC algorithm is used, brute force of a weak secret is possible.');
  if (!parts.signature) warnings.push('Signature segment is empty.');

  const exp = parts.payload.exp;
  if (typeof exp === 'number') {
    if (exp * 1000 < Date.now()) warnings.push('Token is expired (exp is in the past).');
  } else {
    warnings.push('No exp claim, the token may never expire.');
  }

  if (parts.payload.iat == null) warnings.push('No iat claim.');
  if (parts.payload.alg != null || parts.payload.kid != null)
    warnings.push('Algorithm data is present in the payload, check for confusion attacks.');

  return { parts, warnings };
};
