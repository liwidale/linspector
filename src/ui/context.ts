import type { Bridge } from '../core/bridge';
import type { NetworkRecord, Severity } from '../core/types';
import type { RepeaterResult } from '../repeater/repeater';
import type { Store, TabId } from '../store/store';

export interface RepeaterDraft {
  method: string;
  url: string;
  headersText: string;
  body: string;
  sessionId: string | null;
  result: RepeaterResult | null;
  sending: boolean;
}

export interface UiState {
  tab: TabId;
  query: string;
  open: boolean;
  expanded: Set<string>;
  collapsed: Set<string>;
  repeater: RepeaterDraft;
  diffA: string | null;
  diffB: string | null;
  exportKind: 'curl' | 'python' | 'burp';
  showCookies: boolean;
}

export interface Ctx {
  store: Store;
  bridge: Bridge;
  ui: UiState;
  host: HTMLElement;
  schedule: () => void;
  setTab: (tab: TabId) => void;
  loadRepeater: (record: NetworkRecord) => void;
}

export const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export const createUiState = (): UiState => ({
  tab: 'fetch',
  query: '',
  open: false,
  expanded: new Set(),
  collapsed: new Set(),
  repeater: {
    method: 'GET',
    url: '',
    headersText: '',
    body: '',
    sessionId: null,
    result: null,
    sending: false,
  },
  diffA: null,
  diffB: null,
  exportKind: 'curl',
  showCookies: false,
});
