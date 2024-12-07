/* eslint-disable no-underscore-dangle */
import { StreamChat } from 'stream-chat';
import { nanoid } from 'nanoid';

const apiKey = 'API_KEY';
const token = 'dummy_token';

const connectUser = (client, user) =>
  new Promise((resolve) => {
    client.connectionId = 'dumm_connection_id';
    client.user = user;
    client.user.mutes = [];
    client._user = { ...user };
    client.userID = user.id;
    client.userToken = token;
    client.wsPromise = Promise.resolve(true);
    resolve();
  });

function mockClient(client, mocks = {}) {
  jest.spyOn(client, '_setToken').mockImplementation();
  jest.spyOn(client, '_setupConnection').mockImplementation();
  jest.spyOn(client, 'getAppSettings').mockImplementation(mocks.getAppSettings);
  jest.spyOn(client, 'queryReactions').mockImplementation(mocks.queryReactions);
  client.tokenManager = {
    getToken: jest.fn(() => token),
    tokenReady: jest.fn(() => true),
  };
  client.connectUser = connectUser.bind(null, client);
  return client;
}

export const getTestClient = (mocks) => mockClient(new StreamChat(apiKey), mocks);

export const getTestClientWithUser = async (user = { id: nanoid() }) => {
  const client = mockClient(new StreamChat(apiKey));
  await connectUser(client, user);
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
export * from './translator';
export * from './utils';
