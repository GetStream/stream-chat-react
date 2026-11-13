import { defineConfig } from 'vite';
import type { Connect, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createUserToken, loadOwnApp, readCastUserIds } from './scripts/streamApp.mjs';

/** Where the cookbook asks for a user token when it runs against an app of your own. */
const TOKEN_PATH = '/cookbook/token';

/**
 * Signs the cast's user tokens with the app's secret, on the dev and preview servers only, so the
 * secret stays out of the browser bundle. `GET /cookbook/token?user_id=<id>` answers
 * `{ "token": "…" }`, and 403 for a user who isn't in the cast. It reads the cast on every request,
 * so a recipe's new users need no restart. With `--host`, anyone on the network can get the cast's
 * tokens for the app, and nothing more.
 */
const tokenEndpoint = (secret: string): Plugin => {
  const signToken: Connect.NextHandleFunction = (request, response) => {
    const userId = new URL(request.url ?? '', 'http://localhost').searchParams.get(
      'user_id',
    );
    response.setHeader('Content-Type', 'application/json');
    if (!userId || !readCastUserIds().has(userId)) {
      response.statusCode = 403;
      response.end(JSON.stringify({ error: 'Not a cookbook user' }));
      return;
    }
    response.end(JSON.stringify({ token: createUserToken(secret, userId) }));
  };
  return {
    configurePreviewServer: (server) => {
      server.middlewares.use(TOKEN_PATH, signToken);
    },
    configureServer: (server) => {
      server.middlewares.use(TOKEN_PATH, signToken);
    },
    name: 'cookbook-token-endpoint',
  };
};

export default defineConfig(({ mode }) => {
  const ownApp = loadOwnApp(mode);
  return {
    plugins: [react(), ...(ownApp ? [tokenEndpoint(ownApp.secret)] : [])],
    // `stream-chat-react` is consumed as a workspace dependency, so Vite serves
    // its built output from outside this app's root and resolves that copy's
    // `react` import separately from the app's. Without deduping, the SDK and the
    // app end up on two React instances and every hook call throws.
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  };
});
