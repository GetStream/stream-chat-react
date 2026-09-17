import type { StreamChat } from 'stream-chat';

/**
 * Drives this client's WebSocket status, the way a real socket coming up or going down would.
 *
 * Connectivity is published as `client.wsConnection.state` and `client.networkConnection.state`, so
 * driving a test means writing the store.
 *
 * Through the public store rather than the socket's internal `_setStatus`, which
 * `no-underscore-dangle` rightly rejects. Timestamps are stamped too, since a status without one is a
 * state the real socket never produces.
 *
 * Anything reading this through the `<Chat>` banner holds a drop for
 * `client.wsConnection.config.offlineNotificationDisplayDelayMs` before showing it, so a test
 * asserting on that banner has to advance timers.
 */
export const setWSConnectionStatus = (
  client: StreamChat,
  isHealthy: boolean,
  connectionId = 'mock-connection-id',
) => {
  client.wsConnection.state.partialNext(
    isHealthy
      ? { isHealthy, lastHealthyAt: new Date() }
      : { isHealthy, lastUnhealthyAt: new Date() },
  );
  // The id is separate state with its own lifecycle: published when the socket announces itself,
  // dropped when it goes down so no request carries one the server has closed.
  if (isHealthy) client.connectionIdManager.resolveConnectionId(connectionId);
  else client.connectionIdManager.invalidate();
};

/** Reports the device's network status, as a platform reporter would. */
export const setNetworkStatus = (client: StreamChat, isOnline: boolean) => {
  client.networkConnection.setStatus(isOnline);
};
