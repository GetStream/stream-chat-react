import type { StreamChat } from 'stream-chat';

/**
 * Drives this client's WebSocket status, the way a real socket coming up or going down would.
 *
 * This replaces a helper that dispatched `connection.changed`. That event is gone: connectivity is
 * published as `client.wsConnection.state` and `client.networkConnection.state`, and writing the
 * store is what a test needs to do now.
 *
 * Written through the public store rather than the socket's internal `_setStatus`, which
 * `no-underscore-dangle` rightly rejects. The timestamps are stamped too, since a status without one
 * is a state the real socket never produces.
 *
 * Anything reading this through the `<Chat>` banner holds a drop for
 * `client.wsConnection.config.offlineNotificationDisplayDelayMs` before showing it, so a test
 * asserting on that banner has to advance timers.
 */
export const setWSConnectionStatus = (
  client: StreamChat,
  isOnline: boolean,
  connectionId = 'mock-connection-id',
) => {
  client.wsConnection.state.partialNext(
    isOnline
      ? { connectionId, isOnline, lastOnlineAt: new Date() }
      : { connectionId: undefined, isOnline, lastOfflineAt: new Date() },
  );
};

/** Reports the device's network status, as a platform reporter would. */
export const setNetworkStatus = (client: StreamChat, isOnline: boolean) => {
  client.networkConnection.setStatus(isOnline);
};
