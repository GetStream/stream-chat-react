import type { Page } from 'playwright';

// The backend a render fixture was recorded against, so a replay needs no backend, no secrets and no
// Ruby (WEB-PLAN.md §8.3, the PR render gate): every chat API response the page received while
// loading, and the WebSocket's greeting (`connection.ok`). Replay serves them through Playwright's
// request and WebSocket routing, then dispatches the fixture's events as before.
//
// Only paths are kept, never query strings (the API key travels in them), and the replay uses a
// placeholder key and an unsigned stand-in token: the mock never checks either.

export type World = {
  http: Array<{ method: string; path: string; status: number; body: string }>;
  /** Frames the server sent on connect, before any event the fixture holds. */
  ws: string[];
};

const STREAM = /(^|\.)stream-io-api\.com$/;

/** Starts capturing; call before `page.goto`. The returned object fills as the page loads. */
export const recordWorld = (page: Page): World => {
  const world: World = { http: [], ws: [] };
  page.on('response', async (response) => {
    const url = new URL(response.url());
    const method = response.request().method();
    if (!STREAM.test(url.hostname) || method === 'OPTIONS') return;
    const body = await response.text().catch(() => '');
    world.http.push({ body, method, path: url.pathname, status: response.status() });
  });
  page.on('websocket', (ws) => {
    if (!STREAM.test(new URL(ws.url()).hostname)) return;
    ws.on('framereceived', ({ payload }) => {
      if (world.ws.length === 0) world.ws.push(String(payload));
    });
  });
  return world;
};

const base64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

/** An unsigned JWT naming `userId`: the client only reads it, and the mock never verifies it. */
export const offlineToken = (userId: string) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ user_id: userId })}.offline`;

export const OFFLINE_API_KEY = 'offline';

/** Serves a recorded world to `page`; call before `page.goto`. */
export const serveWorld = async (page: Page, world: World) => {
  // Each (method, path) answers with its recordings in order, then repeats the last one.
  const queues = new Map<string, World['http']>();
  for (const h of world.http) {
    const key = `${h.method} ${h.path}`;
    queues.set(key, [...(queues.get(key) ?? []), h]);
  }
  await page.route(
    (url) => STREAM.test(url.hostname),
    async (route) => {
      const request = route.request();
      const origin = (await request.headerValue('origin')) ?? '*';
      const cors = {
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'access-control-allow-origin': origin,
      };
      if (request.method() === 'OPTIONS')
        return route.fulfill({ headers: cors, status: 204 });
      const queue =
        queues.get(`${request.method()} ${new URL(request.url()).pathname}`) ?? [];
      const hit = queue.length > 1 ? queue.shift()! : queue[0];
      return route.fulfill({
        body: hit?.body || '{}',
        contentType: 'application/json',
        headers: cors,
        status: hit?.status ?? 200,
      });
    },
  );
  const greeting = world.ws[0];
  if (!greeting) throw new Error('the fixture holds no WebSocket greeting: re-record it');
  const healthCheck = JSON.stringify({ ...JSON.parse(greeting), type: 'health.check' });
  // A function, not the regex: routeWebSocket matches a RegExp against the whole URL string.
  await page.routeWebSocket(
    (url) => STREAM.test(url.hostname),
    (ws) => {
      ws.send(greeting);
      // The client sends health checks; answer each the way the server does.
      ws.onMessage(() => ws.send(healthCheck));
    },
  );
};
