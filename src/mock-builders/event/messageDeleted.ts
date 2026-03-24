import type { ChannelResponse, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  message: MessageResponse,
  channel: ChannelResponse = {} as any,
) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    message,
    type: 'message.deleted',
  } as any);
};
