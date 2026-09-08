import type { NetworkConnectionState } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

const identity = (state: NetworkConnectionState) => state;

/**
 * The **device's** network status, as reported by the platform listener registered on
 * `client.networkConnection`.
 *
 * Not the same fact as {@link useWSConnectionState}, and the difference is the point: a socket dies on
 * a working network (a server close, an expired token, a health-check timeout), and a device drops
 * while the socket has not noticed yet. Use this for "you're offline"; use the WebSocket hook for
 * "reconnecting…".
 *
 * `isOnline` has **three** states. `undefined` means *unknown* — nobody has told the client, because
 * no registrar is installed or one is installed and has not reported yet. So a guard must test
 * `isOnline === false`; `!isOnline` is also true when the answer is unknown and would claim "offline"
 * on any host without a registrar. (The WebSocket store's `isOnline` is always a boolean, so `!` is
 * fine there.)
 *
 * Must run under `ChatProvider`, e.g. from a child of `<Chat>`.
 */
export const useNetworkConnectionState = (): NetworkConnectionState | undefined => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection.state, identity);
};

/**
 * {@link useNetworkConnectionState} narrowed to what a component actually reads, so it re-renders
 * only when that changes.
 *
 * The selector must return a flat object or tuple — it is shallow-compared on its own keys.
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
