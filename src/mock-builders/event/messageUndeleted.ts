import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, LocalMessage, MessageResponse, StreamChat } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (
  client: StreamChat,
  message: MessageResponse | LocalMessage,
  channel: ChannelOrResponse = fromPartial({}),
) => {
  const data = toChannelResponse(channel);
  const [channel_id, channel_type] = data.cid.split(':');
  client.dispatchEvent(
    fromPartial<Event>({
      channel_id,
      channel_type,
      cid: data.cid,
      message: message as MessageResponse,
      type: 'message.undeleted',
    }),
  );
};
