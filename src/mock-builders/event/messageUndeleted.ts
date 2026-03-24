import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  message: MessageResponse,
  channel: ChannelResponse = fromPartial({}),
) => {
  const [channel_id, channel_type] = channel.cid.split(':');
  client.dispatchEvent(
    fromPartial<Event>({
      channel_id,
      channel_type,
      cid: channel.cid,
      message,
      type: 'message.undeleted',
    }),
  );
};
