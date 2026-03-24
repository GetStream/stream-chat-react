import type { ChannelAPIResponse, StreamChat, UserResponse } from 'stream-chat';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
} from './generator';
import { getOrCreateChannelApi, getTestClientWithUser, useMockedApis } from './index';
import { generateMessageDraft } from './generator/messageDraft';
import type { DeepPartial } from '../types/types';

interface CreateClientWithChannelOptions {
  channelData?: Record<string, unknown>;
  empty?: boolean;
  existingClient?: StreamChat | null;
  existingUsers?: UserResponse[] | null;
  memberCount?: number;
  messageCount?: number;
}

export async function createClientWithChannel({
  channelData = { image: 'image-xxx', name: 'channel-xxx' },
  empty = false,
  existingClient = null,
  existingUsers = null,
  memberCount = 2,
  messageCount = 20,
}: CreateClientWithChannelOptions = {}) {
  const users =
    existingUsers || Array.from({ length: memberCount }, () => generateUser());
  const members = users.map((user) => generateMember({ user }));
  const mockedChannel = generateChannel({
    data: channelData,
    members,
    messages: empty
      ? []
      : ' '
          .repeat(messageCount)
          .split(' ')
          .map((_v, i) => generateMessage({ user: users[i % memberCount] as any })),
  } as DeepPartial<ChannelAPIResponse>);

  const client = existingClient || (await getTestClientWithUser({ id: users[0].id }));
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', (mockedChannel as any).id);
  await channel.watch();

  return { channel, client, users };
}

export const initChannelFromData = async ({
  channelData,
  client,
  defaultGenerateChannelOptions,
}: {
  channelData: any;
  client: StreamChat;
  defaultGenerateChannelOptions: any;
}) => {
  const mockedChannelData = generateChannel({
    ...defaultGenerateChannelOptions,
    ...channelData,
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [getOrCreateChannelApi(mockedChannelData)]);
  const channel = client.channel(
    mockedChannelData.channel.type,
    mockedChannelData.channel.id,
  );
  await channel.watch();
  vi.spyOn(channel, 'getConfig').mockImplementation(
    () => mockedChannelData.channel.config as any,
  );
  vi.spyOn(channel, 'getDraft').mockImplementation(
    () => generateMessageDraft({ channel_cid: channel.cid }) as any,
  );
  return channel;
};

export const initClientWithChannels = async ({
  channelsData,
  customUser,
}: {
  channelsData?: any[];
  customUser?: Partial<UserResponse>;
} = {}) => {
  const user = customUser || generateUser();
  const client = await getTestClientWithUser(user);
  const defaultGenerateChannelOptions = {
    members: [generateMember({ user } as any)],
  };
  const channels = await Promise.all(
    (channelsData ?? [defaultGenerateChannelOptions]).map((channelData) =>
      initChannelFromData({ channelData, client, defaultGenerateChannelOptions }),
    ),
  );

  return { channels, client };
};
