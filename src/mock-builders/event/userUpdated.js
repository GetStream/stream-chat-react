export default (client, user) => {
  client.dispatchEvent({
    created_at: new Date().toISOString(),
    type: 'user.updated',
    user,
  });
};
