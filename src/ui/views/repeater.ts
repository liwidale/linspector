import type { HttpMessage } from '../../core/types';
import { forwardToRelay, sendRequest } from '../../repeater/repeater';
import { toBurp, toCurl, toPython } from '../../attack/export';
import { parseHeaderBlock } from '../../utils/headers';
import { mergeSessionHeaders } from '../../tamper/rules';
import { formatDuration } from '../../utils/format';
import type { Ctx } from '../context';
import { el } from '../dom';
import { copyValue, iconButton, pill, sectionTitle, statusBadge } from '../parts';
import * as icons from '../icons';

const buildMessage = (ctx: Ctx): HttpMessage => {
  const draft = ctx.ui.repeater;
  const session = ctx.store
    .getState()
    .settings.sessions.find((item) => item.id === draft.sessionId);
  const headers = mergeSessionHeaders(
    parseHeaderBlock(draft.headersText),
    session?.headers ?? null,
  );
  return {
    method: draft.method,
    url: draft.url,
    headers,
    body: draft.body.length ? draft.body : null,
  };
};

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const renderRepeater = (ctx: Ctx, body: HTMLElement): void => {
  const draft = ctx.ui.repeater;
  const { settings } = ctx.store.getState();

  const methodSelect = el(
    'select',
    {
      class: 'select-input',
      on: { change: (event) => (draft.method = (event.target as HTMLSelectElement).value) },
    },
    methodOptions.map((method) =>
      el('option', { text: method, attrs: { value: method, selected: method === draft.method } }),
    ),
  );

  const urlInput = el('input', {
    class: 'text-input flex',
    attrs: { type: 'text', value: draft.url, placeholder: 'https://target/api/resource' },
    on: { input: (event) => (draft.url = (event.target as HTMLInputElement).value) },
  });

  const headersInput = el('textarea', {
    class: 'area-input',
    attrs: { spellcheck: false, placeholder: 'Header: value' },
    on: { input: (event) => (draft.headersText = (event.target as HTMLTextAreaElement).value) },
  });
  headersInput.value = draft.headersText;

  const bodyInput = el('textarea', {
    class: 'area-input',
    attrs: { spellcheck: false, placeholder: 'Request body' },
    on: { input: (event) => (draft.body = (event.target as HTMLTextAreaElement).value) },
  });
  bodyInput.value = draft.body;

  const sessionSelect = el(
    'select',
    {
      class: 'select-input flex',
      on: {
        change: (event) => {
          const value = (event.target as HTMLSelectElement).value;
          draft.sessionId = value || null;
        },
      },
    },
    [
      el('option', { text: 'No session', attrs: { value: '', selected: !draft.sessionId } }),
      ...settings.sessions.map((session) =>
        el('option', {
          text: session.name,
          attrs: { value: session.id, selected: session.id === draft.sessionId },
        }),
      ),
    ],
  );

  const send = async (): Promise<void> => {
    draft.sending = true;
    ctx.schedule();
    draft.result = await sendRequest(buildMessage(ctx));
    draft.sending = false;
    ctx.schedule();
  };

  body.append(
    el('div', { class: 'repeater-line' }, [methodSelect, urlInput]),
    el('label', { class: 'input-label', text: 'Headers' }),
    headersInput,
    el('label', { class: 'input-label', text: 'Body' }),
    bodyInput,
    el('div', { class: 'repeater-line' }, [
      el('span', { class: 'input-label tight', text: 'Session' }),
      sessionSelect,
    ]),
    el('div', { class: 'card-actions' }, [
      pill(draft.sending ? 'Sending...' : 'Send', () => void send(), 'accent'),
      pill('Copy cURL', () => void copyValue(toCurl(buildMessage(ctx)))),
      pill('Copy Python', () => void copyValue(toPython(buildMessage(ctx)))),
      pill('Copy Burp', () => void copyValue(toBurp(buildMessage(ctx)))),
      pill('Forward', () => {
        void (async () => {
          const ok = await forwardToRelay(settings.forwardEndpoint, buildMessage(ctx));
          draft.result = ok
            ? {
                status: 200,
                statusText: 'Forwarded to relay',
                headers: [],
                body: `Sent to ${settings.forwardEndpoint}`,
                duration: 0,
                error: null,
              }
            : {
                status: 0,
                statusText: 'Relay unreachable',
                headers: [],
                body: '',
                duration: 0,
                error: `Could not reach ${settings.forwardEndpoint}`,
              };
          ctx.schedule();
        })();
      }),
    ]),
  );

  if (draft.result) {
    const result = draft.result;
    body.append(
      sectionTitle('Response'),
      el('div', { class: 'response-head' }, [
        statusBadge(result.status),
        el('span', { class: 'response-status', text: result.statusText }),
        el('span', { class: 'response-meta', text: formatDuration(result.duration) }),
        iconButton(icons.copy, 'Copy response', () => void copyValue(result.body)),
      ]),
      el('pre', {
        class: result.error ? 'detail-pre faint' : 'detail-pre',
        text: result.error ?? (result.body || '(empty body)'),
      }),
    );
  }
};
