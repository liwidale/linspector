import { uid } from '../../core/ids';
import type { SessionPreset } from '../../core/types';
import { parseHeaderBlock, stringifyHeaders } from '../../utils/headers';
import type { Ctx } from '../context';
import { el } from '../dom';
import { field, iconButton, pill, sectionTitle, switchControl } from '../parts';
import * as icons from '../icons';

const buildSession = (ctx: Ctx, session: SessionPreset): HTMLElement => {
  const { settings } = ctx.store.getState();
  const active = settings.activeSessionId === session.id;

  const nameInput = el('input', {
    class: 'text-input',
    attrs: { type: 'text', value: session.name },
    on: {
      change: (event) =>
        ctx.store.saveSession({
          ...session,
          name: (event.target as HTMLInputElement).value || 'Session',
        }),
    },
  });

  const headersInput = el('textarea', {
    class: 'area-input',
    attrs: { spellcheck: false, placeholder: 'Authorization: Bearer ...' },
    on: {
      change: (event) =>
        ctx.store.saveSession({
          ...session,
          headers: parseHeaderBlock((event.target as HTMLTextAreaElement).value),
        }),
    },
  });
  headersInput.value = stringifyHeaders(session.headers);

  return el('div', { class: active ? 'card active' : 'card' }, [
    el('div', { class: 'card-head' }, [
      el('span', { class: 'card-title', text: active ? 'Active session' : 'Session' }),
      el('div', { class: 'card-head-actions' }, [
        pill(
          active ? 'Active' : 'Use',
          () => ctx.store.updateSettings({ activeSessionId: active ? null : session.id }),
          active ? 'accent' : 'default',
        ),
        iconButton(
          icons.trash,
          'Delete session',
          () => ctx.store.removeSession(session.id),
          'danger',
        ),
      ]),
    ]),
    el('label', { class: 'input-label', text: 'Name' }),
    nameInput,
    el('label', { class: 'input-label', text: 'Headers' }),
    headersInput,
  ]);
};

export const renderSessions = (ctx: Ctx, body: HTMLElement): void => {
  const { settings } = ctx.store.getState();

  body.append(
    field(
      'Inject into live traffic',
      'Apply the active session headers to every outgoing request, not only the Repeater.',
      switchControl(settings.applySessionLive, (applySessionLive) =>
        ctx.store.updateSettings({ applySessionLive }),
      ),
    ),
    el('div', { class: 'toolbar' }, [
      el('span', { class: 'toolbar-label', text: `${settings.sessions.length} preset(s)` }),
      pill(
        'New session',
        () =>
          ctx.store.saveSession({
            id: uid(),
            name: `Session ${settings.sessions.length + 1}`,
            headers: [],
          }),
        'accent',
      ),
    ]),
  );

  if (settings.sessions.length === 0) {
    body.append(sectionTitle('Presets'));
    body.append(
      el('div', {
        class: 'hint',
        text: 'Create presets of Authorization or Cookie headers to swap identities for IDOR and access control checks.',
      }),
    );
    return;
  }

  for (const session of settings.sessions) body.append(buildSession(ctx, session));
};
