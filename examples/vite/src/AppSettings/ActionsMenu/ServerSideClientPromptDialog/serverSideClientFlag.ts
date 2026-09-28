/**
 * Feature flag for the server-side client dialog.
 *
 * Off by default and opted into per session with `?server_side_client=1` — the same URL-param
 * convention the demo uses for its other variants (`message_ui`, `reactions`, …). The dialog can
 * hold an API secret, so it should never appear unless somebody deliberately asked for it.
 */
export const SERVER_SIDE_CLIENT_URL_PARAM = 'server_side_client';

const ENABLED_VALUES = new Set(['1', 'true', 'on', 'yes']);

export const isServerSideClientEnabled = () => {
  if (typeof window === 'undefined') return false;

  const value = new URLSearchParams(window.location.search).get(
    SERVER_SIDE_CLIENT_URL_PARAM,
  );

  return value !== null && ENABLED_VALUES.has(value.toLowerCase());
};
