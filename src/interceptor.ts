import { CHANNEL, type Inbound, type Outbound } from './core/bus';
import { uid } from './core/ids';
import type { Header, HttpMessage, RuntimeConfig, StreamKind } from './core/types';
import { applyTamper, matchesPattern, mergeSessionHeaders } from './tamper/rules';
import { hostOf } from './utils/url';

interface Guarded {
  __linspectorPatched?: boolean;
}

const flag = window as unknown as Guarded;
if (!flag.__linspectorPatched) {
  flag.__linspectorPatched = true;

  const MAX_BODY = 1_000_000;

  const config: RuntimeConfig = {
    tamper: [],
    breakpoints: { enabled: false, pattern: '' },
    sessionHeaders: null,
  };

  const resolvers = new Map<
    string,
    (decision: { action: 'forward' | 'drop'; request: HttpMessage }) => void
  >();

  const post = (message: Inbound): void => window.postMessage(message, '*');

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as Partial<Outbound> | null;
    if (!data || data.channel !== CHANNEL || data.dir !== 'out') return;
    if (data.type === 'config' && data.config) {
      config.tamper = data.config.tamper;
      config.breakpoints = data.config.breakpoints;
      config.sessionHeaders = data.config.sessionHeaders;
    } else if (data.type === 'resume' && data.id && data.action && data.request) {
      const resolve = resolvers.get(data.id);
      if (resolve) {
        resolvers.delete(data.id);
        resolve({ action: data.action, request: data.request });
      }
    }
  });

  const truncate = (value: string): string =>
    value.length > MAX_BODY ? `${value.slice(0, MAX_BODY)}\n...[truncated]` : value;

  const isTextual = (contentType: string): boolean =>
    /json|text|xml|javascript|urlencoded|graphql|csv|html/i.test(contentType);

  const headerEntries = (source: HeadersInit | Headers | undefined): Header[] => {
    if (!source) return [];
    const headers = source instanceof Headers ? source : new Headers(source);
    return [...headers.entries()];
  };

  const parseResponseHeaders = (raw: string): Header[] => {
    const entries: Header[] = [];
    for (const line of raw.trim().split(/\r?\n/)) {
      const index = line.indexOf(':');
      if (index > 0) entries.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
    }
    return entries;
  };

  const readBody = (body: BodyInit | Document | null | undefined): string | null => {
    if (body == null) return null;
    if (typeof body === 'string') return truncate(body);
    if (body instanceof URLSearchParams) return truncate(body.toString());
    if (body instanceof FormData) {
      const parts: string[] = [];
      body.forEach((value, key) =>
        parts.push(`${key}=${typeof value === 'string' ? value : '[file]'}`),
      );
      return truncate(parts.join('&'));
    }
    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return '[binary]';
    if (body instanceof Blob) return '[blob]';
    return '[stream]';
  };

  const safeText = async (response: Response): Promise<string | null> => {
    try {
      return truncate(await response.text());
    } catch {
      return null;
    }
  };

  const pause = (
    request: HttpMessage,
  ): Promise<{ action: 'forward' | 'drop'; request: HttpMessage }> =>
    new Promise((resolve) => {
      const id = uid();
      resolvers.set(id, resolve);
      post({ channel: CHANNEL, dir: 'in', type: 'pause', id, request });
    });

  const prepare = async (message: HttpMessage): Promise<HttpMessage | null> => {
    let next = applyTamper(message, config.tamper);
    next = { ...next, headers: mergeSessionHeaders(next.headers, config.sessionHeaders) };
    if (config.breakpoints.enabled && matchesPattern(next.url, config.breakpoints.pattern)) {
      const decision = await pause(next);
      if (decision.action === 'drop') return null;
      next = decision.request;
    }
    return next;
  };

  const nativeFetch = window.fetch;

  window.fetch = async function patched(input, init) {
    const request = input instanceof Request ? input : new Request(input, init);
    const original: HttpMessage = {
      method: (init?.method ?? request.method ?? 'GET').toUpperCase(),
      url: request.url,
      headers: headerEntries(init?.headers ?? request.headers),
      body: readBody(init?.body ?? null),
    };
    const startedAt = Date.now();
    const t0 = performance.now();

    const prepared = await prepare(original);
    if (!prepared) {
      throw new DOMException('Request dropped by Linspector', 'AbortError');
    }

    const finalInit: RequestInit = {
      ...init,
      method: prepared.method,
      headers: prepared.headers,
    };
    if (prepared.body != null && prepared.body !== original.body) finalInit.body = prepared.body;

    try {
      const response = await nativeFetch(prepared.url, finalInit);
      const contentType = response.headers.get('content-type') ?? '';
      const responseBody = isTextual(contentType) ? await safeText(response.clone()) : null;
      post({
        channel: CHANNEL,
        dir: 'in',
        type: 'record',
        record: {
          id: uid(),
          kind: 'fetch',
          method: prepared.method,
          url: prepared.url,
          host: hostOf(prepared.url),
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          duration: performance.now() - t0,
          startedAt,
          requestHeaders: prepared.headers,
          responseHeaders: [...response.headers.entries()],
          requestBody: prepared.body,
          responseBody,
          responseType: contentType,
          error: null,
        },
      });
      return response;
    } catch (error) {
      post({
        channel: CHANNEL,
        dir: 'in',
        type: 'record',
        record: {
          id: uid(),
          kind: 'fetch',
          method: prepared.method,
          url: prepared.url,
          host: hostOf(prepared.url),
          status: 0,
          statusText: 'Failed',
          ok: false,
          duration: performance.now() - t0,
          startedAt,
          requestHeaders: prepared.headers,
          responseHeaders: [],
          requestBody: prepared.body,
          responseBody: null,
          responseType: '',
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  };

  interface XhrMeta {
    method: string;
    url: string;
    startedAt: number;
    t0: number;
    requestBody: string | null;
    headers: Header[];
  }

  const metaMap = new WeakMap<XMLHttpRequest, XhrMeta>();
  const proto = XMLHttpRequest.prototype;
  const nativeOpen = proto.open;
  const nativeSend = proto.send;
  const nativeSetHeader = proto.setRequestHeader;

  proto.open = function open(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ): void {
    let target = String(url);
    for (const rule of config.tamper) {
      if (rule.enabled && rule.target === 'url') {
        target = applyTamper({ method: String(method), url: target, headers: [], body: null }, [
          rule,
        ]).url;
      }
    }
    metaMap.set(this, {
      method: String(method).toUpperCase(),
      url: target,
      startedAt: 0,
      t0: 0,
      requestBody: null,
      headers: [],
    });
    return (nativeOpen as (...args: unknown[]) => void).call(this, method, target, ...rest);
  };

  proto.setRequestHeader = function setHeader(
    this: XMLHttpRequest,
    name: string,
    value: string,
  ): void {
    const meta = metaMap.get(this);
    let finalValue = value;
    for (const rule of config.tamper) {
      if (rule.enabled && rule.target === 'header') {
        finalValue = applyTamper(
          { method: 'GET', url: '', headers: [[name, finalValue]], body: null },
          [rule],
        ).headers[0][1];
      }
    }
    if (meta) meta.headers.push([name, finalValue]);
    return nativeSetHeader.call(this, name, finalValue);
  };

  proto.send = function send(
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const meta = metaMap.get(this);
    if (meta) {
      meta.startedAt = Date.now();
      meta.t0 = performance.now();
      let payload = readBody(body ?? null);
      for (const rule of config.tamper) {
        if (rule.enabled && rule.target === 'body' && payload != null) {
          payload = applyTamper(
            { method: meta.method, url: meta.url, headers: [], body: payload },
            [rule],
          ).body;
        }
      }
      meta.requestBody = payload;
      if (config.sessionHeaders) {
        for (const [name, value] of config.sessionHeaders) {
          try {
            nativeSetHeader.call(this, name, value);
            meta.headers.push([name, value]);
          } catch {
            void 0;
          }
        }
      }
      this.addEventListener('loadend', () => {
        const contentType = this.getResponseHeader('content-type') ?? '';
        let responseBody: string | null = null;
        try {
          if (this.responseType === '' || this.responseType === 'text') {
            responseBody = isTextual(contentType) ? truncate(this.responseText) : null;
          } else if (this.responseType === 'json' && this.response != null) {
            responseBody = truncate(JSON.stringify(this.response));
          }
        } catch {
          responseBody = null;
        }
        post({
          channel: CHANNEL,
          dir: 'in',
          type: 'record',
          record: {
            id: uid(),
            kind: 'xhr',
            method: meta.method,
            url: meta.url,
            host: hostOf(meta.url),
            status: this.status,
            statusText: this.statusText,
            ok: this.status >= 200 && this.status < 400,
            duration: performance.now() - meta.t0,
            startedAt: meta.startedAt,
            requestHeaders: meta.headers,
            responseHeaders: parseResponseHeaders(this.getAllResponseHeaders()),
            requestBody: meta.requestBody,
            responseBody,
            responseType: contentType,
            error: this.status === 0 ? 'network error' : null,
          },
        });
      });
    }
    return nativeSend.call(this, body ?? null);
  };

  const openStream = (kind: StreamKind, url: string): string => {
    const id = uid();
    post({
      channel: CHANNEL,
      dir: 'in',
      type: 'stream-open',
      meta: { id, kind, url, host: hostOf(url), at: Date.now() },
    });
    return id;
  };

  const streamFrame = (
    id: string,
    direction: 'send' | 'receive' | 'open' | 'close' | 'error',
    data: string,
  ): void => {
    post({
      channel: CHANNEL,
      dir: 'in',
      type: 'stream-frame',
      id,
      frame: { id: uid(), direction, data: truncate(data), at: Date.now() },
    });
  };

  const asText = (data: unknown): string => {
    if (typeof data === 'string') return data;
    if (data instanceof Blob) return '[blob]';
    if (data instanceof ArrayBuffer) return `[binary ${data.byteLength} bytes]`;
    return String(data);
  };

  const NativeWebSocket = window.WebSocket;
  const WebSocketProxy = new Proxy(NativeWebSocket, {
    construct(target, args: [string | URL, (string | string[])?]) {
      const socket = new target(...args);
      const id = openStream('ws', String(args[0]));
      socket.addEventListener('open', () => streamFrame(id, 'open', 'connection opened'));
      socket.addEventListener('message', (event) => streamFrame(id, 'receive', asText(event.data)));
      socket.addEventListener('close', () => {
        streamFrame(id, 'close', 'connection closed');
        post({ channel: CHANNEL, dir: 'in', type: 'stream-close', id });
      });
      socket.addEventListener('error', () => streamFrame(id, 'error', 'socket error'));
      const nativeSocketSend = socket.send.bind(socket);
      socket.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        streamFrame(id, 'send', asText(data));
        return nativeSocketSend(data as never);
      };
      return socket;
    },
  });
  window.WebSocket = WebSocketProxy;

  const NativeEventSource = window.EventSource;
  if (NativeEventSource) {
    const EventSourceProxy = new Proxy(NativeEventSource, {
      construct(target, args: [string | URL, EventSourceInit?]) {
        const source = new target(...args);
        const id = openStream('sse', String(args[0]));
        source.addEventListener('open', () => streamFrame(id, 'open', 'stream opened'));
        source.addEventListener('message', (event) =>
          streamFrame(id, 'receive', asText((event as MessageEvent).data)),
        );
        source.addEventListener('error', () => streamFrame(id, 'error', 'stream error'));
        return source;
      },
    });
    window.EventSource = EventSourceProxy;
  }
}
