import styles from './ui/styles.css';
import { Bridge } from './core/bridge';
import type { Inbound } from './core/bus';
import { Store } from './store/store';
import { mountApp } from './ui/app';

const store = new Store();

const bridge = new Bridge((message: Inbound) => {
  switch (message.type) {
    case 'record':
      store.ingest(message.record);
      break;
    case 'stream-open':
      store.openStream(message.meta);
      break;
    case 'stream-frame':
      store.addFrame(message.id, message.frame);
      break;
    case 'stream-close':
      store.closeStream(message.id);
      break;
    case 'pause':
      store.addPending({ id: message.id, request: message.request, at: Date.now() });
      break;
  }
});

store.subscribe(() => bridge.sendConfig(store.runtimeConfig()));
bridge.sendConfig(store.runtimeConfig());

const start = (): void => mountApp(store, bridge, styles);

if (document.body) start();
else window.addEventListener('DOMContentLoaded', start, { once: true });
