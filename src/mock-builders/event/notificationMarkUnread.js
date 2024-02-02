import { generateUser } from '../generator';

export default ({ channel, client, payload = {}, user }) =>
  client.dispatchEvent({
    channel: null,
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    // event creation timestamp
    created_at: new Date().toISOString(),
    first_unread_message_id: 'SmithAnne-jZsHxapoz50G3QwDiYmoQ',
    // creation date of a message with last_read_message_id
    last_read_at: '2023-12-15T11:49:21.667730943Z',
    last_read_message_id: 'SmithAnne-jeIYWT39L56bs79f10Hao',
    // @deprecated number of all unread messages across all my unread channels, equals unread_count
    total_unread_count: 19,
    type: 'notification.mark_unread',
    // number of all my channels with at least one unread message including the channel in this event
    unread_channels: 1,
    // number of all unread messages across all my unread channels
    unread_count: 19,
    // number of unread messages in the channel from this event
    unread_messages: 19,
    user: user || generateUser(),
    ...payload,
  });
