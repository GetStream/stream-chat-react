/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

import { StreamChat } from 'stream-chat';

const apiKey = 'API_KEY';

const setUser = (client, user) => {
  return new Promise((resolve) => {
    const token = 'dummy_token';
    client.connectionId = 'dumm_connection_id';
    client.user = user;
    client._user = { ...user };
    client.userID = user.id;
    client.userToken = token;
    resolve();
  });
};

export const getTestClient = () => {
  const client = new StreamChat(apiKey);

  client.setUser = setUser.bind(null, client);

  return client;
};

export const getTestClientWithUser = async (user) => {
  const client = new StreamChat(apiKey);

  await setUser(client, user);

  return client;
};

export * from './api';
export * from './event';
export * from './generator';
