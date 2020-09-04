export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'channel.visible',
    cid: channel.cid,
    channel_type: channel.type,
    channel_id: channel.id,
    channel,
  });
};
