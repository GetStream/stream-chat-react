import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  newMessage: MessageResponse,
  channel: ChannelResponse = fromPartial({}),
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      channel_id: channel.id,
      channel_type: channel.type,
      cid: channel.cid,
      message: newMessage,
      type: 'message.new',
      user: newMessage.user,
    }),
  );
};
