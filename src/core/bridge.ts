import { CHANNEL, type Inbound, type Outbound } from './bus';
import type { HttpMessage, RuntimeConfig } from './types';

export class Bridge {
  private lastConfig = '';

  constructor(private readonly onInbound: (message: Inbound) => void) {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data as Partial<Inbound> | null;
      if (!data || data.channel !== CHANNEL || data.dir !== 'in') return;
      this.onInbound(data as Inbound);
    });
  }

  private post(message: Outbound): void {
    window.postMessage(message, '*');
  }

  sendConfig(config: RuntimeConfig): void {
    const signature = JSON.stringify(config);
    if (signature === this.lastConfig) return;
    this.lastConfig = signature;
    this.post({ channel: CHANNEL, dir: 'out', type: 'config', config });
  }

  sendResume(id: string, action: 'forward' | 'drop', request: HttpMessage): void {
    this.post({ channel: CHANNEL, dir: 'out', type: 'resume', id, action, request });
  }
}
