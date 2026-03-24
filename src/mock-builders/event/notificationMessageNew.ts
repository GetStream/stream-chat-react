import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (client: StreamChat, channel: ChannelOrResponse = fromPartial({})) => {
  const data = toChannelResponse(channel);
  client.dispatchEvent(
    fromPartial<Event>({
      channel: data,
      cid: data.cid,
      type: 'notification.message_new',
    }),
  );
};
