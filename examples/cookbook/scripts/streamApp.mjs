/**
 * Which Stream app the cookbook runs against. By default it's Stream's public demo app, whose token
 * endpoint signs a token for any user id. `VITE_STREAM_API_KEY` and `STREAM_SECRET` in
 * examples/cookbook/.env.local point it at an app of your own instead: the dev server and the seed
 * sign the cast's tokens with the secret, so the secret never reaches the browser.
 */
import { createHmac } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const cookbookDir = fileURLToPath(new URL('..', import.meta.url));

/**
 * The app of your own from the cookbook's env files or the shell's environment, or `undefined` for
 * the public demo app.
 * Setting only one of the two fails, so a half-configured app never falls back to the demo app.
 *
 * @param {string} [mode] Vite's mode, which picks the env files (`.env.<mode>.local` and the like).
 * @returns {{ apiKey: string; secret: string } | undefined}
 */
export const loadOwnApp = (mode = 'development') => {
  const env = loadEnv(mode, cookbookDir, ['VITE_STREAM_', 'STREAM_']);
  const apiKey = env.VITE_STREAM_API_KEY;
  const secret = env.STREAM_SECRET;
  if (!apiKey && !secret) return undefined;
  if (!apiKey || !secret)
    throw new Error(
      'Set both VITE_STREAM_API_KEY and STREAM_SECRET in examples/cookbook/.env.local or the shell, or neither for the public demo app.',
    );
  return { apiKey, secret };
};

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

/**
 * A user token for the app: a JWT signed with the app's secret, the same token a Stream server SDK
 * creates.
 *
 * @param {string} secret
 * @param {string} userId
 * @returns {string}
 */
export const createUserToken = (secret, userId) => {
  const unsigned = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ user_id: userId })}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
};

/**
 * The demo-data.json files of the recipes that have data of their own, in
 * src/recipes/<group>/<recipe>/, in the shape of src/base/demo-data.json.
 *
 * @returns {string[]}
 */
export const recipeDemoDataFiles = () => {
  const recipesDir = `${cookbookDir}src/recipes/`;
  return readdirSync(recipesDir, { withFileTypes: true })
    .filter((group) => group.isDirectory())
    .flatMap((group) =>
      readdirSync(`${recipesDir}${group.name}`, { withFileTypes: true })
        .filter((recipe) => recipe.isDirectory())
        .map((recipe) => `${recipesDir}${group.name}/${recipe.name}/demo-data.json`),
    )
    .filter((file) => existsSync(file));
};

const readUserIds = (file) =>
  (JSON.parse(readFileSync(file, 'utf8')).users ?? []).map((user) => user.id);

/**
 * The cookbook's cast: the users in src/base/demo-data.json and in every recipe's own
 * demo-data.json. The dev server signs tokens for these users only.
 *
 * @returns {Set<string>}
 */
export const readCastUserIds = () =>
  new Set(
    [`${cookbookDir}src/base/demo-data.json`, ...recipeDemoDataFiles()].flatMap(
      readUserIds,
    ),
  );
