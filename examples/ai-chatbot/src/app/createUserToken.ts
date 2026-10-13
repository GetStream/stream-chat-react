import { createHmac } from 'node:crypto';

const base64Url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

/**
 * Signs a Stream Chat user token (an HS256 JWT whose payload is `{ user_id }`) with the app's API
 * secret. Server-only: the secret must never reach the browser.
 *
 * `stream-chat` v10 is a client-side SDK — its constructor takes no secret and it has no
 * `createToken()` — so the example signs the token itself instead of pulling in a server SDK.
 */
export const createUserToken = (userId: string, secret: string) => {
  const signingInput = [
    base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64Url(JSON.stringify({ user_id: userId })),
  ].join('.');

  const signature = createHmac('sha256', secret).update(signingInput).digest();

  return `${signingInput}.${base64Url(signature)}`;
};
