export default (client, online) => {
  client.dispatchEvent({
    online,
    type: 'connection.changed',
  });
};
