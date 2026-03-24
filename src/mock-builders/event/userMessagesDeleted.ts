import type { StreamChat, UserResponse } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default ({
  channel,
  client,
  hardDelete,
  user,
}: {
  client: StreamChat;
  channel?: ChannelOrResponse;
  hardDelete?: boolean;
  user: Partial<UserResponse>;
}) => {
  if (channel) {
    const data = toChannelResponse(channel);
    const [channel_id, channel_type] = data.cid.split(':');
    client.dispatchEvent({
      channel_custom: {
        name: (data as any).name as string | undefined,
      },
      channel_id,
      channel_member_count: 2,
      channel_type,
      cid: data.cid,
      created_at: new Date().toISOString(),
      hard_delete: !!hardDelete,
      type: 'user.messages.deleted',
      user: user as UserResponse,
    });
  } else {
    client.dispatchEvent({
      created_at: new Date().toISOString(),
      hard_delete: !!hardDelete,
      type: 'user.messages.deleted',
      user: user as UserResponse,
    });
  }
};
