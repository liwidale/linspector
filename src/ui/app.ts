import type { Bridge } from '../core/bridge';
import type { NetworkRecord } from '../core/types';
import type { Store, TabId } from '../store/store';
import type { Theme } from '../store/settings';
import { stringifyHeaders } from '../utils/headers';
import { assetUrl } from './assets';
import { createUiState, type Ctx } from './context';
import { el, empty } from './dom';
import * as icons from './icons';
import { renderAttack } from './views/attack';
import { renderIntercept } from './views/intercept';
import { renderRepeater } from './views/repeater';
import { renderScanner } from './views/scanner';
import { renderSessions } from './views/sessions';
import { renderSettings } from './views/settingsview';
import { renderStorage } from './views/storageview';
import { renderStreams } from './views/streams';
import { renderHistory, renderRequests } from './views/traffic';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'fetch', label: 'Fetch', icon: icons.globe },
  { id: 'xhr', label: 'XHR', icon: icons.code },
  { id: 'streams', label: 'Streams', icon: icons.stream },
  { id: 'history', label: 'History', icon: icons.clock },
  { id: 'intercept', label: 'Intercept', icon: icons.pause },
  { id: 'repeater', label: 'Repeater', icon: icons.send },
  { id: 'sessions', label: 'Sessions', icon: icons.key },
  { id: 'scanner', label: 'Scanner', icon: icons.shield },
  { id: 'attack', label: 'Attack', icon: icons.zap },
  { id: 'storage', label: 'Storage', icon: icons.database },
  { id: 'settings', label: 'Settings', icon: icons.gear },
];

const SEARCH_TABS = new Set<TabId>(['fetch', 'xhr', 'history', 'scanner']);

export const mountApp = (store: Store, bridge: Bridge, css: string): void => {
  const guard = window as unknown as { __linspectorMounted?: boolean };
  if (guard.__linspectorMounted) return;
  guard.__linspectorMounted = true;

  const host = document.createElement('div');
  host.id = 'linspector-root';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.append(el('style', { text: css }));
  (document.body ?? document.documentElement).append(host);

  const ui = createUiState();

  const media = matchMedia('(prefers-color-scheme: dark)');
  const resolveTheme = (theme: Theme): 'dark' | 'light' =>
    theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
  const applyTheme = (): void =>
    host.setAttribute('data-theme', resolveTheme(store.getState().settings.theme));
  media.addEventListener('change', applyTheme);
  applyTheme();

  const logoSrc = assetUrl('logo.png');
  const badge = el('span', { class: 'fab-badge', attrs: { hidden: true } });
  const fab = el('button', { class: 'fab', title: 'Linspector', on: { click: () => toggle() } }, [
    el('img', { class: 'fab-logo', attrs: { src: logoSrc, alt: 'Linspector', draggable: false } }),
    badge,
  ]);

  const searchInput = el('input', {
    attrs: { type: 'text', placeholder: 'Search url, method, status', spellcheck: false },
    on: {
      input: (event) => {
        ui.query = (event.target as HTMLInputElement).value;
        schedule();
      },
    },
  });
  const searchbar = el('div', { class: 'searchbar' }, [
    el('span', { html: icons.search }),
    searchInput,
  ]);

  const navPill = el('span', { class: 'nav-pill' });
  const navButtons = new Map<TabId, HTMLElement>();
  const navTrack = el('div', { class: 'nav-track' }, [navPill]);
  for (const tab of TABS) {
    const button = el(
      'button',
      { class: 'nav-item', title: tab.label, on: { click: () => setTab(tab.id) } },
      [
        el('span', { class: 'nav-icon', html: tab.icon }),
        el('span', { class: 'nav-label', text: tab.label }),
      ],
    );
    navButtons.set(tab.id, button);
    navTrack.append(button);
  }
  const nav = el('div', { class: 'nav' }, [navTrack]);

  const body = el('div', { class: 'body' });

  const header = el('div', { class: 'header' }, [
    el('div', { class: 'header-mark' }, [
      el('img', {
        class: 'header-logo',
        attrs: { src: logoSrc, alt: 'Linspector', draggable: false },
      }),
    ]),
    el('div', { class: 'header-text' }, [
      el('div', { class: 'header-title', text: 'Linspector' }),
      el('div', { class: 'header-sub', text: 'Network Security Inspector' }),
    ]),
    el('div', { class: 'header-spacer' }),
    el('button', {
      class: 'icon-btn',
      html: icons.close,
      title: 'Close',
      on: { click: () => toggle(false) },
    }),
  ]);

  const panel = el('div', { class: 'panel', attrs: { hidden: true } }, [
    header,
    nav,
    searchbar,
    body,
  ]);
  shadow.append(fab, panel);

  const toggle = (force?: boolean): void => {
    ui.open = force ?? !ui.open;
    panel.hidden = !ui.open;
    if (ui.open) schedule();
  };

  const updatePill = (): void => {
    const active = navButtons.get(ui.tab);
    if (!active) return;
    navPill.style.width = `${active.offsetWidth}px`;
    navPill.style.transform = `translateX(${active.offsetLeft}px)`;
    const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollLeft = Math.max(0, Math.min(target, nav.scrollWidth - nav.clientWidth));
  };

  const setTab = (tab: TabId): void => {
    ui.tab = tab;
    schedule();
  };

  const loadRepeater = (record: NetworkRecord): void => {
    ui.repeater = {
      method: record.method,
      url: record.url,
      headersText: stringifyHeaders(record.requestHeaders),
      body: record.requestBody ?? '',
      sessionId: ui.repeater.sessionId,
      result: null,
      sending: false,
    };
    setTab('repeater');
  };

  const ctx: Ctx = { store, bridge, ui, host, schedule: () => schedule(), setTab, loadRepeater };

  let prevActive = store.getState().active.length;

  const render = (): void => {
    const state = store.getState();
    applyTheme();

    const count = state.active.length;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = count === 0;

    for (const [id, button] of navButtons) button.classList.toggle('active', id === ui.tab);
    const intercept = navButtons.get('intercept');
    if (intercept) intercept.classList.toggle('alert', state.pending.length > 0);
    searchbar.hidden = !SEARCH_TABS.has(ui.tab);

    if (!ui.open) return;

    empty(body);
    switch (ui.tab) {
      case 'fetch':
      case 'xhr':
        renderRequests(ctx, ui.tab, body);
        break;
      case 'streams':
        renderStreams(ctx, body);
        break;
      case 'history':
        renderHistory(ctx, body);
        break;
      case 'intercept':
        renderIntercept(ctx, body);
        break;
      case 'repeater':
        renderRepeater(ctx, body);
        break;
      case 'sessions':
        renderSessions(ctx, body);
        break;
      case 'scanner':
        renderScanner(ctx, body);
        break;
      case 'attack':
        renderAttack(ctx, body);
        break;
      case 'storage':
        renderStorage(ctx, body);
        break;
      case 'settings':
        renderSettings(ctx, body);
        break;
    }

    updatePill();
    if (
      state.settings.autoScroll &&
      count > prevActive &&
      (ui.tab === 'fetch' || ui.tab === 'xhr')
    ) {
      body.scrollTop = 0;
    }
    prevActive = count;
  };

  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      render();
    });
  };

  store.subscribe(schedule);
  render();
};
