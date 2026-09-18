import { useRef } from 'react';
import {
  useChatContext,
  useNetworkConnectionState,
  useWSConnectionState,
} from 'stream-chat-react';

import './ConnectionDevPanel.scss';

/**
 * Drives the two connection facts independently, so the pair that disagrees can actually be seen.
 *
 * DevTools' "Offline" checkbox is no use for this: it takes down `navigator.onLine` **and** the
 * socket, which is the one combination that always worked. What needs exercising is a dead socket on
 * a live network — a server close, an expired token, a health-check timeout — because that is the case
 * the banner used to describe as "Waiting for network…".
 *
 * **Both toggles simulate rather than sever.** The socket one writes `client.wsConnection.state`,
 * which is what the real socket does and what every consumer reads. Closing the real socket is no
 * good for a toggle: `StableWSConnection` reconnects on its own within a second or two, so it would
 * flip back by itself.
 *
 * Taking the socket down therefore takes five seconds to reach the banner, because `<Chat>` holds a
 * drop for `offlineNotificationDisplayDelayMs` before showing it. The label below flips at once.
 *
 * For the genuine path, close the socket from the console instead:
 *
 * ```js
 * client.wsConnection.connection.ws.close()
 * ```
 *
 * Dev-only. Nothing here belongs in an application: `setStatus` is for a platform listener rather
 * than a button.
 */
export const ConnectionDevPanel = () => {
  const { client } = useChatContext();
  const { isOnline: networkOnline } = useNetworkConnectionState() ?? {};
  const { isHealthy: socketHealthy } = useWSConnectionState() ?? {};
  // Not in the socket's store: the id belongs to `client.connectionIdManager`. Read during render
  // rather than subscribed to, which is enough here - both stores above re-render this panel.
  const connectionId = client?.connectionIdManager.connectionId;
  // Parked while the socket is simulated down, so bringing it back hands the *same* id over. See
  // the toggle below for why inventing one is not an option.
  const parkedConnectionId = useRef<string | undefined>(undefined);

  if (!client) return null;

  return (
    <aside className='connection-dev-panel'>
      <span className='connection-dev-panel__label'>connection</span>

      <button
        aria-checked={networkOnline === false}
        className='connection-dev-panel__toggle'
        // `=== false`, never `!networkOnline`: `undefined` means no reporter has reported, and
        // unknown must not render as offline.
        data-state={String(networkOnline)}
        onClick={() => client.networkConnection.setStatus(networkOnline === false)}
        role='switch'
        title='client.networkConnection — the device network, via setStatus()'
        type='button'
      >
        network: {String(networkOnline)}
        <span className='connection-dev-panel__action'>
          {networkOnline === false ? 'bring online' : 'take offline'}
        </span>
      </button>

      <button
        aria-checked={!socketHealthy}
        className='connection-dev-panel__toggle'
        data-state={String(socketHealthy)}
        onClick={() => {
          // The status the click moves the socket *to*, not the one it is in.
          const nextHealthy = !socketHealthy;
          // Two writes, because the socket's status and its connection id have separate owners. The
          // real socket does both: `_applyHealth` invalidates the id on the way down, and the hello
          // frame resolves a new one. Leaving a live id behind would let requests that watch or
          // subscribe to presence sail through a socket this panel calls down.
          client.wsConnection.state.partialNext(
            nextHealthy
              ? { isHealthy: nextHealthy, lastHealthyAt: new Date() }
              : { isHealthy: nextHealthy, lastUnhealthyAt: new Date() },
          );
          // The id has to be the real one. Coming back up is a recovery edge, so the client re-queries
          // every channel list and reloads the open channel at once; an invented id makes the server
          // reject all of them with a 400. Park the live id on the way down and hand that same one
          // back. With none parked - the socket is genuinely closed - leave the manager alone and let
          // the real handshake settle it, which holds those requests rather than failing them.
          if (!nextHealthy) {
            parkedConnectionId.current = client.connectionIdManager.connectionId;
            client.connectionIdManager.invalidate();
          } else if (parkedConnectionId.current) {
            client.connectionIdManager.resolveConnectionId(parkedConnectionId.current);
            parkedConnectionId.current = undefined;
          }
        }}
        role='switch'
        title={`client.wsConnection — this client's socket. connection id: ${String(connectionId)}`}
        type='button'
      >
        socket: {String(socketHealthy)}
        <span className='connection-dev-panel__action'>
          {socketHealthy ? 'take down' : 'bring up'}
        </span>
      </button>

      <span className='connection-dev-panel__hint'>
        network offline wins the copy; socket down alone reads as reconnecting
      </span>
    </aside>
  );
};
