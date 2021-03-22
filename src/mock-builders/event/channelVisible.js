export default (client, channel = {}) => {
  client.dispatchEvent({
    channel,
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    type: 'channel.visible',
  });
};
