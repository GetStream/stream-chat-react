import { fromPartial } from '@total-typescript/shoehorn';
import type {
  ChannelResponse,
  Event,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

export default (
  client: StreamChat,
  newMessage: MessageResponse,
  channel: ChannelResponse = fromPartial({}),
  user?: UserResponse,
) => {
  const [channel_id, channel_type] = channel.cid.split(':');
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      channel_id,
      channel_type,
      cid: channel.cid,
      message: newMessage,
      type: 'message.updated',
      user: user || newMessage.user,
    }),
  );
};
