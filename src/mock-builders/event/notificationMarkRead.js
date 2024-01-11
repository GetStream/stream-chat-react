import { generateUser } from '../generator';

export default ({ channel, client, payload, user }) =>
  client.dispatchEvent({
    channel: channel?.data,
    channel_id: channel?.id,
    channel_type: channel?.type,
    cid: channel?.cid,
    created_at: new Date().toISOString(),
    last_read_message_id: 'user_id-rfh6ieeQ8XCqabLN-GCHo',
    total_unread_count: 3,
    type: 'notification.mark_read',
    unread_channels: 1,
    unread_count: 3,
    user: user || generateUser(),
    ...payload,
  });
