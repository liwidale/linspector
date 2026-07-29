import { diffLines, diffStats } from '../../attack/diff';
import { payloadLibrary } from '../../attack/payloads';
import { auditJwt } from '../../security/jwt';
import type { NetworkRecord } from '../../core/types';
import { prettyJson, shortUrl } from '../../utils/format';
import type { Ctx } from '../context';
import { el, empty } from '../dom';
import { copyValue, sectionTitle } from '../parts';

const recordById = (ctx: Ctx, id: string | null): NetworkRecord | null => {
  if (!id) return null;
  const state = ctx.store.getState();
  return [...state.active, ...state.history].find((record) => record.id === id) ?? null;
};

const recordLabel = (record: NetworkRecord): string => {
  const path = shortUrl(record.url);
  const trimmed = path.length > 40 ? `${path.slice(0, 40)}...` : path;
  return `${record.method} ${trimmed} [${record.status || 'ERR'}]`;
};

const buildPayloads = (ctx: Ctx): HTMLElement => {
  const container = el('div', { class: 'stack-8' });
  for (const group of payloadLibrary) {
    const items = group.items.map((payload) =>
      el('div', { class: 'payload-row' }, [
        el('code', { class: 'payload-text', text: payload, title: payload }),
        el('button', {
          class: 'mini-btn',
          text: 'Copy',
          on: { click: () => void copyValue(payload) },
        }),
        el('button', {
          class: 'mini-btn accent',
          text: 'Body',
          on: {
            click: () => {
              ctx.ui.repeater.body = payload;
              ctx.setTab('repeater');
            },
          },
        }),
      ]),
    );
    container.append(
      el('div', { class: 'payload-group' }, [
        el('div', { class: 'payload-name', text: group.name }),
        ...items,
      ]),
    );
  }
  return container;
};

const buildDiff = (ctx: Ctx): HTMLElement => {
  const state = ctx.store.getState();
  const records = [...state.active, ...state.history];
  const options = (selected: string | null): HTMLElement[] => [
    el('option', { text: 'Select response', attrs: { value: '', selected: !selected } }),
    ...records.map((record) =>
      el('option', {
        text: recordLabel(record),
        attrs: { value: record.id, selected: record.id === selected },
      }),
    ),
  ];

  const selectA = el(
    'select',
    {
      class: 'select-input flex',
      on: {
        change: (event) => {
          ctx.ui.diffA = (event.target as HTMLSelectElement).value || null;
          ctx.schedule();
        },
      },
    },
    options(ctx.ui.diffA),
  );
  const selectB = el(
    'select',
    {
      class: 'select-input flex',
      on: {
        change: (event) => {
          ctx.ui.diffB = (event.target as HTMLSelectElement).value || null;
          ctx.schedule();
        },
      },
    },
    options(ctx.ui.diffB),
  );

  const container = el('div', { class: 'stack-8' }, [
    el('div', { class: 'repeater-line' }, [selectA, selectB]),
  ]);

  const left = recordById(ctx, ctx.ui.diffA);
  const right = recordById(ctx, ctx.ui.diffB);
  if (left && right) {
    const lines = diffLines(prettyJson(left.responseBody), prettyJson(right.responseBody));
    const stats = diffStats(lines);
    container.append(el('div', { class: 'diff-stats', text: `+${stats.added} -${stats.removed}` }));
    const pre = el('div', { class: 'diff-view' });
    for (const line of lines) {
      pre.append(el('div', { class: `diff-line diff-${line.kind}`, text: line.text || ' ' }));
    }
    container.append(pre);
  } else {
    container.append(
      el('div', {
        class: 'hint',
        text: 'Pick two captured responses to compare them line by line.',
      }),
    );
  }
  return container;
};

const buildJwt = (): HTMLElement => {
  const output = el('div', { class: 'jwt-output' });
  const render = (token: string): void => {
    empty(output);
    if (!token.trim()) return;
    const audit = auditJwt(token);
    if (audit.parts) {
      output.append(
        el('label', { class: 'input-label', text: 'Header' }),
        el('pre', { class: 'detail-pre', text: JSON.stringify(audit.parts.header, null, 2) }),
        el('label', { class: 'input-label', text: 'Payload' }),
        el('pre', { class: 'detail-pre', text: JSON.stringify(audit.parts.payload, null, 2) }),
      );
    }
    if (audit.warnings.length) {
      output.append(
        el('label', { class: 'input-label', text: 'Warnings' }),
        el(
          'ul',
          { class: 'warn-list' },
          audit.warnings.map((warning) => el('li', { text: warning })),
        ),
      );
    }
  };

  const input = el('textarea', {
    class: 'area-input',
    attrs: { spellcheck: false, placeholder: 'Paste a JWT to decode and audit' },
    on: { input: (event) => render((event.target as HTMLTextAreaElement).value) },
  });

  return el('div', { class: 'stack-8' }, [input, output]);
};

export const renderAttack = (ctx: Ctx, body: HTMLElement): void => {
  body.append(sectionTitle('Payload library'));
  body.append(buildPayloads(ctx));
  body.append(sectionTitle('Response diff'));
  body.append(buildDiff(ctx));
  body.append(sectionTitle('JWT decoder'));
  body.append(buildJwt());
  body.append(
    el('div', {
      class: 'hint',
      text: 'Export to cURL, Python and Burp is available on any request from the Repeater tab.',
    }),
  );
};
