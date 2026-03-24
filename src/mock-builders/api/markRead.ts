import type { Channel } from 'stream-chat';

/**
 * Returns the api response for markRead api
 *
 * api - /read
 */
export const markReadApi = (channel: Channel) => ({
  duration: 0.01,
  event: {
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    created_at: new Date().toISOString(),
    last_read_message_id: channel.state.messages.slice(-1)[0],
    type: 'message.read' as const,
    user: channel.getClient().user,
  },
});
