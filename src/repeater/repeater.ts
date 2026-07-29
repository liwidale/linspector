import type { Header, HttpMessage } from '../core/types';
import { parseRawHeaders } from '../utils/headers';

export interface RepeaterResult {
  status: number;
  statusText: string;
  headers: Header[];
  body: string;
  duration: number;
  error: string | null;
}

const hasBody = (method: string): boolean => !['GET', 'HEAD'].includes(method.toUpperCase());

export const sendRequest = async (message: HttpMessage): Promise<RepeaterResult> => {
  const started = performance.now();
  try {
    const response = await fetch(message.url, {
      method: message.method,
      headers: message.headers,
      body: hasBody(message.method) && message.body ? message.body : undefined,
      credentials: 'include',
      redirect: 'follow',
    });
    const body = await response.text();
    return {
      status: response.status,
      statusText: response.statusText,
      headers: parseRawHeaders([...response.headers].map(([k, v]) => `${k}: ${v}`).join('\n')),
      body,
      duration: performance.now() - started,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Failed',
      headers: [],
      body: '',
      duration: performance.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const forwardToRelay = async (endpoint: string, message: HttpMessage): Promise<boolean> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: [['content-type', 'application/json']],
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch {
    return false;
  }
};
