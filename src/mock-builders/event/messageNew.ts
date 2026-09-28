import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, LocalMessage, MessageResponse, StreamChat } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (
  client: StreamChat,
  newMessage: MessageResponse | LocalMessage,
  channel: ChannelOrResponse = fromPartial({}),
) => {
  const data = toChannelResponse(channel);
  client.dispatchEvent(
    fromPartial<Event>({
      channel: data,
      channel_id: data.id,
      channel_type: data.type,
      cid: data.cid,
      // Real WS message events carry the channel cid on the message; the paginator ingests only
      // messages matching its channel filter, so the mock must set it too.
      message: { ...newMessage, cid: newMessage.cid ?? data.cid } as MessageResponse,
      type: 'message.new',
      user: newMessage.user,
    }),
  );
};
