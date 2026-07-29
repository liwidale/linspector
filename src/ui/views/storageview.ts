import {
  readCookies,
  readLocalStorage,
  removeLocalStorage,
  writeLocalStorage,
} from '../../inspect/browserstore';
import { auditCookieString } from '../../security/headers';
import type { Ctx } from '../context';
import { el } from '../dom';
import { copyValue, emptyState, iconButton, pill } from '../parts';
import * as icons from '../icons';

const buildLocalStorage = (ctx: Ctx): HTMLElement => {
  const entries = readLocalStorage();
  const container = el('div', { class: 'stack-6' });

  const keyInput = el('input', {
    class: 'text-input flex',
    attrs: { type: 'text', placeholder: 'key' },
  });
  const valueInput = el('input', {
    class: 'text-input flex',
    attrs: { type: 'text', placeholder: 'value' },
  });
  container.append(
    el('div', { class: 'repeater-line' }, [
      keyInput,
      valueInput,
      el('button', {
        class: 'mini-btn accent',
        text: 'Set',
        on: {
          click: () => {
            if (keyInput.value.trim()) {
              writeLocalStorage(keyInput.value.trim(), valueInput.value);
              ctx.schedule();
            }
          },
        },
      }),
    ]),
  );

  if (entries.length === 0) {
    container.append(el('div', { class: 'hint', text: 'LocalStorage is empty for this origin.' }));
    return container;
  }

  for (const entry of entries) {
    const valueField = el('input', {
      class: 'text-input flex',
      attrs: { type: 'text', value: entry.value },
      on: {
        change: (event) => writeLocalStorage(entry.key, (event.target as HTMLInputElement).value),
      },
    });
    container.append(
      el('div', { class: 'kv-row' }, [
        el('span', { class: 'kv-key', text: entry.key, title: entry.key }),
        valueField,
        iconButton(
          icons.trash,
          'Delete key',
          () => {
            removeLocalStorage(entry.key);
            ctx.schedule();
          },
          'danger',
        ),
      ]),
    );
  }
  return container;
};

const buildCookies = (): HTMLElement => {
  const cookies = readCookies();
  const container = el('div', { class: 'stack-6' });
  if (cookies.length === 0) {
    container.append(
      el('div', {
        class: 'hint',
        text: 'No JavaScript readable cookies. HttpOnly cookies are hidden by the browser.',
      }),
    );
    return container;
  }
  for (const cookie of cookies) {
    const issues = auditCookieString(`${cookie.key}=${cookie.value}`);
    container.append(
      el('div', { class: 'kv-row' }, [
        el('span', { class: 'kv-key', text: cookie.key, title: cookie.key }),
        el('span', { class: 'kv-value', text: cookie.value, title: cookie.value }),
        el('span', {
          class: issues.length ? 'kv-flag warn' : 'kv-flag',
          text: issues.length ? `${issues.length} flags` : 'ok',
        }),
        iconButton(icons.copy, 'Copy value', () => void copyValue(cookie.value)),
      ]),
    );
  }
  return container;
};

export const renderStorage = (ctx: Ctx, body: HTMLElement): void => {
  const showCookies = ctx.ui.showCookies;
  body.append(
    el('div', { class: 'inline-seg' }, [
      el('button', {
        class: showCookies ? 'inline-opt' : 'inline-opt active',
        text: 'LocalStorage',
        on: {
          click: () => {
            ctx.ui.showCookies = false;
            ctx.schedule();
          },
        },
      }),
      el('button', {
        class: showCookies ? 'inline-opt active' : 'inline-opt',
        text: 'Cookies',
        on: {
          click: () => {
            ctx.ui.showCookies = true;
            ctx.schedule();
          },
        },
      }),
      el('div', { class: 'header-spacer' }),
      pill('Refresh', () => ctx.schedule()),
    ]),
  );

  if (showCookies) {
    body.append(buildCookies());
  } else {
    const entries = readLocalStorage();
    if (entries.length === 0 && !document.cookie) {
      body.append(emptyState('Nothing stored', 'This origin has no LocalStorage entries.'));
    }
    body.append(buildLocalStorage(ctx));
  }
};
