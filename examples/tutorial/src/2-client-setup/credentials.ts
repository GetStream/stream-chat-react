// Stream Chat credentials for the tutorial example.
//
// The example uses VITE_USER_TOKEN when you set one, the token the tutorial
// has you paste for your own app. Otherwise it fetches a fresh JWT from
// pronto.getstream.io for whichever user_id is active, so the app stays
// runnable without pasting a token that expires, and you can switch users
// via URL params at runtime:
//
//   ?user_id=alice                           // different user
//   ?user_id=alice&user_name=Alice           // + display name override
//
// Notes:
// - With no credentials at all, the example runs against Stream's demo app:
//   the API key defaults to the one the default "demo" token environment
//   issues tokens for.
// - To use your own app, set its apiKey. `getstream env --target vite` writes
//   VITE_STREAM_API_KEY, which is what the tutorial tells you to run;
//   VITE_API_KEY is still accepted for older local setups.
// - A fetched token is signed for the token environment's app, not yours:
//   the default "demo" environment belongs to one specific API key. Unless
//   apiKey is that key, set VITE_USER_TOKEN, or point VITE_TOKEN_ENDPOINT
//   and VITE_TOKEN_ENVIRONMENT at a token service for your app. The app
//   stops with an error naming both keys when they don't match.

const searchParams = new URLSearchParams(window.location.search);

const tokenEndpoint =
  import.meta.env.VITE_TOKEN_ENDPOINT ||
  'https://pronto.getstream.io/api/auth/create-token';
const tokenEnvironment = import.meta.env.VITE_TOKEN_ENVIRONMENT || 'demo';

// The app behind the default "demo" token environment. Only a fallback: a token service of your own
// issues tokens for your app, so it needs your key.
const DEMO_API_KEY = 'mmhfdzb5evj2';
const usesDemoTokenService =
  !import.meta.env.VITE_TOKEN_ENDPOINT && !import.meta.env.VITE_TOKEN_ENVIRONMENT;

const configuredApiKey: string | undefined =
  import.meta.env.VITE_STREAM_API_KEY || import.meta.env.VITE_API_KEY;

if (!configuredApiKey && !usesDemoTokenService) {
  throw new Error(
    'VITE_STREAM_API_KEY is not set. A custom VITE_TOKEN_ENDPOINT or VITE_TOKEN_ENVIRONMENT ' +
      "issues tokens for your own app, so the app needs that app's API key.",
  );
}

export const apiKey: string = configuredApiKey || DEMO_API_KEY;

const configuredUserId = import.meta.env.VITE_USER_ID || 'react-tutorial';

export const userId = searchParams.get('user_id') || configuredUserId;

export const userName =
  searchParams.get('user_name') || import.meta.env.VITE_USER_NAME || userId;

// A pasted token is issued for the configured user, so it is not used once the URL switches to
// another one.
const userToken: string | undefined =
  userId === configuredUserId ? import.meta.env.VITE_USER_TOKEN : undefined;

// Stream's `useCreateChatClient` accepts either a token string or a provider
// function. A provider lets the SDK refresh the token on reconnect, which is
// what we want for a long-running example session.
export const tokenProvider = async (): Promise<string> => {
  if (userToken) return userToken;

  const url = `${tokenEndpoint}?environment=${encodeURIComponent(
    tokenEnvironment,
  )}&user_id=${encodeURIComponent(userId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to mint token from ${tokenEndpoint} (${response.status})`);
  }
  const data = (await response.json()) as { apiKey?: string; token: string };
  // Connecting with a token signed for another app fails with an opaque "signature is not valid".
  if (data.apiKey && data.apiKey !== apiKey) {
    throw new Error(
      `The "${tokenEnvironment}" token environment issues tokens for API key ${data.apiKey}, ` +
        `but the app is configured with ${apiKey}. Set VITE_USER_TOKEN, or point ` +
        'VITE_TOKEN_ENVIRONMENT at the environment for your API key.',
    );
  }
  return data.token;
};
