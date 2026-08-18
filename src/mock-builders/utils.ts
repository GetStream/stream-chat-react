import type {
  ChannelConfigWithInfo,
  ChannelResponse,
  GetDraftResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import type { GenerateChannelOptions } from './generator/channel';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
} from './generator';
import { getOrCreateChannelApi, getTestClientWithUser, useMockedApis } from './index';
import { generateMessageDraft } from './generator/messageDraft';

interface CreateClientWithChannelOptions {
  channelData?: Partial<ChannelResponse>;
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
    channel: channelData,
    members,
    messages: empty
      ? []
      : (' '
          .repeat(messageCount)
          .split(' ')
          .map((_v, i) => generateMessage({ user: users[i % memberCount] })) as any),
  });

  const client = existingClient || (await getTestClientWithUser({ id: users[0].id }));
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel['id']);
  await channel.watch();

  return { channel, client, users };
}

export const initChannelFromData = async ({
  channelData,
  client,
  defaultGenerateChannelOptions,
}: {
  channelData: GenerateChannelOptions;
  client: StreamChat;
  defaultGenerateChannelOptions: GenerateChannelOptions;
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
  // Written into the client's store rather than stubbed onto the channel: `getConfig()` is gone, and
  // its replacement `serverConfig` is a getter reading this store. Going through the store also drives
  // the channel's own derivation, so `channel.config` — where six of these flags are reconciled with
  // the integrator's configuration — is correct too. Stubbing an accessor would leave it stale.
  client.channelConfigsByTypeStore.partialNext({
    configs: {
      ...client.channelConfigsByType,
      [mockedChannelData.channel.type]: mockedChannelData.channel
        .config as ChannelConfigWithInfo,
    },
  });
  vi.spyOn(channel, 'getDraft').mockResolvedValue({
    draft: generateMessageDraft({ channel_cid: channel.cid }),
  } as GetDraftResponse);
  return channel;
};

export const initClientWithChannels = async ({
  channelsData,
  customUser,
}: {
  channelsData?: GenerateChannelOptions[];
  customUser?: Partial<UserResponse>;
} = {}) => {
  const user = customUser || generateUser();
  const client = await getTestClientWithUser(user);
  const defaultGenerateChannelOptions = {
    members: [generateMember({ user: user as UserResponse })],
  };
  // Set up channels sequentially, not via Promise.all: initChannelFromData mocks the shared
  // client.axiosInstance query endpoint per channel (useMockedApis uses mockResolvedValue, which
  // REPLACES the previous mock). Running concurrently lets the last channel's mock win, so every
  // channel's watch() resolves with the same (last) response — cross-seeding each channel's message
  // paginator with another channel's messages (the paginator then correctly rejects the foreign-cid
  // messages, unlike the cid-agnostic legacy channel.state). Sequential setup keeps each watch()
  // paired with its own mocked response.
  const channels: Awaited<ReturnType<typeof initChannelFromData>>[] = [];
  for (const channelData of channelsData ?? [defaultGenerateChannelOptions]) {
    channels.push(
      await initChannelFromData({ channelData, client, defaultGenerateChannelOptions }),
    );
  }

  return { channels, client };
};
