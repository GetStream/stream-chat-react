/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

import { StreamChat } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

const apiKey = 'API_KEY';
const token = 'dummy_token';

const setUser = (client, user) => {
  return new Promise((resolve) => {
    client.connectionId = 'dumm_connection_id';
    client.user = user;
    client.user.mutes = [];
    client._user = { ...user };
    client.userID = user.id;
    client.userToken = token;
    client.wsPromise = Promise.resolve(true);
    resolve();
  });
};

function mockClient(client) {
  jest.spyOn(client, '_setToken').mockImplementation();
  jest.spyOn(client, '_setupConnection').mockImplementation();
  client.tokenManager = {
    tokenReady: jest.fn(() => true),
    getToken: jest.fn(() => token),
  };
  client.setUser = setUser.bind(null, client);
  return client;
}

export const getTestClient = () => {
  return mockClient(new StreamChat(apiKey));
};

export const getTestClientWithUser = async (user = { id: uuidv4() }) => {
  const client = mockClient(new StreamChat(apiKey));
  await setUser(client, user);
  return client;
};

export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
};

export * from './api';
export * from './event';
export * from './generator';
