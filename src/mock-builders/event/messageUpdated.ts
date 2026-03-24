import type {
  ChannelResponse,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

export default (
  client: StreamChat,
  newMessage: MessageResponse,
  channel: ChannelResponse = {} as any,
  user?: UserResponse,
) => {
  const [channel_id, channel_type] = channel.cid.split(':');
  client.dispatchEvent({
    channel,
    channel_id,
    channel_type,
    cid: channel.cid,
    message: newMessage,
    type: 'message.updated',
    user: user || newMessage.user,
  } as any);
};
