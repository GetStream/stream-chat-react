import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, MessageResponse, StreamChat, UserResponse } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (
  client: StreamChat,
  newMessage: MessageResponse,
  channel: ChannelOrResponse = fromPartial({}),
  user?: UserResponse,
) => {
  const data = toChannelResponse(channel);
  const [channel_id, channel_type] = data.cid.split(':');
  client.dispatchEvent(
    fromPartial<Event>({
      channel: data,
      channel_id,
      channel_type,
      cid: data.cid,
      message: newMessage,
      type: 'message.updated',
      user: user || newMessage.user,
    }),
  );
};
