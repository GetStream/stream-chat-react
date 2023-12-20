export default ({ channel, client }) =>
  client.dispatchEvent({
    cid: channel?.cid,
    type: 'notification.mark_read',
  });
