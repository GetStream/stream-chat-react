export default (client, newMessage, channel = {}, user) => {
  const [channel_id, channel_type] = channel.cid.split(':');
  client.dispatchEvent({
    channel,
    channel_id,
    channel_type,
    cid: channel.cid,
    message: newMessage,
    type: 'message.updated',
    user: user || newMessage.user,
  });
};
