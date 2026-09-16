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
 * drop for `WS_OFFLINE_ANNOUNCE_DELAY_MS` before showing it. The label below flips at once.
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
  const { isOnline: socketOnline, connectionId } = useWSConnectionState() ?? {};

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
        aria-checked={!socketOnline}
        className='connection-dev-panel__toggle'
        data-state={String(socketOnline)}
        onClick={() => {
          const online = !socketOnline;
          // The store is the whole interface now — one write, which every consumer sees. This used
          // to write the store *and* dispatch an event, because the two carried different things.
          client.wsConnection.state.partialNext(
            online
              ? {
                  connectionId: 'dev-panel-connection',
                  isOnline: online,
                  lastOnlineAt: new Date(),
                }
              : { connectionId: undefined, isOnline: online, lastOfflineAt: new Date() },
          );
        }}
        role='switch'
        title={`client.wsConnection — this client's socket. connection id: ${String(connectionId)}`}
        type='button'
      >
        socket: {String(socketOnline)}
        <span className='connection-dev-panel__action'>
          {socketOnline ? 'take down' : 'bring up'}
        </span>
      </button>

      <span className='connection-dev-panel__hint'>
        network offline wins the copy; socket down alone reads as reconnecting
      </span>
    </aside>
  );
};
