import type { NetworkRecord, RequestKind } from '../../core/types';
import type { Ctx } from '../context';
import { el } from '../dom';
import * as icons from '../icons';
import { buildRow, emptyState, pill } from '../parts';

export const matchesQuery = (record: NetworkRecord, query: string): boolean => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    record.url.toLowerCase().includes(needle) ||
    record.method.toLowerCase().includes(needle) ||
    record.host.toLowerCase().includes(needle) ||
    String(record.status).includes(needle)
  );
};

const groupByHost = (records: NetworkRecord[]): Map<string, NetworkRecord[]> => {
  const groups = new Map<string, NetworkRecord[]>();
  for (const record of records) {
    const bucket = groups.get(record.host);
    if (bucket) bucket.push(record);
    else groups.set(record.host, [record]);
  }
  return groups;
};

const buildSector = (
  ctx: Ctx,
  kind: RequestKind,
  host: string,
  records: NetworkRecord[],
): HTMLElement => {
  const key = `${kind}:${host}`;
  const collapsed = ctx.ui.collapsed.has(key);
  const head = el(
    'div',
    {
      class: 'sector-head',
      on: {
        click: () => {
          if (collapsed) ctx.ui.collapsed.delete(key);
          else ctx.ui.collapsed.add(key);
          ctx.schedule();
        },
      },
    },
    [
      el('span', {
        class: collapsed ? 'sector-chevron' : 'sector-chevron open',
        html: icons.chevron,
      }),
      el('span', { class: 'sector-host', text: host, title: host }),
      el('span', { class: 'count-chip', text: String(records.length) }),
      el('div', { class: 'sector-actions' }, [
        el('button', {
          class: 'mini-btn',
          text: 'Archive All',
          on: {
            click: (event) => {
              event.stopPropagation();
              ctx.store.archiveSector(kind, host);
            },
          },
        }),
        el('button', {
          class: 'mini-btn danger',
          text: 'Clear',
          on: {
            click: (event) => {
              event.stopPropagation();
              ctx.store.clearSector(kind, host);
            },
          },
        }),
      ]),
    ],
  );

  const sector = el('div', { class: 'sector' }, [head]);
  if (!collapsed) {
    sector.append(
      el(
        'div',
        { class: 'sector-body' },
        records.map((record) => buildRow(ctx, record, 'active')),
      ),
    );
  }
  return sector;
};

export const renderRequests = (ctx: Ctx, kind: RequestKind, body: HTMLElement): void => {
  const records = ctx.store
    .getState()
    .active.filter((record) => record.kind === kind && matchesQuery(record, ctx.ui.query))
    .sort((a, b) => b.startedAt - a.startedAt);

  if (records.length === 0) {
    body.append(
      emptyState(
        ctx.ui.query ? 'No matches' : `No ${kind.toUpperCase()} requests`,
        ctx.ui.query
          ? 'Try a different search term.'
          : 'Requests appear here as the page makes them.',
      ),
    );
    return;
  }

  body.append(
    el('div', { class: 'toolbar' }, [
      el('span', { class: 'toolbar-label', text: `${records.length} request(s)` }),
      pill('Archive All', () => ctx.store.archiveKind(kind)),
      pill('Clear', () => ctx.store.clearKind(kind), 'danger'),
    ]),
  );

  const groups = [...groupByHost(records).entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [host, bucket] of groups) body.append(buildSector(ctx, kind, host, bucket));
};

export const renderHistory = (ctx: Ctx, body: HTMLElement): void => {
  const records = ctx.store
    .getState()
    .history.filter((record) => matchesQuery(record, ctx.ui.query))
    .sort((a, b) => b.startedAt - a.startedAt);

  if (records.length === 0) {
    body.append(
      emptyState(
        ctx.ui.query ? 'No matches' : 'History is empty',
        'Closed requests land here. Restore them or delete them for good.',
      ),
    );
    return;
  }

  body.append(
    el('div', { class: 'toolbar' }, [
      el('span', { class: 'toolbar-label', text: `${records.length} archived` }),
      pill(
        'Clear History',
        () => {
          ctx.ui.expanded.clear();
          ctx.store.clearHistory();
        },
        'danger',
      ),
    ]),
  );

  body.append(
    el('div', { class: 'sector' }, [
      el(
        'div',
        { class: 'sector-body' },
        records.map((record) => buildRow(ctx, record, 'history')),
      ),
    ]),
  );
};
