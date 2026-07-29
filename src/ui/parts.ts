import type { NetworkRecord, Severity } from '../core/types';
import { methodColor, statusColor, withAlpha } from '../utils/colors';
import { formatDuration, formatTime, prettyJson, shortUrl } from '../utils/format';
import type { Ctx } from './context';
import { el } from './dom';
import * as icons from './icons';

const severityColor: Record<Severity, string> = {
  high: '#ff453a',
  medium: '#ff9f0a',
  low: '#64d2ff',
  info: '#98989d',
};

export const copyValue = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    void 0;
  }
};

export const methodBadge = (method: string): HTMLElement => {
  const color = methodColor(method);
  return el('span', {
    class: 'badge',
    text: method,
    style: { color, background: withAlpha(color, '22') },
  });
};

export const statusBadge = (status: number): HTMLElement => {
  const color = statusColor(status);
  return el('span', {
    class: 'status-badge',
    text: status === 0 ? 'ERR' : String(status),
    style: { color, background: withAlpha(color, '22') },
  });
};

export const severityBadge = (severity: Severity): HTMLElement => {
  const color = severityColor[severity];
  return el('span', {
    class: 'sev-badge',
    text: severity,
    style: { color, background: withAlpha(color, '26') },
  });
};

export const pill = (
  label: string,
  onClick: () => void,
  variant: 'default' | 'danger' | 'accent' = 'default',
): HTMLElement =>
  el('button', {
    class: `pill-btn ${variant === 'default' ? '' : variant}`.trim(),
    text: label,
    on: { click: onClick },
  });

export const iconButton = (
  icon: string,
  title: string,
  onClick: (event: Event) => void,
  variant = '',
): HTMLElement =>
  el('button', {
    class: `icon-btn ${variant}`.trim(),
    html: icon,
    title,
    on: { click: onClick },
  });

export const emptyState = (title: string, sub: string): HTMLElement =>
  el('div', { class: 'empty' }, [
    el('span', { html: icons.inbox }),
    el('div', { class: 'empty-title', text: title }),
    el('div', { class: 'empty-sub', text: sub }),
  ]);

export const detailBlock = (label: string, value: string | null): HTMLElement => {
  const present = Boolean(value && value.length > 0);
  const head = el('div', { class: 'detail-head' }, [
    el('span', { class: 'detail-label', text: label }),
  ]);
  if (present) {
    head.append(iconButton(icons.copy, 'Copy', () => void copyValue(value as string)));
  }
  return el('div', { class: 'detail-block' }, [
    head,
    el('pre', {
      class: present ? 'detail-pre' : 'detail-pre faint',
      text: present ? (value as string) : '(empty)',
    }),
  ]);
};

const buildDetails = (record: NetworkRecord): HTMLElement =>
  el('div', { class: 'details' }, [
    detailBlock('Request url', record.url),
    detailBlock('Request headers', record.requestHeaders.map(([k, v]) => `${k}: ${v}`).join('\n')),
    detailBlock('Payload', record.requestBody),
    detailBlock(
      'Response headers',
      record.responseHeaders.map(([k, v]) => `${k}: ${v}`).join('\n'),
    ),
    detailBlock('Response', record.error ?? prettyJson(record.responseBody)),
  ]);

export const buildRow = (
  ctx: Ctx,
  record: NetworkRecord,
  mode: 'active' | 'history',
): HTMLElement => {
  const isOpen = ctx.ui.expanded.has(record.id);
  const line = el(
    'div',
    {
      class: 'row-line',
      on: {
        click: () => {
          if (isOpen) ctx.ui.expanded.delete(record.id);
          else ctx.ui.expanded.add(record.id);
          ctx.schedule();
        },
      },
    },
    [
      methodBadge(record.method),
      statusBadge(record.status),
      el('span', { class: 'row-url', text: shortUrl(record.url), title: record.url }),
      el('span', {
        class: 'row-meta',
        text: `${formatDuration(record.duration)} · ${formatTime(record.startedAt)}`,
      }),
    ],
  );

  line.append(
    iconButton(
      icons.send,
      'Send to Repeater',
      (event) => {
        event.stopPropagation();
        ctx.loadRepeater(record);
      },
      'accent',
    ),
  );

  if (mode === 'active') {
    line.append(
      iconButton(icons.close, 'Move to history', (event) => {
        event.stopPropagation();
        ctx.store.archive(record.id);
      }),
    );
  } else {
    line.append(
      iconButton(
        icons.restore,
        'Restore',
        (event) => {
          event.stopPropagation();
          ctx.store.restore(record.id);
        },
        'accent',
      ),
      iconButton(
        icons.close,
        'Delete forever',
        (event) => {
          event.stopPropagation();
          ctx.ui.expanded.delete(record.id);
          ctx.store.destroy(record.id);
        },
        'danger',
      ),
    );
  }

  const row = el('div', { class: 'row' }, [line]);
  if (isOpen) row.append(buildDetails(record));
  return row;
};

export const switchControl = (
  checked: boolean,
  onChange: (value: boolean) => void,
): HTMLElement => {
  const input = el('input', {
    attrs: { type: 'checkbox', checked },
    on: { change: (event) => onChange((event.target as HTMLInputElement).checked) },
  });
  return el('label', { class: 'switch' }, [
    input,
    el('span', { class: 'switch-track' }),
    el('span', { class: 'switch-knob' }),
  ]);
};

export const field = (
  title: string,
  desc: string,
  control: HTMLElement,
  stack = false,
): HTMLElement => {
  const text = el('div', { class: 'field-text' }, [
    el('div', { class: 'field-title', text: title }),
    el('div', { class: 'field-desc', text: desc }),
  ]);
  return stack
    ? el('div', { class: 'field stack' }, [text, control])
    : el('div', { class: 'field' }, [text, control]);
};

export const sectionTitle = (text: string): HTMLElement =>
  el('div', { class: 'section-title', text });
