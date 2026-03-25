import { StreamChat } from 'stream-chat';
import type { UserResponse } from 'stream-chat';
import { nanoid } from 'nanoid';

const apiKey = 'API_KEY';
const token = 'dummy_token';

const connectUser = (client: StreamChat, user: Partial<UserResponse>) =>
  new Promise<void>((resolve) => {
    client['connectionId'] = 'dumm_connection_id';
    client.user = { ...user, mutes: [] } as UserResponse;
    client['_user'] = { ...user } as UserResponse;
    client.userID = user.id;
    client['userToken'] = token;
    client.wsPromise = Promise.resolve(true) as any;
    resolve();
  });

const noop = () => {};

function mockClient(client: StreamChat, mocks: Record<string, any> = {}) {
  vi.spyOn(client, '_setToken').mockImplementation(noop as any);
  vi.spyOn(client, '_setupConnection').mockImplementation(noop as any);
  vi.spyOn(client, 'getAppSettings').mockImplementation(mocks.getAppSettings ?? noop);
  vi.spyOn(client, 'queryReactions').mockImplementation(mocks.queryReactions ?? noop);
  client.tokenManager = {
    getToken: vi.fn(() => token),
    tokenReady: vi.fn(() => true),
  } as any;
  client['connectUser'] = connectUser.bind(null, client) as any;
  return client;
}

export const getTestClient = (mocks?: Record<string, unknown>) =>
  mockClient(new StreamChat(apiKey), mocks);

export const getTestClientWithUser = async (
  user: Partial<UserResponse> = { id: nanoid() },
) => {
  const client = mockClient(new StreamChat(apiKey));
  await connectUser(client, user);
  return client;
};

export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
};

export * from './api';
export * from './event';
export * from './generator';
export * from './context';
export * from './translator';
export * from './utils';
