import type { ChannelResponse, StreamChat, UserResponse } from 'stream-chat';

export default (
  client: StreamChat,
  user: UserResponse,
  channel: ChannelResponse = {} as any,
  last_read_message_id?: string,
) => {
  const event = {
    channel,
    cid: channel.cid,
    created_at: new Date().toISOString(),
    last_read_message_id: last_read_message_id || 'last_read_message_id',
    type: 'message.read' as const,
    user,
  };
  client.dispatchEvent(event as any);

  return event;
};
