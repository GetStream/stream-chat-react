import { fromPartial } from '@total-typescript/shoehorn';
import type { ConnectionType, Event, StreamChat } from 'stream-chat';

/**
 * Dispatches `connection.changed`.
 *
 * `connection` defaults to `'ws'` so existing call sites keep the meaning they had before the event
 * gained a discriminator — every one of them was written when this event could only be about the
 * WebSocket. Pass `'network'` to simulate the device's network instead.
 */
export default (
  client: StreamChat,
  online: boolean,
  connection: ConnectionType = 'ws',
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      connection,
      online,
      type: 'connection.changed',
    }),
  );
};
