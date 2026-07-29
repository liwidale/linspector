import { beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../src/store/store';
import { makeRecord } from './helpers';

describe('Store', () => {
  beforeEach(() => localStorage.clear());

  it('ingests active records', () => {
    const store = new Store();
    store.ingest(makeRecord({ id: 'a' }));
    store.ingest(makeRecord({ id: 'b' }));
    expect(store.getState().active.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('skips records below the minimum status', () => {
    const store = new Store();
    store.updateSettings({ minStatus: 400 });
    store.ingest(makeRecord({ id: 'ok', status: 200 }));
    store.ingest(makeRecord({ id: 'err', status: 404 }));
    store.ingest(makeRecord({ id: 'neterr', status: 0 }));
    expect(store.getState().active.map((r) => r.id)).toEqual(['neterr', 'err']);
  });

  it('skips excluded domains', () => {
    const store = new Store();
    store.updateSettings({ excludedDomains: ['ads.example'] });
    store.ingest(makeRecord({ id: 'keep', host: 'api.example.com' }));
    store.ingest(makeRecord({ id: 'drop', host: 'ads.example.net' }));
    expect(store.getState().active.map((r) => r.id)).toEqual(['keep']);
  });

  it('archives and restores records', () => {
    const store = new Store();
    store.ingest(makeRecord({ id: 'a' }));
    store.archive('a');
    expect(store.getState().active).toHaveLength(0);
    expect(store.getState().history.map((r) => r.id)).toEqual(['a']);
    store.restore('a');
    expect(store.getState().history).toHaveLength(0);
    expect(store.getState().active.map((r) => r.id)).toEqual(['a']);
  });

  it('destroys history records permanently', () => {
    const store = new Store();
    store.ingest(makeRecord({ id: 'a' }));
    store.archive('a');
    store.destroy('a');
    expect(store.getState().history).toHaveLength(0);
  });

  it('clears and archives a sector by kind and host', () => {
    const store = new Store();
    store.ingest(makeRecord({ id: 'a', kind: 'fetch', host: 'one.com' }));
    store.ingest(makeRecord({ id: 'b', kind: 'fetch', host: 'two.com' }));
    store.ingest(makeRecord({ id: 'c', kind: 'xhr', host: 'one.com' }));

    store.archiveSector('fetch', 'one.com');
    expect(
      store
        .getState()
        .active.map((r) => r.id)
        .sort(),
    ).toEqual(['b', 'c']);
    expect(store.getState().history.map((r) => r.id)).toEqual(['a']);

    store.clearSector('xhr', 'one.com');
    expect(store.getState().active.map((r) => r.id)).toEqual(['b']);
  });

  it('clears and archives a whole kind', () => {
    const store = new Store();
    store.ingest(makeRecord({ id: 'a', kind: 'fetch' }));
    store.ingest(makeRecord({ id: 'b', kind: 'xhr' }));
    store.archiveKind('fetch');
    expect(store.getState().active.map((r) => r.id)).toEqual(['b']);
    expect(store.getState().history.map((r) => r.id)).toEqual(['a']);
    store.clearKind('xhr');
    expect(store.getState().active).toHaveLength(0);
  });

  it('persists to localStorage when enabled and clears when disabled', () => {
    const first = new Store();
    first.ingest(makeRecord({ id: 'a' }));
    const restored = new Store();
    expect(restored.getState().active.map((r) => r.id)).toEqual(['a']);

    restored.updateSettings({ persist: false });
    const clean = new Store();
    expect(clean.getState().active).toHaveLength(0);
  });

  it('notifies subscribers on commit', () => {
    const store = new Store();
    let calls = 0;
    const unsubscribe = store.subscribe(() => (calls += 1));
    store.ingest(makeRecord());
    store.ingest(makeRecord());
    unsubscribe();
    store.ingest(makeRecord());
    expect(calls).toBe(2);
  });
});
