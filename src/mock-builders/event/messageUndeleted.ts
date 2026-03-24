import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, MessageResponse, StreamChat } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (
  client: StreamChat,
  message: MessageResponse,
  channel: ChannelOrResponse = fromPartial({}),
) => {
  const data = toChannelResponse(channel);
  const [channel_id, channel_type] = data.cid.split(':');
  client.dispatchEvent(
    fromPartial<Event>({
      channel_id,
      channel_type,
      cid: data.cid,
      message,
      type: 'message.undeleted',
    }),
  );
};
