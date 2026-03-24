import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat } from 'stream-chat';

export default (client: StreamChat, channel: ChannelResponse = fromPartial({})) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      channel_id: channel.id,
      channel_type: channel.type,
      cid: channel.cid,
      type: 'channel.visible',
    }),
  );
};
