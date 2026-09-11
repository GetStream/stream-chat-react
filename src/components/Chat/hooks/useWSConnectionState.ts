import type { WSConnectionState } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

const identity = (state: WSConnectionState) => state;

/**
 * This client's **WebSocket** status — whether the realtime connection is up, and the connection id
 * the server keys channel watches by.
 *
 * Not the device's network: see {@link useNetworkConnectionState}. Use this for "reconnecting…", for
 * disabling a composer, or for anything that needs the realtime connection specifically.
 *
 * Two things worth knowing about the underlying store:
 *
 * - It reports transitions the `connection.changed` event does not. That event is not dispatched by
 *   `client.closeConnection()` — the documented mobile backgrounding path — nor by two internal error
 *   paths, while this store is written on every transition.
 * - It publishes a drop immediately, where the event waits five seconds to avoid strobing a
 *   "connection lost" banner on a brief flap.
 *
 * `connectionId` is assigned on a successful connect and **never cleared**, so a value there means
 * "connected at some point", not "connected now" — read `isOnline` for that. Unlike the network
 * store's, this `isOnline` is always a boolean.
 *
 * Must run under `ChatProvider`, e.g. from a child of `<Chat>`.
 */
export const useWSConnectionState = (): WSConnectionState | undefined => {
  const { client } = useChatContext();
  return useStateStore(client?.wsConnection.state, identity);
};
