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
 * The store is written on **every** transition, including `client.closeConnection()` — the documented
 * mobile backgrounding path — and it publishes a drop the moment it happens. If you are rendering a
 * "connection lost" banner, hold a drop for `WS_OFFLINE_ANNOUNCE_DELAY_MS` before showing it and
 * cancel it if the socket returns inside that window, which is what `<Chat>` does: the socket retries
 * on its own, and most drops resolve in well under a second.
 *
 * `connectionId` names the live connection: assigned when the socket announces itself, cleared when it
 * drops, because the server rejects a request carrying an id it has already closed. For "has this
 * client ever connected", read `lastOnlineAt`. Unlike the network store's, this `isOnline` is always a
 * boolean.
 *
 * Must run under `ChatProvider`, e.g. from a child of `<Chat>`.
 */
export const useWSConnectionState = (): WSConnectionState | undefined => {
  const { client } = useChatContext();
  return useStateStore(client?.wsConnection.state, identity);
};
