import type {
  Channel,
  CustomChannelData,
  Event,
  StreamChat,
  UserResponse,
} from 'stream-chat';

type MessageDeliveredEvent = {
  channel_custom: CustomChannelData;
  channel_id: string;
  channel_member_count: number;
  channel_type: string;
  cid: string;
  created_at: string;
  last_delivered_at: string;
  last_delivered_message_id: string;
  user: UserResponse;
};
export const makeMessageDeliveredEvent = (
  event: Partial<MessageDeliveredEvent> = {},
): Event => ({
  channel_custom: {
    name: 'Test',
  },
  channel_id: 'test',
  channel_member_count: 2,
  channel_type: 'messaging',
  cid: 'messaging:test',
  created_at: '2025-09-16T13:25:57.996011272Z',
  last_delivered_at: '2025-09-16T13:25:57Z',
  last_delivered_message_id: 'aefbf38a-0e02-4ba6-a480-e595c37ec78a',
  type: 'message.delivered',
  user: {
    banned: false,
    blocked_user_ids: [],
    created_at: '2025-09-16T09:01:40.650479Z',
    id: 'test1',
    last_active: '2025-09-16T13:22:52.69594176Z',
    online: true,
    role: 'user',
    teams: [],
    updated_at: '2025-09-16T12:40:29.86597Z',
  },
  ...event,
});

export const dispatchMessageDeliveredEvent = ({
  channel,
  client,
  deliveredAt,
  lastDeliveredMessageId,
  user,
}: {
  channel: Channel;
  client: StreamChat;
  deliveredAt: string;
  lastDeliveredMessageId: string;
  user?: UserResponse;
}) =>
  client.dispatchEvent(
    makeMessageDeliveredEvent({
      channel_id: channel.id,
      channel_member_count: channel.data?.member_count || 0,
      channel_type: channel.type,
      cid: channel.cid,
      created_at: new Date().toISOString(),
      last_delivered_at: deliveredAt,
      last_delivered_message_id: lastDeliveredMessageId,
      user,
    }),
  );
