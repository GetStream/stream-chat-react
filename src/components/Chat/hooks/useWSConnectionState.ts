import type { WSConnectionState } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

const identity = (state: WSConnectionState) => state;

/**
 * The client's WebSocket status, as held by `client.wsConnection`.
 *
 * Not the device's network, see {@link useNetworkConnectionState}. `isHealthy` is always a boolean.
 * The store publishes every transition the moment it happens, including `client.closeConnection()`,
 * so a "connection lost" banner should hold a drop for
 * `client.wsConnection.config.offlineNotificationDisplayDelayMs`, as `<Chat>` does. The connection
 * ID lives on `client.connectionIdManager`, not here.
 *
 * Must run under `ChatProvider`, e.g. from a child of `<Chat>`.
 */
export const useWSConnectionState = (): WSConnectionState | undefined => {
  const { client } = useChatContext();
  return useStateStore(client?.wsConnection.state, identity);
};
