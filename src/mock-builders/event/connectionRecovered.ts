import { fromPartial } from '@total-typescript/shoehorn';
import type { ConnectionType, Event, StreamChat } from 'stream-chat';

/**
 * Dispatches `connection.recovered`.
 *
 * `connection` defaults to `'ws'`, which is also the only value the client actually dispatches today —
 * recovery is about the socket being back and its watches re-established.
 */
export default (client: StreamChat, connection: ConnectionType = 'ws') => {
  client.dispatchEvent(
    fromPartial<Event>({
      connection,
      type: 'connection.recovered',
    }),
  );
};
