import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat, UserResponse } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (
  client: StreamChat,
  user: UserResponse,
  channel: ChannelOrResponse = fromPartial({}),
  last_read_message_id?: string,
) => {
  const data = toChannelResponse(channel);
  const event = fromPartial<Event>({
    channel: data,
    cid: data.cid,
    created_at: new Date().toISOString(),
    last_read_message_id: last_read_message_id || 'last_read_message_id',
    type: 'message.read' as const,
    user,
  });
  client.dispatchEvent(event);

  return event;
};
