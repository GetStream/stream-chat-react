export default (client, message, channel = {}) => {
  const [channel_id, channel_type] = channel.cid.split(':');
  client.dispatchEvent({
    channel_id,
    channel_type,
    cid: channel.cid,
    message,
    type: 'message.undeleted',
  });
};
