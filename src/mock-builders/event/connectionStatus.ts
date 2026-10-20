import type { StreamChat } from 'stream-chat';

/**
 * Sets the client's WebSocket status as a real socket coming up or going down would, by writing the
 * public `client.wsConnection.state` store instead of the internal `_setStatus`. The matching
 * timestamp is stamped too, since the real socket never reports a status without one.
 *
 * The `<Chat>` banner holds a drop for
 * `client.wsConnection.config.offlineNotificationDisplayDelayMs`, so a test asserting on it has to
 * advance timers.
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
  // The connection ID is published when the socket comes up and dropped when it goes down, so no
  // request carries one the server has closed.
  if (isHealthy) client.connectionIdManager.resolveConnectionId(connectionId);
  else client.connectionIdManager.invalidate();
};

/** Reports the device's network status, as a platform reporter would. */
export const setNetworkStatus = (client: StreamChat, isOnline: boolean) => {
  client.networkConnection.setStatus(isOnline);
};
