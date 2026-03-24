import type { ChannelResponse, StreamChat } from 'stream-chat';

export default (client: StreamChat, channel: ChannelResponse = {} as any) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'channel.updated',
  } as any);
};
