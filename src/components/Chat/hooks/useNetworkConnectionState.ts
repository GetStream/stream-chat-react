import type { NetworkConnectionState } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

const identity = (state: NetworkConnectionState) => state;

/**
 * The device's network status, as reported by the platform listener registered on
 * `client.networkConnection`.
 *
 * Not the WebSocket status of {@link useWSConnectionState}: a socket can die on a working network,
 * and a device can drop before the socket notices. `isOnline` is `undefined` while unknown (no
 * reporter installed, or none has reported yet), so test `isOnline === false`, not `!isOnline`.
 *
 * Must run under `ChatProvider`, e.g. from a child of `<Chat>`.
 */
export const useNetworkConnectionState = (): NetworkConnectionState | undefined => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection.state, identity);
};

/**
 * {@link useNetworkConnectionState} narrowed to what a component reads, so it re-renders only when
 * that changes. The selector must return a flat object or tuple, which is shallow-compared.
 *
 * @example
 * ```tsx
 * const isOffline = useNetworkConnectionStateSelector(
 *   ({ isOnline }) => ({ isOffline: isOnline === false }),
 * )?.isOffline;
 * ```
 */
export const useNetworkConnectionStateSelector = <
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  selector: (state: NetworkConnectionState) => O,
): O | undefined => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection.state, selector);
};
