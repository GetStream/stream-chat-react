import { StreamChat } from 'stream-chat';

/**
 * Creates a *server-side* StreamChat client inside the browser.
 *
 * ⚠️  This is a debugging aid for the demo app only, gated behind a feature flag. An API secret
 * grants full admin access to the whole app; it must never ship in a real client bundle. The
 * secret entered here is held in component state for the lifetime of the dialog and is never
 * persisted to localStorage, the URL, or anywhere else.
 *
 * Two obstacles, both worked around without patching the SDK:
 *
 * 1. `package.json#browser` maps `jsonwebtoken` to `false`, so the SDK cannot mint a server token
 *    in a browser bundle. The `{ "server": true }` HS256 token is signed with Web Crypto instead
 *    and injected into `tokenManager`, which is what `_getToken()` reads for the `Authorization`
 *    header.
 *
 * 2. The client constructor takes `(key, options)` only — there is no secret parameter — and
 *    `client.channel(...)` throws without a connected user. So callers must not build `Channel`
 *    objects; they issue requests through `client.api.sendRequest` instead (see serverSideMethods).
 *
 * `crypto.subtle` requires a secure context — fine on localhost and https.
 */

const textEncoder = new TextEncoder();

const base64Url = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const encodeSegment = (value: object) =>
  base64Url(textEncoder.encode(JSON.stringify(value)));

/**
 * HS256 JWT with the payload the Stream API expects from a server-side caller — exactly
 * `{"server":true}`, matching the SDK's own `JWTServerToken`.
 */
export const createServerToken = async (secret: string) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Web Crypto is unavailable — a secure context (https or localhost) is required to sign the server token.',
    );
  }

  const signingInput = `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment({
    server: true,
  })}`;

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(signingInput),
  );

  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
};

export const createServerSideClient = async ({
  apiKey,
  secret,
}: {
  apiKey: string;
  secret: string;
}) => {
  const token = await createServerToken(secret);

  // Not `getInstance` — that would hand back (and mutate) the app's user-authenticated singleton.
  const client = new StreamChat(apiKey, { allowServerSideConnect: true });

  client.tokenManager.token = token;
  client.tokenManager.type = 'static';

  return client;
};

/**
 * Cheap round-trip that fails fast on a wrong secret, so the dialog reports a bad credential
 * before a payload is composed. `getAppSettings` is server-side only, which makes it a precise
 * check that the token really is accepted as a server token — a bad secret comes back as
 * `Token signature is invalid`.
 */
export const verifyServerSideClient = async (client: StreamChat) => {
  await client.getAppSettings();
};
