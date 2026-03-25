import { fromPartial } from '@total-typescript/shoehorn';
import { StreamChat } from 'stream-chat';
import type { TokenManager, UserResponse } from 'stream-chat';
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
    client.wsPromise = Promise.resolve() as StreamChat['wsPromise'];
    resolve();
  });

interface MockClientOverrides {
  getAppSettings?: StreamChat['getAppSettings'];
  queryReactions?: StreamChat['queryReactions'];
}

function mockClient(client: StreamChat, mocks: MockClientOverrides = {}) {
  vi.spyOn(client, '_setToken').mockResolvedValue();
  vi.spyOn(client, '_setupConnection').mockReturnValue(undefined);
  vi.spyOn(client, 'getAppSettings').mockImplementation(
    mocks.getAppSettings ?? ((() => Promise.resolve({})) as StreamChat['getAppSettings']),
  );
  vi.spyOn(client, 'queryReactions').mockImplementation(
    mocks.queryReactions ??
      ((() => Promise.resolve({})) as unknown as StreamChat['queryReactions']),
  );
  client.tokenManager = fromPartial<TokenManager>({
    getToken: vi.fn(() => token),
    tokenReady: vi.fn(() => true),
  });
  vi.spyOn(client, 'connectUser').mockImplementation(
    (_user) => connectUser(client, _user) as any,
  );
  return client;
}

export const getTestClient = (mocks?: MockClientOverrides) =>
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
