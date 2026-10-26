import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { chromium } from 'playwright';

import type { TraceCdp } from './frames.ts';

// A browser the runner drives over raw CDP, without Playwright attached (WB-01). Playwright keeps
// every page it is attached to visible, whatever the tab layout (step 1, Q4), so a hidden tab needs
// a Chrome nobody automates through Playwright: Playwright's own Chromium binary, launched with
// --remote-debugging-port, controlled over the DevTools HTTP endpoints and WebSocket.

export type RawCdp = TraceCdp & {
  send: (method: string, params?: Record<string, unknown>) => Promise<any>;
};

/** A CDP connection over a WebSocket (Node's global WebSocket). */
export const connect = async (wsUrl: string): Promise<RawCdp> => {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let next = 0;
  const pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  const listeners = new Map<string, Array<(params: unknown) => void>>();
  ws.onmessage = (message) => {
    const msg = JSON.parse(String(message.data));
    if (msg.id) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p?.reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else p?.resolve(msg.result);
    } else {
      const callbacks = listeners.get(msg.method) ?? [];
      listeners.delete(msg.method);
      for (const callback of callbacks) callback(msg.params);
    }
  };
  const cdp = {
    detach: async () => ws.close(),
    once: (event: string, callback: (params: unknown) => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), callback]);
      return cdp;
    },
    send: (method: string, params: Record<string, unknown> = {}) =>
      new Promise((resolve, reject) => {
        const id = ++next;
        pending.set(id, { reject, resolve });
        ws.send(JSON.stringify({ id, method, params }));
      }),
  };
  return cdp as unknown as RawCdp;
};

/** Runs `expression` in the page and returns its (awaited) value. */
export const evaluate = async <T = unknown>(
  cdp: RawCdp,
  expression: string,
): Promise<T> => {
  const { exceptionDetails, result } = await cdp.send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return result.value as T;
};

export type RawBrowser = {
  /** The DevTools HTTP endpoint, e.g. http://127.0.0.1:9333 */
  endpoint: string;
  /** The browser-level connection (tracing). */
  browser: RawCdp;
  /** The first tab, and its target id. */
  page: RawCdp;
  pageId: string;
  /** Opens a new tab in front (the tab under it becomes hidden); returns its id. */
  cover: () => Promise<string>;
  /** Brings a tab to the front. */
  activate: (targetId: string) => Promise<void>;
  closeTab: (targetId: string) => Promise<void>;
  close: () => Promise<void>;
};

export const launchRaw = async (port = 9333): Promise<RawBrowser> => {
  const userDataDir = mkdtempSync(join(tmpdir(), 'perf-wb01-'));
  const chrome: ChildProcess = spawn(
    chromium.executablePath(),
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      // A window other apps cover counts as hidden on macOS and stops rendering, before the run
      // ever hides the tab itself (Playwright passes the same flag). Hiding the TAB still throttles.
      '--disable-backgrounding-occluded-windows',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const endpoint = `http://127.0.0.1:${port}`;
  let version: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 100 && !version; i++) {
    version = await fetch(`${endpoint}/json/version`)
      .then((r) => r.json() as Promise<{ webSocketDebuggerUrl: string }>)
      .catch(() => undefined);
    if (!version) await new Promise((r) => setTimeout(r, 100));
  }
  if (!version) throw new Error(`Chrome did not open its DevTools endpoint on ${port}`);
  const targets = (await (await fetch(`${endpoint}/json/list`)).json()) as Array<{
    id: string;
    type: string;
    webSocketDebuggerUrl: string;
  }>;
  const tab = targets.find((t) => t.type === 'page')!;
  return {
    activate: async (id) => {
      await fetch(`${endpoint}/json/activate/${id}`);
    },
    browser: await connect(version.webSocketDebuggerUrl),
    close: async () => {
      chrome.kill();
      await new Promise((r) => setTimeout(r, 500));
      rmSync(userDataDir, { force: true, recursive: true });
    },
    closeTab: async (id) => {
      await fetch(`${endpoint}/json/close/${id}`);
    },
    cover: async () => {
      const res = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' });
      return ((await res.json()) as { id: string }).id;
    },
    endpoint,
    page: await connect(tab.webSocketDebuggerUrl),
    pageId: tab.id,
  };
};
