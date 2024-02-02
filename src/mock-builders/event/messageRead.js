export default (client, user, channel = {}, last_read_message_id) => {
  const event = {
    channel,
    cid: channel.cid,
    created_at: new Date().toISOString(),
    last_read_message_id: last_read_message_id || 'last_read_message_id',
    type: 'message.read',
    user,
  };
  client.dispatchEvent(event);

  return event;
};
