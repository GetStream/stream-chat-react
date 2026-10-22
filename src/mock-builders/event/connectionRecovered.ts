import { fromPartial } from '@total-typescript/shoehorn';
import type { ConnectionType, Event, StreamChat } from 'stream-chat';

/**
 * Dispatches `connection.recovered`. `connection` defaults to `'ws'`, the only value the client
 * dispatches.
 */
export default (client: StreamChat, connection: ConnectionType = 'ws') => {
  client.dispatchEvent(
    fromPartial<Event>({
      connection,
      type: 'connection.recovered',
    }),
  );
};
