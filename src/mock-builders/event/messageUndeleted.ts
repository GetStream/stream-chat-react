import type { ChannelResponse, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  message: MessageResponse,
  channel: ChannelResponse = {} as any,
) => {
  const [channel_id, channel_type] = channel.cid.split(':');
  client.dispatchEvent({
    channel_id,
    channel_type,
    cid: channel.cid,
    message,
    type: 'message.undeleted',
  } as any);
};
