import { uid } from '../../core/ids';
import type { TamperRule } from '../../core/types';
import { clampStatus, parseDomains, type Theme } from '../../store/settings';
import type { Ctx } from '../context';
import { el } from '../dom';
import { field, iconButton, pill, sectionTitle, switchControl } from '../parts';
import * as icons from '../icons';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const buildTamper = (ctx: Ctx, rule: TamperRule): HTMLElement => {
  const targetSelect = el(
    'select',
    {
      class: 'select-input',
      on: {
        change: (event) =>
          ctx.store.saveTamper({
            ...rule,
            target: (event.target as HTMLSelectElement).value as TamperRule['target'],
          }),
      },
    },
    (['url', 'body', 'header'] as const).map((target) =>
      el('option', { text: target, attrs: { value: target, selected: target === rule.target } }),
    ),
  );

  const matchInput = el('input', {
    class: 'text-input flex',
    attrs: { type: 'text', value: rule.match, placeholder: 'match' },
    on: {
      change: (event) =>
        ctx.store.saveTamper({ ...rule, match: (event.target as HTMLInputElement).value }),
    },
  });
  const replaceInput = el('input', {
    class: 'text-input flex',
    attrs: { type: 'text', value: rule.replace, placeholder: 'replace' },
    on: {
      change: (event) =>
        ctx.store.saveTamper({ ...rule, replace: (event.target as HTMLInputElement).value }),
    },
  });

  return el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      switchControl(rule.enabled, (enabled) => ctx.store.saveTamper({ ...rule, enabled })),
      targetSelect,
      el('label', { class: 'inline-check' }, [
        el('input', {
          attrs: { type: 'checkbox', checked: rule.regex },
          on: {
            change: (event) =>
              ctx.store.saveTamper({ ...rule, regex: (event.target as HTMLInputElement).checked }),
          },
        }),
        el('span', { text: 'regex' }),
      ]),
      el('div', { class: 'header-spacer' }),
      iconButton(icons.trash, 'Delete rule', () => ctx.store.removeTamper(rule.id), 'danger'),
    ]),
    el('div', { class: 'repeater-line' }, [matchInput, replaceInput]),
  ]);
};

export const renderSettings = (ctx: Ctx, body: HTMLElement): void => {
  const { settings } = ctx.store.getState();

  body.append(
    field(
      'Persist logs',
      'Save captured requests to LocalStorage across reloads.',
      switchControl(settings.persist, (persist) => ctx.store.updateSettings({ persist })),
    ),
    field(
      'Auto scroll',
      'Jump to the newest request when it arrives.',
      switchControl(settings.autoScroll, (autoScroll) => ctx.store.updateSettings({ autoScroll })),
    ),
    field(
      'Passive scanner',
      'Audit traffic for secrets, JWT, stack traces, CORS and headers.',
      switchControl(settings.scannerEnabled, (scannerEnabled) =>
        ctx.store.updateSettings({ scannerEnabled }),
      ),
    ),
  );

  const statusInput = el('input', {
    class: 'num-input',
    attrs: { type: 'number', min: 0, max: 599, value: settings.minStatus },
    on: {
      change: (event) =>
        ctx.store.updateSettings({
          minStatus: clampStatus(Number((event.target as HTMLInputElement).value)),
        }),
    },
  });
  body.append(field('Minimum status code', 'Ignore responses below this status.', statusInput));

  const themeSeg = el(
    'div',
    { class: 'theme-seg' },
    THEMES.map((theme) =>
      el('button', {
        class: settings.theme === theme.id ? 'theme-opt active' : 'theme-opt',
        text: theme.label,
        on: { click: () => ctx.store.updateSettings({ theme: theme.id }) },
      }),
    ),
  );
  body.append(field('Appearance', 'Follow the system or lock a theme.', themeSeg));

  const relayInput = el('input', {
    class: 'text-input',
    attrs: { type: 'text', value: settings.forwardEndpoint },
    on: {
      change: (event) =>
        ctx.store.updateSettings({ forwardEndpoint: (event.target as HTMLInputElement).value }),
    },
  });
  body.append(
    field(
      'Forward endpoint',
      'Relay target for Burp or Caido (a listener that accepts JSON).',
      relayInput,
      true,
    ),
  );

  const domainsInput = el('textarea', {
    class: 'area-input',
    attrs: { spellcheck: false, placeholder: 'analytics.example.com' },
    on: {
      change: (event) =>
        ctx.store.updateSettings({
          excludedDomains: parseDomains((event.target as HTMLTextAreaElement).value),
        }),
    },
  });
  domainsInput.value = settings.excludedDomains.join('\n');
  body.append(
    field(
      'Excluded domains',
      'One host per line. Matching requests are skipped.',
      domainsInput,
      true,
    ),
  );

  body.append(
    sectionTitle('Tamper rules'),
    el('div', { class: 'toolbar' }, [
      el('span', { class: 'toolbar-label', text: `${settings.tamper.length} rule(s)` }),
      pill(
        'New rule',
        () =>
          ctx.store.saveTamper({
            id: uid(),
            enabled: true,
            target: 'url',
            match: '',
            replace: '',
            regex: false,
          }),
        'accent',
      ),
    ]),
  );
  if (settings.tamper.length === 0) {
    body.append(
      el('div', {
        class: 'hint',
        text: 'Auto replace parts of the URL, body or headers on the fly.',
      }),
    );
  } else {
    for (const rule of settings.tamper) body.append(buildTamper(ctx, rule));
  }

  body.append(
    el('div', { class: 'settings-footer' }, [
      el('span', { text: 'Linspector v1.0.0 · ' }),
      el('a', {
        text: 'liwidale',
        attrs: { href: 'https://github.com/liwidale', target: '_blank', rel: 'noreferrer' },
      }),
    ]),
  );
};
