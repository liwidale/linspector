import type { BreakpointConfig, SessionPreset, TamperRule } from '../core/types';

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  persist: boolean;
  autoScroll: boolean;
  minStatus: number;
  excludedDomains: string[];
  theme: Theme;
  scannerEnabled: boolean;
  applySessionLive: boolean;
  activeSessionId: string | null;
  forwardEndpoint: string;
  sessions: SessionPreset[];
  tamper: TamperRule[];
  breakpoints: BreakpointConfig;
}

export const defaultSettings: Settings = {
  persist: true,
  autoScroll: true,
  minStatus: 0,
  excludedDomains: [],
  theme: 'system',
  scannerEnabled: true,
  applySessionLive: false,
  activeSessionId: null,
  forwardEndpoint: 'http://127.0.0.1:8080/linspector',
  sessions: [],
  tamper: [],
  breakpoints: { enabled: false, pattern: '' },
};

export const parseDomains = (raw: string): string[] =>
  raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

export const clampStatus = (value: number): number =>
  Number.isFinite(value) ? Math.min(599, Math.max(0, Math.trunc(value))) : 0;
