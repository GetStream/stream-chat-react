/**
 * Returns the api response for markRead api
 *
 * api - /read
 *
 * @param {*} channel Initialized channel object.
 */
export const markReadApi = (channel) => ({
  duration: 0.01,
  event: {
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    created_at: new Date().toISOString(),
    last_read_message_id: channel.state.messages.slice(-1)[0],
    type: 'message.read',
    user: channel.getClient().user,
  },
});
