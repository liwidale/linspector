import type { StreamRecord } from '../../core/types';
import { formatTime } from '../../utils/format';
import type { Ctx } from '../context';
import { el } from '../dom';
import { copyValue, emptyState, iconButton, pill } from '../parts';
import * as icons from '../icons';

const directionClass: Record<string, string> = {
  send: 'frame-send',
  receive: 'frame-receive',
  open: 'frame-info',
  close: 'frame-info',
  error: 'frame-error',
};

const arrow: Record<string, string> = {
  send: '↑',
  receive: '↓',
  open: '•',
  close: '•',
  error: '!',
};

const buildStream = (ctx: Ctx, stream: StreamRecord): HTMLElement => {
  const key = `stream:${stream.id}`;
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
      el('span', {
        class: 'badge',
        text: stream.kind.toUpperCase(),
        style: { color: '#bf5af2', background: 'rgba(191,90,242,0.15)' },
      }),
      el('span', { class: 'sector-host', text: stream.host, title: stream.url }),
      el('span', {
        class: 'count-chip',
        text: stream.closed ? `${stream.frames.length} · closed` : String(stream.frames.length),
      }),
    ],
  );

  const sector = el('div', { class: 'sector' }, [head]);
  if (!collapsed) {
    const frames = stream.frames.map((frame) =>
      el('div', { class: `frame ${directionClass[frame.direction] ?? ''}` }, [
        el('span', { class: 'frame-dir', text: arrow[frame.direction] ?? '•' }),
        el('span', { class: 'frame-time', text: formatTime(frame.at) }),
        el('span', { class: 'frame-data', text: frame.data, title: frame.data }),
      ]),
    );
    sector.append(
      el(
        'div',
        { class: 'frame-list' },
        frames.length ? frames : [el('div', { class: 'frame-empty', text: 'No frames yet.' })],
      ),
    );
  }
  return sector;
};

export const renderStreams = (ctx: Ctx, body: HTMLElement): void => {
  const streams = ctx.store.getState().streams;
  if (streams.length === 0) {
    body.append(
      emptyState(
        'No live streams',
        'WebSocket and SSE connections show up here with their frames.',
      ),
    );
    return;
  }

  body.append(
    el('div', { class: 'toolbar' }, [
      el('span', { class: 'toolbar-label', text: `${streams.length} stream(s)` }),
      iconButton(
        icons.copy,
        'Copy all frames',
        () =>
          void copyValue(
            streams
              .map(
                (stream) =>
                  `${stream.kind} ${stream.url}\n${stream.frames.map((f) => `${f.direction}: ${f.data}`).join('\n')}`,
              )
              .join('\n\n'),
          ),
      ),
      pill('Clear', () => ctx.store.clearStreams(), 'danger'),
    ]),
  );

  for (const stream of streams) body.append(buildStream(ctx, stream));
};
