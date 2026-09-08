import { fromPartial } from '@total-typescript/shoehorn';
import { StreamChat } from 'stream-chat';
import type { TokenManager, UserResponse } from 'stream-chat';
import { nanoid } from 'nanoid';

const apiKey = 'API_KEY';
const token = 'dummy_token';

const connectUser = (client: StreamChat, user: Partial<UserResponse>) =>
  new Promise<void>((resolve) => {
    // Mark the socket up, which is what "connected" means to the client: `channel.watch()` and
    // `client.queryChannels()` wait for a live connection instead of degrading to `watch: false`.
    //
    // Written through the public store rather than the socket's internal `_setStatus`, which
    // `no-underscore-dangle` rightly rejects — and a fixture standing in for a connection it never
    // opens is exactly the case for setting the state directly. `lastOnlineAt` is stamped too, since
    // online-without-a-timestamp is a state the real socket never produces.
    //
    // This replaces `client['connectionId'] = '…'`, which was dead — the client has no such field.
    // The connection id lives on the socket, so that assignment never satisfied the old
    // `_hasConnectionID()` guard, and every mocked `watch()` quietly took the downgrade path.
    client.wsConnection.state.partialNext({
      connectionId: 'dummy_connection_id',
      isOnline: true,
      lastOnlineAt: new Date(),
    });
    client.user = { ...user, mutes: [] } as UserResponse;
    client['_user'] = { ...user } as UserResponse;
    // `userID` is a getter in v10 (derives from `client.user?.id`), so it can't be assigned;
    // setting `client.user` above is what populates it.
    // `userToken` was never a field on `StreamChat` — only `userTokenOrProvider`, a parameter — so
    // this assignment wrote a property nothing reads. The `tokenManager` mock below is what actually
    // supplies the token.
    client.wsPromise = Promise.resolve() as StreamChat['wsPromise'];
    resolve();
  });

interface MockClientOverrides {
  getAppSettings?: StreamChat['getAppSettings'];
  queryReactions?: StreamChat['queryReactions'];
}

function mockClient(client: StreamChat, mocks: MockClientOverrides = {}) {
  vi.spyOn(client, '_setToken').mockResolvedValue();
  vi.spyOn(client, 'openConnection').mockReturnValue(undefined);
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
