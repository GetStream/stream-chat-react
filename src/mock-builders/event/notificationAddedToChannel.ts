import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat } from 'stream-chat';

export default (client: StreamChat, channel: ChannelResponse = fromPartial({})) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      type: 'notification.added_to_channel',
    }),
  );
};
