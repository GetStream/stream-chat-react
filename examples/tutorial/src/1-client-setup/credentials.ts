// Stream Chat credentials for the tutorial example.
//
// The example fetches a fresh JWT from pronto.getstream.io for whichever
// user_id is active, so the app stays runnable without pasting a token
// that expires, and you can switch users via URL params at runtime:
//
//   ?user_id=alice                           // different user
//   ?user_id=alice&user_name=Alice           // + display name override
//
// Notes:
// - apiKey is the one thing you still need to set (via VITE_API_KEY).
// - The token endpoint and environment default to the values shared with
//   the other example apps in this repo; override with VITE_TOKEN_ENDPOINT
//   and VITE_TOKEN_ENVIRONMENT if you're pointing at a different Stream
//   app.

const searchParams = new URLSearchParams(window.location.search);

export const apiKey = import.meta.env.VITE_API_KEY;

export const userId =
  searchParams.get('user_id') || import.meta.env.VITE_USER_ID || 'react-tutorial';

export const userName =
  searchParams.get('user_name') || import.meta.env.VITE_USER_NAME || userId;

const tokenEndpoint =
  import.meta.env.VITE_TOKEN_ENDPOINT ||
  'https://pronto.getstream.io/api/auth/create-token';
const tokenEnvironment = import.meta.env.VITE_TOKEN_ENVIRONMENT || 'demo';

// Stream's `useCreateChatClient` accepts either a token string or a provider
// function. A provider lets the SDK refresh the token on reconnect, which is
// what we want for a long-running example session.
export const tokenProvider = async (): Promise<string> => {
  const url = `${tokenEndpoint}?environment=${encodeURIComponent(
    tokenEnvironment,
  )}&user_id=${encodeURIComponent(userId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to mint token from ${tokenEndpoint} (${response.status})`);
  }
  const data = (await response.json()) as { token: string };
  return data.token;
};
