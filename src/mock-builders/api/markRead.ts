import type { Channel } from 'stream-chat';
import { convertDateToTimestamp } from '../generator/time';

/**
 * Returns the api response for markRead api
 *
 * api - /read
 */
export const markReadApi = (channel: Channel) => ({
  duration: '0.01s',
  event: {
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    created_at: convertDateToTimestamp(),
    last_read_message_id: channel.messagePaginator.headmostItem?.id,
    type: 'message.read' as const,
    user: channel.getClient().user,
  },
});
