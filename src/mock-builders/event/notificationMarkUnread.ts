import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, Event, StreamChat, UserResponse } from 'stream-chat';

import { generateUser } from '../generator';
import { convertDateToTimestamp } from '../generator/time';

export default ({
  channel,
  client,
  payload = {},
  user,
}: {
  channel: Channel;
  client: StreamChat;
  payload?: Partial<Event>;
  user?: UserResponse;
}) =>
  client.dispatchEvent(
    fromPartial<Event>({
      channel: null,
      channel_id: channel.id,
      channel_type: channel.type,
      cid: channel.cid,
      created_at: convertDateToTimestamp(),
      first_unread_message_id: 'SmithAnne-jZsHxapoz50G3QwDiYmoQ',
      // creation date of the message `last_read_message_id` points to
      last_read_at: convertDateToTimestamp('2023-12-15T11:49:21.667730943Z'),
      last_read_message_id: 'SmithAnne-jeIYWT39L56bs79f10Hao',
      total_unread_count: 19,
      type: 'notification.mark_unread',
      // channels with unread messages, including the channel of this event
      unread_channels: 1,
      // unread messages across all channels
      unread_count: 19,
      // unread messages in the channel of this event
      unread_messages: 19,
      user: user || generateUser(),
      ...payload,
    }),
  );
