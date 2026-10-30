import type { StreamChat } from 'stream-chat';

/**
 * Requests the cookbook may send to the shared demo app: reads, watching, typing events and the
 * user's own read state. Everything else (sending, editing, deleting, reacting, flagging, pinning,
 * adding members, updating channels) would change data every screenshot depends on.
 */
const ALLOWED_WRITES = [
  /\/chat\/channels$/, // queryChannels
  /\/chat\/channels\/read$/,
  /\/chat\/channels\/[^/]+\/[^/]+\/(query|event|read|unread|stop-watching)$/,
  /\/chat\/channels\/[^/]+\/[^/]+\/bans\/query$/,
  /\/chat\/(drafts|reminders|scheduled_messages)\/query$/,
  /\/chat\/threads$/,
  /\/polls\/query$/,
];

/**
 * Makes the cookbook read-only against the demo app: a blocked request never settles, so the UI
 * keeps its optimistic state (a reaction shows, a sent message stays "sending") and the server
 * stays unchanged. `?writes=on` turns it off, for testing against an app of your own.
 */
export const makeReadOnly = (client: StreamChat) => {
  if (new URLSearchParams(window.location.search).get('writes') === 'on')
    return () => undefined;

  const id = client.axiosInstance.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const path = (config.url ?? '').split('?')[0];
    if (method === 'get' || ALLOWED_WRITES.some((pattern) => pattern.test(path)))
      return config;
    console.info(`Cookbook is read-only: ${method.toUpperCase()} ${path} was not sent.`);
    return new Promise<never>(() => undefined);
  });

  return () => client.axiosInstance.interceptors.request.eject(id);
};
