import type { PausedRequest } from '../../core/types';
import { parseHeaderBlock, stringifyHeaders } from '../../utils/headers';
import type { Ctx } from '../context';
import { el } from '../dom';
import { emptyState, field, pill, sectionTitle, switchControl } from '../parts';

const buildPaused = (ctx: Ctx, paused: PausedRequest): HTMLElement => {
  const urlInput = el('input', {
    class: 'text-input',
    attrs: { type: 'text', value: paused.request.url },
  });
  const headersInput = el('textarea', { class: 'area-input', attrs: { spellcheck: false } });
  headersInput.value = stringifyHeaders(paused.request.headers);
  const bodyInput = el('textarea', { class: 'area-input', attrs: { spellcheck: false } });
  bodyInput.value = paused.request.body ?? '';

  const collect = () => ({
    method: paused.request.method,
    url: urlInput.value,
    headers: parseHeaderBlock(headersInput.value),
    body: bodyInput.value.length ? bodyInput.value : null,
  });

  return el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('span', {
        class: 'badge',
        text: paused.request.method,
        style: { color: '#0a84ff', background: 'rgba(10,132,255,0.15)' },
      }),
      el('span', { class: 'card-title', text: 'Paused request' }),
    ]),
    el('label', { class: 'input-label', text: 'URL' }),
    urlInput,
    el('label', { class: 'input-label', text: 'Headers' }),
    headersInput,
    el('label', { class: 'input-label', text: 'Body' }),
    bodyInput,
    el('div', { class: 'card-actions' }, [
      pill(
        'Forward',
        () => {
          ctx.bridge.sendResume(paused.id, 'forward', collect());
          ctx.store.resolvePending(paused.id);
        },
        'accent',
      ),
      pill(
        'Drop',
        () => {
          ctx.bridge.sendResume(paused.id, 'drop', paused.request);
          ctx.store.resolvePending(paused.id);
        },
        'danger',
      ),
      pill('To Repeater', () => {
        const message = collect();
        ctx.ui.repeater = {
          method: message.method,
          url: message.url,
          headersText: stringifyHeaders(message.headers),
          body: message.body ?? '',
          sessionId: ctx.ui.repeater.sessionId,
          result: null,
          sending: false,
        };
        ctx.bridge.sendResume(paused.id, 'forward', message);
        ctx.store.resolvePending(paused.id);
        ctx.setTab('repeater');
      }),
    ]),
  ]);
};

export const renderIntercept = (ctx: Ctx, body: HTMLElement): void => {
  const { settings } = ctx.store.getState();
  const patternInput = el('input', {
    class: 'text-input',
    attrs: {
      type: 'text',
      value: settings.breakpoints.pattern,
      placeholder: '/api/  or  /admin/i as /regex/',
    },
    on: {
      change: (event) =>
        ctx.store.updateSettings({
          breakpoints: {
            ...settings.breakpoints,
            pattern: (event.target as HTMLInputElement).value,
          },
        }),
    },
  });

  body.append(
    field(
      'Breakpoints',
      'Pause matching fetch requests before they are sent (fetch only).',
      switchControl(settings.breakpoints.enabled, (enabled) =>
        ctx.store.updateSettings({ breakpoints: { ...settings.breakpoints, enabled } }),
      ),
    ),
    field(
      'Match pattern',
      'Substring, or wrap in slashes for a regular expression.',
      patternInput,
      true,
    ),
  );

  const pending = ctx.store.getState().pending;
  body.append(sectionTitle(`Queue (${pending.length})`));
  if (pending.length === 0) {
    body.append(
      emptyState(
        'Nothing paused',
        'Enable breakpoints and matching requests will wait here for a decision.',
      ),
    );
    return;
  }
  for (const paused of pending) body.append(buildPaused(ctx, paused));
};
