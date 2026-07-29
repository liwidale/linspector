import type { HttpMessage, NetworkRecord, RuntimeConfig, StreamFrame, StreamKind } from './types';

export const CHANNEL = 'linspector:v1' as const;

export interface StreamMeta {
  id: string;
  kind: StreamKind;
  url: string;
  host: string;
  at: number;
}

export type Inbound =
  | { channel: typeof CHANNEL; dir: 'in'; type: 'record'; record: NetworkRecord }
  | { channel: typeof CHANNEL; dir: 'in'; type: 'stream-open'; meta: StreamMeta }
  | { channel: typeof CHANNEL; dir: 'in'; type: 'stream-frame'; id: string; frame: StreamFrame }
  | { channel: typeof CHANNEL; dir: 'in'; type: 'stream-close'; id: string }
  | { channel: typeof CHANNEL; dir: 'in'; type: 'pause'; id: string; request: HttpMessage };

export type Outbound =
  | { channel: typeof CHANNEL; dir: 'out'; type: 'config'; config: RuntimeConfig }
  | {
      channel: typeof CHANNEL;
      dir: 'out';
      type: 'resume';
      id: string;
      action: 'forward' | 'drop';
      request: HttpMessage;
    };
