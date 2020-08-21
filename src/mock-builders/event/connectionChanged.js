export default (client, online) => {
  client.dispatchEvent({
    type: 'connection.changed',
    online,
  });
};
