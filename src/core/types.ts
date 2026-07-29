export type RequestKind = 'fetch' | 'xhr';
export type StreamKind = 'ws' | 'sse';
export type Header = [string, string];

export interface NetworkRecord {
  id: string;
  kind: RequestKind;
  method: string;
  url: string;
  host: string;
  status: number;
  statusText: string;
  ok: boolean;
  duration: number;
  startedAt: number;
  requestHeaders: Header[];
  responseHeaders: Header[];
  requestBody: string | null;
  responseBody: string | null;
  responseType: string;
  error: string | null;
}

export interface HttpMessage {
  method: string;
  url: string;
  headers: Header[];
  body: string | null;
}

export interface StreamFrame {
  id: string;
  direction: 'send' | 'receive' | 'open' | 'close' | 'error';
  data: string;
  at: number;
}

export interface StreamRecord {
  id: string;
  kind: StreamKind;
  url: string;
  host: string;
  startedAt: number;
  closed: boolean;
  frames: StreamFrame[];
}

export type Severity = 'high' | 'medium' | 'low' | 'info';

export type FindingCategory = 'jwt' | 'secret' | 'cors' | 'header' | 'cookie' | 'stacktrace';

export interface Finding {
  id: string;
  recordId: string;
  host: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  detail: string;
  evidence: string;
}

export interface SessionPreset {
  id: string;
  name: string;
  headers: Header[];
}

export interface TamperRule {
  id: string;
  enabled: boolean;
  target: 'url' | 'body' | 'header';
  match: string;
  replace: string;
  regex: boolean;
}

export interface BreakpointConfig {
  enabled: boolean;
  pattern: string;
}

export interface RuntimeConfig {
  tamper: TamperRule[];
  breakpoints: BreakpointConfig;
  sessionHeaders: Header[] | null;
}

export interface PausedRequest {
  id: string;
  request: HttpMessage;
  at: number;
}
