import type { ChannelResponse, StreamChat, UserResponse } from 'stream-chat';

export default ({
  channel,
  client,
  hardDelete,
  user,
}: {
  channel: ChannelResponse & { name?: string }; // mock-builders are excluded in tsconfig.json
  client: StreamChat;
  hardDelete?: boolean;
  user: UserResponse;
}) => {
  if (channel) {
    const [channel_id, channel_type] = channel.cid.split(':');
    client.dispatchEvent({
      channel_custom: {
        // archived: false,
        name: channel.name,
      },
      channel_id,
      channel_member_count: 2,
      channel_type,
      cid: channel.cid,
      created_at: new Date().toISOString(),
      hard_delete: !!hardDelete,
      type: 'user.messages.deleted',
      user,
    });
  } else {
    client.dispatchEvent({
      created_at: new Date().toISOString(),
      hard_delete: !!hardDelete,
      type: 'user.messages.deleted',
      user,
    });
  }
};
