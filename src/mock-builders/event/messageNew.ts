import type { ChannelResponse, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  newMessage: MessageResponse,
  channel: ChannelResponse = {} as any,
) => {
  client.dispatchEvent({
    channel,
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    message: newMessage,
    type: 'message.new',
    user: newMessage.user,
  } as any);
};
