import type { ChannelResponse, StreamChat } from 'stream-chat';

export default (client: StreamChat, channel: ChannelResponse = {} as any) => {
  client.dispatchEvent({
    channel,
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    type: 'channel.visible',
  } as any);
};
