import type { StreamMeta } from '../core/bus';
import type {
  Finding,
  NetworkRecord,
  PausedRequest,
  RequestKind,
  RuntimeConfig,
  SessionPreset,
  StreamFrame,
  StreamRecord,
  TamperRule,
} from '../core/types';
import { scanRecord } from '../security/scan';
import { defaultSettings, type Settings } from './settings';
import { clear, load, save } from './storage';

export type TabId =
  | RequestKind
  | 'streams'
  | 'history'
  | 'intercept'
  | 'repeater'
  | 'sessions'
  | 'scanner'
  | 'attack'
  | 'storage'
  | 'settings';

export interface State {
  active: NetworkRecord[];
  history: NetworkRecord[];
  streams: StreamRecord[];
  findings: Finding[];
  pending: PausedRequest[];
  settings: Settings;
}

interface Persisted {
  active: NetworkRecord[];
  history: NetworkRecord[];
  settings: Settings;
}

type Listener = (state: State) => void;

const CAPACITY = 500;
const STREAM_CAPACITY = 60;
const FRAME_CAPACITY = 300;
const FINDING_CAPACITY = 400;

const cap = <T>(items: T[], limit = CAPACITY): T[] =>
  items.length > limit ? items.slice(0, limit) : items;

export class Store {
  private state: State;
  private readonly listeners = new Set<Listener>();

  constructor() {
    const persisted = load<Partial<Persisted>>({});
    const settings: Settings = { ...defaultSettings, ...(persisted.settings ?? {}) };
    this.state = {
      settings,
      active: settings.persist ? (persisted.active ?? []) : [],
      history: settings.persist ? (persisted.history ?? []) : [],
      streams: [],
      findings: [],
      pending: [],
    };
  }

  getState(): State {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  runtimeConfig(): RuntimeConfig {
    const { settings } = this.state;
    const session = settings.applySessionLive
      ? (settings.sessions.find((item) => item.id === settings.activeSessionId)?.headers ?? null)
      : null;
    return {
      tamper: settings.tamper,
      breakpoints: settings.breakpoints,
      sessionHeaders: session,
    };
  }

  private persist(): void {
    if (this.state.settings.persist) {
      save({
        active: this.state.active,
        history: this.state.history,
        settings: this.state.settings,
      });
    }
  }

  private commit(next: Partial<State>): void {
    this.state = { ...this.state, ...next };
    this.persist();
    this.listeners.forEach((listener) => listener(this.state));
  }

  private isExcluded(host: string): boolean {
    return this.state.settings.excludedDomains.some(
      (domain) => domain.length > 0 && host.toLowerCase().includes(domain),
    );
  }

  ingest(record: NetworkRecord): void {
    const { minStatus, scannerEnabled } = this.state.settings;
    if (this.isExcluded(record.host)) return;
    if (record.status !== 0 && record.status < minStatus) return;
    const findings = scannerEnabled
      ? cap([...scanRecord(record), ...this.state.findings], FINDING_CAPACITY)
      : this.state.findings;
    this.commit({ active: cap([record, ...this.state.active]), findings });
  }

  openStream(meta: StreamMeta): void {
    const stream: StreamRecord = {
      id: meta.id,
      kind: meta.kind,
      url: meta.url,
      host: meta.host,
      startedAt: meta.at,
      closed: false,
      frames: [],
    };
    this.commit({ streams: cap([stream, ...this.state.streams], STREAM_CAPACITY) });
  }

  addFrame(id: string, frame: StreamFrame): void {
    const streams = this.state.streams.map((stream) =>
      stream.id === id
        ? { ...stream, frames: cap([...stream.frames, frame], FRAME_CAPACITY) }
        : stream,
    );
    this.commit({ streams });
  }

  closeStream(id: string): void {
    const streams = this.state.streams.map((stream) =>
      stream.id === id ? { ...stream, closed: true } : stream,
    );
    this.commit({ streams });
  }

  clearStreams(): void {
    this.commit({ streams: [] });
  }

  addPending(request: PausedRequest): void {
    this.commit({ pending: [...this.state.pending, request] });
  }

  resolvePending(id: string): void {
    this.commit({ pending: this.state.pending.filter((item) => item.id !== id) });
  }

  clearFindings(): void {
    this.commit({ findings: [] });
  }

  archive(id: string): void {
    const target = this.state.active.find((record) => record.id === id);
    if (!target) return;
    this.commit({
      active: this.state.active.filter((record) => record.id !== id),
      history: cap([target, ...this.state.history]),
    });
  }

  restore(id: string): void {
    const target = this.state.history.find((record) => record.id === id);
    if (!target) return;
    this.commit({
      history: this.state.history.filter((record) => record.id !== id),
      active: cap([target, ...this.state.active]),
    });
  }

  destroy(id: string): void {
    this.commit({ history: this.state.history.filter((record) => record.id !== id) });
  }

  clearSector(kind: RequestKind, host: string): void {
    this.commit({
      active: this.state.active.filter((record) => !(record.kind === kind && record.host === host)),
    });
  }

  archiveSector(kind: RequestKind, host: string): void {
    const moved = this.state.active.filter(
      (record) => record.kind === kind && record.host === host,
    );
    if (moved.length === 0) return;
    this.commit({
      active: this.state.active.filter((record) => !(record.kind === kind && record.host === host)),
      history: cap([...moved, ...this.state.history]),
    });
  }

  clearKind(kind: RequestKind): void {
    this.commit({ active: this.state.active.filter((record) => record.kind !== kind) });
  }

  archiveKind(kind: RequestKind): void {
    const moved = this.state.active.filter((record) => record.kind === kind);
    if (moved.length === 0) return;
    this.commit({
      active: this.state.active.filter((record) => record.kind !== kind),
      history: cap([...moved, ...this.state.history]),
    });
  }

  clearHistory(): void {
    this.commit({ history: [] });
  }

  saveSession(preset: SessionPreset): void {
    const exists = this.state.settings.sessions.some((item) => item.id === preset.id);
    const sessions = exists
      ? this.state.settings.sessions.map((item) => (item.id === preset.id ? preset : item))
      : [...this.state.settings.sessions, preset];
    this.updateSettings({ sessions });
  }

  removeSession(id: string): void {
    const sessions = this.state.settings.sessions.filter((item) => item.id !== id);
    const activeSessionId =
      this.state.settings.activeSessionId === id ? null : this.state.settings.activeSessionId;
    this.updateSettings({ sessions, activeSessionId });
  }

  saveTamper(rule: TamperRule): void {
    const exists = this.state.settings.tamper.some((item) => item.id === rule.id);
    const tamper = exists
      ? this.state.settings.tamper.map((item) => (item.id === rule.id ? rule : item))
      : [...this.state.settings.tamper, rule];
    this.updateSettings({ tamper });
  }

  removeTamper(id: string): void {
    this.updateSettings({ tamper: this.state.settings.tamper.filter((item) => item.id !== id) });
  }

  updateSettings(patch: Partial<Settings>): void {
    const settings: Settings = { ...this.state.settings, ...patch };
    this.state = { ...this.state, settings };
    if (settings.persist) {
      this.persist();
    } else {
      clear();
    }
    this.listeners.forEach((listener) => listener(this.state));
  }
}
